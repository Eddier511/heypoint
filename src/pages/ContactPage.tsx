import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { BackToTopButton } from "../components/BackToTopButton";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Phone, Mail, Send, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface ContactPageProps {
  onNavigate?: (page: string) => void;
}

const faqs = [
  {
    question: "¿Qué es Hey!Point?",
    answer: `Hey!Point es un mini-market autónomo pensado para edificios, oficinas, gimnasios y comunidades que necesitan un punto de abastecimiento interno.
Funciona sin intermediarios y se adapta a las necesidades reales de consumo de cada lugar.`,
  },
  {
    question: "¿Cómo funciona Hey!Point?",
    answer: `Comprás desde la tienda web, pagás online y retirás tus productos en el stand.
Elegís los productos en la tienda web.
Pagás de forma rápida con Mercado Pago.
Recibís un código token por mail y lo ingresás en el stand para retirar tu compra.`,
  },
  {
    question: "¿Qué productos puedo encontrar?",
    answer: `Vas a encontrar productos de consumo cotidiano, seleccionados según cada comunidad.
La oferta puede incluir bebidas, snacks, alimentos, productos básicos del día a día y otros artículos de conveniencia.`,
  },
  {
    question: "¿Cómo se realiza el pago?",
    answer: `Los pagos se realizan a través de Mercado Pago, utilizando cualquier medio habilitado en tu cuenta.
Es un proceso rápido, seguro y sin contacto.`,
  },
  {
    question: "¿Mis datos y mis medios de pago están seguros?",
    answer: `Sí. Hey!Point no almacena ni accede a datos de tarjetas.
Los pagos se procesan directamente a través de Mercado Pago, que se encarga de la seguridad y encriptación de la información.
Solo utilizamos los datos necesarios para gestionar tu compra y generar el código token.`,
  },
];

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    // honeypot — invisible to real users, filled only by bots
    website: "",
  });

  // ✅ NUEVO: estados UX
  const [isSending, setIsSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  // ✅ NUEVO: base de API (misma que usás en App.tsx/CartContext)
  const API_ORIGIN = useMemo(
    () => (import.meta as any).env?.VITE_API_URL || "http://localhost:4000",
    [],
  );

  // ✅ NUEVO: submit real end-to-end
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;

    setSentOk(false);

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      website: formData.website, // honeypot — backend rejects if non-empty
    };

    // validación mínima (rápida)
    if (!payload.name || !payload.email || !payload.message) {
      toast.error("Faltan datos", {
        description: "Completá nombre, email y mensaje.",
        duration: 2500,
      });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(`${API_ORIGIN}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}) as any);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `Error HTTP ${res.status}`);
      }

      setSentOk(true);
      toast.success("Mensaje enviado", {
        description: "¡Gracias! Te respondemos lo antes posible.",
        duration: 2500,
      });

      // limpiar form
      setFormData({ name: "", email: "", subject: "", message: "", website: "" });
    } catch (err: any) {
      console.error("[contact] submit failed:", err);
      toast.error("No se pudo enviar", {
        description: err?.message || "Intentá nuevamente en unos segundos.",
        duration: 3500,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="contact"
        isTransparent={false}
      />

      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-[#FFF4E6] py-16">
          <div className="container mx-auto px-6 text-center max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1
                className="text-[#1C2335] mb-4"
                style={{ fontSize: "3rem", fontWeight: 700 }}
              >
                Contactanos
              </h1>
              <p
                className="text-[#2E2E2E]"
                style={{ fontSize: "1.125rem", lineHeight: "1.7" }}
              >
                ¿Tenés preguntas sobre nuestros productos o servicios? Nos
                encantaría escucharte.
                <br />
                Escribinos y te responderemos lo antes posible.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Form and Info Cards */}
        <section className="py-16">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: Contact Form */}
              <div className="lg:col-span-2">
                <Card className="bg-white border-none shadow-lg rounded-2xl p-8">
                  <h2
                    className="text-[#1C2335] mb-2"
                    style={{ fontSize: "1.75rem", fontWeight: 600 }}
                  >
                    Envianos un mensaje
                  </h2>

                  {/* ✅ CAMBIO: agregar onSubmit */}
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Honeypot anti-spam — invisible to real users, do not remove */}
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        left: "-9999px",
                        top: "-9999px",
                        width: "1px",
                        height: "1px",
                        opacity: 0,
                        pointerEvents: "none",
                      }}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="fullName"
                          className="text-[#2E2E2E]"
                          style={{ fontSize: "0.938rem", fontWeight: 600 }}
                        >
                          Nombre completo
                        </Label>
                        <Input
                          id="fullName"
                          placeholder="Ingresá tu nombre"
                          className="rounded-xl border-gray-200 h-12"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          aria-label="Nombre completo"
                          required
                          disabled={isSending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-[#2E2E2E]"
                          style={{ fontSize: "0.938rem", fontWeight: 600 }}
                        >
                          Correo electrónico
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Ingresá tu correo"
                          className="rounded-xl border-gray-200 h-12"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          aria-label="Correo electrónico"
                          required
                          disabled={isSending}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="subject"
                        className="text-[#2E2E2E]"
                        style={{ fontSize: "0.938rem", fontWeight: 600 }}
                      >
                        Asunto
                      </Label>
                      <Input
                        id="subject"
                        placeholder="¿De qué se trata?"
                        className="rounded-xl border-gray-200 h-12"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        aria-label="Asunto del mensaje"
                        required
                        disabled={isSending}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="message"
                        className="text-[#2E2E2E]"
                        style={{ fontSize: "0.938rem", fontWeight: 600 }}
                      >
                        Mensaje
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Contanos más..."
                        className="rounded-xl border-gray-200 min-h-[150px] resize-none"
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        aria-label="Mensaje"
                        required
                        disabled={isSending}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSending}
                      className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-full py-6 disabled:opacity-60"
                      style={{ fontSize: "1.125rem", fontWeight: 600 }}
                      aria-label="Enviar mensaje"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {isSending ? "Enviando..." : "Enviar mensaje"}
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Right: Contact Info Cards */}
              <div className="space-y-6">
                <Card className="bg-white border-none shadow-md rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-[#FF6B00]" />
                    </div>
                    <div>
                      <h3
                        className="text-[#1C2335] mb-2"
                        style={{ fontSize: "1.125rem", fontWeight: 600 }}
                      >
                        Contacto comercial
                      </h3>
                      <p
                        className="text-[#2E2E2E]"
                        style={{ fontSize: "0.938rem", lineHeight: "1.6" }}
                      >
                        (+54) 9 11 3147 5522
                        <br />
                        Lun-Vie: 9 a 18 hs
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white border-none shadow-md rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-[#FF6B00]" />
                    </div>
                    <div>
                      <h3
                        className="text-[#1C2335] mb-2"
                        style={{ fontSize: "1.125rem", fontWeight: 600 }}
                      >
                        Escribinos
                      </h3>
                      <p
                        className="text-[#2E2E2E]"
                        style={{ fontSize: "0.938rem", lineHeight: "1.6" }}
                      >
                        heypoint.ar@gmail.com
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="preguntas-frecuentes" className="py-16 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2
                className="text-[#1C2335] text-center mb-12"
                style={{ fontSize: "2.5rem", fontWeight: 700 }}
              >
                Preguntas Frecuentes
              </h2>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {faqs.map((faq, index) => {
                  const isOpen = openFaq === index;
                  return (
                    <div key={index} className="bg-white">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : index)}
                        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50/70 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-inset"
                        aria-expanded={isOpen}
                      >
                        <span
                          className="text-[#1C2335]"
                          style={{ fontSize: "1rem", fontWeight: 600 }}
                        >
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`flex-shrink-0 w-5 h-5 text-[#FF6B00] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="content"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                            style={{ overflow: "hidden" }}
                          >
                            <p
                              className="px-6 pb-6 text-[#2E2E2E] whitespace-pre-line"
                              style={{ fontSize: "0.938rem", lineHeight: "1.75" }}
                            >
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        <Footer onNavigate={onNavigate} />
        <BackToTopButton />
      </div>
    </div>
  );
}


