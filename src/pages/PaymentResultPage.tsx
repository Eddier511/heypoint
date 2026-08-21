import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock3, LoaderCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { CheckoutStepper } from "../components/CheckoutStepper";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { api } from "../lib/api";
import { PurchaseSuccessPage } from "./PurchaseSuccessPage";

type PaymentState = "verifying" | "approved" | "pending" | "failed" | "review";

type PaymentOrder = {
  id: string;
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  state: "approved" | "pending" | "failed" | "review";
  approved: boolean;
  final: boolean;
  pickupToken: string;
  pickupTokenExpiresAt?: string;
  customerName?: string;
  customerEmail?: string;
};

interface PaymentResultPageProps {
  onNavigate?: (page: string) => void;
  userEmail?: string;
  userName?: string;
  onClearCart?: () => void;
}

const MAX_POLLS = 10;
const POLL_DELAY_MS = 2000;

export function PaymentResultPage({
  onNavigate,
  userEmail = "",
  userName = "",
  onClearCart,
}: PaymentResultPageProps) {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const orderDocId =
    params.get("order_id") || sessionStorage.getItem("heypoint_pending_order_id") || "";
  const rawPaymentId = params.get("payment_id") || params.get("collection_id") || "";
  const paymentId = /^\d+$/.test(rawPaymentId) ? rawPaymentId : "";
  const returnStatus = String(params.get("mp_status") || params.get("status") || "").toLowerCase();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<PaymentState>("verifying");
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [message, setMessage] = useState("Estamos confirmando el pago con Mercado Pago.");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    let cancelled = false;

    const applyStatus = (data: PaymentOrder) => {
      if (cancelled) return true;
      setOrder(data);
      if (data.state === "approved" && data.pickupToken) {
        sessionStorage.removeItem("heypoint_pending_order_id");
        setState("approved");
        return true;
      }
      if (data.state === "failed") {
        setState("failed");
        setMessage("El pago no se completó. Tu carrito sigue disponible para intentarlo nuevamente.");
        return true;
      }
      if (data.state === "review") {
        setState("review");
        setMessage("El pago fue recibido y el pedido necesita una validación adicional.");
        return true;
      }
      return false;
    };

    const verify = async (attempt: number) => {
      if (!orderDocId) {
        setState("failed");
        setMessage("No encontramos la referencia del pedido para verificar el pago.");
        return;
      }

      try {
        const response =
          attempt === 0 && paymentId
            ? await api.post<PaymentOrder>(
                `/orders/${encodeURIComponent(orderDocId)}/mercadopago/sync`,
                { paymentId },
              )
            : await api.get<PaymentOrder>(
                `/orders/${encodeURIComponent(orderDocId)}/payment-status`,
              );

        if (applyStatus(response.data)) return;

        if (returnStatus === "failure" && !paymentId) {
          setState("failed");
          setMessage("El pago fue cancelado o rechazado. Podés volver al carrito e intentarlo otra vez.");
          return;
        }

        if (attempt < MAX_POLLS) {
          setState("verifying");
          timerRef.current = setTimeout(() => verify(attempt + 1), POLL_DELAY_MS);
          return;
        }

        setState("pending");
        setMessage("Mercado Pago todavía está procesando el pago. Te avisaremos cuando quede confirmado.");
      } catch (error) {
        console.error("[PaymentResultPage] payment verification failed", error);
        if (attempt < MAX_POLLS) {
          timerRef.current = setTimeout(() => verify(attempt + 1), POLL_DELAY_MS);
          return;
        }
        setState("pending");
        setMessage("No pudimos obtener la confirmación todavía. El pedido se actualizará automáticamente.");
      }
    };

    verify(0);
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [orderDocId, paymentId, returnStatus]);

  if (state === "approved" && order) {
    return (
      <PurchaseSuccessPage
        onNavigate={onNavigate}
        userEmail={order.customerEmail || userEmail}
        userName={order.customerName || userName}
        pickupCode={order.pickupToken}
        orderId={order.orderId}
        orderDocId={order.id}
        onClearCart={onClearCart}
      />
    );
  }

  const isVerifying = state === "verifying";
  const isFailed = state === "failed";
  const isReview = state === "review";
  const icon = isVerifying ? (
    <LoaderCircle className="h-14 w-14 animate-spin text-[#009EE3]" />
  ) : isFailed || isReview ? (
    <AlertTriangle className="h-14 w-14 text-[#FF6B00]" />
  ) : (
    <Clock3 className="h-14 w-14 text-[#009EE3]" />
  );
  const title = isVerifying
    ? "Confirmando tu pago"
    : isFailed
      ? "El pago no se completó"
      : isReview
        ? "Pago en validación"
        : "Pago pendiente";

  return (
    <div className="min-h-screen w-full bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="checkout"
        isLoggedIn
        isTransparent={false}
      />
      <main className="mx-auto w-full max-w-4xl px-4 pb-16 pt-28 sm:px-6">
        <div className="mb-10">
          <CheckoutStepper currentStep={3} />
        </div>
        <Card className="mx-auto max-w-xl border border-gray-200 bg-white p-8 text-center shadow-lg sm:p-10">
          <div className="mb-6 flex justify-center">{icon}</div>
          <h1 className="mb-3 text-2xl font-bold text-[#1C2335] sm:text-3xl">{title}</h1>
          <p className="mx-auto max-w-md leading-7 text-[#4A4A4A]">{message}</p>
          {order?.orderId && (
            <p className="mt-4 font-semibold text-[#FF6B00]">{order.orderId}</p>
          )}

          {!isVerifying && (
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {isFailed ? (
                <Button
                  onClick={() => onNavigate?.("cart")}
                  className="bg-[#FF6B00] px-6 py-5 text-white hover:bg-[#e56000]"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Volver al carrito
                </Button>
              ) : (
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-[#009EE3] px-6 py-5 text-white hover:bg-[#008ac7]"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Consultar nuevamente
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => onNavigate?.("home")}
                className="border-[#FF6B00] px-6 py-5 text-[#FF6B00]"
              >
                Volver al inicio
              </Button>
            </div>
          )}
        </Card>
      </main>
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
