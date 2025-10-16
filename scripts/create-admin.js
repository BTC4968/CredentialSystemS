const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🚀 Connected to MongoDB');
    
    const db = client.db('credential_manager');
    const usersCollection = db.collection('users');
    
    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@gmail.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', existingAdmin.email);
      console.log('📧 Email: admin@gmail.com');
      console.log('🔑 Password: admin');
      console.log('👤 Role: ADMIN');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin', 12);
    
    const adminUser = {
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await usersCollection.insertOne(adminUser);
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: admin');
    console.log('👤 Role: ADMIN');
    console.log('🆔 User ID:', result.insertedId);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdmin();
