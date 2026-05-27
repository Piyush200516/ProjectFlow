async function test() {
  try {
    const response = await fetch('https://projectflow-edu-app.netlify.app/.netlify/functions/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'testuser' + Date.now() + '@example.com',
        password: 'password123',
        role: 'student'
      })
    });
    const data = await response.json();
    console.log(response.status, data);
  } catch(e) {
    console.error(e);
  }
}
test();
