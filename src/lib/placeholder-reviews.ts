const NAMES = [
  "Fernando Arriaga", "Sofía Ramírez", "Diego Martínez", "Valeria López",
  "Santiago Hernández", "Renata González", "Mateo Pérez", "Regina Vega",
  "Emilio Castillo", "Ximena Barrera", "Leonardo Torres", "Camila Flores",
  "Alejandro Sánchez", "Natalia Ortiz", "Iker Domínguez", "Paola Núñez",
  "Rodrigo Escobar", "Isabella Quintero", "Sebastián Juárez", "Fernanda Zavala",
  "Andrés Reyes", "Mariana Uribe", "Héctor Yáñez", "Daniela Ibarra",
];

const REVIEW_TEXTS: Array<{ rating: number; title: string; body: string }> = [
  { rating: 5, title: "Excelente calidad", body: "La playera es idéntica a la oficial. Tela muy buena y el estampado se nota de alta calidad. Llegó en 3 días, súper recomendado." },
  { rating: 5, title: "Me encantó", body: "Me quedó perfecta, la talla es tal cual se describe. Los colores son vivos y la costura muy bien terminada. Ya compré otra para mi hermano." },
  { rating: 5, title: "100% recomendada", body: "Vale cada peso. La envidia de mis cuates cuando la estrené en el partido. Tela fresca y el escudo aguanta. 10/10." },
  { rating: 4, title: "Buena relación precio-calidad", body: "Cumple con lo que promete. No es la oficial pero visualmente no se nota la diferencia. Entrega rápida y buen empaque." },
  { rating: 5, title: "Superó mis expectativas", body: "Pensé que por el precio iba a ser corriente, pero la tela es de muy buena calidad. Se siente como las originales, increíble." },
  { rating: 5, title: "Llegó antes de lo esperado", body: "Me dijeron 5 días hábiles y llegó en 3. La playera está perfecta, ni un hilo suelto. Sin duda volveré a comprar." },
  { rating: 4, title: "Muy bonita", body: "La verdad me gustó mucho. El envío fue rápido y el empaque llegó impecable. Le doy 4 estrellas solo porque la talla me quedó un poco holgada." },
  { rating: 5, title: "Mi nuevo jersey para los partidos", body: "Ya la usé en dos partidos de cascarita y aguanta perfecto. Tela transpirable, no pica, y el corte es bueno. La repito." },
  { rating: 5, title: "Tal cual la foto", body: "Lo que ves es lo que te llega. Envío seguro, bien empacado, y la playera con sus etiquetas intactas. Recomendadísimo." },
  { rating: 5, title: "Mi hijo feliz", body: "Se la regalé a mi hijo de 15 años y no se la quiere quitar. La tela aguanta los lavados y no pierde color. Buena inversión." },
  { rating: 4, title: "Todo bien", body: "La atención al cliente respondió rápido cuando tuve duda de la talla. Me orientaron sin problema. El producto muy bien." },
  { rating: 5, title: "Calidad sorprendente", body: "Honestamente no esperaba tanto por este precio. La costura, los colores, el escudo, todo impecable. Ya se las recomendé a mis amigos." },
  { rating: 5, title: "Cumple al 100%", body: "Muy contento con la compra. Llegó en el tiempo prometido, buena calidad de tela y el logo bien definido. Pulgar arriba." },
  { rating: 5, title: "100% recomendado", body: "A simple vista notas la gran calidad. Para quienes quieren apoyar al equipo con una camisa de época sin gastar una fortuna, esta es la opción." },
  { rating: 4, title: "Buena pero ojo con la talla", body: "El producto es bueno, la tela y los colores están bien. Solo recomiendo pedir una talla menos si eres delgado, me quedó un poco grande." },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export type PlaceholderReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  name: string;
  createdAt: Date;
  isPlaceholder: true;
};

export function getPlaceholderReviews(productId: string): PlaceholderReview[] {
  const seed = hashString(productId);
  const count = 6 + (seed % 4);
  const reviews: PlaceholderReview[] = [];
  const usedTexts = new Set<number>();
  const usedNames = new Set<number>();

  for (let i = 0; i < count; i++) {
    let nameIdx = (seed + i * 7) % NAMES.length;
    let textIdx = (seed + i * 13) % REVIEW_TEXTS.length;

    while (usedTexts.has(textIdx)) textIdx = (textIdx + 1) % REVIEW_TEXTS.length;
    while (usedNames.has(nameIdx)) nameIdx = (nameIdx + 1) % NAMES.length;
    usedTexts.add(textIdx);
    usedNames.add(nameIdx);

    const daysAgo = 3 + ((seed + i * 17) % 180);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);

    reviews.push({
      id: `placeholder-${productId}-${i}`,
      rating: REVIEW_TEXTS[textIdx].rating,
      title: REVIEW_TEXTS[textIdx].title,
      body: REVIEW_TEXTS[textIdx].body,
      name: NAMES[nameIdx],
      createdAt,
      isPlaceholder: true,
    });
  }

  return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function getPlaceholderAggregate(productId: string) {
  const reviews = getPlaceholderReviews(productId);
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return {
    average: sum / reviews.length,
    count: reviews.length,
  };
}
