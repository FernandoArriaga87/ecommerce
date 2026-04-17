# CLAUDE.md

This file provides guidance to AI assistants when working with code in this repository.

## Project Overview

DeportivoStore is an e-commerce application for sports team jerseys built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, and shadcn/ui. The project adheres to an edgy, high-contrast visual editorial pattern inspired by modern sport/fashion interfaces (ui-ux-pro-max-skill).

### Component Organization
```
src/components/
├── layout/      # Header (Navbar with top announcement bar), Footer
├── home/        # HeroBanner edge-to-edge, ProductGrid
├── products/    # Product specifications, Size selectors, Color selectors
├── cart/        # CartDrawer (using Sheet)
├── ui/          # shadcn/ui components (sharp corners rounded-none)
```

### Data Layer
- `src/lib/data.ts` - Mock products, currently used for the UI phase.
- Prisma will manage the connection to Supabase PostgreSQL.

### Styling System
- Tailwind CSS v4.
- High-contrast, sharp "edgy" style: `rounded-none`, heavy bold/uppercase fonts, `bg-[#18181b]` for dark areas. 
- Use `cn()` utility from `src/lib/utils.ts` for class merging.

### Key Patterns

- **Server Components & Server Actions** - Use Server Components exclusively with Next.js 15 and use Server Actions for all data mutations instead of API Routes.
- `page.tsx` generally wraps layouts and fetches data directly.
- Clean code, well commented, and easy to extend.

## Configuration

- **Path alias**: `@/*` maps to `./src/*`
- **Images**: Remote patterns configured for `images.unsplash.com` and `plus.unsplash.com`.
- **shadcn/ui**: Base UI integration for components.

## Rules

- En el backend usa **Server Actions** en lugares donde el template original usaba Route handlers, respetando el stack del PRD actual.
- Mantén el look edgy y deportivo (sin bordes redondeados excesivos).
