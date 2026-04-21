const fs = require('fs');
const path = require('path');

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
  
  if (!resAuth.ok) return console.error("Auth failed");
  const { access_token } = await resAuth.json();
  
  // 1. Create Quote with full addresses (name, phone, street1, area levels)
  const quoteBody = {
    quotation: {
      address_from: { 
        country_code: "MX", postal_code: env.SKYDROPX_ORIGIN_ZIP || "64640",
        area_level1: "Nuevo León", area_level2: "Monterrey", area_level3: "Centro",
        name: "Tienda Origen", phone: "8180000000", street1: "Av. Central 123", email: "hola@tienda.com"
      },
      address_to: { 
        country_code: "MX", postal_code: "01000",
        area_level1: "Ciudad de México", area_level2: "Álvaro Obregón", area_level3: "San Ángel",
        name: "Cliente Destino", phone: "5550000000", street1: "Av. Insurgentes 456", email: "cliente@test.com"
      },
      parcel: { weight: 1, length: 30, width: 30, height: 10 },
      requested_carriers: [],
    },
  };

  const resQuote = await fetch(`${API_URL}/quotations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    },
    body: JSON.stringify(quoteBody),
  });
  
  let quoteRes = await resQuote.json();
  const quoteId = quoteRes.id || quoteRes?.data?.id;
  
  let attempts = 0;
  while (!quoteRes.is_completed && attempts < 5) {
    attempts++;
    await new Promise(r => setTimeout(r, 1000));
    const poll = await fetch(`${API_URL}/quotations/${quoteId}`, { headers: { Authorization: `Bearer ${access_token}` } });
    quoteRes = await poll.json();
  }
  
  const rate = quoteRes.rates.find(r => r.amount);
  if (!rate) return console.error("No valid rates found");

  console.log("Trying to create shipment with quotation_id:", quoteId, "rate_id:", rate.id);
  
  // Try sending payload with quotation_id and rate_id as per search results
  const shipmentBody = {
    shipment: {
      rate_id: rate.id,
      reference: "ORD-001",
      address_from: { ...quoteBody.quotation.address_from, reference: "Almacen Central" },
      address_to: { ...quoteBody.quotation.address_to, reference: "Casa" },
      packages: [
        {
          package_number: 1,
          weight: 1, length: 30, width: 30, height: 10,
          consignment_note: "53131600",
          package_type: "4G" // 4G = Caja de carton
        }
      ]
    }
  };

  const resShip = await fetch(`${API_URL}/shipments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${access_token}`
    },
    body: JSON.stringify(shipmentBody),
  });
  
  console.log("Shipment Response:", resShip.status, await resShip.text());
}
test();