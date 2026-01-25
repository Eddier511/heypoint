import { useEffect, useState } from "react";

export type StoreSettings = {
  iva: number; // porcentaje (21)
  serviceCharge: number; // porcentaje (1)
};

const DEFAULTS: StoreSettings = { iva: 21, serviceCharge: 1 };

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

        if (!alive) return;
        setSettings({
          iva: Number(data?.iva ?? DEFAULTS.iva),
          serviceCharge: Number(data?.serviceCharge ?? DEFAULTS.serviceCharge),
        });
      } catch {
        // si falla, dejamos defaults para no romper UI
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
