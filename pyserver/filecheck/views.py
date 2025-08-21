import base64
import os
import tempfile
import requests
import io
import csv
import re
import json
import traceback

# Third-party imports
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

# Local application imports
from .serializers import FileCheckSerializer


# Log Python executable and sys.path for debugging import issues
import sys
print(f"[FileCheck] Python executable: {sys.executable}")
print(f"[FileCheck] sys.path: {sys.path}")


# Remove global try-import for fitz and openpyxl. Import inside functions instead.


def _bypass_enabled():
    """Checks if the file verification bypass is enabled via environment or Django settings."""
    env = os.getenv('FILE_CHECK_BYPASS')
    if env is not None:
        return env.strip().lower() in ("1", "true", "yes", "on")
    # Default to DEBUG mode for smoother local development
    return getattr(settings, 'DEBUG', False)


@method_decorator(csrf_exempt, name='dispatch')
class FileCheckView(APIView):
    """
    API View to check an uploaded file against a set of success criteria using
    local text extraction and the Gemini API for verification.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        print("[FileCheck] Incoming request data:", request.data)
        serializer = FileCheckSerializer(data=request.data)

        if not serializer.is_valid():
            print("[FileCheck] Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # --- 1. Extract and Validate Input Data ---
        file = serializer.validated_data.get('file')
        title = serializer.validated_data.get('title')
        description = serializer.validated_data.get('description')
        success_criteria = serializer.validated_data.get('successCriteria')

        # Log received data for debugging
        print(f"[FileCheck] file: name={getattr(file, 'name', None)}, content_type={getattr(file, 'content_type', None)}, size={getattr(file, 'size', None)}")
        print(f"[FileCheck] title: {title}")
        print(f"[FileCheck] description: {description}")
        print(f"[FileCheck] success_criteria: {success_criteria}")

        # --- 2. Read File and Determine MIME Type ---
        try:
            file_bytes = file.read()
            print(f"[FileCheck] file_bytes type: {type(file_bytes)}, length: {len(file_bytes)}")
        except Exception as e:
            print(f"[FileCheck] Error reading file: {e}")
            return Response({'error': 'Could not read the uploaded file.'}, status=status.HTTP_400_BAD_REQUEST)

        # Determine mime type (prefer uploaded content_type, fallback to extension)
        ct = getattr(file, 'content_type', None)
        ext = os.path.splitext(file.name)[1].lower()
        
        mime_type = ""
        if ct in ("application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"):
            mime_type = ct
        elif ext == ".pdf":
            mime_type = "application/pdf"
        elif ext in [".xls", ".xlsx"]:
            mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        elif ext == ".csv":
            mime_type = "text/csv"
        else:
            print("[FileCheck] Early return: Unsupported file type.")
            return Response({'error': 'Unsupported file type.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- 3. Local Text Extraction ---
        combined_text = ""
        if mime_type == "application/pdf":
            combined_text = self._extract_text_from_pdf(file_bytes)
        elif mime_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
            combined_text = self._extract_text_from_xlsx(file_bytes)
        elif mime_type == "text/csv":
            combined_text = self._extract_text_from_csv(file_bytes)

        print(f"[FileCheck] Raw extracted text (first 500 chars):\n{combined_text[:500]}")
        
        combined_text_norm = self._normalize_text(combined_text)
        print(f"[FileCheck] Extracted normalized text (first 500 chars):\n{combined_text_norm[:500]}")

        # CRITICAL FIX: If local parsing failed, we cannot verify the file.
        if not combined_text_norm:
            print("[FileCheck] Early return: Could not extract any text from the file.")
            return Response({
                "result": False,
                "reason": "Could not extract readable text from the file. It might be an image-only PDF or a corrupted file.",
                "missingCriteria": success_criteria, # All criteria are missing if no text is found
            }, status=status.HTTP_200_OK)

        # --- 4. Pre-check based on local extraction ---
        criteria_norm = [self._normalize_text(c) for c in success_criteria if isinstance(c, str) and c.strip()]
        
        precheck_missing = []
        for c in criteria_norm:
            if not self._criterion_passes(combined_text_norm, c):
                precheck_missing.append(c)

        if precheck_missing:
            print(f"[FileCheck] Local pre-check failed. Missing: {precheck_missing}")
            return Response({
                "result": False,
                "reason": "Local content check failed for one or more success criteria.",
                "missingCriteria": precheck_missing,
            }, status=status.HTTP_200_OK)

        # --- 5. Bypass check (for dev/testing) ---
        if _bypass_enabled():
            print("[FileCheck] Bypass enabled. Returning success.")
            return Response({
                "result": True,
                "reason": "Bypass enabled (DEBUG/FILE_CHECK_BYPASS).",
            })

        # --- 6. Gemini API Verification ---
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            print("[FileCheck] Error: Gemini API key not configured.")
            return Response({'error': 'Gemini API key not configured.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        file_b64 = base64.b64encode(file_bytes).decode("utf-8")

        # Gemini model and endpoint: using gemini-2.5-flash for v1beta (update if Google changes model/version)
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key
        }
        criteria_text = "\n".join([f"- {c}" for c in success_criteria]) if success_criteria else "(none)"
        extracted_snippet = combined_text[:8000] # Truncate to limit token usage

        verify_prompt = (
            "You are a STRICT file verifier.\n"
            "Task: Determine if the provided file content matches ALL Success Criteria, given the Task Title and Description.\n"
            "Rules:\n"
            "- Respond in valid JSON only. No extra commentary or markdown backticks.\n"
            "- Schema: {\n  \"verified\": boolean,\n  \"reasons\": string[],\n  \"evidence\": [{\n    \"criterion\": string,\n    \"snippet\": string\n  }],\n  \"missingCriteria\": string[]\n}\n"
            "- `verified` must be true ONLY if EVERY success criterion is clearly and directly met. Provide a direct quote as a `snippet` for each.\n"
            "- If uncertain about any criterion, set `verified` to false and list the unmet criteria in `missingCriteria`.\n\n"
            f"Task Title: {title}\n"
            f"Task Description: {description}\n"
            f"Success Criteria:\n{criteria_text}\n\n"
            "Here is the file content for your review."
        )

        print("[FileCheck] Gemini verification prompt (to AI):\n" + verify_prompt)
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": verify_prompt},
                        {"inline_data": {"mime_type": mime_type, "data": file_b64}},
                    ]
                }
            ]
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=45)
            if resp.status_code != 200:
                print(f"[FileCheck] Gemini API error. Status: {resp.status_code}, Body: {resp.text}")
                return Response({'error': 'Gemini API error', 'details': resp.text}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            data = resp.json()
            reply_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            print("[FileCheck] Gemini raw reply:", reply_text)

            # --- 7. Parse and Finalize Response ---
            parsed_json = self._parse_json_from_string(reply_text)

            if not parsed_json or not isinstance(parsed_json, dict):
                return Response({
                    "result": False,
                    "reason": "Model did not return valid JSON; treating as failed verification.",
                    "modelReply": reply_text,
                }, status=status.HTTP_200_OK)

            verified = bool(parsed_json.get("verified", False))
            missing = parsed_json.get("missingCriteria", []) or []
            
            # Final strict check: if model says verified but also lists missing criteria, it's a failure.
            final_result = verified and not missing

            return Response({
                "result": final_result,
                "reason": "; ".join(parsed_json.get("reasons", [])) or ("All criteria matched" if final_result else "Verification failed"),
                "evidence": parsed_json.get("evidence", []),
                "missingCriteria": missing,
                "modelReply": parsed_json,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("[ERROR] file-check exception:\n" + traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # --- Helper Methods ---
    def _normalize_text(self, s: str) -> str:
        if not isinstance(s, str):
            s = str(s)
        # Lowercase, remove non-alphanumeric chars (except spaces), and collapse whitespace
        s = re.sub(r'[^a-z0-9\s]', '', s.lower())
        return re.sub(r"\s+", " ", s).strip()

    def _criterion_passes(self, content: str, criterion: str) -> bool:
        """A simple local check to see if a criterion might be met."""
        if not criterion:
            return True
        # Token-based: require at least 2 keywords (>=4 chars) to be present
        tokens = {w for w in re.split(r"[^a-z0-9]+", criterion) if len(w) >= 4}
        if not tokens:
            return criterion in content # Fallback for short criteria
        
        content_words = set(content.split())
        present_tokens = tokens.intersection(content_words)
        
        # Require a high percentage of keywords to be present for a pass
        return len(present_tokens) >= len(tokens) * 0.75


    def _extract_text_from_pdf(self, data: bytes) -> str:
        try:
            import fitz  # PyMuPDF
        except ImportError:
            print("[FileCheck] PyMuPDF (fitz) is not installed. Cannot process PDF.")
            return ""
        try:
            doc = fitz.open(stream=data, filetype="pdf")
            parts = [page.get_text() for page in doc]
            return "\n".join(parts)
        except Exception as e:
            print(f"[FileCheck] Exception in extract_text_from_pdf: {e}")
            return ""

    def _extract_text_from_xlsx(self, data: bytes) -> str:
        try:
            from openpyxl import load_workbook
        except ImportError:
            print("[FileCheck] openpyxl is not installed. Cannot process XLSX.")
            return ""
        try:
            wb = load_workbook(io.BytesIO(data), data_only=True, read_only=True)
            parts = []
            for ws in wb.worksheets:
                for row in ws.iter_rows(values_only=True):
                    vals = [str(v) for v in row if v is not None]
                    if vals:
                        parts.append(" ".join(vals))
            return "\n".join(parts)
        except Exception as e:
            print(f"[FileCheck] Exception in extract_text_from_xlsx: {e}")
            return ""

    def _extract_text_from_csv(self, data: bytes) -> str:
        text = ""
        for enc in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                text = data.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        else: # If no encoding worked, this will be empty
            return ""

        try:
            parts = []
            reader = csv.reader(io.StringIO(text))
            for row in reader:
                if row:
                    parts.append(" ".join([cell for cell in row if cell]))
            return "\n".join(parts)
        except Exception as e:
            print(f"[FileCheck] Exception in extract_text_from_csv: {e}")
            return ""

    def _parse_json_from_string(self, text: str) -> dict | None:
        """Extracts a JSON object from a string that might contain other text."""
        # Find the first '{' and the last '}' to get the JSON part
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError as e:
                print(f"[FileCheck] JSON parsing failed: {e}")
                return None
        return None
