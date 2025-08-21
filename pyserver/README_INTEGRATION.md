## Integration notes

Endpoints

- POST /api/file-check/ (multipart/form-data)
  Fields:
  - file: uploaded PDF/XLS/XLSX
  - taskId: string
  - title: string
  - description: string
  - successCriteria: JSON string array (optional)
  - userId: string (optional)

Returns JSON: { result: true|false|null, reason: string }

Environment

- set GEMINI_API_KEY in Django environment or settings.

Run locally

- python -m venv venv
- venv\Scripts\activate
- pip install django djangorestframework requests
- python manage.py runserver 8000

Security

- This service performs verification only; it does not persist files. The Node server stores verified files in MongoDB GridFS.
