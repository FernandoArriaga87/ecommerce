require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log("Probando enviar correo a fernandoarriaga1203@gmail.com...");
  try {
    const result = await resend.emails.send({
      from: 'AuraSport <onboarding@resend.dev>',
      to: 'fernandoarriaga1203@gmail.com',
      subject: 'Prueba desde script',
      html: '<p>Este es un correo de prueba.</p>'
    });
    console.log("Resultado:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Excepción:", error);
  }
}

testEmail();
