const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCredentials() {
  try {
    console.log('🔍 Debugging credentials in database...\n');

    // Try to find the specific credential
    const targetId = '68eea763633fcbbbb1706fce';
    console.log(`Looking for credential with ID: ${targetId}\n`);

    // Try raw MongoDB queries
    console.log('1. Raw MongoDB query with ObjectId format:');
    try {
      const rawCredential = await prisma.$runCommandRaw({
        find: 'credentials',
        filter: { _id: { $oid: targetId } },
        limit: 1
      });
      console.log('Result:', JSON.stringify(rawCredential, null, 2));
    } catch (error) {
      console.log('Error:', error.message);
    }

    console.log('\n2. Raw MongoDB query with string format:');
    try {
      const rawCredential = await prisma.$runCommandRaw({
        find: 'credentials',
        filter: { _id: targetId },
        limit: 1
      });
      console.log('Result:', JSON.stringify(rawCredential, null, 2));
    } catch (error) {
      console.log('Error:', error.message);
    }

    console.log('\n3. List all credentials in database:');
    try {
      const allCredentials = await prisma.$runCommandRaw({
        find: 'credentials',
        filter: {},
        limit: 10
      });
      console.log('Found credentials:', allCredentials.cursor.firstBatch.length);
      allCredentials.cursor.firstBatch.forEach((cred, index) => {
        console.log(`  ${index + 1}. ID: ${cred._id}, Service: ${cred.serviceName}, Client: ${cred.clientName}`);
      });
    } catch (error) {
      console.log('Error:', error.message);
    }

    console.log('\n4. Try with lowercase collection name:');
    try {
      const altCredentials = await prisma.$runCommandRaw({
        find: 'credentials',
        filter: {},
        limit: 10
      });
      console.log('Found credentials (lowercase):', altCredentials.cursor.firstBatch.length);
      altCredentials.cursor.firstBatch.forEach((cred, index) => {
        console.log(`  ${index + 1}. ID: ${cred._id}, Service: ${cred.serviceName}, Client: ${cred.clientName}`);
      });
    } catch (error) {
      console.log('Error:', error.message);
    }

    console.log('\n5. Try Prisma findMany (might fail due to DateTime issues):');
    try {
      const prismaCredentials = await prisma.credential.findMany({
        take: 5,
        select: {
          id: true,
          serviceName: true,
          clientName: true,
          createdAt: true,
          updatedAt: true
        }
      });
      console.log('Prisma found credentials:', prismaCredentials.length);
      prismaCredentials.forEach((cred, index) => {
        console.log(`  ${index + 1}. ID: ${cred.id}, Service: ${cred.serviceName}, Client: ${cred.clientName}`);
      });
    } catch (error) {
      console.log('Prisma Error:', error.message);
    }

  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCredentials();
