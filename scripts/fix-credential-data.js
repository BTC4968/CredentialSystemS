const { MongoClient } = require('mongodb');

async function fixCredentialData() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('credential_manager');
    const credentialsCollection = db.collection('credentials');
    
    console.log('Checking for credentials with null createdBy fields...');
    
    // Find credentials with null createdBy or createdById
    const problematicCredentials = await credentialsCollection.find({
      $or: [
        { createdBy: null },
        { createdById: null },
        { createdBy: { $exists: false } },
        { createdById: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${problematicCredentials.length} credentials with data issues`);
    
    if (problematicCredentials.length > 0) {
      console.log('Fixing credentials...');
      
      for (const credential of problematicCredentials) {
        console.log(`Fixing credential: ${credential._id}`);
        
        // Set default values for null fields
        const updateData = {};
        
        if (!credential.createdBy) {
          updateData.createdBy = 'Unknown User';
        }
        
        if (!credential.createdById) {
          // Try to find a default admin user
          const usersCollection = db.collection('users');
          const adminUser = await usersCollection.findOne({ role: 'ADMIN' });
          
          if (adminUser) {
            updateData.createdById = adminUser._id;
          } else {
            // If no admin user exists, create a placeholder
            updateData.createdById = '000000000000000000000000';
          }
        }
        
        await credentialsCollection.updateOne(
          { _id: credential._id },
          { $set: updateData }
        );
        
        console.log(`Fixed credential: ${credential._id}`);
      }
      
      console.log('All credentials have been fixed!');
    } else {
      console.log('No problematic credentials found.');
    }
    
  } catch (error) {
    console.error('Error fixing credential data:', error);
  } finally {
    await client.close();
  }
}

// Run the fix
fixCredentialData().then(() => {
  console.log('Data fix completed');
  process.exit(0);
}).catch((error) => {
  console.error('Data fix failed:', error);
  process.exit(1);
});
