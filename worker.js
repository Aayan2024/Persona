export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle the /style API route
    if (url.pathname === '/style' && request.method === 'POST') {
      try {
        const body = await request.json();

        function sanitize(str) {
          if (!str) return '';
          return str
            .replace(/[<>{}[\]]/g, '')
            .replace(/important|ignore|repeat|instructions|system|prompt/gi, '')
            .slice(0, 50);
        }

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
            'Authorization': `Bearer ${env.GROQ_API_KEY}`
          },
          body: JSON.stringify(body)
        });

        const data = await res.json();
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // All other requests serve static assets
    return env.ASSETS.fetch(request);
  }
};
