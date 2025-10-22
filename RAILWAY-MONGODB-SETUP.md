# Railway MongoDB Atlas Setup Guide

## Your MongoDB Atlas Connection String
```
mongodb+srv://credential:9JZNSeefghYHvEAJ@cluster0.z9vyqgn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

## Step 1: Set Environment Variables in Railway

Go to your Railway project dashboard and add these environment variables:

### Required Environment Variables:
```
DATABASE_URL=mongodb+srv://credential:9JZNSeefghYHvEAJ@cluster0.z9vyqgn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-railway-deployment
ENCRYPTION_KEY=your-32-byte-hex-encryption-key-railway-deployment
NEXTAUTH_URL=https://your-railway-app.railway.app
NEXTAUTH_SECRET=your-nextauth-secret-railway-deployment
NODE_ENV=production
PORT=3000
```

### Generate Secure Keys:
```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate NextAuth Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: MongoDB Atlas Configuration

### Network Access:
1. Go to MongoDB Atlas Dashboard
2. Navigate to "Network Access"
3. Add IP Address: `0.0.0.0/0` (allow all IPs for Railway)
4. Or add Railway's specific IP ranges

### Database User:
- Username: `credential`
- Password: `9JZNSeefghYHvEAJ`
- Database: `credential_manager` (will be created automatically)

## Step 3: Deploy to Railway

1. **Push your code** to GitHub
2. **Connect Railway** to your GitHub repository
3. **Set environment variables** (Step 1)
4. **Deploy**

## Step 4: Database Setup After Deployment

Once deployed, run these commands:

```bash
# Connect to your Railway deployment
railway run node scripts/railway-setup.js
```

This will create:
- Database collections
- Admin user (admin@gmail.com / admin123)

## Step 5: Test Your Deployment

### Health Check:
```
https://your-railway-app.railway.app/api/health
```

### Test Login:
- Email: `admin@gmail.com`
- Password: `admin123`

## Troubleshooting

### If Database Connection Fails:
1. **Check MongoDB Atlas Network Access** - ensure `0.0.0.0/0` is allowed
2. **Verify DATABASE_URL** is set correctly in Railway
3. **Check Railway logs** for connection errors
4. **Test connection** with MongoDB Compass or similar tool

### If App Doesn't Start:
1. **Check Railway build logs** for errors
2. **Verify all environment variables** are set
3. **Check if PORT=3000** is set
4. **Ensure NODE_ENV=production** is set

### Common Issues:
- **502 errors**: Usually missing environment variables
- **Database connection failed**: Check MongoDB Atlas network access
- **Build failures**: Check Railway build logs for specific errors

## Verification Commands

```bash
# Test health endpoint
curl https://your-railway-app.railway.app/api/health

# Test if app is running
curl https://your-railway-app.railway.app/

# Check Railway logs
railway logs
```
