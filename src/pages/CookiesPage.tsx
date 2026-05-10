import { useEffect } from "react";
import { motion } from "motion/react";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { BackToTopButton } from "../components/BackToTopButton";

interface CookiesPageProps {
  onNavigate: (page: string) => void;
}

export function CookiesPage({ onNavigate }: CookiesPageProps) {
  useEffect(() => {
    document.title = "Política de Cookies | Hey Point!";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Política de Cookies de Hey Point! — cómo usamos cookies para mantener tu sesión segura, recordar preferencias y mejorar la plataforma.",
      );
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="cookies"
        isTransparent={false}
      />

      <div className="pt-20 lg:pt-24">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#FF6B00] to-[#FF8C3A] py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-white mb-4">Política de Cookies</h1>
              <p className="text-white/90 max-w-2xl mx-auto">
                Última actualización: enero de 2026
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm p-8 md:p-12"
          >
            <div className="prose prose-lg max-w-none">

              {/* Intro */}
              <h2 className="text-[#2E2E2E] mb-4">Introducción</h2>
              <p className="text-[#2E2E2E]/80 mb-8">
                En Hey Point! usamos cookies y tecnologías similares para mejorar
                tu experiencia, mantener tu sesión segura, recordar tus
                preferencias y analizar el rendimiento de la plataforma. Esta
                política explica qué son, cómo las usamos y qué podés hacer con
                ellas.
              </p>

              {/* 1 */}
              <h2 className="text-[#2E2E2E] mb-4">1. ¿Qué son las cookies?</h2>
              <p className="text-[#2E2E2E]/80 mb-8">
                Las cookies son pequeños archivos de texto que un sitio web
                guarda en tu dispositivo cuando lo visitás. Permiten que la
                plataforma te reconozca entre visitas, recuerde tus preferencias
                y funcione correctamente. No almacenan información sensible como
                contraseñas o datos de tarjetas.
              </p>

              {/* 2 */}
              <h2 className="text-[#2E2E2E] mb-4">
                2. ¿Qué tipos de cookies usamos?
              </h2>

              <h3 className="text-[#2E2E2E] mb-2">Cookies necesarias</h3>
              <p className="text-[#2E2E2E]/80 mb-4">
                Son imprescindibles para que la plataforma funcione. Incluyen las
                cookies de sesión, autenticación, seguridad del login y
                funcionamiento básico del carrito de compras. Sin estas cookies,
                HeyPoint! no puede operar correctamente.
              </p>

              <h3 className="text-[#2E2E2E] mb-2">Cookies de preferencias</h3>
              <p className="text-[#2E2E2E]/80 mb-4">
                Permiten que la plataforma recuerde decisiones que ya tomaste,
                como haber aceptado esta política de cookies o ciertas
                configuraciones de interfaz.
              </p>

              <h3 className="text-[#2E2E2E] mb-2">
                Cookies de análisis y rendimiento
              </h3>
              <p className="text-[#2E2E2E]/80 mb-4">
                Nos ayudan a entender cómo se usa la plataforma: qué secciones
                se visitan más, dónde ocurren errores y cómo mejorar la
                experiencia general. Esta información es agregada y anónima.
              </p>

              <h3 className="text-[#2E2E2E] mb-2">Cookies de terceros</h3>
              <p className="text-[#2E2E2E]/80 mb-8">
                Algunos servicios que usamos pueden establecer sus propias
                cookies para funcionar correctamente. Esto incluye:
              </p>
              <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                <li>
                  <strong>Firebase / Google Auth</strong> — para la
                  autenticación segura de tu cuenta.
                </li>
                <li>
                  <strong>Mercado Pago</strong> — para el procesamiento de
                  pagos. Sus cookies están sujetas a la política de privacidad
                  de Mercado Libre.
                </li>
                <li>
                  <strong>Servicios de análisis</strong> — si en el futuro
                  integramos herramientas de análisis de uso, se indicará en
                  esta política.
                </li>
              </ul>

              {/* 3 */}
              <h2 className="text-[#2E2E2E] mb-4">
                3. ¿Para qué usamos cookies en HeyPoint?
              </h2>
              <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                <li>Mantener tu sesión iniciada de forma segura.</li>
                <li>Proteger tu cuenta contra accesos no autorizados.</li>
                <li>
                  Recordar preferencias y decisiones dentro de la plataforma.
                </li>
                <li>
                  Procesar pagos y garantizar la integridad de las
                  transacciones.
                </li>
                <li>
                  Analizar errores y mejorar el rendimiento general de la
                  plataforma.
                </li>
                <li>
                  Entender cómo se usa HeyPoint! para seguir mejorando la
                  experiencia.
                </li>
              </ul>

              {/* 4 */}
              <h2 className="text-[#2E2E2E] mb-4">4. Gestión de cookies</h2>
              <p className="text-[#2E2E2E]/80 mb-4">
                Podés eliminar o bloquear las cookies desde la configuración de
                tu navegador. La mayoría de los navegadores modernos te permiten:
              </p>
              <ul className="list-disc pl-6 mb-4 text-[#2E2E2E]/80 space-y-2">
                <li>Ver qué cookies están almacenadas.</li>
                <li>Eliminar cookies individualmente o todas a la vez.</li>
                <li>Bloquear cookies de terceros.</li>
                <li>Bloquear todas las cookies de forma general.</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-8">
                Tené en cuenta que si deshabilitás las cookies necesarias, algunas
                funciones de HeyPoint! —como el login, el carrito o el proceso de
                pago— pueden dejar de funcionar correctamente.
              </p>

              {/* 5 */}
              <h2 className="text-[#2E2E2E] mb-4">
                5. Cambios en esta política
              </h2>
              <p className="text-[#2E2E2E]/80 mb-8">
                A medida que HeyPoint! evoluciona, es posible que actualicemos
                esta política para reflejar nuevas tecnologías, integraciones o
                cambios en la legislación aplicable. Publicaremos la fecha de la
                última actualización en esta página. Te recomendamos revisarla
                periódicamente.
              </p>

              {/* 6 */}
              <h2 className="text-[#2E2E2E] mb-4">6. Contacto</h2>
              <p className="text-[#2E2E2E]/80">
                Si tenés preguntas sobre esta política o sobre el uso de cookies
                en HeyPoint!, podés comunicarte con nosotros a través de nuestra{" "}
                <button
                  type="button"
                  onClick={() => onNavigate("contact")}
                  className="text-[#FF6B00] hover:text-[#e56000] underline-offset-2 hover:underline font-medium transition-colors"
                >
                  página de contacto
                </button>
                .
              </p>
            </div>
          </motion.div>
        </section>

        <Footer onNavigate={onNavigate} />
        <BackToTopButton />
      </div>
    </div>
  );
}
