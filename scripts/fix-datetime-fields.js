const { MongoClient } = require('mongodb');

async function fixDateTimeFields() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('credential_manager');
    
    console.log('Fixing DateTime fields in the database...');
    
    // Fix clients collection
    const clientsCollection = db.collection('clients');
    
    // Find documents with string DateTime fields
    const clientsWithStringDates = await clientsCollection.find({
      $or: [
        { createdAt: { $type: 'string' } },
        { updatedAt: { $type: 'string' } }
      ]
    }).toArray();
    
    console.log(`Found ${clientsWithStringDates.length} clients with string DateTime fields`);
    
    for (const clientDoc of clientsWithStringDates) {
      const updateData = {};
      
      if (typeof clientDoc.createdAt === 'string') {
        updateData.createdAt = new Date(clientDoc.createdAt);
      }
      
      if (typeof clientDoc.updatedAt === 'string') {
        updateData.updatedAt = new Date(clientDoc.updatedAt);
      }
      
      await clientsCollection.updateOne(
        { _id: clientDoc._id },
        { $set: updateData }
      );
      
      console.log(`Fixed client: ${clientDoc._id}`);
    }
    
    // Fix credentials collection
    const credentialsCollection = db.collection('credentials');
    
    const credentialsWithStringDates = await credentialsCollection.find({
      $or: [
        { createdAt: { $type: 'string' } },
        { updatedAt: { $type: 'string' } },
        { lastAccessedAt: { $type: 'string' } }
      ]
    }).toArray();
    
    console.log(`Found ${credentialsWithStringDates.length} credentials with string DateTime fields`);
    
    for (const credentialDoc of credentialsWithStringDates) {
      const updateData = {};
      
      if (typeof credentialDoc.createdAt === 'string') {
        updateData.createdAt = new Date(credentialDoc.createdAt);
      }
      
      if (typeof credentialDoc.updatedAt === 'string') {
        updateData.updatedAt = new Date(credentialDoc.updatedAt);
      }
      
      if (typeof credentialDoc.lastAccessedAt === 'string') {
        updateData.lastAccessedAt = new Date(credentialDoc.lastAccessedAt);
      }
      
      await credentialsCollection.updateOne(
        { _id: credentialDoc._id },
        { $set: updateData }
      );
      
      console.log(`Fixed credential: ${credentialDoc._id}`);
    }
    
    // Fix users collection
    const usersCollection = db.collection('users');
    
    const usersWithStringDates = await usersCollection.find({
      $or: [
        { createdAt: { $type: 'string' } },
        { updatedAt: { $type: 'string' } }
      ]
    }).toArray();
    
    console.log(`Found ${usersWithStringDates.length} users with string DateTime fields`);
    
    for (const userDoc of usersWithStringDates) {
      const updateData = {};
      
      if (typeof userDoc.createdAt === 'string') {
        updateData.createdAt = new Date(userDoc.createdAt);
      }
      
      if (typeof userDoc.updatedAt === 'string') {
        updateData.updatedAt = new Date(userDoc.updatedAt);
      }
      
      await usersCollection.updateOne(
        { _id: userDoc._id },
        { $set: updateData }
      );
      
      console.log(`Fixed user: ${userDoc._id}`);
    }
    
    console.log('All DateTime fields have been fixed!');
    
  } catch (error) {
    console.error('Error fixing DateTime fields:', error);
  } finally {
    await client.close();
  }
}

// Run the fix
fixDateTimeFields().then(() => {
  console.log('DateTime fix completed');
  process.exit(0);
}).catch((error) => {
  console.error('DateTime fix failed:', error);
  process.exit(1);
});
