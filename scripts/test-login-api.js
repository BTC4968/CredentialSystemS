const fetch = require('node-fetch');

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login API...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'admin'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Admin login successful!');
      console.log('👤 User:', data.user.name);
      console.log('📧 Email:', data.user.email);
      console.log('🔑 Role:', data.user.role);
      console.log('🎫 Token:', data.token ? 'Generated' : 'Missing');
    } else {
      console.log('❌ Admin login failed');
      console.log('Error:', data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Wait a moment for the server to start, then test
setTimeout(testAdminLogin, 3000);
