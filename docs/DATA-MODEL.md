# Modelo de Datos - AuraSport

## Resumen de Requisitos

- **Registro**: Auto-registro + Admin puede crear cuentas.
- **Auth**: Autenticación manejada para proteger historial de compras (Email/Password).
- **Inventario**: Validado por variante opcional (Talla, Color y Stock numérico).
- **Pedidos**: Crear, historial, estados simples.
- **Cupones**: No.
- **Reseñas**: No.
- **Wishlist**: Simple, basada en favoritos del usuario.
- **Roles**: Admin, Moderador/Vendedor, Cliente.

---

## Diagrama de Relaciones

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │   Product   │       │  Category   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ email       │       │ name        │◄──────│ name        │
│ password    │       │ slug        │       │ slug        │
│ name        │       │ description │       │ createdAt   │
│ phone       │       │ price       │       └─────────────┘
│ role        │       │ comparePrice│       
│ status      │       │ images[]    │       ┌─────────────┐
│ createdAt   │       │ isNew       │       │   Team      │
└──────┬──────┘       │ isFeatured  │       ├─────────────┤
       │              │ isActive    │◄──────│ id          │
       │              │ categoryId  │       │ name        │
       │              │ teamId      │       │ slug        │
       │              │ createdAt   │       │ logo        │
       │              └──────┬──────┘       │ createdAt   │
       │                     │              └─────────────┘
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│   Address   │       │   Variant   │
├─────────────┤       ├─────────────┤
│ id          │       │ id          │
│ userId      │       │ productId   │
│ label       │       │ color       │
│ name        │       │ size        │
│ phone       │       │ stock       │
│ address     │       │ sku         │
│ city        │       └──────┬──────┘
│ state       │              │
│ zipCode     │              │
│ isDefault   │              │
│ createdAt   │              │
└─────────────┘              │
                             │
┌─────────────┐       ┌──────▼──────┐
│    Order    │       │ OrderItem   │
├─────────────┤       ├─────────────┤
│ id          │       │ id          │
│ orderNumber │       │ orderId     │
│ userId      │───────│ productId   │
│ addressId   │       │ variantId   │
│ status      │       │ price       │
│ subtotal    │       │ quantity    │
│ shipping    │       │ total       │
│ total       │       └─────────────┘
│ paymentMethod│
│ notes       │
│ externalId  │ 
│ createdAt   │
└─────────────┘
```

## Descripción de Modelos

### User (Usuarios)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| email | String | Email unico para login |
| password | String | Hash de contrasena (bcrypt) |
| name | String | Nombre completo |
| phone | String? | Telefono (opcional) |
| avatar | String? | URL de imagen de perfil |
| role | Enum | ADMIN, MODERATOR, CUSTOMER |
| status | Enum | ACTIVE, INACTIVE, SUSPENDED |

### Category (Categorias)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre (ej: "Liga MX", "Selecciones") |
| slug | String | URL-friendly |

### Team (Equipos/Marcas)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre (ej: "Madrid", "Nacional") |
| slug | String | URL-friendly |
| logo | String? | URL del logo/escudo |

### Product (Productos)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| name | String | Nombre del producto |
| slug | String | URL-friendly unico |
| description | String? | Descripcion detallada |
| price | Decimal | Precio actual |
| comparePrice| Decimal? | Precio anterior (para descuento) |
| images | String[] | Array de URLs de imagenes |
| isNew | Boolean | Marcar como nuevo |
| isFeatured | Boolean | Producto destacado |
| isActive | Boolean | Visible en tienda |

### Variant (Variantes - Tallas y Colores)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| productId | cuid | Producto asociado |
| color | String | Nombre del color (Ej: "Negro") |
| size | String | Talla (Ej: "S", "M") |
| stock | Int | Control de inventario físico |
| sku | String | SKU único por Variante |

### Address (Direcciones)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| label | String | Etiqueta (Casa, Oficina) |
| name | String | Nombre del destinatario |
| phone | String | Telefono de contacto |
| address | String | Direccion completa |
| city | String | Ciudad |
| state | String | Departamento/Estado |
| zipCode | String | Codigo postal |
| isDefault | Boolean | Direccion predeterminada |

### Order (Pedidos)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| orderNumber | String | Numero visible (ORD-2024-001) |
| status | Enum | Estado del pedido |
| subtotal | Decimal | Suma de items |
| shipping | Decimal | Costo de envio |
| total | Decimal | Total final |
| paymentMethod| Enum | STRIPE, MERCADO_PAGO, APLAZO |
| notes | String? | Notas adicionales |
| externalId | String? | ID Transacción (Webhook) |

### OrderItem (Items del Pedido)
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | cuid | Identificador unico |
| variantId | cuid | ID de la talla/color comprada |
| price | Decimal | Precio al momento de compra |
| quantity | Int | Cantidad |
| total | Decimal | price x quantity |

---

## Roles y Permisos

| Accion | CUSTOMER | MODERATOR | ADMIN |
|--------|----------|-----------|-------|
| Ver productos | ✅ | ✅ | ✅ |
| Crear pedidos | ✅ | ✅ | ✅ |
| Ver sus pedidos | ✅ | ✅ | ✅ |
| Gestionar direcciones propias | ✅ | ✅ | ✅ |
| Ver todos los pedidos | ❌ | ✅ | ✅ |
| Crear/editar productos | ❌ | ✅ | ✅ |
| Crear/editar categorias | ❌ | ✅ | ✅ |
| Crear/editar equipos | ❌ | ✅ | ✅ |
| Cambiar estado de pedidos | ❌ | ✅ | ✅ |
| Gestionar usuarios | ❌ | ❌ | ✅ |
| Ver estadisticas | ❌ | ✅ | ✅ |
| Configuracion del sistema | ❌ | ❌ | ✅ |

---

## Estados de Pedido

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↓         ↓            ↓           ↓
    └─────────┴────────────┴───────────┴──→ CANCELLED
```

| Estado | Descripcion |
|--------|-------------|
| PENDING | Pedido creado, esperando confirmacion via Webhook |
| CONFIRMED | Webhook recibido, pago MP/Stripe validado |
| PROCESSING | En preparacion Logística |
| SHIPPED | Enviado (en camino) |
| DELIVERED | Entregado |
| CANCELLED | Cancelado |
