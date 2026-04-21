const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '../.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

async function test() {
  const API_URL = "https://sb-pro.skydropx.com/api/v1";
  
  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: env.SKYDROPX_API_KEY,
    client_secret: env.SKYDROPX_API_SECRET,
  });

  const resAuth = await fetch(`${API_URL}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: formBody.toString(),
  });
  
  if (!resAuth.ok) {
    console.error("Auth failed:", resAuth.status, await resAuth.text());
    return;
  }
  
  const { access_token } = await resAuth.json();
  console.log("Auth success!");
  
  const body = {
    quotation: {
      address_from: { 
        country_code: "MX", 
        postal_code: env.SKYDROPX_ORIGIN_ZIP || "64640",
        area_level1: "Nuevo León",
        area_level2: "Monterrey",
        area_level3: "Centro"
      },
      address_to: { 
        country_code: "MX", 
        postal_code: "01000",
        area_level1: "Ciudad de México",
        area_level2: "Álvaro Obregón",
        area_level3: "San Ángel"
      },
      parcel: { weight: 1, length: 30, width: 30, height: 10 },
      requested_carriers: [],
    },
  };

  const res = await fetch(`${API_URL}/quotations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    console.error("Quotation failed:", res.status, await res.text());
    return;
  }
  
  let quoteRes = await res.json();
  const quoteId = quoteRes.id;
  console.log(`Quotation created with ID: ${quoteId}. is_completed: ${quoteRes.is_completed}`);

  let attempts = 0;
  while (!quoteRes.is_completed && attempts < 10) {
    attempts++;
    console.log(`Polling attempt ${attempts}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollRes = await fetch(`${API_URL}/quotations/${quoteId}`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    if (!pollRes.ok) {
      console.error("Polling failed", pollRes.status);
      break;
    }
    quoteRes = await pollRes.json();
    console.log(`is_completed: ${quoteRes.is_completed}`);
  }

  console.log(JSON.stringify(quoteRes.rates.filter(r => r.amount), null, 2));
}

test();
