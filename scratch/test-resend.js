require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log("Probando enviar correo a cbm0100687arriaga@gmail.com...");
  try {
    const result = await resend.emails.send({
      from: 'AuraSport <onboarding@resend.dev>',
      to: 'cbm0100687arriaga@gmail.com',
      subject: 'Prueba desde script',
      html: '<p>Este es un correo de prueba.</p>'
    });
    console.log("Resultado:", result);
  } catch (error) {
    console.error("Excepción:", error);
  }
}

testEmail();
