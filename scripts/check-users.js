const { MongoClient } = require('mongodb');

async function checkUsers() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🚀 Connected to MongoDB');
    
    const db = client.db('credential_manager');
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    
    console.log(`📊 Total users in database: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n👥 Users in database:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found in database');
    }
    
    // Check specifically for the email mentioned
    const specificUser = await usersCollection.findOne({ email: 'donaldo11sea@gmail.com' });
    if (specificUser) {
      console.log('✅ Found donaldo11sea@gmail.com in database:');
      console.log(JSON.stringify(specificUser, null, 2));
    } else {
      console.log('❌ donaldo11sea@gmail.com NOT found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await client.close();
  }
}

checkUsers();
