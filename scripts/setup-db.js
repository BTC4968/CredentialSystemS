#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Simple encryption function for setup (matches the server-side encryption)
function encrypt(text) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync('default-dev-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('credential-manager', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  
  return Buffer.from(combined).toString('base64');
}

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🚀 Setting up database...');

  try {
    // Create default admin user
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin';
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      const adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN'
        }
      });

      console.log('✅ Admin user created:', adminUser.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create sample clients
    const sampleClients = [
      {
        clientName: 'TechCorp Inc.',
        contactPerson: 'John Smith',
        address: '123 Tech Street, San Francisco, CA 94105',
        notes: 'Technology company specializing in software development',
        email: 'john@techcorp.com',
        phone: '+1-555-0123',
        createdById: existingAdmin?.id || (await prisma.user.findUnique({ where: { email: adminEmail } })).id
      },
      {
        clientName: 'Finance Group LLC',
        contactPerson: 'Sarah Johnson',
        address: '456 Finance Ave, New York, NY 10001',
        notes: 'Financial services and investment management',
        email: 'sarah@financegroup.com',
        phone: '+1-555-0456',
        createdById: existingAdmin?.id || (await prisma.user.findUnique({ where: { email: adminEmail } })).id
      },
      {
        clientName: 'Healthcare Solutions',
        contactPerson: 'Mike Wilson',
        address: '789 Health Blvd, Chicago, IL 60601',
        notes: 'Healthcare technology and patient management systems',
        email: 'mike@healthcare.com',
        phone: '+1-555-0789',
        createdById: existingAdmin?.id || (await prisma.user.findUnique({ where: { email: adminEmail } })).id
      }
    ];

    for (const clientData of sampleClients) {
      const existingClient = await prisma.client.findFirst({
        where: { clientName: clientData.clientName }
      });

      if (!existingClient) {
        const client = await prisma.client.create({
          data: clientData
        });
        console.log('✅ Sample client created:', client.clientName);
      } else {
        console.log('ℹ️  Sample client already exists:', clientData.clientName);
      }
    }

    // Create sample credentials
    const adminUserId = existingAdmin?.id || (await prisma.user.findUnique({ where: { email: adminEmail } })).id;
    const clients = await prisma.client.findMany();

    if (clients.length > 0) {
      const sampleCredentials = [
        {
          clientId: clients[0].id,
          clientName: clients[0].clientName,
          serviceName: 'Cloudflare',
          username: 'admin@techcorp.com',
          password: 'TechCorp2024!', // This will be encrypted
          notes: 'Main admin panel credentials for Cloudflare DNS management',
          createdById: adminUserId
        },
        {
          clientId: clients[1].id,
          clientName: clients[1].clientName,
          serviceName: 'Database Hosting',
          username: 'db_user',
          password: 'SecureDB123', // This will be encrypted
          notes: 'Database connection credentials for production environment',
          createdById: adminUserId
        },
        {
          clientId: clients[0].id,
          clientName: clients[0].clientName,
          serviceName: 'AWS Console',
          username: 'aws-admin@techcorp.com',
          password: 'AWS-Secure-Key-2024', // This will be encrypted
          notes: 'AWS console access for infrastructure management',
          createdById: adminUserId
        }
      ];

      for (const credData of sampleCredentials) {
        const existingCred = await prisma.credential.findFirst({
          where: { 
            clientId: credData.clientId,
            serviceName: credData.serviceName
          }
        });

        if (!existingCred) {
          // CRITICAL: Encrypt the password before storing
          const encryptedCredData = {
            ...credData,
            password: encrypt(credData.password)
          };
          
          const credential = await prisma.credential.create({
            data: encryptedCredData
          });
          console.log('✅ Sample credential created (encrypted):', credential.serviceName);
        } else {
          console.log('ℹ️  Sample credential already exists:', credData.serviceName);
        }
      }
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('   Email: admin@gmail.com');
    console.log('   Password: admin');
    console.log('\n🔐 Security Notes:');
    console.log('   - Change default admin password immediately');
    console.log('   - Set up proper encryption keys in environment variables');
    console.log('   - Configure SSL/TLS for production deployment');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Generate encryption key
function generateEncryptionKey() {
  const key = crypto.randomBytes(32).toString('hex');
  console.log('\n🔑 Generated encryption key:');
  console.log(`   ENCRYPTION_KEY="${key}"`);
  console.log('\n   Add this to your .env file for secure credential encryption');
}

// Run setup
if (require.main === module) {
  setupDatabase().then(() => {
    generateEncryptionKey();
  });
}

module.exports = { setupDatabase };
