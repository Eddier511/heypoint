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
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
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

interface Order {
  id: string;
  orderId: string;
  items: OrderItem[];
  lockers: LockerGroup[];
  total: number;
  pickupToken: string;
  status: "pending" | "completed";
  purchaseDate: string;
  completedDate?: string;
}

/** =========================
 * API DTO (what backend returns)
 * ========================= */
type ApiOrderStatus = "pending" | "completed";

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
  total: number;
  pickupToken?: string;

  // Optional shapes (depending on your backend)
  lockers?: ApiLockerGroup[];
  items?: ApiOrderItem[];
};

type ApiOrdersMeResponse = { orders: ApiOrder[] } | ApiOrder[]; // por si tu endpoint devuelve array directo

function normalizeOrdersResponse(data: ApiOrdersMeResponse): ApiOrder[] {
  if (Array.isArray(data)) return data;
  return data?.orders || [];
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
            total: o.total,
            pickupToken: o.pickupToken || "",
            status: o.status,
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

  const OrderCard = ({ order }: { order: Order }) => {
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
                <motion.div key="all" className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
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
                          style={{ fontSize: "0.938rem", fontWeight: 600 }}
                        >
                          {item.name}
                        </h5>
                        <p
                          className="text-[#2E2E2E]"
                          style={{ fontSize: "0.813rem" }}
                        >
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                        <p
                          className="text-[#FF6B00]"
                          style={{ fontSize: "0.75rem", fontWeight: 500 }}
                        >
                          {item.locker}
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
                    Usá este token para desbloquear todos los lockers de este
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

  const OrdersStateCard = ({
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

          {/* View Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <Card className="inline-flex items-center gap-3 px-6 py-4 border-none shadow-md rounded-full bg-white">
              <List
                className={`w-5 h-5 transition-colors ${
                  !groupByLocker ? "text-[#FF6B00]" : "text-[#2E2E2E]/50"
                }`}
              />
              <Label
                htmlFor="view-toggle"
                className="text-[#1C2335] cursor-pointer"
                style={{ fontSize: "0.938rem", fontWeight: 600 }}
              >
                Todos los productos
              </Label>
              <Switch
                id="view-toggle"
                checked={groupByLocker}
                onCheckedChange={setGroupByLocker}
                className="data-[state=checked]:bg-[#FF6B00]"
              />
              <Label
                htmlFor="view-toggle"
                className="text-[#1C2335] cursor-pointer"
                style={{ fontSize: "0.938rem", fontWeight: 600 }}
              >
                Agrupar por locker
              </Label>
              <LayoutGrid
                className={`w-5 h-5 transition-colors ${
                  groupByLocker ? "text-[#FF6B00]" : "text-[#2E2E2E]/50"
                }`}
              />
            </Card>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
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
                        <OrderCard order={order} />
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
                        <OrderCard order={order} />
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
              Mostrá este código en cualquier locker de HeyPoint! para retirar
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
                Mostrá este código en cualquier locker de HeyPoint! para retirar
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
                  ubicaciones de lockers y token de retiro
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
                    <Badge className="bg-[#FF6B00] text-white border-none px-4 py-2">
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
                            ${locker.subtotal.toFixed(2)}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {locker.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4"
                            >
                              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
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
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatPrecioARS(
                        selectedOrder.lockers.reduce(
                          (sum, l) => sum + l.subtotal,
                          0,
                        ),
                      )}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between text-[#2E2E2E]"
                    style={{ fontSize: "1rem" }}
                  >
                    <span>Cargo por servicio (1%)</span>
                    <span style={{ fontWeight: 600 }}>
                      {formatPrecioARS(
                        selectedOrder.lockers.reduce(
                          (sum, l) => sum + l.subtotal,
                          0,
                        ) * 0.01,
                      )}
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
