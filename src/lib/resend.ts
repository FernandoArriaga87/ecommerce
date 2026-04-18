import { Resend } from 'resend';

// Verifica si existe la variable de entorno, si no, no inicializa (útil para que no crashee en build)
export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Dominio de remitente por defecto
export const SEND_FROM = 'DeportivoStore <pedidos@tu-dominio.com>'; // Cambiar en prod a tu dominio verificado
