import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Eye,
  ShoppingBag,
  LayoutGrid,
  Hash,
  List,
  AlertTriangle,
  Headphones,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { formatPrecioARS } from "../utils/priceUtils";
import {
  formatVatRate,
  normalizeOrderTaxBreakdown,
} from "../utils/taxBreakdown";
import { motion, AnimatePresence } from "motion/react";

/** =========================
 * API Helper (fixed)
 * - Normaliza /api
 * - Agrega Authorization Bearer automáticamente
 * ========================= */
const raw =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "";

const normalizedBase = raw.split(",")[0].trim().replace(/\/+$/, "");

const API_URL =
  normalizedBase.length > 0
    ? normalizedBase.endsWith("/api")
      ? normalizedBase
      : `${normalizedBase}/api`
    : import.meta.env.PROD
      ? "https://api.heypoint.com.ar/api"
      : "http://localhost:4000/api";

const STORAGE_KEYS = {
  idToken: "heypoint_id_token",
} as const;

function getIdTokenFromStorage() {
  return localStorage.getItem(STORAGE_KEYS.idToken);
}

async function apiGet<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = getIdTokenFromStorage();

  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers || {}),
    },
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `HTTP ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** =========================
 * UI Types (your screen types)
 * ========================= */
interface MyOrdersPageProps {
  onNavigate?: (page: string) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number; // unit price
  image: string;
  locker: string;
}

interface LockerGroup {
  lockerName: string;
  lockerLocation: string;
  items: OrderItem[];
  subtotal: number;
}

type UiOrderStatus = "pending" | "completed";

interface Order {
  id: string;
  orderId: string;
  items: OrderItem[];
  lockers: LockerGroup[];
  subtotal?: number;
  vatRate?: number;
  subtotalWithoutTax?: number;
  vatAmount?: number;
  subtotalWithTax?: number;
  taxTransparencyLabel?: string;
  serviceCharge?: number;
  serviceChargeLabel?: string;
  total: number;
  pickupToken: string;
  pickupTokenExpiresAt?: string;
  token?: {
    expiresAt?: string;
  };
  status: UiOrderStatus;
  purchaseDate: string;
  completedDate?: string;
}

/** =========================
 * API DTO (what backend returns)
 * ========================= */
type ApiOrderStatus = string;

type ApiOrderItem = {
  id: string | number;
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string;
  locker?: string;
};

type ApiLockerGroup = {
  lockerName: string;
  lockerLocation?: string;
  subtotal: number;
  items: ApiOrderItem[];
};

type ApiOrder = {
  id: string;
  orderId: string; // "#ORD-92845"
  status: ApiOrderStatus;
  purchaseDate: string;
  completedDate?: string;
  subtotal?: number;
  vatRate?: number;
  subtotalWithoutTax?: number;
  vatAmount?: number;
  subtotalWithTax?: number;
  taxTransparencyLabel?: string;
  serviceCharge?: number;
  serviceChargeLabel?: string;
  total: number;
  pickupToken?: string;
  pickupTokenExpiresAt?: string;
  token?: {
    expiresAt?: string;
  };

  // Optional shapes (depending on your backend)
  lockers?: ApiLockerGroup[];
  items?: ApiOrderItem[];
};

type ApiOrdersMeResponse = { orders: ApiOrder[] } | ApiOrder[]; // por si tu endpoint devuelve array directo

function normalizeOrdersResponse(data: ApiOrdersMeResponse): ApiOrder[] {
  if (Array.isArray(data)) return data;
  return data?.orders || [];
}

function toUiOrderStatus(status?: string): UiOrderStatus {
  switch (String(status || "").trim().toLowerCase()) {
    case "picked_up":
    case "completed":
    case "complete":
    case "cancelled":
    case "canceled":
    case "expired":
      return "completed";
    case "pending":
    case "pending_pickup":
    case "ready_for_pickup":
      return "pending";
    default:
      return "completed";
  }
}

function getPickupTokenExpiration(order: Pick<Order, "pickupTokenExpiresAt" | "token">) {
  return order.pickupTokenExpiresAt || order.token?.expiresAt || "";
}

function isPickupTokenExpired(order: Pick<Order, "pickupTokenExpiresAt" | "token">) {
  const value = getPickupTokenExpiration(order);
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function formatExpirationDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildLockersFromItems(items: OrderItem[]): LockerGroup[] {
  // agrupa items por locker y crea lockers/subtotales
  const map = new Map<string, OrderItem[]>();
  for (const it of items) {
    const key = it.locker || "Locker";
    map.set(key, [...(map.get(key) || []), it]);
  }

  const lockers: LockerGroup[] = [];
  for (const [lockerName, groupItems] of map.entries()) {
    const subtotal = groupItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0,
    );
    lockers.push({
      lockerName,
      lockerLocation: "",
      items: groupItems,
      subtotal,
    });
  }
  return lockers;
}

// ─── Stable module-level components ─────────────────────────────────────────
// Defined outside MyOrdersPage so React always sees the same component type
// across renders — prevents images from unmounting/flickering when parent
// state changes (e.g. toggling the groupByLocker switch).

interface OrderCardProps {
  order: Order;
  groupByLocker: boolean;
  onViewDetails: (order: Order) => void;
  onShowToken: (token: string) => void;
  onNavigate?: (page: string) => void;
}

function getOrderSubtotal(order: Order) {
  return (
    Number(order.subtotal) ||
    order.lockers.reduce((sum, locker) => sum + Number(locker.subtotal || 0), 0)
  );
}

function getOrderServiceCharge(order: Order) {
  const subtotal = getOrderSubtotal(order);
  return Number(order.serviceCharge ?? Math.max(0, Number(order.total || 0) - subtotal));
}

function getOrderServiceChargeLabel(order: Order) {
  const label = String(order.serviceChargeLabel || "").trim();
  return label ? `Cargo por servicio (${label})` : "Cargo por servicio";
}

function getOrderTaxBreakdown(order: Order) {
  return normalizeOrderTaxBreakdown(order, getOrderSubtotal(order), order.vatRate ?? 21);
}

function OrderCard({
  order,
  groupByLocker,
  onViewDetails,
  onShowToken,
  onNavigate,
}: OrderCardProps) {
  const isCompleted = order.status === "completed";
  const isExpiredPending =
    order.status === "pending" && isPickupTokenExpired(order);
  const expirationLabel = formatExpirationDate(getPickupTokenExpiration(order));

  return (
    <Card
      className={`border-none shadow-lg rounded-3xl overflow-hidden transition-all ${
        isExpiredPending
          ? "bg-gradient-to-br from-red-50 to-white ring-2 ring-red-200"
          : isCompleted
          ? "bg-gradient-to-br from-green-50 to-white"
          : "bg-white hover:shadow-xl"
      }`}
    >
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b-2 border-gray-100">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-3 mb-3">
              <h3
                className="text-[#1C2335]"
                style={{ fontSize: "1.5rem", fontWeight: 700 }}
              >
                {order.orderId}
              </h3>

              {isExpiredPending ? (
                <Badge className="bg-red-100 text-red-700 border border-red-300 px-3 py-1.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                  <span style={{ fontSize: "0.813rem", fontWeight: 600 }}>
                    Código vencido
                  </span>
                </Badge>
              ) : order.status === "pending" ? (
                <Badge className="bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  <span style={{ fontSize: "0.813rem", fontWeight: 600 }}>
                    Pendiente de retiro
                  </span>
                </Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span style={{ fontSize: "0.813rem", fontWeight: 600 }}>
                    Retirado
                  </span>
                </Badge>
              )}
            </div>

            <div className="space-y-1.5">
              <div
                className="flex items-center gap-2 text-gray-600"
                style={{ fontSize: "0.875rem" }}
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  <span style={{ fontWeight: 600 }}>Pedido:</span>{" "}
                  {order.purchaseDate}
                </span>
              </div>
              {order.completedDate && (
                <div
                  className="flex items-center gap-2 text-green-600"
                  style={{ fontSize: "0.875rem" }}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <span style={{ fontWeight: 600 }}>Completado:</span>{" "}
                    {order.completedDate}
                  </span>
                </div>
              )}
              {expirationLabel && order.status === "pending" && (
                <div
                  className={`flex items-center gap-2 ${
                    isExpiredPending ? "text-red-700" : "text-gray-600"
                  }`}
                  style={{ fontSize: "0.875rem" }}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <span style={{ fontWeight: 600 }}>Disponible hasta:</span>{" "}
                    {expirationLabel}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div
              className="text-gray-500 mb-1"
              style={{ fontSize: "0.875rem", fontWeight: 600 }}
            >
              Total
            </div>
            <div
              className="text-[#FF6B00]"
              style={{ fontSize: "2rem", fontWeight: 700 }}
            >
              {formatPrecioARS(order.total)}
            </div>
          </div>
        </div>

        {/* Products list */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4
              className="text-[#1C2335]"
              style={{ fontSize: "0.938rem", fontWeight: 600 }}
            >
              {groupByLocker
                ? `Ubicaciones de retiro (${order.lockers.length})`
                : `Productos (${order.items.length})`}
            </h4>
          </div>

          <AnimatePresence mode="wait">
            {groupByLocker ? (
              <motion.div key="grouped" className="space-y-4">
                {order.lockers.map((locker, lockerIndex) => (
                  <div
                    key={lockerIndex}
                    className={`rounded-2xl p-4 ${
                      lockerIndex % 2 === 0
                        ? "bg-[#FFF4E6]"
                        : "bg-white border-2 border-[#FFF4E6]"
                    }`}
                  >
                    {/* Module header */}
                    <div className="flex items-start gap-2 mb-3 pb-3 border-b border-[#FF6B00]/20">
                      <MapPin className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div
                          className="text-[#1C2335]"
                          style={{ fontSize: "0.938rem", fontWeight: 700 }}
                        >
                          {locker.lockerName}
                        </div>
                        <div
                          className="text-[#2E2E2E]"
                          style={{ fontSize: "0.813rem" }}
                        >
                          {locker.lockerLocation || ""}
                        </div>
                      </div>
                      <div
                        className="text-[#FF6B00]"
                        style={{ fontSize: "0.875rem", fontWeight: 600 }}
                      >
                        {formatPrecioARS(locker.subtotal)}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {locker.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3"
                        >
                          {/* translateZ(0) → stable compositing layer → no scroll repaint flicker */}
                          <div
                            className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
                            style={{ transform: "translateZ(0)" }}
                          >
                            <ImageWithFallback
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5
                              className="text-[#1C2335] truncate"
                              style={{ fontSize: "0.875rem", fontWeight: 600 }}
                            >
                              {item.name}
                            </h5>
                            <p
                              className="text-[#2E2E2E]"
                              style={{ fontSize: "0.75rem" }}
                            >
                              {item.quantity} × ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div
                            className="text-[#1C2335]"
                            style={{ fontSize: "0.875rem", fontWeight: 600 }}
                          >
                            ${(item.quantity * item.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div key="all" className="space-y-4">
                {(() => {
                  const groups = new Map<string, OrderItem[]>();
                  for (const item of order.items) {
                    const key = item.locker || "Sin módulo";
                    const existing = groups.get(key);
                    if (existing) existing.push(item);
                    else groups.set(key, [item]);
                  }
                  return Array.from(groups.entries()).map(
                    ([moduleName, groupItems]) => (
                      <div key={moduleName}>
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#FF6B00]/20">
                          <Package className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                          <span
                            className="text-[#1C2335]"
                            style={{ fontSize: "0.875rem", fontWeight: 700 }}
                          >
                            {moduleName}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {groupItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4"
                            >
                              <div
                                className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
                                style={{ transform: "translateZ(0)" }}
                              >
                                <ImageWithFallback
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <h5
                                  className="text-[#1C2335]"
                                  style={{ fontSize: "0.938rem", fontWeight: 600 }}
                                >
                                  {item.name}
                                </h5>
                                <p
                                  className="text-[#2E2E2E]"
                                  style={{ fontSize: "0.813rem" }}
                                >
                                  Qty: {item.quantity} ×{" "}
                                  ${item.price.toFixed(2)}
                                </p>
                              </div>
                              <div
                                className="text-[#1C2335]"
                                style={{ fontSize: "1rem", fontWeight: 600 }}
                              >
                                ${(item.quantity * item.price).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pickup Token */}
        {order.status === "pending" && order.pickupToken && (
          <div
            className={`rounded-2xl p-4 mb-4 border-2 ${
              isExpiredPending
                ? "bg-red-50 border-red-200"
                : "bg-gradient-to-r from-[#FF6B00]/10 to-[#FF6B00]/5 border-[#FF6B00]/20"
            }`}
          >
            <div className="flex items-start gap-3">
              {isExpiredPending ? (
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Hash className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div
                  className="text-[#1C2335] mb-1"
                  style={{ fontSize: "0.938rem", fontWeight: 700 }}
                >
                  {isExpiredPending ? "Código vencido" : "Token de retiro"}
                </div>
                {!isExpiredPending && (
                  <div
                    className="text-[#FF6B00] tracking-wider mb-2"
                    style={{ fontSize: "1.5rem", fontWeight: 700 }}
                  >
                    {order.pickupToken}
                  </div>
                )}
                {isExpiredPending && (
                  <p className="text-red-700" style={{ fontSize: "0.75rem" }}>
                    El período de retiro finalizó. Contactá soporte para solicitar asistencia.
                  </p>
                )}
                <p
                  className={isExpiredPending ? "hidden" : "text-[#2E2E2E]"}
                  style={{ fontSize: "0.75rem" }}
                >
                  Usá este token para desbloquear todos los módulos de este
                  pedido
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => onViewDetails(order)}
            variant="outline"
            className="flex-1 py-5 rounded-full border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FFF4E6] hover:text-[#FF6B00] transition-all"
            style={{ fontSize: "0.938rem", fontWeight: 600 }}
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver detalles
          </Button>

          {isExpiredPending ? (
            <Button
              onClick={() => onNavigate?.("contact")}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-5 rounded-full shadow-lg hover:shadow-xl transition-all"
              style={{ fontSize: "0.938rem", fontWeight: 600 }}
            >
              <Headphones className="w-4 h-4 mr-2" />
              Contactar soporte
            </Button>
          ) : order.status === "pending" ? (
            <Button
              onClick={() => onShowToken(order.pickupToken)}
              className="flex-1 bg-[#FF6B00] hover:bg-[#e56000] text-white py-5 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              style={{ fontSize: "0.938rem", fontWeight: 600 }}
              disabled={!order.pickupToken}
            >
              <Hash className="w-4 h-4 mr-2" />
              Mostrar token
            </Button>
          ) : (
            <Button
              disabled
              className="flex-1 bg-green-500 text-white py-5 rounded-full cursor-not-allowed opacity-75"
              style={{ fontSize: "0.938rem", fontWeight: 600 }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Retirado
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

interface OrdersStateCardProps {
  title: string;
  description: string;
  buttonText: string;
  onNavigate?: (page: string) => void;
}

function OrdersStateCard({
  title,
  description,
  buttonText,
  onNavigate,
}: OrdersStateCardProps) {
  return (
    <Card className="p-12 text-center border-none shadow-lg rounded-3xl bg-white">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFF4E6] rounded-full mb-6">
        <Package className="w-10 h-10 text-[#FF6B00]" />
      </div>
      <h3
        className="text-[#1C2335] mb-2"
        style={{ fontSize: "1.5rem", fontWeight: 600 }}
      >
        {title}
      </h3>
      <p className="text-[#2E2E2E] mb-6" style={{ fontSize: "1rem" }}>
        {description}
      </p>
      <div className="flex justify-center">
        <Button
          onClick={() => onNavigate?.("shop")}
          className="w-auto bg-[#FF6B00] hover:bg-[#e56000] text-white px-8 py-4 rounded-full shadow-lg transition-all transform hover:scale-105"
          style={{ fontSize: "1rem", fontWeight: 600 }}
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          {buttonText}
        </Button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function MyOrdersPage({
  onNavigate,
  isLoggedIn = true,
  onLogout,
}: MyOrdersPageProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "completed">(
    "pending",
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState("");
  const [groupByLocker, setGroupByLocker] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingOrders(true);
        setOrdersError(null);

        // ✅ Endpoint: GET /orders/me
        const data = await apiGet<ApiOrdersMeResponse>("/orders/me");
        const apiOrders = normalizeOrdersResponse(data);

        const mapped: Order[] = apiOrders.map((o) => {
          const uiItems: OrderItem[] = (o.items || []).map((it, idx) => ({
            id: Number(it.id) || idx + 1,
            name: it.name,
            quantity: it.quantity,
            price: it.unitPrice,
            image: it.image || "",
            locker: it.locker || "Locker",
          }));

          const uiLockers: LockerGroup[] =
            o.lockers?.map((l) => ({
              lockerName: l.lockerName,
              lockerLocation: l.lockerLocation || "",
              subtotal: l.subtotal,
              items: l.items.map((it, idx) => ({
                id: Number(it.id) || idx + 1,
                name: it.name,
                quantity: it.quantity,
                price: it.unitPrice,
                image: it.image || "",
                locker: it.locker || l.lockerName,
              })),
            })) || [];

          // Si backend no manda lockers, los armamos con items
          const finalLockers =
            uiLockers.length > 0 ? uiLockers : buildLockersFromItems(uiItems);

          return {
            id: o.id,
            orderId: o.orderId,
            items: uiItems,
            lockers: finalLockers,
            subtotal: o.subtotal,
            vatRate: o.vatRate,
            subtotalWithoutTax: o.subtotalWithoutTax,
            vatAmount: o.vatAmount,
            subtotalWithTax: o.subtotalWithTax,
            taxTransparencyLabel: o.taxTransparencyLabel,
            serviceCharge: o.serviceCharge,
            serviceChargeLabel: o.serviceChargeLabel,
            total: o.total,
            pickupToken: o.pickupToken || "",
            pickupTokenExpiresAt: o.pickupTokenExpiresAt || o.token?.expiresAt || "",
            token: o.token,
            status: toUiOrderStatus(o.status),
            purchaseDate: o.purchaseDate,
            completedDate: o.completedDate,
          };
        });

        if (mounted) setOrders(mapped);
      } catch (e: any) {
        if (mounted) setOrdersError(e?.message || "Error cargando pedidos");
      } finally {
        if (mounted) setLoadingOrders(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "pending"),
    [orders],
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === "completed"),
    [orders],
  );

  const handleShowToken = (token: string) => {
    setSelectedToken(token);
    setShowTokenModal(true);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  // OrderCard and OrdersStateCard are defined at module level above
  // to maintain a stable component reference across renders.
  const _OrderCard = ({ order }: { order: Order }) => {
    const isCompleted = order.status === "completed";

    return (
      <Card
        className={`border-none shadow-lg rounded-3xl overflow-hidden transition-all ${
          isCompleted
            ? "bg-gradient-to-br from-green-50 to-white"
            : "bg-white hover:shadow-xl"
        }`}
      >
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-6 border-b-2 border-gray-100">
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-3 mb-3">
                <h3
                  className="text-[#1C2335]"
                  style={{ fontSize: "1.5rem", fontWeight: 700 }}
                >
                  {order.orderId}
                </h3>

                {order.status === "pending" ? (
                  <Badge className="bg-gradient-to-r from-[#FF6B00] to-[#FF8534] text-white border-none px-3 py-1.5 rounded-full">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    <span style={{ fontSize: "0.813rem", fontWeight: 600 }}>
                      Pendiente de retiro
                    </span>
                  </Badge>
                ) : (
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-none px-3 py-1.5 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span style={{ fontSize: "0.813rem", fontWeight: 600 }}>
                      Retirado
                    </span>
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <div
                  className="flex items-center gap-2 text-gray-600"
                  style={{ fontSize: "0.875rem" }}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <span style={{ fontWeight: 600 }}>Pedido:</span>{" "}
                    {order.purchaseDate}
                  </span>
                </div>
                {order.completedDate && (
                  <div
                    className="flex items-center gap-2 text-green-600"
                    style={{ fontSize: "0.875rem" }}
                  >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>
                      <span style={{ fontWeight: 600 }}>Completado:</span>{" "}
                      {order.completedDate}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <div
                className="text-gray-500 mb-1"
                style={{ fontSize: "0.875rem", fontWeight: 600 }}
              >
                Total
              </div>
              <div
                className="text-[#FF6B00]"
                style={{ fontSize: "2rem", fontWeight: 700 }}
              >
                {formatPrecioARS(order.total)}
              </div>
            </div>
          </div>

          {/* Products list */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4
                className="text-[#1C2335]"
                style={{ fontSize: "0.938rem", fontWeight: 600 }}
              >
                {groupByLocker
                  ? `Ubicaciones de retiro (${order.lockers.length})`
                  : `Productos (${order.items.length})`}
              </h4>
            </div>

            <AnimatePresence mode="wait">
              {groupByLocker ? (
                <motion.div key="grouped" className="space-y-4">
                  {order.lockers.map((locker, lockerIndex) => (
                    <div
                      key={lockerIndex}
                      className={`rounded-2xl p-4 ${
                        lockerIndex % 2 === 0
                          ? "bg-[#FFF4E6]"
                          : "bg-white border-2 border-[#FFF4E6]"
                      }`}
                    >
                      {/* Locker header */}
                      <div className="flex items-start gap-2 mb-3 pb-3 border-b border-[#FF6B00]/20">
                        <MapPin className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div
                            className="text-[#1C2335]"
                            style={{ fontSize: "0.938rem", fontWeight: 700 }}
                          >
                            {locker.lockerName}
                          </div>
                          <div
                            className="text-[#2E2E2E]"
                            style={{ fontSize: "0.813rem" }}
                          >
                            {locker.lockerLocation || ""}
                          </div>
                        </div>
                        <div
                          className="text-[#FF6B00]"
                          style={{ fontSize: "0.875rem", fontWeight: 600 }}
                        >
                          {formatPrecioARS(locker.subtotal)}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {locker.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3"
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                              <ImageWithFallback
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5
                                className="text-[#1C2335] truncate"
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 600,
                                }}
                              >
                                {item.name}
                              </h5>
                              <p
                                className="text-[#2E2E2E]"
                                style={{ fontSize: "0.75rem" }}
                              >
                                {item.quantity} × ${item.price.toFixed(2)}
                              </p>
                            </div>
                            <div
                              className="text-[#1C2335]"
                              style={{ fontSize: "0.875rem", fontWeight: 600 }}
                            >
                              ${(item.quantity * item.price).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="all" className="space-y-4">
                  {(() => {
                    // Group items by module (locker), preserving first-appearance order
                    const groups = new Map<string, OrderItem[]>();
                    for (const item of order.items) {
                      const key = item.locker || "Sin módulo";
                      const existing = groups.get(key);
                      if (existing) existing.push(item);
                      else groups.set(key, [item]);
                    }
                    return Array.from(groups.entries()).map(
                      ([moduleName, groupItems]) => (
                        <div key={moduleName}>
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#FF6B00]/20">
                            <Package className="w-4 h-4 text-[#FF6B00] flex-shrink-0" />
                            <span
                              className="text-[#1C2335]"
                              style={{ fontSize: "0.875rem", fontWeight: 700 }}
                            >
                              {moduleName}
                            </span>
                          </div>
                          <div className="space-y-3">
                            {groupItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4"
                              >
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                  <ImageWithFallback
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h5
                                    className="text-[#1C2335]"
                                    style={{
                                      fontSize: "0.938rem",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {item.name}
                                  </h5>
                                  <p
                                    className="text-[#2E2E2E]"
                                    style={{ fontSize: "0.813rem" }}
                                  >
                                    Qty: {item.quantity} ×{" "}
                                    ${item.price.toFixed(2)}
                                  </p>
                                </div>
                                <div
                                  className="text-[#1C2335]"
                                  style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  ${(item.quantity * item.price).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pickup Token */}
          {order.status === "pending" && order.pickupToken && (
            <div className="bg-gradient-to-r from-[#FF6B00]/10 to-[#FF6B00]/5 rounded-2xl p-4 mb-4 border-2 border-[#FF6B00]/20">
              <div className="flex items-start gap-3">
                <Hash className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div
                    className="text-[#1C2335] mb-1"
                    style={{ fontSize: "0.938rem", fontWeight: 700 }}
                  >
                    Token de retiro
                  </div>
                  <div
                    className="text-[#FF6B00] tracking-wider mb-2"
                    style={{ fontSize: "1.5rem", fontWeight: 700 }}
                  >
                    {order.pickupToken}
                  </div>
                  <p className="text-[#2E2E2E]" style={{ fontSize: "0.75rem" }}>
                    Usá este token para desbloquear todos los módulos de este
                    pedido
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleViewDetails(order)}
              variant="outline"
              className="flex-1 py-6 rounded-2xl border-2 border-gray-200 hover:border-[#FF6B00] hover:bg-[#FFF4E6] hover:text-[#FF6B00] transition-all"
              style={{ fontSize: "0.938rem", fontWeight: 600 }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver detalles
            </Button>

            {order.status === "pending" ? (
              <Button
                onClick={() => handleShowToken(order.pickupToken)}
                className="flex-1 bg-[#FF6B00] hover:bg-[#e56000] text-white py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ fontSize: "0.938rem", fontWeight: 600 }}
                disabled={!order.pickupToken}
              >
                <Hash className="w-4 h-4 mr-2" />
                Mostrar token
              </Button>
            ) : (
              <Button
                disabled
                className="flex-1 bg-green-500 text-white py-6 rounded-2xl cursor-not-allowed opacity-75"
                style={{ fontSize: "0.938rem", fontWeight: 600 }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Retirado
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const _OrdersStateCard = ({
    title,
    description,
    buttonText,
  }: {
    title: string;
    description: string;
    buttonText: string;
  }) => (
    <Card className="p-12 text-center border-none shadow-lg rounded-3xl bg-white">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FFF4E6] rounded-full mb-6">
        <Package className="w-10 h-10 text-[#FF6B00]" />
      </div>
      <h3
        className="text-[#1C2335] mb-2"
        style={{ fontSize: "1.5rem", fontWeight: 600 }}
      >
        {title}
      </h3>
      <p className="text-[#2E2E2E] mb-6" style={{ fontSize: "1rem" }}>
        {description}
      </p>
      <Button
        onClick={() => onNavigate?.("shop")}
        className="bg-[#FF6B00] hover:bg-[#e56000] text-white px-8 py-6 rounded-full shadow-lg transition-all transform hover:scale-105"
        style={{ fontSize: "1rem", fontWeight: 600 }}
      >
        <ShoppingBag className="w-5 h-5 mr-2" />
        {buttonText}
      </Button>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="orders"
        isLoggedIn={isLoggedIn}
        onLogout={onLogout}
        isTransparent={false}
      />

      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-12 max-w-6xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1
              className="text-[#1C2335] mb-4"
              style={{ fontSize: "3rem", fontWeight: 700 }}
            >
              Mis pedidos
            </h1>
            <p
              className="text-[#2E2E2E] max-w-2xl mx-auto"
              style={{ fontSize: "1.125rem" }}
            >
              Consultá tus compras, tokens de retiro y estado de pedidos
            </p>
          </motion.div>

          {/* Tabs — primary navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "pending" | "completed")}
              className="w-full"
            >
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 bg-white rounded-full h-14 p-1 shadow-md mb-8">
                <TabsTrigger
                  value="pending"
                  className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white rounded-full transition-all"
                  style={{ fontSize: "1rem", fontWeight: 600 }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Pendiente
                  {!loadingOrders && pendingOrders.length > 0 && (
                    <Badge
                      className="ml-2 bg-white text-[#FF6B00] border-none"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {pendingOrders.length}
                    </Badge>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="completed"
                  className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white rounded-full transition-all"
                  style={{ fontSize: "1rem", fontWeight: 600 }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completados
                </TabsTrigger>
              </TabsList>

              {/* View grouping — secondary filter */}
              <div className="flex justify-end mb-5">
                <div className="inline-flex bg-gray-100 rounded-xl p-0.5 gap-px">
                  <button
                    type="button"
                    onClick={() => setGroupByLocker(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      !groupByLocker
                        ? "bg-white text-[#1C2335] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <List className="w-3.5 h-3.5 flex-shrink-0" />
                    Por productos
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupByLocker(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      groupByLocker
                        ? "bg-white text-[#1C2335] shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 flex-shrink-0" />
                    Por módulos
                  </button>
                </div>
              </div>

              {/* Pending */}
              <TabsContent value="pending" className="mt-0">
                {loadingOrders ? (
                  <Card className="p-12 text-center border-none shadow-lg rounded-3xl bg-white">
                    Cargando pedidos...
                  </Card>
                ) : ordersError ? (
                  <Card className="p-12 text-center border-none shadow-lg rounded-3xl bg-white">
                    <p
                      className="text-[#1C2335]"
                      style={{ fontSize: "1.25rem", fontWeight: 700 }}
                    >
                      No se pudieron cargar los pedidos
                    </p>
                    <p
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "0.938rem" }}
                    >
                      {ordersError}
                    </p>
                  </Card>
                ) : pendingOrders.length === 0 ? (
                  <OrdersStateCard
                    title="No hay pedidos pendientes"
                    description="¡Todos tus pedidos fueron retirados!"
                    buttonText="Ir a la tienda"
                    onNavigate={onNavigate}
                  />
                ) : (
                  <div className="space-y-6">
                    {pendingOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <OrderCard
                          order={order}
                          groupByLocker={groupByLocker}
                          onViewDetails={handleViewDetails}
                          onShowToken={handleShowToken}
                          onNavigate={onNavigate}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Completed */}
              <TabsContent value="completed" className="mt-0">
                {loadingOrders ? (
                  <Card className="p-12 text-center border-none shadow-lg rounded-3xl bg-white">
                    Cargando pedidos...
                  </Card>
                ) : ordersError ? (
                  <Card className="p-12 text-center border-none shadow-lg rounded-3xl bg-white">
                    <p
                      className="text-[#1C2335]"
                      style={{ fontSize: "1.25rem", fontWeight: 700 }}
                    >
                      No se pudieron cargar los pedidos
                    </p>
                    <p
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "0.938rem" }}
                    >
                      {ordersError}
                    </p>
                  </Card>
                ) : completedOrders.length === 0 ? (
                  <OrdersStateCard
                    title="Todavía no tenés pedidos"
                    description="Empezá a comprar para ver tu historial"
                    buttonText="Ir a la tienda"
                    onNavigate={onNavigate}
                  />
                ) : (
                  <div className="space-y-6">
                    {completedOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <OrderCard
                          order={order}
                          groupByLocker={groupByLocker}
                          onViewDetails={handleViewDetails}
                          onShowToken={handleShowToken}
                          onNavigate={onNavigate}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Token Modal */}
      <Dialog open={showTokenModal} onOpenChange={setShowTokenModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl border-none">
          <DialogHeader>
            <DialogTitle
              className="text-center text-[#1C2335]"
              style={{ fontSize: "1.5rem", fontWeight: 700 }}
            >
              Token de retiro
            </DialogTitle>
            <DialogDescription
              className="text-center text-[#2E2E2E]"
              style={{ fontSize: "0.938rem" }}
            >
              Mostrá este código en cualquier módulo de Hey!Point para retirar
              tu pedido
            </DialogDescription>
          </DialogHeader>
          <div className="py-8">
            <div className="bg-gradient-to-br from-[#FF6B00] to-[#e56000] rounded-2xl p-8 text-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl py-6 mb-4">
                <div
                  className="text-white tracking-wider whitespace-nowrap"
                  style={{ fontSize: "3rem", fontWeight: 700 }}
                >
                  {selectedToken}
                </div>
              </div>
              <p className="text-[#FFF4E6]" style={{ fontSize: "0.938rem" }}>
                Mostrá este código en cualquier módulo de Hey!Point para retirar
                tu pedido
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      <Dialog
        open={selectedOrder !== null}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="sm:max-w-3xl bg-white rounded-3xl max-h-[90vh] overflow-y-auto border-none">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle
                  className="text-[#1C2335]"
                  style={{ fontSize: "1.75rem", fontWeight: 700 }}
                >
                  Detalles del pedido
                </DialogTitle>
                <DialogDescription
                  className="text-[#2E2E2E]"
                  style={{ fontSize: "0.938rem" }}
                >
                  Información completa de tu pedido incluyendo productos,
                  ubicaciones de módulos y token de retiro
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3
                      className="text-[#1C2335] mb-1"
                      style={{ fontSize: "1.25rem", fontWeight: 700 }}
                    >
                      {selectedOrder.orderId}
                    </h3>
                    <p
                      className="text-[#2E2E2E]"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {selectedOrder.purchaseDate}
                    </p>
                  </div>

                  {selectedOrder.status === "pending" ? (
                    <Badge className="bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] px-4 py-2">
                      Pendiente de retiro
                    </Badge>
                  ) : (
                    <Badge className="bg-[#B6E322] text-[#1C2335] border-none px-4 py-2">
                      Completado
                    </Badge>
                  )}
                </div>

                <div>
                  <h4
                    className="text-[#1C2335] mb-4"
                    style={{ fontSize: "1.125rem", fontWeight: 600 }}
                  >
                    Ubicaciones de retiro
                  </h4>

                  <div className="space-y-4">
                    {selectedOrder.lockers.map((locker, lockerIndex) => (
                      <div
                        key={lockerIndex}
                        className="bg-[#FFF4E6] rounded-2xl p-5"
                      >
                        <div className="flex items-start gap-3 mb-4 pb-3 border-b border-[#FF6B00]/20">
                          <MapPin className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div
                              className="text-[#1C2335]"
                              style={{ fontSize: "1rem", fontWeight: 700 }}
                            >
                              {locker.lockerName}
                            </div>
                            <div
                              className="text-[#2E2E2E]"
                              style={{ fontSize: "0.875rem" }}
                            >
                              {locker.lockerLocation}
                            </div>
                          </div>
                          <div
                            className="text-[#FF6B00]"
                            style={{ fontSize: "1rem", fontWeight: 700 }}
                          >
                            {formatPrecioARS(locker.subtotal)}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {locker.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4"
                            >
                              <div
                                className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
                                style={{ transform: "translateZ(0)" }}
                              >
                                <ImageWithFallback
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <h5
                                  className="text-[#1C2335] mb-1"
                                  style={{ fontSize: "1rem", fontWeight: 600 }}
                                >
                                  {item.name}
                                </h5>
                                <p
                                  className="text-[#2E2E2E]"
                                  style={{ fontSize: "0.875rem" }}
                                >
                                  ${item.price.toFixed(2)} × {item.quantity}
                                </p>
                              </div>
                              <div
                                className="text-[#FF6B00]"
                                style={{
                                  fontSize: "1.125rem",
                                  fontWeight: 700,
                                }}
                              >
                                ${(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div
                    className="flex items-center justify-between text-[#2E2E2E]"
                    style={{ fontSize: "1rem" }}
                  >
                    <span>Subtotal sin IVA</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatPrecioARS(getOrderTaxBreakdown(selectedOrder).subtotalWithoutTax)}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between text-[#2E2E2E]"
                    style={{ fontSize: "1rem" }}
                  >
                    <span>
                      IVA contenido ({formatVatRate(getOrderTaxBreakdown(selectedOrder).vatRate)}%)
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {formatPrecioARS(getOrderTaxBreakdown(selectedOrder).vatAmount)}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between text-[#2E2E2E]"
                    style={{ fontSize: "1rem" }}
                  >
                    <span>Subtotal con IVA</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatPrecioARS(getOrderTaxBreakdown(selectedOrder).subtotalWithTax)}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666]">
                    {getOrderTaxBreakdown(selectedOrder).taxTransparencyLabel}
                  </p>
                  <div
                    className="flex items-center justify-between text-[#2E2E2E]"
                    style={{ fontSize: "1rem" }}
                  >
                    <span>{getOrderServiceChargeLabel(selectedOrder)}</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatPrecioARS(getOrderServiceCharge(selectedOrder))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span
                      className="text-[#1C2335]"
                      style={{ fontSize: "1.25rem", fontWeight: 700 }}
                    >
                      Total
                    </span>
                    <span
                      className="text-[#FF6B00]"
                      style={{ fontSize: "2rem", fontWeight: 700 }}
                    >
                      {formatPrecioARS(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}


