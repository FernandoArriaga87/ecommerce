# PRD: DeportivoStore

## 1. Resumen Ejecutivo

**DeportivoStore** es una plataforma e-commerce especializada en playeras de equipos deportivos (fútbol). El sistema permite a los usuarios navegar, filtrar por tallas/colores y comprar productos mediante pagos rápidos, mientras que los administradores gestionan el inventario, usuarios y pedidos.

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | E-commerce B2C |
| **Mercado** | Playeras Deportivas de Fútbol |
| **Plataforma** | Web (responsive) |
| **Estado actual** | UI implementada con datos mock |

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router + Server Components + Server Actions) |
| Lenguaje | TypeScript + ESLint |
| Base de datos | Supabase PostgreSQL (plan gratuito) |
| ORM | Prisma |
| UI Components | shadcn/ui (diseño edgy deportivo) |
| Styling | Tailwind CSS v4 |
| Imágenes | Next.js Image con optimización automática |
| Pagos | Mercado Pago principal + Aplazo (BNPL) + Stripe |
| Correos | Resend o Brevo |
| Hosting y Deploy | Vercel (plan Hobby gratuito) |

---

## 3. Usuarios y Roles

| Rol | Descripción | Permisos clave |
|-----|-------------|----------------|
| **CUSTOMER** | Cliente final | Navegar, comprar, gestionar su perfil y direcciones |
| **MODERATOR** | Vendedor/Staff | Todo lo anterior + gestionar productos, categorías, equipos y ver todos los pedidos |
| **ADMIN** | Administrador | Todo lo anterior + gestionar usuarios y configuración del sistema |

---

## 4. Funcionalidades Principales

### 4.1 Tienda Pública
- **Homepage**: Hero banner, categorías deportivas (Ligas, Selecciones), productos destacados, sección de equipos.
- **Catálogo** (`/products`): Grid de productos con filtros de talla/equipo, ordenamiento.
- **Detalle de producto** (`/producto/[id]`): Galería de imágenes, especificaciones, selector de cantidad/talla/color, productos relacionados.
- **Carrito** (`/cart`): Implementado como Drawer (Sheet lateral), cantidades editables, resumen con subtotal/envío/total.
- **Checkout directos**: Conexión a pasarela segura (Mercado Pago, Stripe, Aplazo).

### 4.2 Autenticación
- Registro de usuarios (email/password).
- Login con credenciales.
- Protección de rutas por rol.

### 4.3 Perfil de Usuario
- Información personal y estadísticas.
- Historial de pedidos.
- Gestión de direcciones (CRUD).
- Productos favoritos.
- Configuración de cuenta.

### 4.4 Panel de Administración
- **Dashboard**: Estadísticas de ventas, pedidos, usuarios.
- **Productos**: CRUD completo con imágenes, variantes (Talla, Color) y especificaciones.
- **Usuarios**: Gestión y asignación de roles.
- **Pagos/Órdenes**: Historial y cambio de estados.
- **Configuración**: Ajustes del sistema.

---

## 5. Modelo de Datos

### Entidades Principales

```
User ──┬── Address (1:N)
       └── Order (1:N) ──── OrderItem (1:N) ──── Variant (1:N) ──── Product
                                                                       │
Category (1:N) ────────────────────────────────────────────────────────┤
Team/Brand (1:N) ──────────────────────────────────────────────────────┘
```

### Estados de Pedido
```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    └──────────────────────────────────────→ CANCELLED
```

### Métodos de Pago
- Mercado Pago (MERCADO_PAGO)
- Stripe (STRIPE)
- Aplazo (APLAZO)

---

## 6. Estructura de Páginas

| Sección | Cantidad | Rutas ejemplo |
|---------|----------|---------------|
| Públicas | 6 | `/`, `/products`, `/producto/[id]`, `/login`, `/register` |
| Checkout | 3 | Checkout externo (Mercado Pago), `/checkout/success`, `/checkout/cancel` |
| Perfil | 7 | `/profile`, `/profile/orders`, `/profile/addresses/*` |
| Admin | 7 | `/admin`, `/admin/products/*`, `/admin/users/*`, `/admin/payments` |
| **Total** | **23** | |

---

## 7. Interacciones con el Backend (Server Actions / APIs)

En Next.js 15, gran parte de la interacción reemplaza los endpoints GET por *Server Components*. Las mutaciones usan *Server Actions*. Solo los Webhooks utilizan *Route Handlers*.

| Recurso | Flujo / Endpoints |
|---------|-----------|
| Auth | Server Actions para Login / Registro vía Supabase. |
| Products | Lectura vía Prisma Server Components, Mutación vía Server Actions. |
| Categories | Lectura en Server Component de `page.tsx`. |
| Teams | Lectura en Server Component de `page.tsx`. |
| Orders | Server Actions para lectura/creación de órdenes. |
| Addresses | CRUD con Server Actions en vistas de Perfil. |
| Users | Gestiones del Admin vía Server Actions. |
| Payments | Server Action `createCheckoutSession`, y Route Handlers `POST /api/webhook/stripe`, `POST /api/webhook/mercadopago` |

---

## 8. Categorías de Productos

- Liga MX
- Ligas Europeas
- Selecciones Nacionales
- Retro / Leyendas
- Ropa de Entrenamiento

### Equipos Destacados
Madrid, Barcelona, Manchester Blue, Juventus, Arsenal, Selección Nacional, etc.

---

## 9. Requisitos No Funcionales

| Aspecto | Requisito |
|---------|-----------|
| **Responsive** | Mobile-first, soporte completo desktop/tablet/mobile |
| **Tema** | Deportivo y Edgy. High-contrast (sin bordes redondeados excesivos) |
| **SEO** | Server-side rendering con Next.js y Metadatos optimizados |
| **Performance** | Imágenes de Next.js (`next/image`), skeletons para loading |

---

## 10. Exclusiones (No incluido inicialmente)

- Sistema complejo de cupones/descuentos
- Reseñas de productos
- Wishlist avanzada
- Multi-idioma
- Multi-moneda
- Integración con marketplaces externos

---

## 11. Fases de Implementación

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1. UI con datos mock | ✅ Completada | Layout, componentes (Home, Page, Drawer), datos estáticos |
| 2. Backend (Prisma/Supabase) | Pendiente | Modelo de datos y Prisma Client |
| 3. Autenticación | Pendiente | Login via Supabase / Auth |
| 4. Integración de pagos | Pendiente | Mercado Pago, Stripe, Aplazo (Checkout y Webhooks) |
| 5. Deploy y optimización | Pendiente | Vercel Hobby + PostgreSQL |
