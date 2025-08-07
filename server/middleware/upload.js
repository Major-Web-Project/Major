import multer from 'multer';
import multerS3 from 'multer-s3';
import { s3Client, S3_CONFIG, generateS3Key, generateUniqueFilename, validateAWSConfig } from '../config/aws.js';

// Validate AWS configuration on startup
try {
    validateAWSConfig();
} catch (error) {
    console.error('❌ AWS Configuration Error:', error.message);
    console.error('💡 Please check your environment variables in .env file');
    process.exit(1);
}

// Configure S3 storage
const storage = multerS3({
    s3: s3Client,
    bucket: S3_CONFIG.bucket,
    key: (req, file, cb) => {
        // Generate unique filename
        const filename = generateUniqueFilename(file.originalname, req.body.taskId);
        
        // Generate S3 key (path in bucket)
        const s3Key = generateS3Key('submissions', filename);
        
        console.log('[upload middleware] S3 upload configuration:', {
            originalName: file.originalname,
            generatedFilename: filename,
            s3Key: s3Key,
            bucket: S3_CONFIG.bucket,
            taskId: req.body.taskId
        });
        
        cb(null, s3Key);
    },
    metadata: (req, file, cb) => {
        // Add metadata to S3 object
        cb(null, {
            'original-name': file.originalname,
            'task-id': req.body.taskId || 'unknown',
            'upload-timestamp': Date.now().toString(),
            'user-id': req.user?._id?.toString() || 'anonymous'
        });
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    // Set appropriate ACL (private by default for security)
    acl: 'private',
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    console.log('[upload middleware] File filter check:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        allowed: allowedTypes.includes(file.mimetype)
    });

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        console.log('[upload middleware] File type rejected:', file.mimetype);
        cb(new Error('Invalid file type. Only PDF, Excel, Word, and CSV files are allowed.'), false);
    }
};

// Configure multer with S3 storage and enhanced security
const upload = multer({
    storage: storage,
    limits: {
        fileSize: process.env.NODE_ENV === 'production' ? 5 * 1024 * 1024 : 10 * 1024 * 1024, // 5MB in prod, 10MB in dev
        files: 1, // Only allow 1 file per request
        fieldSize: 1024 * 1024, // 1MB field size limit
    },
    fileFilter: fileFilter,
    // Enhanced error handling for S3 uploads
    onError: (err, next) => {
        console.error('[upload middleware] S3 upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
            next(new Error('File size too large. Maximum size allowed is 5MB.'));
        } else if (err.code === 'NoSuchBucket') {
            next(new Error('S3 bucket not found. Please check AWS configuration.'));
        } else if (err.code === 'AccessDenied') {
            next(new Error('S3 access denied. Please check AWS credentials.'));
        } else {
            next(err);
        }
    }
});

export default upload;