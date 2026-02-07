import { useEffect, useState } from "react";
import { applyActionCode } from "firebase/auth";
import { auth } from "../config/firebaseClient";
import { Button } from "../components/ui/button";

export function VerifyEmailPage({
  onNavigate,
}: {
  onNavigate?: (p: string) => void;
}) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const oobCode = params.get("oobCode");
        if (!oobCode) throw new Error("Falta oobCode");

        await applyActionCode(auth, oobCode);
        setStatus("ok");
        setMsg("¡Tu correo fue verificado correctamente!");
      } catch (e: any) {
        setStatus("error");
        setMsg(e?.message || "No se pudo verificar el correo.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF4E6] flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-[#1C2335] text-2xl font-bold mb-3">
          Verificación de correo
        </h1>

        {status === "loading" && (
          <p className="text-gray-600">Verificando...</p>
        )}
        {status !== "loading" && <p className="text-gray-700">{msg}</p>}

        <div className="mt-6">
          <Button
            onClick={() => onNavigate?.("home")}
            className="bg-[#FF6B00] hover:bg-[#e56000] rounded-full px-8"
          >
            Ir a inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
