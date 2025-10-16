# Credential Management System - Production Setup

A secure, enterprise-grade credential management system built with Next.js, PostgreSQL, and comprehensive security features.

## 🏗️ Architecture

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **UI Framework**: ShadCN + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Encryption**: AES-256-GCM for credential storage
- **PDF Generation**: Server-side with jsPDF
- **Hosting**: Docker containers with Nginx reverse proxy
- **Security**: SSL/TLS, rate limiting, audit logging

## 🔐 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **Credential Encryption**: AES-256-GCM encryption for sensitive data
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Admin and User roles with proper permissions
- **Audit Logging**: Complete audit trail for all actions
- **Rate Limiting**: API rate limiting to prevent abuse
- **SSL/TLS**: End-to-end encryption for all communications
- **Security Headers**: Comprehensive security headers via Nginx

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for development)
- MongoDB 7.0+ (for production)
- SSL certificates (for HTTPS)
- Domain name for private subdomain

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd auth-dashboard

# Copy environment template
cp env.example .env

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure Environment Variables

Update `.env` with your production values:

```env
# Database
DATABASE_URL="mongodb://credential_user:your_secure_password@localhost:27017/credential_manager"

# Security
JWT_SECRET="your-super-secure-jwt-secret-key"
ENCRYPTION_KEY="your-32-byte-hex-encryption-key"
NEXTAUTH_SECRET="your-nextauth-secret"

# Application
NEXTAUTH_URL="https://credentials.yourcompany.com"
NODE_ENV="production"
```

### 3. Deploy with Docker

```bash
# Set required environment variables
export DB_PASSWORD="your_secure_db_password"
export JWT_SECRET="your_jwt_secret"
export ENCRYPTION_KEY="your_encryption_key"
export REDIS_PASSWORD="your_redis_password"
export NEXTAUTH_SECRET="your_nextauth_secret"

# Deploy the application
./scripts/deploy.sh
```

### 4. Access the Application

- **URL**: https://credentials.yourcompany.com
- **Admin Email**: admin@gmail.com
- **Admin Password**: admin

⚠️ **Important**: Change the default admin password immediately after first login!

## 🗄️ Database Setup

### Manual Setup (Alternative to Docker)

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Setup initial data
npm run db:setup
```

### Database Schema

The system uses the following main entities:

- **Users**: Authentication and authorization
- **Clients**: Client information and metadata
- **Credentials**: Encrypted credential storage
- **PDF Configs**: User-specific PDF export settings
- **Audit Logs**: Complete audit trail

## 🔧 Configuration

### SSL/TLS Setup

For production, replace the self-signed certificates:

```bash
# Place your SSL certificates in the ssl/ directory
ssl/
├── cert.pem    # Your SSL certificate
└── key.pem     # Your private key
```

### Nginx Configuration

The included `nginx.conf` provides:

- SSL/TLS termination
- Rate limiting
- Security headers
- Gzip compression
- Health checks

### Firewall Configuration

Configure your firewall to allow only internal access:

```bash
# Allow HTTPS from internal networks only
ufw allow from 192.168.0.0/16 to any port 443
ufw allow from 10.0.0.0/8 to any port 443

# Block external access
ufw deny 443
```

## 📊 Monitoring and Logging

### Application Logs

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f mongodb

# View Nginx logs
docker-compose logs -f nginx
```

### Health Checks

```bash
# Check application health
curl -f https://credentials.yourcompany.com/health

# Check database connectivity
docker-compose exec app npx prisma db push
```

### Audit Logs

All user actions are logged in the `audit_logs` table:

- User logins/logouts
- Client creation/updates/deletions
- Credential management
- PDF exports
- System access

## 🔄 Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec mongodb mongodump --db credential_manager --out /backup

# Restore backup
docker-compose exec mongodb mongorestore --db credential_manager /backup/credential_manager
```

### File Backup

```bash
# Backup uploads and logs
tar -czf backup-files.tar.gz uploads/ logs/
```

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run database migrations
npm run db:migrate

# Setup development data
npm run db:setup
```

### API Documentation

The system provides RESTful APIs:

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/credentials` - List credentials
- `POST /api/credentials` - Create credential
- `POST /api/export/pdf` - Export PDF

## 🔒 Security Best Practices

1. **Change Default Passwords**: Immediately change admin password
2. **Use Strong Encryption Keys**: Generate cryptographically secure keys
3. **Enable SSL/TLS**: Use proper SSL certificates
4. **Restrict Network Access**: Limit access to internal networks only
5. **Regular Updates**: Keep dependencies and system updated
6. **Monitor Logs**: Regularly review audit logs
7. **Backup Regularly**: Implement automated backup procedures

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env
   - Verify MongoDB is running
   - Check network connectivity

2. **SSL Certificate Errors**
   - Verify certificate files exist
   - Check certificate validity
   - Ensure proper file permissions

3. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Review audit logs

### Support

For technical support or security issues:

1. Check application logs
2. Review audit logs
3. Verify environment configuration
4. Test network connectivity

## 📝 License

This project is proprietary software. All rights reserved.

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review audit logs
2. **Monthly**: Update dependencies
3. **Quarterly**: Security audit
4. **Annually**: SSL certificate renewal

### Update Process

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations if needed
docker-compose exec app npx prisma migrate deploy
```

---

**⚠️ Security Notice**: This system handles sensitive credential information. Ensure proper security measures are in place before production deployment.
