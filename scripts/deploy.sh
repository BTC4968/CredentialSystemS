#!/bin/bash

# Credential Management System Deployment Script
# This script sets up the production environment with proper security

set -e

echo "🚀 Starting deployment of Credential Management System..."

# Check if required environment variables are set
check_env() {
    if [ -z "$DB_PASSWORD" ]; then
        echo "❌ DB_PASSWORD environment variable is required"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        echo "❌ JWT_SECRET environment variable is required"
        exit 1
    fi
    
    if [ -z "$ENCRYPTION_KEY" ]; then
        echo "❌ ENCRYPTION_KEY environment variable is required"
        exit 1
    fi
    
    if [ -z "$REDIS_PASSWORD" ]; then
        echo "❌ REDIS_PASSWORD environment variable is required"
        exit 1
    fi
    
    if [ -z "$NEXTAUTH_SECRET" ]; then
        echo "❌ NEXTAUTH_SECRET environment variable is required"
        exit 1
    fi
}

# Generate SSL certificates (self-signed for internal use)
generate_ssl() {
    echo "🔐 Generating SSL certificates..."
    
    mkdir -p ssl
    
    if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=credentials.yourcompany.com"
        echo "✅ SSL certificates generated"
    else
        echo "ℹ️  SSL certificates already exist"
    fi
}

# Set up environment file
setup_env() {
    echo "⚙️  Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        echo "✅ Environment file created from template"
        echo "⚠️  Please update .env file with your actual values"
    else
        echo "ℹ️  Environment file already exists"
    fi
}

# Build and start services
deploy_services() {
    echo "🏗️  Building and starting services..."
    
    # Stop existing containers
    docker-compose down || true
    
    # Build and start services
    docker-compose up -d --build
    
    echo "✅ Services started successfully"
}

# Wait for database to be ready
wait_for_db() {
    echo "⏳ Waiting for database to be ready..."
    
    max_attempts=30
    attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
            echo "✅ Database is ready"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts: Database not ready yet..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ Database failed to start within expected time"
    exit 1
}

# Run database migrations and setup
setup_database() {
    echo "🗄️  Setting up database..."
    
    # Run Prisma migrations
    docker-compose exec -T app npx prisma migrate deploy
    
    # Run database setup script
    docker-compose exec -T app node scripts/setup-mongodb.js
    
    echo "✅ Database setup completed"
}

# Health check
health_check() {
    echo "🏥 Performing health check..."
    
    # Wait for application to be ready
    sleep 10
    
    # Check if application is responding
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Application is healthy"
    else
        echo "❌ Application health check failed"
        exit 1
    fi
}

# Display deployment information
show_info() {
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Access Information:"
    echo "   URL: https://credentials.yourcompany.com"
    echo "   Admin Email: admin@gmail.com"
    echo "   Admin Password: admin"
    echo ""
    echo "🔐 Security Notes:"
    echo "   - Change default admin password immediately"
    echo "   - Update SSL certificates for production"
    echo "   - Configure firewall rules for internal access only"
    echo "   - Set up monitoring and logging"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "📝 Logs:"
    echo "   Application: docker-compose logs -f app"
    echo "   Database: docker-compose logs -f mongodb"
    echo "   Nginx: docker-compose logs -f nginx"
}

# Main deployment process
main() {
    check_env
    generate_ssl
    setup_env
    deploy_services
    wait_for_db
    setup_database
    health_check
    show_info
}

# Run main function
main "$@"
