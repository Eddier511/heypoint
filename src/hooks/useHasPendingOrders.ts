import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";

export function useHasPendingOrders(): boolean {
  const { isAuthenticated } = useAuth();
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasPending(false);
      return;
    }

    let alive = true;

    api
      .get<{ orders: Array<{ status: string }> } | Array<{ status: string }>>(
        "/orders/me",
      )
      .then(({ data }) => {
        if (!alive) return;
        const orders = Array.isArray(data) ? data : data?.orders ?? [];
        setHasPending(orders.some((o) => o.status === "pending"));
      })
      .catch(() => {
        if (alive) setHasPending(false);
      });

    return () => {
      alive = false;
    };
  }, [isAuthenticated]);

  return hasPending;
}
