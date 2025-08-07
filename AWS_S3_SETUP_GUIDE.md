# 🚀 AWS S3 Setup Guide for Task Manager

## 📋 **Prerequisites**
- AWS Account (Free tier available)
- Basic understanding of AWS console

## 🔧 **Step 1: Create AWS Account & S3 Bucket**

### **1.1 Sign up for AWS**
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the registration process (requires credit card, but free tier is available)

### **1.2 Create S3 Bucket**
1. Login to AWS Console
2. Search for "S3" and click on it
3. Click "Create bucket"
4. **Bucket Configuration:**
   ```
   Bucket name: task-manager-submissions-[your-unique-suffix]
   Region: us-east-1 (or your preferred region)
   
   Block Public Access: ✅ Keep all boxes CHECKED (for security)
   Bucket Versioning: Disabled (optional)
   Default encryption: Enable with SSE-S3
   ```
5. Click "Create bucket"

## 🔑 **Step 2: Create IAM User & Access Keys**

### **2.1 Create IAM User**
1. Go to IAM service in AWS Console
2. Click "Users" → "Add users"
3. **User Configuration:**
   ```
   User name: task-manager-s3-user
   Access type: ✅ Programmatic access
   ```
4. Click "Next: Permissions"

### **2.2 Set Permissions**
1. Choose "Attach existing policies directly"
2. Search and select: `AmazonS3FullAccess` (for development)
   
   **For Production (More Secure):**
   Create custom policy with minimal permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:PutObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "s3:ListBucket"
         ],
         "Resource": "arn:aws:s3:::your-bucket-name"
       }
     ]
   }
   ```

3. Click "Next" → "Create user"
4. **IMPORTANT:** Copy and save the Access Key ID and Secret Access Key

## ⚙️ **Step 3: Configure Your Application**

### **3.1 Update Environment Variables**
Create `.env` file in your server directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your AWS credentials:
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_BUCKET_NAME=task-manager-submissions-your-suffix
AWS_REGION=us-east-1

# Other existing variables...
NODE_ENV=development
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
```

### **3.2 Test the Configuration**
```bash
# Start your server
npm start

# The server will validate AWS configuration on startup
# Look for: "✅ AWS S3 configuration validated"
```

## 🧪 **Step 4: Test File Upload**

### **4.1 Test Upload**
1. Start your application
2. Login and create a task
3. Try uploading a PDF file
4. Check AWS S3 Console to see if file appears in your bucket

### **4.2 Test File Viewing**
1. Click "View Submission" on a completed task
2. File should open in new tab with signed URL
3. URL should look like: `https://your-bucket.s3.amazonaws.com/...?X-Amz-Signature=...`

## 💰 **Cost Monitoring**

### **Free Tier Limits (12 months):**
- ✅ 5 GB storage
- ✅ 20,000 GET requests/month
- ✅ 2,000 PUT requests/month
- ✅ 15 GB data transfer

### **Monitor Usage:**
1. Go to AWS Billing Dashboard
2. Set up billing alerts for $1-5
3. Monitor S3 usage in CloudWatch

## 🔒 **Security Best Practices**

### **✅ Implemented:**
- Private bucket (no public access)
- Signed URLs for file access
- User authentication required
- IAM user with minimal permissions

### **🔄 Additional Recommendations:**
- Rotate access keys every 90 days
- Enable CloudTrail for audit logging
- Set up lifecycle policies for old files
- Enable MFA for AWS account

## 🚨 **Troubleshooting**

### **Common Issues:**

**1. "AWS Configuration Error"**
```bash
# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_BUCKET_NAME

# Verify credentials
aws s3 ls s3://your-bucket-name
```

**2. "Access Denied" errors**
- Check IAM permissions
- Verify bucket name is correct
- Ensure region matches

**3. "NoSuchBucket" error**
- Verify bucket name in .env
- Check if bucket exists in correct region

**4. Files not uploading**
- Check server logs for detailed errors
- Verify multer-s3 configuration
- Test AWS credentials with AWS CLI

## 📊 **Monitoring & Maintenance**

### **Regular Tasks:**
- [ ] Monitor AWS costs monthly
- [ ] Review S3 storage usage
- [ ] Check for failed uploads in logs
- [ ] Rotate access keys quarterly

### **Scaling Considerations:**
- **1000+ users**: Consider CloudFront CDN
- **10GB+ storage**: Set up lifecycle policies
- **High traffic**: Monitor request costs

## 🎯 **Success Checklist**

- [ ] AWS account created
- [ ] S3 bucket created with proper settings
- [ ] IAM user created with correct permissions
- [ ] Environment variables configured
- [ ] Server starts without AWS errors
- [ ] File upload works
- [ ] File viewing works with signed URLs
- [ ] Local uploads folder deleted
- [ ] Billing alerts set up

**🎉 Congratulations! Your app now uses AWS S3 cloud storage!**