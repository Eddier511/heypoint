import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { BackToTopButton } from "../components/BackToTopButton";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface ContactPageProps {
  onNavigate?: (page: string) => void;
}

const faqs = [
  {
    question: "¿Qué es Hey Point?",
    answer: `Hey Point! es un mini-market autónomo pensado para edificios, oficinas, gimnasios y comunidades que necesitan un punto de abastecimiento interno.
Funciona sin intermediarios y se adapta a las necesidades reales de consumo de cada lugar.`,
  },
  {
    question: "¿Cómo funciona Hey Point!?",
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
    answer: `Sí. Hey Point! no almacena ni accede a datos de tarjetas.
Los pagos se procesan directamente a través de Mercado Pago, que se encarga de la seguridad y encriptación de la información.
Solo utilizamos los datos necesarios para gestionar tu compra y generar el código token.`,
  },
];

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader
        onNavigate={onNavigate}
        currentPage="contact"
        isTransparent={false}
      />

      {/* Add padding-top to account for fixed header */}
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
                    className="text-[#1C2335] mb-8"
                    style={{ fontSize: "1.75rem", fontWeight: 600 }}
                  >
                    Envianos un mensaje
                  </h2>

                  <form className="space-y-6">
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
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#FF6B00] hover:bg-[#e56000] text-white rounded-full py-6"
                      style={{ fontSize: "1.125rem", fontWeight: 600 }}
                      aria-label="Enviar mensaje"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Enviar mensaje
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Right: Contact Info Cards */}
              <div className="space-y-6">
                {/* Call Us */}
                <Card className="bg-white border-none shadow-md rounded-2xl p-6 hover:shadow-lg transition-shadow">
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

                {/* Email Us */}
                <Card className="bg-white border-none shadow-md rounded-2xl p-6 hover:shadow-lg transition-shadow">
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
                        heypoint.arg@gmail.com
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="text-[#1C2335] text-center mb-12"
                style={{ fontSize: "2.5rem", fontWeight: 700 }}
              >
                Preguntas Frecuentes
              </h2>

              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="pb-6 border-b border-gray-200 last:border-0">
                      <h3
                        className="text-[#1C2335] mb-3"
                        style={{ fontSize: "1.125rem", fontWeight: 600 }}
                      >
                        {faq.question}
                      </h3>
                      <p
                        className="text-[#2E2E2E]"
                        style={{ fontSize: "0.938rem", lineHeight: "1.7" }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <Footer onNavigate={onNavigate} />

        {/* Back to Top Button */}
        <BackToTopButton />
      </div>
    </div>
  );
}
