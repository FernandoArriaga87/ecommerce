export interface Product {
  id: string;
  name: string;
  team: string;
  price: number;
  image: string;
  badge?: string;
  sizes: { label: string; stock: number }[];
  sku: string;
  slug: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Jersey Madrid Local 24/25",
    team: "Madrid",
    price: 1899,
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?q=80&w=800&auto=format&fit=crop",
    badge: "Más vendido",
    sizes: [
      { label: "S", stock: 5 },
      { label: "M", stock: 12 },
      { label: "L", stock: 0 },
      { label: "XL", stock: 3 }
    ],
    sku: "RM-LOC-2425",
    slug: "jersey-madrid-local-24-25"
  },
  {
    id: "2",
    name: "Jersey Manchester Blue Visitante",
    team: "Manchester Blue",
    price: 1799,
    image: "https://images.unsplash.com/photo-1544452179-883a992bc0c2?q=80&w=800&auto=format&fit=crop",
    badge: "Nuevo",
    sizes: [
      { label: "S", stock: 0 },
      { label: "M", stock: 8 },
      { label: "L", stock: 4 },
      { label: "XL", stock: 2 }
    ],
    sku: "MB-VIS-2425",
    slug: "jersey-manchester-blue-visitante"
  },
  {
    id: "3",
    name: "Playera Selección Nacional Local",
    team: "Nacional",
    price: 1999,
    image: "https://images.unsplash.com/photo-1552554769-cf2be34be108?q=80&w=800&auto=format&fit=crop",
    sizes: [
      { label: "S", stock: 10 },
      { label: "M", stock: 0 },
      { label: "L", stock: 14 }
    ],
    sku: "NAC-LOC-2425",
    slug: "playera-seleccion-nacional-local"
  },
  {
    id: "4",
    name: "Jersey Barcelona Local 24/25",
    team: "Barcelona",
    price: 1899,
    image: "https://images.unsplash.com/photo-1582046897931-1507ae8001be?q=80&w=800&auto=format&fit=crop",
    sizes: [
      { label: "S", stock: 2 },
      { label: "M", stock: 5 },
      { label: "L", stock: 8 },
      { label: "XL", stock: 0 }
    ],
    sku: "FCB-LOC-2425",
    slug: "jersey-barcelona-local-24-25"
  },
  {
    id: "5",
    name: "Jersey Juventus Visitante 23/24",
    team: "Juventus",
    price: 1699,
    image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=800&auto=format&fit=crop",
    sizes: [
      { label: "S", stock: 0 },
      { label: "M", stock: 0 },
      { label: "L", stock: 5 },
      { label: "XL", stock: 1 }
    ],
    sku: "JUV-VIS-2324",
    slug: "jersey-juventus-visitante-23-24"
  },
  {
    id: "6",
    name: "Playera Arsenal Tercera Equipación",
    team: "Arsenal",
    price: 1799,
    image: "/brazilshirt.webp",
    sizes: [
      { label: "S", stock: 4 },
      { label: "M", stock: 7 },
      { label: "L", stock: 3 },
      { label: "XL", stock: 0 }
    ],
    sku: "ARS-TER-2324",
    slug: "playera-arsenal-tercera-equipacion"
  }
];

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
};
