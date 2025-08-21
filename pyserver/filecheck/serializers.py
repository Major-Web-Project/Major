from rest_framework import serializers


class FileCheckSerializer(serializers.Serializer):
    # Uploaded file (PDF or Excel)
    file = serializers.FileField()

    # Task metadata for verification
    taskId = serializers.CharField(required=True)
    title = serializers.CharField(required=True)
    description = serializers.CharField(required=True)
    successCriteria = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True
    )

    # Optional: user information for audit (if provided by frontend)
    userId = serializers.CharField(required=False, allow_blank=True)