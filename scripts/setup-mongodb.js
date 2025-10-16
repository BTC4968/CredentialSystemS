const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupMongoDB() {
  try {
    console.log('🚀 Setting up MongoDB database...');

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin', 12);
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gmail.com' }
    });

    let adminUser;
    if (existingAdmin) {
      adminUser = existingAdmin;
      console.log('ℹ️  Admin user already exists:', adminUser.email);
    } else {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@gmail.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN'
        }
      });
      console.log('✅ Admin user created:', adminUser.email);
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
        createdById: adminUser.id
      },
      {
        clientName: 'Finance Group LLC',
        contactPerson: 'Sarah Johnson',
        address: '456 Finance Ave, New York, NY 10001',
        notes: 'Financial services and investment management',
        email: 'sarah@financegroup.com',
        phone: '+1-555-0456',
        createdById: adminUser.id
      },
      {
        clientName: 'Healthcare Solutions',
        contactPerson: 'Mike Wilson',
        address: '789 Health Blvd, Chicago, IL 60601',
        notes: 'Healthcare technology and patient management systems',
        email: 'mike@healthcare.com',
        phone: '+1-555-0789',
        createdById: adminUser.id
      }
    ];

    for (const clientData of sampleClients) {
      // Check if client already exists
      const existingClient = await prisma.client.findFirst({
        where: {
          clientName: clientData.clientName,
          createdById: clientData.createdById
        }
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
    const clients = await prisma.client.findMany();
    
    const sampleCredentials = [
      {
        clientId: clients[0].id,
        clientName: clients[0].clientName,
        serviceName: 'Cloudflare',
        username: 'admin@techcorp.com',
        password: 'TechCorp2024!', // Will be encrypted by the API
        notes: 'Main admin panel credentials for Cloudflare DNS management',
        createdById: adminUser.id
      },
      {
        clientId: clients[1].id,
        clientName: clients[1].clientName,
        serviceName: 'Database Hosting',
        username: 'db_user',
        password: 'SecureDB123', // Will be encrypted by the API
        notes: 'Database connection credentials for production environment',
        createdById: adminUser.id
      }
    ];

    for (const credentialData of sampleCredentials) {
      // Check if credential already exists
      const existingCredential = await prisma.credential.findFirst({
        where: {
          clientId: credentialData.clientId,
          serviceName: credentialData.serviceName
        }
      });

      if (!existingCredential) {
        const credential = await prisma.credential.create({
          data: credentialData
        });
        console.log('✅ Sample credential created:', credential.serviceName);
      } else {
        console.log('ℹ️  Sample credential already exists:', credentialData.serviceName);
      }
    }

    console.log('🎉 MongoDB setup completed successfully!');
    console.log('📧 Admin login: admin@gmail.com');
    console.log('🔑 Admin password: admin');
    console.log('⚠️  Please change the admin password after first login!');

  } catch (error) {
    console.error('❌ Error setting up MongoDB:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupMongoDB();
