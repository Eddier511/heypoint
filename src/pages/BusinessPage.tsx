import { Building2, Clock, Shield, Zap, Smartphone, Package, TrendingUp, MapPin, CheckCircle2, Users, Briefcase, Dumbbell, Home } from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface BusinessPageProps {
  onNavigate?: (page: string) => void;
}

export function BusinessPage({ onNavigate }: BusinessPageProps) {
  const problems = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Pérdida de tiempo productivo",
      description: "Los empleados interrumpen su jornada para compras básicas"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Seguridad y confianza",
      description: "Preocupación por entregas no seguras o sin supervisión"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Necesidad de conveniencia",
      description: "Los usuarios buscan soluciones rápidas sin comprometer calidad"
    }
  ];

  const solutions = [
    {
      icon: <Package className="w-8 h-8" />,
      title: "Lockers inteligentes",
      description: "Módulos seguros con tecnología de acceso digital"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Pagos digitales",
      description: "Checkout 100% online, sin contacto, sin efectivo"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Retiro en segundos",
      description: "Token de acceso único para retirar en menos de 30 segundos"
    }
  ];

  const locations = [
    {
      icon: <Home className="w-10 h-10" />,
      title: "Complejos residenciales",
      description: "Conveniencia 24/7 para residentes con vidas ocupadas",
      image: "https://images.unsplash.com/photo-1615725475020-1f7625d5ac72?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjByZXNpZGVudGlhbCUyMHRvd2VyJTIwYnVpbGRpbmclMjBlbnRyYW5jZXxlbnwxfHx8fDE3Njk5MTc5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      icon: <Briefcase className="w-10 h-10" />,
      title: "Oficinas corporativas",
      description: "Beneficio que aumenta la productividad de tus equipos",
      image: "https://images.unsplash.com/photo-1749310726959-d8fccfef7ee4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBidWlsZGluZyUyMGxvYmJ5fGVufDF8fHx8MTc2OTkxNzA4NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    },
    {
      icon: <Dumbbell className="w-10 h-10" />,
      title: "Gimnasios y coworkings",
      description: "Servicios adicionales que valorizan tu propuesta",
      image: "https://images.unsplash.com/photo-1761971975769-97e598bf526b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBmaXRuZXNzJTIwY2VudGVyJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzY5OTE3MDg1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
    }
  ];

  const benefits = [
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Sin inversión inicial",
      description: "Nosotros instalamos y mantenemos el equipamiento"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Modelo flexible",
      description: "Adaptamos el servicio a las necesidades de tu espacio"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Operación simple",
      description: "Nos encargamos de la logística, stock y reposición"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Valor agregado",
      description: "Diferenciá tu edificio u oficina con tecnología de vanguardia"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Ingresos pasivos",
      description: "Generá renta adicional según el modelo de partnership"
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Soporte integral",
      description: "Equipo técnico disponible para mantenimiento y actualizaciones"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Explorás",
      description: "El usuario navega el catálogo desde su celular, en cualquier momento"
    },
    {
      number: "02",
      title: "Comprás",
      description: "Selecciona productos, paga online y elige su locker más cercano"
    },
    {
      number: "03",
      title: "Recibís token",
      description: "Al confirmar la orden, recibe un código único de retiro"
    },
    {
      number: "04",
      title: "Retirás en segundos",
      description: "Va al locker, ingresa el token y retira su pedido de forma segura"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader onNavigate={onNavigate} currentPage="business" isTransparent={false} />
      
      {/* Add padding-top to account for fixed header */}
      <div className="pt-20 lg:pt-24">
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#FF6B00] to-[#ff8533] text-white py-20 lg:py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h1 className="mb-6" style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: '1.1' }}>
                  El futuro del retail está en tu edificio
                </h1>
                <p className="mb-8" style={{ fontSize: '1.25rem', lineHeight: '1.7', opacity: 0.95 }}>
                  HeyPoint! es un ecosistema de mini-tiendas inteligentes que transforma espacios comunes en puntos de conveniencia sin fricciones. Un modelo escalable, flexible y probado.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-[#FF6B00] hover:bg-white/90"
                    style={{ fontSize: '1rem', fontWeight: 600, padding: '1.25rem 2rem', height: 'auto' }}
                    onClick={() => onNavigate?.('contact')}
                  >
                    <Users className="w-5 h-5" />
                    Quiero HeyPoint! en mi espacio
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1617021483925-a331d536133d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydCUyMGxvY2tlciUyMGRlbGl2ZXJ5JTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3Njk5MTcwODN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="HeyPoint! smart locker system"
                    className="w-full h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-[#1C2335] mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                El problema que resolvemos
              </h2>
              <p className="text-[#2E2E2E] max-w-3xl mx-auto" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                En un mundo donde el tiempo es el recurso más valioso, las personas necesitan soluciones inmediatas y confiables
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {problems.map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 border-none shadow-md rounded-2xl bg-[#FFF4E6] h-full">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FF6B00]/10 text-[#FF6B00] rounded-xl mb-4">
                      {problem.icon}
                    </div>
                    <h3 className="text-[#1C2335] mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      {problem.title}
                    </h3>
                    <p className="text-[#2E2E2E]" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                      {problem.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution Overview */}
        <section className="py-20 bg-gradient-to-br from-[#FFF4E6] to-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-[#1C2335] mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                La solución HeyPoint!
              </h2>
              <p className="text-[#2E2E2E] max-w-3xl mx-auto" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                Un ecosistema completo que combina hardware inteligente, software robusto y operación logística eficiente
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {solutions.map((solution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-8 text-center border-none shadow-lg rounded-2xl bg-white hover:shadow-xl transition-all h-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6B00]/10 text-[#FF6B00] rounded-xl mb-4">
                      {solution.icon}
                    </div>
                    <h3 className="text-[#1C2335] mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      {solution.title}
                    </h3>
                    <p className="text-[#2E2E2E]" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                      {solution.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Where it Works */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-[#1C2335] mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                ¿Dónde funciona HeyPoint!?
              </h2>
              <p className="text-[#2E2E2E] max-w-3xl mx-auto" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                Nuestro modelo se adapta a múltiples entornos, siempre generando valor para usuarios y propietarios
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {locations.map((location, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-none shadow-lg rounded-2xl bg-white hover:shadow-xl transition-all">
                    <div className="relative h-48 overflow-hidden">
                      <ImageWithFallback
                        src={location.image}
                        alt={location.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-4 left-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-lg">
                          {location.icon}
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-[#1C2335] mb-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        {location.title}
                      </h3>
                      <p className="text-[#2E2E2E]" style={{ fontSize: '1rem', lineHeight: '1.6' }}>
                        {location.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Benefits */}
        <section className="py-20 bg-gradient-to-br from-[#FFF4E6] to-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-[#1C2335] mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                Beneficios clave del modelo
              </h2>
              <p className="text-[#2E2E2E] max-w-3xl mx-auto" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                Diseñado para maximizar el valor sin complejidad operativa
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="flex gap-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0">
                    <div className="text-[#FF6B00]">
                      {benefit.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[#1C2335] mb-2" style={{ fontSize: '1rem', fontWeight: 600 }}>
                      {benefit.title}
                    </h4>
                    <p className="text-[#2E2E2E]" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-[#1C2335] mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                ¿Cómo funciona para el usuario?
              </h2>
              <p className="text-[#2E2E2E] max-w-3xl mx-auto" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                Una experiencia sin fricciones, diseñada para la vida moderna
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6B00] text-white rounded-full mb-4" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                      {step.number}
                    </div>
                    <h4 className="text-[#1C2335] mb-3" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                      {step.title}
                    </h4>
                    <p className="text-[#2E2E2E]" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                      {step.description}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-[#FF6B00] to-transparent -translate-x-1/2"></div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Business Model */}
        <section className="py-20 bg-[#1C2335] text-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h2 className="mb-6" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                  Modelo de negocio flexible
                </h2>
                <div className="space-y-6" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                  <p>
                    Ofrecemos diferentes esquemas de partnership según el tipo de espacio y el nivel de involucramiento deseado.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                      <span><strong>Modelo concesión:</strong> Instalamos, operamos y compartimos ingresos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                      <span><strong>Licencia de marca:</strong> Proveemos tecnología y know-how para operación propia</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                      <span><strong>Servicio white label:</strong> Adaptamos la plataforma a tu marca institucional</span>
                    </li>
                  </ul>
                  <p className="pt-4">
                    Cada implementación es única y diseñada para maximizar el valor para todas las partes.
                  </p>
                </div>
              </div>

              <div className="bg-[#FF6B00]/10 backdrop-blur-sm p-8 rounded-2xl border border-[#FF6B00]/20">
                <h3 className="mb-6" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  ¿Por qué elegir HeyPoint!?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="mb-1" style={{ fontWeight: 600 }}>Presencia estratégica</h4>
                      <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        Ya operamos en edificios premium con alta densidad de usuarios
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="mb-1" style={{ fontWeight: 600 }}>Tecnología propia</h4>
                      <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        Desarrollamos y mantenemos toda la infraestructura digital
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="mb-1" style={{ fontWeight: 600 }}>Equipo experimentado</h4>
                      <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                        Profesionales con años de experiencia en retail, logística y tecnología
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Vision & Commitment */}
        <section className="py-20 bg-gradient-to-br from-[#FF6B00] to-[#ff8533] text-white">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-6" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                Innovación desarrollada en Argentina
              </h2>
              <p className="mb-8" style={{ fontSize: '1.25rem', lineHeight: '1.8' }}>
                HeyPoint! es un proyecto 100% argentino que combina visión estratégica, ingeniería de software de alto nivel y conocimiento profundo del mercado local. Creemos en el talento nacional y en construir soluciones tecnológicas que resuelvan problemas reales.
              </p>
              <p style={{ fontSize: '1.125rem', lineHeight: '1.8', opacity: 0.95 }}>
                Nuestro compromiso es escalar un modelo que genere valor sostenible para usuarios, propietarios y la comunidad, posicionando a Argentina como referente en retail tech de última generación.
              </p>
              <div className="mt-12">
                <Button 
                  size="lg" 
                  className="bg-white text-[#FF6B00] hover:bg-white/90"
                  style={{ fontSize: '1.125rem', fontWeight: 600, padding: '1.5rem 3rem', height: 'auto' }}
                  onClick={() => onNavigate?.('contact')}
                >
                  <Building2 className="w-5 h-5" />
                  Conversemos sobre tu proyecto
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer onNavigate={onNavigate} />
      </div>
    </div>
  );
}