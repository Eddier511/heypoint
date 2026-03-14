import { useCallback, useEffect, useState } from "react";

export type ServiceChargeRule = {
  id: string;
  min: number;
  max: number;
  fee: number;
};

export type StoreSettings = {
  iva: number;
  serviceChargeRules: ServiceChargeRule[];
};

const DEFAULTS: StoreSettings = {
  iva: 21,
  serviceChargeRules: [
    { id: "1", min: 0, max: 15000, fee: 500 },
    { id: "2", min: 15001, max: 999999, fee: 350 },
  ],
};

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const base = import.meta.env.VITE_API_URL || "";

      const res = await fetch(`${base}/api/settings/store?_ts=${Date.now()}`);

      if (!res.ok) throw new Error("Failed to load store settings");

      const data = await res.json();
      const s = data?.settings ?? data;

      setSettings({
        iva: Number(s?.iva ?? DEFAULTS.iva),
        serviceChargeRules: Array.isArray(s?.serviceChargeRules)
          ? s.serviceChargeRules.map((rule: any, index: number) => ({
              id: String(rule?.id ?? index + 1),
              min: Number(rule?.min ?? 0),
              max: Number(rule?.max ?? 0),
              fee: Number(rule?.fee ?? 0),
            }))
          : DEFAULTS.serviceChargeRules,
      });
    } catch {
      setSettings(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") load();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  return { settings, loading, refresh: load };
}
