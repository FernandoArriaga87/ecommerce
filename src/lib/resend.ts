import { Resend } from 'resend';

// Verifica si existe la variable de entorno, si no, no inicializa (útil para que no crashee en build)
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Dominio de remitente — usa onboarding@resend.dev para testing (solo envía a tu correo de Resend)
// En producción cambia a tu dominio verificado: 'DeportivoStore <pedidos@tudominio.com>'
export const SEND_FROM = 'DeportivoStore <onboarding@resend.dev>';
