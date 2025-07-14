# Environment Variables Setup

Create a `.env` file in the server directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/infinite-learning

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Optional: For production MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/infinite-learning?retryWrites=true&w=majority
```

## Required Environment Variables:

1. **PORT**: Server port (default: 5000)
2. **NODE_ENV**: Environment mode (development/production)
3. **MONGODB_URI**: MongoDB connection string
4. **JWT_SECRET**: Secret key for JWT token signing (change this in production!)
5. **JWT_EXPIRE**: JWT token expiration time (default: 7d)

## MongoDB Setup:

### Local MongoDB:

1. Install MongoDB locally
2. Start MongoDB service
3. Use: `mongodb://localhost:27017/infinite-learning`

### MongoDB Atlas (Cloud):

1. Create account at mongodb.com
2. Create a cluster
3. Get connection string
4. Replace username, password, and cluster details

## Security Notes:

- Always change JWT_SECRET in production
- Use strong, unique passwords
- Enable MongoDB authentication in production
- Use HTTPS in production
