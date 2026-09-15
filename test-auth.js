async function testAuth() {
  const email = 'testuser123@example.com';
  const password = 'password123';
  const name = 'Test User';

  console.log('--- Testing Signup ---');
  try {
    const signupRes = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const signupData = await signupRes.json();
    console.log('Signup status:', signupRes.status);
    console.log('Signup response:', signupData);
  } catch (e) {
    console.error('Signup error:', e);
  }

  console.log('--- Testing Login ---');
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    console.log('Login response:', loginData);
  } catch (e) {
    console.error('Login error:', e);
  }
}

testAuth();
