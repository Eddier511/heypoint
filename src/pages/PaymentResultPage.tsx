import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock3, LoaderCircle, RefreshCw, ShoppingCart } from "lucide-react";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { CheckoutStepper } from "../components/CheckoutStepper";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { api } from "../lib/api";
import { clearCheckoutAttempt } from "../lib/checkoutAttempt";
import { PurchaseSuccessPage } from "./PurchaseSuccessPage";

type PaymentState = "verifying" | "approved" | "pending" | "failed" | "review";
type FailedPaymentKind = "notCompleted" | "paymentFailed" | null;

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
  // Kiosk mobile return: the customer's own phone lands here after paying
  // via the QR (Fase 3C), with no Firebase session on that device. This
  // page must never depend on that session to say anything — it's purely
  // informational; the kiosk's own backend polling remains the only
  // source of truth for approval.
  const isKioskChannel = params.get("channel") === "kiosk";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<PaymentState>("verifying");
  const [failedKind, setFailedKind] = useState<FailedPaymentKind>(null);
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [message, setMessage] = useState("Estamos confirmando el pago con Mercado Pago.");

  useEffect(() => {
    // Kiosk mobile return never verifies/syncs anything from this device —
    // no Firebase Auth here, no order lookup, no pickupToken. See the
    // early render branch below for what this actually shows.
    if (isKioskChannel) return;

    window.scrollTo({ top: 0, behavior: "instant" });
    let cancelled = false;

    const applyStatus = (data: PaymentOrder) => {
      if (cancelled) return true;
      setOrder(data);
      if (data.state === "approved" && data.pickupToken) {
        sessionStorage.removeItem("heypoint_pending_order_id");
        clearCheckoutAttempt();
        setState("approved");
        return true;
      }
      if (data.state === "failed") {
        clearCheckoutAttempt();
        setState("failed");
        if (returnStatus === "failure" && !paymentId) {
          setFailedKind("notCompleted");
          setMessage("Podés volver al carrito e intentarlo nuevamente cuando quieras.");
        } else {
          setFailedKind("paymentFailed");
          setMessage(
            "Tu carrito sigue disponible. Podés intentarlo nuevamente o elegir otro medio de pago.",
          );
        }
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
          attempt === 0 && (paymentId || returnStatus === "failure")
            ? await api.post<PaymentOrder>(
                `/orders/${encodeURIComponent(orderDocId)}/mercadopago/sync`,
                { paymentId, returnStatus },
              )
            : await api.get<PaymentOrder>(
                `/orders/${encodeURIComponent(orderDocId)}/payment-status`,
              );

        if (applyStatus(response.data)) return;

        if (returnStatus === "failure" && !paymentId) {
          clearCheckoutAttempt();
          setState("failed");
          setFailedKind("notCompleted");
          setMessage("Podés volver al carrito e intentarlo nuevamente cuando quieras.");
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
  }, [orderDocId, paymentId, returnStatus, isKioskChannel]);

  if (isKioskChannel) {
    const kioskTitle =
      returnStatus === "failure"
        ? "No pudimos completar el pago"
        : returnStatus === "success"
          ? "Pago enviado"
          : "Pago en proceso";
    const kioskMessage =
      returnStatus === "failure"
        ? "Podés volver al kiosko para intentarlo nuevamente."
        : returnStatus === "success"
          ? "Estamos verificando tu pago."
          : "Estamos verificando el estado de tu pago.";

    // Purely informational: no order lookup, no pickupToken, no way to
    // confirm/sync payment from this screen. The kiosk's own backend
    // polling (Fase 3C) is the only source of truth for approval — this
    // just tells the person holding the phone what to do next.
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#FFF4E6] px-4">
        <Card className="mx-auto w-full max-w-md border border-gray-200 bg-white p-8 text-center shadow-lg">
          <h1 className="mb-3 text-2xl font-bold text-[#1C2335]">{kioskTitle}</h1>
          <p className="mx-auto max-w-sm leading-7 text-[#4A4A4A]">{kioskMessage}</p>
          <p className="mx-auto mt-4 max-w-sm leading-7 text-[#4A4A4A]">
            Volvé al kiosko para continuar con el retiro.
          </p>
        </Card>
      </div>
    );
  }

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
      ? failedKind === "notCompleted"
        ? "No completaste el pago"
        : "No pudimos procesar tu pago"
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
