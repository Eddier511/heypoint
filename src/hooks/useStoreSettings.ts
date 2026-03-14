import { useEffect, useState } from "react";

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

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const base = import.meta.env.VITE_API_URL || "";
        const res = await fetch(`${base}/api/settings/store`);
        if (!res.ok) throw new Error("Failed to load store settings");

        const data = await res.json();
        const s = data?.settings ?? data;

        if (!alive) return;

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
        if (alive) setSettings(DEFAULTS);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  return { settings, loading };
}
