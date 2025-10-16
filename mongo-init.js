// MongoDB initialization script
db = db.getSiblingDB('credential_manager');

// Create user for the application
db.createUser({
  user: 'credential_user',
  pwd: 'credential_password',
  roles: [
    {
      role: 'readWrite',
      db: 'credential_manager'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'name', 'role'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        name: {
          bsonType: 'string',
          minLength: 1
        },
        role: {
          enum: ['ADMIN', 'USER']
        }
      }
    }
  }
});

db.createCollection('clients');
db.createCollection('credentials');
db.createCollection('pdf_configs');
db.createCollection('audit_logs');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.clients.createIndex({ createdById: 1 });
db.credentials.createIndex({ clientId: 1 });
db.credentials.createIndex({ createdById: 1 });
db.audit_logs.createIndex({ userId: 1 });
db.audit_logs.createIndex({ createdAt: 1 });

print('MongoDB initialization completed successfully!');
