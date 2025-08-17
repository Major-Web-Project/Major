from rest_framework import serializers

class FileCheckSerializer(serializers.Serializer):
    file = serializers.FileField()
    description = serializers.CharField()