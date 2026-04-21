# Plan: AuraSport - Ecommerce de Playeras de Deportes

## Configuración del Proyecto
- **Nombre**: AuraSport

## Stack Tecnológico
- **Frontend**: Next.js 15 (App Router, Server Actions)
- **Base de datos**: Supabase (PostgreSQL) - Plan Gratuito
- **ORM**: Prisma
- **UI Components**: shadcn/ui (Estilo "Edgy")
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Pagos**: Mercado Pago, Aplazo, Stripe

## Fases de Implementación

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1. UI con datos mock | ✅ Completada | Layout, componentes EDGE, páginas con datos estáticos |
| 2. Backend (Prisma/PostgreSQL) | Pendiente | Modelo de datos y push db, Server components de lectura |
| 3. Autenticación | Pendiente | Supabase Auth con credenciales (Admin y Customers) |
| 4. Server Actions Lógicas | Pendiente | CRUDs e interacciones de DB para el Admin Panel |
| 5. Integración de pagos | Pendiente | Mercado Pago, Stripe, Aplazo (Peticiones Checkout URL) |
| 6. Route Handlers | Pendiente | Endpoints dedicados para recibir ping de Webhooks. |
| 7. Deploy y optimización | Pendiente | Vercel (Hobby) + Supabase |
