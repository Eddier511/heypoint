import { useEffect } from "react";
import { motion } from "motion/react";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { BackToTopButton } from "../components/BackToTopButton";

interface PrivacyPageProps {
  onNavigate: (page: string) => void;
}

export function PrivacyPage({ onNavigate }: PrivacyPageProps) {
  // Set page title for SEO
  useEffect(() => {
    document.title = "Privacy Policy | Hey Point!";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Privacy Policy for Hey Point! smart mini-store system. Learn how we collect, use, protect and manage your personal information."
      );
    }
    
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader onNavigate={onNavigate} currentPage="privacy" isTransparent={false} />
      
      {/* Add padding-top to account for fixed header */}
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#FF6B00] to-[#FF8C3A] py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-white mb-4">
                Política de Privacidad
              </h1>
              <p className="text-white/90 max-w-2xl mx-auto">
                Última actualización: 15 de noviembre de 2025
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm p-8 md:p-12"
          >
            <div className="prose prose-lg max-w-none">
              {/* Introduction */}
              <h2 className="text-[#2E2E2E] mb-4">Introducción</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                En Hey Point!, valoramos y respetamos su privacidad. Esta Política de Privacidad describe cómo 
                recopilamos, usamos, compartimos y protegemos su información personal cuando utiliza nuestros 
                servicios de mini-tiendas inteligentes.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                Al utilizar los servicios de Hey Point!, usted acepta las prácticas descritas en esta política. 
                Si no está de acuerdo con esta política, por favor no utilice nuestros servicios.
              </p>

              {/* Section 1 */}
              <h2 className="text-[#2E2E2E] mb-4">1. Información que Recopilamos</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>1.1 Información que Usted Proporciona:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li><strong>Información de Cuenta:</strong> Nombre completo, dirección de correo electrónico, 
                número de teléfono, contraseña (encriptada)</li>
                <li><strong>Información de Pago:</strong> Datos de tarjeta de crédito/débito (procesados de forma 
                segura por terceros certificados PCI-DSS)</li>
                <li><strong>Información de Perfil:</strong> Preferencias de productos, historial de compras, 
                direcciones de entrega</li>
                <li><strong>Comunicaciones:</strong> Correos electrónicos, mensajes o cualquier otra comunicación 
                que envíe a nuestro servicio al cliente</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>1.2 Información Recopilada Automáticamente:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li><strong>Datos de Uso:</strong> Información sobre cómo utiliza nuestros servicios, páginas 
                visitadas, productos visualizados, tiempo de navegación</li>
                <li><strong>Datos del Dispositivo:</strong> Dirección IP, tipo de navegador, sistema operativo, 
                identificadores únicos del dispositivo</li>
                <li><strong>Datos de Ubicación:</strong> Ubicación aproximada basada en dirección IP (con su 
                consentimiento, podemos recopilar ubicación GPS precisa)</li>
                <li><strong>Cookies y Tecnologías Similares:</strong> Utilizamos cookies para mejorar su experiencia 
                y personalizar nuestros servicios</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>1.3 Información de Transacciones:</strong>
              </p>
              <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                <li>Detalles de pedidos (productos, cantidades, precios)</li>
                <li>Fechas y horarios de transacciones</li>
                <li>Códigos de acceso a casilleros</li>
                <li>Ubicación del casillero utilizado</li>
                <li>Estado de recogida de productos</li>
              </ul>

              {/* Section 2 */}
              <h2 className="text-[#2E2E2E] mb-4">2. Cómo Utilizamos su Información</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Utilizamos su información personal para los siguientes propósitos:
              </p>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>2.1 Provisión de Servicios:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Procesar y completar sus pedidos</li>
                <li>Gestionar su cuenta y proporcionar servicio al cliente</li>
                <li>Generar códigos de acceso a casilleros</li>
                <li>Enviar confirmaciones de pedidos y notificaciones de estado</li>
                <li>Procesar pagos y prevenir fraudes</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>2.2 Mejora y Personalización:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Personalizar su experiencia en la plataforma</li>
                <li>Recomendar productos basados en sus preferencias</li>
                <li>Analizar tendencias de uso para mejorar nuestros servicios</li>
                <li>Desarrollar nuevas características y funcionalidades</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>2.3 Comunicación:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Enviar actualizaciones sobre el estado de sus pedidos</li>
                <li>Responder a sus consultas y solicitudes de soporte</li>
                <li>Enviar notificaciones importantes sobre cambios en nuestros servicios</li>
                <li>Enviar ofertas promocionales y marketing (con su consentimiento)</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>2.4 Seguridad y Cumplimiento:</strong>
              </p>
              <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                <li>Detectar y prevenir fraudes y actividades ilegales</li>
                <li>Proteger la seguridad de nuestros usuarios y servicios</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
                <li>Resolver disputas y hacer cumplir nuestros acuerdos</li>
              </ul>

              {/* Section 3 */}
              <h2 className="text-[#2E2E2E] mb-4">3. Compartir su Información</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Hey Point! no vende su información personal a terceros. Sin embargo, podemos compartir su información 
                en las siguientes circunstancias:
              </p>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>3.1 Proveedores de Servicios:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Procesadores de pagos (para transacciones seguras)</li>
                <li>Proveedores de servicios en la nube (para almacenamiento de datos)</li>
                <li>Servicios de análisis y estadísticas</li>
                <li>Servicios de marketing y comunicación por correo electrónico</li>
                <li>Proveedores de seguridad y prevención de fraudes</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-6">
                Estos proveedores están contractualmente obligados a proteger su información y solo pueden usarla 
                para proporcionar servicios a Hey Point!.
              </p>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>3.2 Cumplimiento Legal:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Cuando sea requerido por ley o proceso legal</li>
                <li>Para responder a solicitudes gubernamentales o de autoridades reguladoras</li>
                <li>Para proteger nuestros derechos, propiedad o seguridad</li>
                <li>Para prevenir o investigar posibles actividades ilegales</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>3.3 Transacciones Corporativas:</strong>
              </p>
              <p className="text-[#2E2E2E]/80 mb-6">
                En caso de fusión, adquisición, venta de activos o reestructuración, su información personal puede 
                ser transferida como parte de dicha transacción.
              </p>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>3.4 Con su Consentimiento:</strong>
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                Podemos compartir su información con terceros cuando usted nos haya dado su consentimiento explícito 
                para hacerlo.
              </p>

              {/* Section 4 */}
              <h2 className="text-[#2E2E2E] mb-4">4. Seguridad de los Datos</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger su información 
                personal contra acceso no autorizado, pérdida, alteración o divulgación:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li><strong>Encriptación:</strong> Utilizamos SSL/TLS para cifrar datos en tránsito y encriptación 
                AES-256 para datos en reposo</li>
                <li><strong>Control de Acceso:</strong> Acceso limitado a información personal solo para empleados 
                autorizados que lo necesiten</li>
                <li><strong>Autenticación:</strong> Contraseñas hasheadas con algoritmos seguros (bcrypt)</li>
                <li><strong>Monitoreo:</strong> Supervisión continua de sistemas para detectar y prevenir 
                vulnerabilidades</li>
                <li><strong>Auditorías:</strong> Revisiones periódicas de seguridad y cumplimiento</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-8">
                Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. 
                Aunque nos esforzamos por proteger su información, no podemos garantizar su seguridad absoluta.
              </p>

              {/* Section 5 */}
              <h2 className="text-[#2E2E2E] mb-4">5. Sus Derechos y Opciones</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Usted tiene los siguientes derechos respecto a su información personal:
              </p>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>5.1 Acceso y Portabilidad:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Solicitar una copia de la información personal que tenemos sobre usted</li>
                <li>Recibir su información en un formato estructurado y de uso común</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>5.2 Rectificación:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Actualizar o corregir información inexacta o incompleta</li>
                <li>Modificar sus preferencias de cuenta en cualquier momento</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>5.3 Eliminación:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Solicitar la eliminación de su información personal</li>
                <li>Cerrar su cuenta de forma permanente</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-6">
                Nota: Podemos retener cierta información por razones legales o de archivo legítimo.
              </p>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>5.4 Restricción y Objeción:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Restringir el procesamiento de su información en ciertas circunstancias</li>
                <li>Oponerse al procesamiento basado en intereses legítimos</li>
                <li>Optar por no recibir comunicaciones de marketing</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>5.5 Gestión de Cookies:</strong>
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Configurar su navegador para rechazar cookies</li>
                <li>Eliminar cookies existentes en cualquier momento</li>
                <li>Ajustar preferencias de cookies en nuestra plataforma</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-8">
                Para ejercer cualquiera de estos derechos, contáctenos en privacy@heypoint.com
              </p>

              {/* Section 6 */}
              <h2 className="text-[#2E2E2E] mb-4">6. Retención de Datos</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Retenemos su información personal durante el tiempo necesario para cumplir con los propósitos 
                descritos en esta política, a menos que la ley requiera o permita un período de retención más largo.
              </p>
              <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                <li><strong>Información de Cuenta:</strong> Mientras su cuenta esté activa, más un período razonable 
                después del cierre</li>
                <li><strong>Historial de Transacciones:</strong> Mínimo 7 años para cumplimiento fiscal y contable</li>
                <li><strong>Registros de Comunicación:</strong> 3-5 años para resolución de disputas</li>
                <li><strong>Datos de Marketing:</strong> Hasta que retire su consentimiento</li>
                <li><strong>Registros de Seguridad:</strong> Según lo requiera la ley aplicable</li>
              </ul>

              {/* Section 7 */}
              <h2 className="text-[#2E2E2E] mb-4">7. Privacidad de Menores</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente 
                información personal de menores. Si descubrimos que hemos recopilado información de un menor sin 
                el consentimiento parental apropiado, tomaremos medidas para eliminar esa información lo antes posible.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                Si usted es padre o tutor y cree que su hijo nos ha proporcionado información personal, contáctenos 
                inmediatamente en privacy@heypoint.com
              </p>

              {/* Section 8 */}
              <h2 className="text-[#2E2E2E] mb-4">8. Transferencias Internacionales</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Su información puede ser transferida y procesada en países distintos al país donde reside. Estos países 
                pueden tener leyes de protección de datos diferentes a las de su jurisdicción.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                Cuando transferimos información personal internacionalmente, implementamos salvaguardas apropiadas, 
                como cláusulas contractuales estándar aprobadas por autoridades reguladoras, para proteger su información 
                de acuerdo con esta política.
              </p>

              {/* Section 9 */}
              <h2 className="text-[#2E2E2E] mb-4">9. Cookies y Tecnologías de Rastreo</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Utilizamos cookies y tecnologías similares para:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li><strong>Cookies Esenciales:</strong> Necesarias para el funcionamiento básico del sitio web</li>
                <li><strong>Cookies de Rendimiento:</strong> Ayudan a mejorar el rendimiento y la experiencia del usuario</li>
                <li><strong>Cookies Funcionales:</strong> Recuerdan sus preferencias y configuraciones</li>
                <li><strong>Cookies de Marketing:</strong> Personalizan contenido y anuncios (con su consentimiento)</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-8">
                Puede gestionar sus preferencias de cookies a través de la configuración de su navegador o nuestro 
                panel de consentimiento de cookies.
              </p>

              {/* Section 10 */}
              <h2 className="text-[#2E2E2E] mb-4">10. Enlaces a Sitios de Terceros</h2>
              <p className="text-[#2E2E2E]/80 mb-8">
                Nuestro sitio web puede contener enlaces a sitios web de terceros. No somos responsables de las 
                prácticas de privacidad o el contenido de estos sitios externos. Le recomendamos revisar las políticas 
                de privacidad de cualquier sitio de terceros que visite.
              </p>

              {/* Section 11 */}
              <h2 className="text-[#2E2E2E] mb-4">11. Cambios a esta Política</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras 
                prácticas, tecnología o requisitos legales. Cuando realicemos cambios materiales, le notificaremos:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Publicando un aviso destacado en nuestro sitio web</li>
                <li>Enviando un correo electrónico a la dirección asociada con su cuenta</li>
                <li>Actualizando la fecha de "Última actualización" en la parte superior de esta política</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-8">
                Le recomendamos revisar esta política regularmente para mantenerse informado sobre cómo protegemos 
                su información.
              </p>

              {/* Section 12 */}
              <h2 className="text-[#2E2E2E] mb-4">12. Cómo Contactarnos</h2>
              <p className="text-[#2E2E2E]/80 mb-4">
                Si tiene preguntas, comentarios o inquietudes sobre esta Política de Privacidad o nuestras prácticas 
                de privacidad, puede contactarnos:
              </p>
              <ul className="list-none mb-6 text-[#2E2E2E]/80 space-y-2">
                <li><strong>Email:</strong> privacy@heypoint.com</li>
                <li><strong>Email de Protección de Datos:</strong> dpo@heypoint.com</li>
                <li><strong>Teléfono:</strong> +1 (555) 123-4567</li>
                <li><strong>Dirección Postal:</strong></li>
                <li className="pl-6">Hey Point! Privacy Team</li>
                <li className="pl-6">123 Innovation Drive</li>
                <li className="pl-6">Tech City, TC 12345</li>
              </ul>

              <p className="text-[#2E2E2E]/80 mb-8">
                Responderemos a su consulta lo antes posible, generalmente dentro de 30 días.
              </p>

              {/* Section 13 */}
              <h2 className="text-[#2E2E2E] mb-4">13. Autoridad de Protección de Datos</h2>
              <p className="text-[#2E2E2E]/80 mb-8">
                Si no está satisfecho con nuestra respuesta a una queja o cree que no estamos procesando su información 
                personal de acuerdo con la ley, tiene derecho a presentar una queja ante la autoridad de protección de 
                datos de su jurisdicción.
              </p>

              {/* Final Note */}
              <div className="bg-[#FFF4E6] rounded-2xl p-6 mt-8">
                <p className="text-[#2E2E2E]" style={{ fontWeight: 600 }}>
                  Su Consentimiento
                </p>
                <p className="text-[#2E2E2E]/80 mt-2">
                  Al utilizar los servicios de Hey Point!, usted reconoce que ha leído y entendido esta Política de 
                  Privacidad y acepta el tratamiento de su información personal como se describe en esta política.
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
      
      <BackToTopButton />
      <Footer onNavigate={onNavigate} />
    </div>
  );
}