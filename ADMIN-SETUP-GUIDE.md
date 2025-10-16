# Admin Login Setup Guide

This guide will help you set up and test the admin login functionality for your credential management system.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd auth-dashboard
npm install
```

### 2. Set up Environment Variables
```bash
cp env.example .env
```

Update the `.env` file with your MongoDB connection:
```env
DATABASE_URL="mongodb://localhost:27017/credential_manager"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
ENCRYPTION_KEY="your-32-byte-hex-encryption-key"
```

### 3. Generate Prisma Client
```bash
npm run db:generate
```

### 4. Set up MongoDB Database
```bash
# Start MongoDB (if using Docker)
docker-compose up -d mongodb

# Or start local MongoDB service
# mongod --dbpath /path/to/your/db

# Push the schema to MongoDB
npm run db:push
```

### 5. Create Admin User
```bash
# Run the setup script to create admin user and sample data
npm run db:setup

# Or test admin login specifically
node scripts/test-admin-login.js
```

## 🔐 Admin Login Credentials

- **Email**: `admin@gmail.com`
- **Password**: `admin`
- **Role**: `ADMIN`

## 🧪 Testing the Login

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to Login Page
Open your browser and go to: `http://localhost:3000/login`

### 3. Enter Admin Credentials
- Email: `admin@gmail.com`
- Password: `admin`

### 4. Expected Behavior
- ✅ Login should be successful
- ✅ You should be redirected to `/dashboard`
- ✅ You should see the dashboard with admin privileges
- ✅ You should be able to create clients and credentials

## 🔧 Troubleshooting

### Issue: "Invalid credentials" error
**Solution**: Make sure the admin user exists in the database
```bash
node scripts/test-admin-login.js
```

### Issue: Database connection error
**Solution**: Check your MongoDB connection
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/credential_manager"
```

### Issue: Prisma client not generated
**Solution**: Regenerate Prisma client
```bash
npm run db:generate
```

### Issue: JWT token errors
**Solution**: Make sure JWT_SECRET is set in your `.env` file

## 📊 Admin Features

Once logged in as admin, you should have access to:

1. **Dashboard Overview**: View all clients and credentials
2. **Create Clients**: Add new client companies
3. **Create Credentials**: Add login credentials for clients
4. **Export PDFs**: Generate credential reports
5. **User Management**: Create staff accounts (admin only)
6. **Audit Logs**: View system activity logs

## 🔒 Security Notes

⚠️ **Important**: Change the default admin password after first login!

The system includes:
- Password hashing with bcrypt (12 salt rounds)
- JWT token authentication
- AES-256-GCM encryption for credentials
- Audit logging for all actions
- Role-based access control

## 🐳 Docker Deployment

If you prefer to use Docker:

```bash
# Set environment variables
export DB_PASSWORD="your_secure_password"
export JWT_SECRET="your_jwt_secret"
export ENCRYPTION_KEY="your_encryption_key"

# Deploy with Docker
npm run deploy
```

## 📝 API Testing

You can also test the login API directly:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gmail.com","password":"admin"}'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "admin@gmail.com",
    "name": "Admin User",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 🆘 Need Help?

If you encounter any issues:

1. Check the console logs in your browser
2. Check the server logs in your terminal
3. Verify your MongoDB connection
4. Ensure all environment variables are set
5. Run the test script: `node scripts/test-admin-login.js`

The admin login should work seamlessly once the database is set up correctly!
