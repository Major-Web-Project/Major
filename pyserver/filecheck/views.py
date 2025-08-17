import base64
import os
import tempfile
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import FileCheckSerializer
from django.conf import settings

class FileCheckView(APIView):
    def post(self, request):
        serializer = FileCheckSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            description = serializer.validated_data['description']

            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                for chunk in file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            # Read file and encode as base64
            with open(tmp_path, "rb") as f:
                file_bytes = f.read()
            os.remove(tmp_path)
            file_b64 = base64.b64encode(file_bytes).decode("utf-8")

            # Determine mime type
            ext = os.path.splitext(file.name)[1].lower()
            if ext == ".pdf":
                mime_type = "application/pdf"
            elif ext in [".xls", ".xlsx"]:
                mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            else:
                return Response({'error': 'Unsupported file type.'}, status=400)

            # Prepare Gemini API request
            api_key = getattr(settings, 'GEMINI_API_KEY', None)
            if not api_key:
                return Response({'error': 'Gemini API key not configured.'}, status=500)

            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": api_key
            }
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": f"Check if the following file matches this description: {description}. Reply only with 'true' or 'false' and a short reason."
                            },
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": file_b64
                                }
                            }
                        ]
                    }
                ]
            }

            try:
                resp = requests.post(url, headers=headers, json=payload)
                if resp.status_code != 200:
                    return Response({'error': 'Gemini API error', 'details': resp.text}, status=500)
                data = resp.json()
                # Extract the model's reply
                reply = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                reply_lower = reply.lower()
                if "true" in reply_lower:
                    result = True
                elif "false" in reply_lower:
                    result = False
                else:
                    result = None
                return Response({
                    "result": result,
                    "reason": reply
                })
            except Exception as e:
                return Response({'error': str(e)}, status=500)
        return Response(serializer.errors, status=400)