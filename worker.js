addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return handleOptions(request)
  }

  if (request.method === 'GET') {
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

  if (request.method === 'POST') {
    const body = await request.json();
    await PINS_KV.put(crypto.randomUUID(), JSON.stringify(body));
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
