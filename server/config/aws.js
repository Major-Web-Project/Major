import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// AWS S3 Configuration
const s3Config = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Create S3 client
export const s3Client = new S3Client(s3Config);

// S3 bucket configuration
export const S3_CONFIG = {
  bucket: process.env.AWS_BUCKET_NAME || 'task-manager-submissions',
  region: process.env.AWS_REGION || 'us-east-1',
  // File organization in S3
  folders: {
    submissions: 'submissions/',
    temp: 'temp/',
  },
};

// Helper function to generate S3 key (file path in bucket)
export const generateS3Key = (folder, filename) => {
  return `${S3_CONFIG.folders[folder]}${filename}`;
};

// Helper function to generate unique filename
export const generateUniqueFilename = (originalName, taskId = 'unknown') => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const extension = originalName.split('.').pop();
  return `task-${taskId}-${timestamp}-${randomSuffix}.${extension}`;
};

// Helper function to get signed URL for file access
export const getFileSignedUrl = async (s3Key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: s3Key,
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// Helper function to delete file from S3
export const deleteFileFromS3 = async (s3Key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_CONFIG.bucket,
      Key: s3Key,
    });
    
    await s3Client.send(command);
    console.log(`File deleted from S3: ${s3Key}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Validate AWS configuration
export const validateAWSConfig = () => {
  const requiredEnvVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET_NAME',
    'AWS_REGION'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required AWS environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log('✅ AWS S3 configuration validated');
  return true;
};

export default s3Client;