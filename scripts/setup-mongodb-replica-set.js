const { MongoClient } = require('mongodb');

async function setupReplicaSet() {
  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    const adminDb = client.db('admin');
    
    console.log('Setting up MongoDB replica set...');
    
    // Check if replica set is already configured
    try {
      const status = await adminDb.command({ replSetGetStatus: 1 });
      console.log('Replica set is already configured:', status.set);
      return;
    } catch (error) {
      console.log('Replica set not configured, initializing...');
    }
    
    // Initialize replica set
    const config = {
      _id: 'rs0',
      members: [
        { _id: 0, host: 'localhost:27017' }
      ]
    };
    
    try {
      await adminDb.command({ replSetInitiate: config });
      console.log('Replica set initialized successfully!');
      console.log('You may need to restart your MongoDB server for the changes to take effect.');
    } catch (initError) {
      console.error('Failed to initialize replica set:', initError.message);
      console.log('\nAlternative: You can manually configure MongoDB as a replica set by:');
      console.log('1. Stop MongoDB');
      console.log('2. Start MongoDB with: mongod --replSet rs0');
      console.log('3. Connect to MongoDB and run: rs.initiate()');
    }
    
  } catch (error) {
    console.error('Error setting up replica set:', error);
  } finally {
    await client.close();
  }
}

// Run the setup
setupReplicaSet().then(() => {
  console.log('Replica set setup completed');
  process.exit(0);
}).catch((error) => {
  console.error('Replica set setup failed:', error);
  process.exit(1);
});
