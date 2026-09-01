const https = require('https');

const req = https.request('https://api.groq.com/openai/v1/models', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY_HERE'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('AVAILABLE GROQ MODELS:');
      parsed.data.forEach(m => console.log(m.id));
    } catch (e) {
      console.log('Error parsing:', data);
    }
  });
});

req.on('error', console.error);
req.end();
