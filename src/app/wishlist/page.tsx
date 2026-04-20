import type { Metadata } from "next";
import { WishlistClient } from "./client";

export const metadata: Metadata = {
  title: "Mis favoritos",
  description: "Los jerseys que guardaste para más tarde.",
  robots: { index: false, follow: false },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
