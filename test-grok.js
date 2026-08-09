const GROK_API_KEY = "YOUR_API_KEY";

async function test() {
  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: 'Hello' }]
  };

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROK_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', data);
}
test();
