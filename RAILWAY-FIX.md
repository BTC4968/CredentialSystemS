# Railway 502 Error Fix Guide

## Quick Fix Steps

### 1. **Use Railway's Built-in MongoDB**
Since you're using Railway's internal MongoDB, you need to:

1. **Go to your Railway project dashboard**
2. **Add a MongoDB service** (if not already added)
3. **Get the connection string** from Railway's MongoDB service
4. **Set the DATABASE_URL environment variable** to Railway's MongoDB connection string

### 2. **Environment Variables to Set in Railway**

```
DATABASE_URL=<railway-mongodb-connection-string>
JWT_SECRET=your-super-secret-jwt-key-railway-deployment
ENCRYPTION_KEY=your-32-byte-hex-encryption-key-railway-deployment
NEXTAUTH_URL=https://your-railway-app.railway.app
NEXTAUTH_SECRET=your-nextauth-secret-railway-deployment
NODE_ENV=production
PORT=3000
```

### 3. **Deployment Configuration**

**Option A: Use the new Dockerfile (Recommended)**
- Use `Dockerfile.railway` instead of the original Dockerfile
- This is simpler and more reliable for Railway

**Option B: Fix the original Dockerfile**
- The issue is with the standalone build configuration
- Railway works better with standard Next.js builds

### 4. **Database Setup After Deployment**

Once deployed, you need to set up the database:

```bash
# Connect to your Railway deployment
railway run npm run db:setup

# Create an admin user
railway run npm run db:test-admin
```

### 5. **Common 502 Error Causes**

1. **Missing environment variables** - Check all required env vars are set
2. **Database connection issues** - Verify DATABASE_URL is correct
3. **Build failures** - Check Railway build logs
4. **Port configuration** - Ensure PORT=3000 is set
5. **Missing dependencies** - Check package.json includes all required packages

### 6. **Debugging Steps**

1. **Check Railway logs** for specific error messages
2. **Test health endpoint**: `https://your-app.railway.app/api/health`
3. **Verify database connection** in logs
4. **Check if the app starts successfully**

### 7. **Quick Test Commands**

```bash
# Test health endpoint
curl https://your-app.railway.app/api/health

# Check if app is running
curl https://your-app.railway.app/
```

## If Still Having Issues

1. **Check Railway build logs** for specific errors
2. **Verify all environment variables** are set correctly
3. **Try redeploying** with the new Dockerfile.railway
4. **Check database permissions** in Railway MongoDB service
