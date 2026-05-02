exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    // Sanitize user inputs to prevent prompt injection
    function sanitize(str) {
      if (!str) return '';
      return str
        .replace(/[<>{}[\]]/g, '')
        .replace(/important|ignore|repeat|instructions|system|prompt/gi, '')
        .slice(0, 50);
    }

    // Clean the user message which is the second message in the array
    if (body.messages && body.messages[1]) {
      body.messages[1].content = body.messages[1].content
        .split('\n')
        .map(line => {
          if (line.startsWith('Name:')) return 'Name: ' + sanitize(line.replace('Name:', '').trim());
          return line;
        })
        .join('\n');
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
