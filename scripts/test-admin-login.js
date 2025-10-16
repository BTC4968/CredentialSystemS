const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAdminLogin() {
  try {
    console.log('🔍 Testing admin login functionality...');

    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@gmail.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found. Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin', 12);
      
      const newAdminUser = await prisma.user.create({
        data: {
          email: 'admin@gmail.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN'
        }
      });
      
      console.log('✅ Admin user created:', newAdminUser.email);
    } else {
      console.log('✅ Admin user found:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Name:', adminUser.name);
    }

    // Test password verification
    const testPassword = 'admin';
    const isValidPassword = await bcrypt.compare(testPassword, adminUser.password);
    
    if (isValidPassword) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }

    console.log('\n🎉 Admin login test completed!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: admin');
    console.log('👤 Role: ADMIN');

  } catch (error) {
    console.error('❌ Error testing admin login:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin();
