import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutCancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center">
      <div className="flex flex-col items-center max-w-lg">
        <XCircle className="h-20 w-20 text-gray-400 mb-6" />
        <h1 className="text-4xl font-black uppercase tracking-tight mb-4">
          PAGO CANCELADO
        </h1>
        <p className="text-sm text-gray-500 font-medium tracking-wide uppercase mb-10">
          El proceso de pago fue interrumpido o declinado. No se ha realizado ningún cargo a tu cuenta. Puedes volver a intentarlo u ocupar otro método de pago.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full h-14 px-8 rounded-none bg-black text-white hover:bg-gray-800 uppercase font-black tracking-widest text-xs">
              Volver a la tienda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
