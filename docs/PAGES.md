# Listado de Páginas - DeportivoStore

## Páginas Públicas (Shop)

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/` | Homepage - Hero full-width, categorías deportivas, grid productos | No |
| `/products` | Catalogo de playeras con filtros | No |
| `/producto/[id]` | Detalle de playera (selectores de variaciones) | No |
| `/login` | Inicio de sesion | Solo invitados |
| `/register` | Registro de usuario | Solo invitados |

*Nota:* El carrito (`/cart`) está manejado puramente en un componente interactivo Drawer (`Sheet`).

## Páginas de Checkout

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/checkout` | Flujo de checkout | No obligatoria/Sí |
| `/checkout/success` | Confirmacion de pago exitoso (vuelta de Mercado Pago) | No obligatoria/Sí |
| `/checkout/cancel` | Pago cancelado / declinado | No obligatoria/Sí |

## Páginas de Perfil de Usuario

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/profile` | Informacion del perfil y estadisticas de compras | Si |
| `/profile/orders` | Historial de pedidos y guías de rastreo | Si |
| `/profile/addresses` | Lista de direcciones | Si |
| `/profile/addresses/new` | Agregar nueva direccion | Si |
| `/profile/addresses/[id]/edit` | Editar direccion | Si |
| `/profile/favorites` | Productos favoritos | Si |
| `/profile/settings` | Configuracion de cuenta | Si |

## Páginas de Administración

| Ruta | Descripcion | Autenticacion |
|------|-------------|---------------|
| `/admin` | Dashboard con estadisticas | Admin |
| `/admin/products` | Gestion de playeras / inventarios | Admin |
| `/admin/products/new` | Crear nuevo producto / variantes | Admin |
| `/admin/users` | Gestion de usuarios | Admin |
| `/admin/payments` | Historial de pagos/ordenes | Admin |
| `/admin/settings` | Configuracion del sistema | Admin |

---

## Acciones de Servidor y Rutas API (Next.js 15)

Al utilizar **Next.js 15 y Server Actions**, muchas rutas API clásicas (REST) se gestionan directamente mediante mutaciones de Server Actions. Los Webhooks sí usan Handlers.

### Autenticacion
| Metodo | Componente/Ruta | Descripcion |
|--------|------|-------------|
| Acción | `loginAction` | Login con Supabase Auth |
| Acción | `registerAction` | Registro de Usuario (Supabase Auth) |

### Productos y Categorías
| Metodo | Componente/Ruta | Descripcion |
|--------|------|-------------|
| Server Component | `page.tsx` | Fetch Listar productos |
| Server Component | `page.tsx` | Fetch Listar producto por ID |
| Acción | `createProductAction` | Crear producto |
| Acción | `updateProductAction` | Actualizar producto e inventario |

### Ordenes (Carrito a DB)
| Metodo | Componente/Ruta | Descripcion |
|--------|------|-------------|
| Acción | `createOrderAction` | Crear orden (Estatus: PENDING) |
| Server Component | `profile/orders/page.tsx`| Fetch Lista órdenes del usuario |

### Webhooks de Pagos (Route Handlers)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/webhook/mercadopago`| Webhook de actualización Mercado Pago |
| POST | `/api/webhook/stripe` | Webhook de actualización de Stripe |

---

## Estructura de Layouts

```
src/app/
├── layout.tsx                    # Root layout (ThemeProvider, Navbar global)
├── (shop)/                       # Grupo de rutas publicas (Principal)
│   ├── page.tsx                 # Homepage / Catálogo
│   ├── producto/[id]/
│   ├── checkout/
│   ├── profile/
│   │   └── layout.tsx           # Layout con sidebar de perfil
│   ├── login/
│   └── register/
└── (admin-panel)/               # Grupo de rutas admin
    └── admin/
        ├── layout.tsx           # Layout con AdminSidebar
        ├── page.tsx             # Dashboard
        ├── products/
        ├── users/
        └── payments/
```

## Protección de Rutas (Middleware local / Supabase Auth)

- **Rutas protegidas** (`/profile/*`, `/checkout` requerida): Requieren autenticacion.
- **Rutas admin** (`/admin/*`): Requieren rol ADMIN de tabla usuarios.
- **Rutas de invitados** (`/login`, `/register`): Solo accesibles sin autenticacion.

---

## Resumen

| Categoria | Cantidad |
|-----------|----------|
| Paginas Publicas | 5 |
| Paginas Checkout | 3 |
| Paginas Perfil | 7 |
| Paginas Admin | 6 |
| **Total Páginas** | **21** |
