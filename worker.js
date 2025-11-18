addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  if (path === '/validate' && request.method === 'POST') {
    // In a real application, you would perform some validation here.
    // For now, we'll just return a 200 OK.
    return new Response('Validation successful', { headers: corsHeaders });
  }

  if (path === '/chat' && request.method === 'POST') {
    const { pinId, message } = await request.json();
    const pinString = await PINS_KV.get(pinId);
    if (pinString) {
      const pin = JSON.parse(pinString);
      if (!pin.messages) {
        pin.messages = [];
      }
      pin.messages.push(message);
      await PINS_KV.put(pinId, JSON.stringify(pin));
      return new Response('Message saved', { headers: corsHeaders });
    }
    return new Response('Pin not found', { status: 404, headers: corsHeaders });
  }

  if (path === '/' && request.method === 'GET') {
    const kv_list = await PINS_KV.list();
    let pins = [];
    for (const key of kv_list.keys) {
      const pin_string = await PINS_KV.get(key.name);
      pins.push(JSON.parse(pin_string));
    }
    return new Response(JSON.stringify(pins), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  if (path === '/' && request.method === 'POST') {
    const pin = await request.json();
    await PINS_KV.put(pin.id, JSON.stringify(pin));
    return new Response('Pin saved', { headers: corsHeaders });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders })
}

function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: corsHeaders,
    })
  } else {
    return new Response(null, {
      headers: {
        Allow: 'GET, POST, OPTIONS',
      },
    })
  }
}
