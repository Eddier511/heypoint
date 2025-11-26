import { useEffect } from "react";
import { motion } from "motion/react";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { BackToTopButton } from "../components/BackToTopButton";

interface TermsPageProps {
  onNavigate: (page: string) => void;
}

export function TermsPage({ onNavigate }: TermsPageProps) {
  // Set page title for SEO
  useEffect(() => {
    document.title = "Terms & Conditions | Hey Point!";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Terms and Conditions of Use for Hey Point! smart mini-store system. Read our terms of service, user responsibilities, and usage policies."
      );
    }
    
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader onNavigate={onNavigate} currentPage="terms" isTransparent={false} />
      
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
                Términos y Condiciones de Uso
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
              {/* Section 1 */}
              <h2 className="text-[#2E2E2E] mb-4">1. Aceptación de los Términos</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Bienvenido a Hey Point!. Al acceder y utilizar nuestro sistema de mini-tiendas inteligentes, 
                usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con 
                alguna parte de estos términos, por favor no utilice nuestros servicios.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                Hey Point! se reserva el derecho de actualizar, cambiar o reemplazar cualquier parte de estos 
                Términos y Condiciones mediante la publicación de actualizaciones en nuestro sitio web. Es su 
                responsabilidad revisar estos términos periódicamente para estar al tanto de los cambios.
              </p>

              {/* Section 2 */}
              <h2 className="text-[#2E2E2E] mb-4">2. Descripción del Servicio</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Hey Point! es un sistema de mini-tiendas inteligentes que permite a los usuarios:
              </p>
              <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                <li>Navegar y comprar productos a través de nuestra plataforma digital</li>
                <li>Realizar pedidos en línea con pago electrónico seguro</li>
                <li>Recoger productos en casilleros inteligentes automatizados</li>
                <li>Acceder a productos 24/7 sin necesidad de personal de atención</li>
                <li>Rastrear el estado de sus pedidos en tiempo real</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-8">
                Nuestro servicio está diseñado para proporcionar conveniencia, rapidez y seguridad en cada transacción.
              </p>

              {/* Section 3 */}
              <h2 className="text-[#2E2E2E] mb-4">3. Registro y Cuenta de Usuario</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Para utilizar los servicios de Hey Point!, debe:
              </p>
              <ul className="list-disc pl-6 mb-8 text-[#2E2E2E]/80 space-y-2">
                <li>Crear una cuenta proporcionando información precisa y completa</li>
                <li>Ser mayor de 18 años o tener el consentimiento de un tutor legal</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                <li>Actualizar su información personal cuando sea necesario</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-8">
                Usted es responsable de todas las actividades que ocurran bajo su cuenta. Hey Point! no será 
                responsable por pérdidas o daños derivados del uso no autorizado de su cuenta.
              </p>

              {/* Section 4 */}
              <h2 className="text-[#2E2E2E] mb-4">4. Proceso de Compra y Pago</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>4.1 Pedidos:</strong> Al realizar un pedido a través de Hey Point!, usted acepta:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Proporcionar información de pago válida y autorizada</li>
                <li>Pagar el precio total del pedido, incluyendo impuestos aplicables</li>
                <li>Recoger su pedido dentro del plazo especificado</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>4.2 Precios:</strong> Todos los precios están expresados en la moneda local y pueden 
                estar sujetos a cambios sin previo aviso. Hey Point! se reserva el derecho de corregir errores 
                de precio antes de confirmar su pedido.
              </p>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>4.3 Métodos de Pago:</strong> Aceptamos pagos mediante tarjetas de crédito, débito y 
                otros métodos electrónicos seguros. Todos los pagos son procesados a través de plataformas 
                certificadas y encriptadas.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                <strong>4.4 Confirmación:</strong> Recibirá una confirmación por correo electrónico una vez que 
                su pedido sea procesado exitosamente. Esta confirmación incluirá los detalles del pedido y el 
                código de acceso al casillero.
              </p>

              {/* Section 5 */}
              <h2 className="text-[#2E2E2E] mb-4">5. Recogida de Productos</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>5.1 Plazo de Recogida:</strong> Los productos deben ser recogidos dentro de las 48 horas 
                posteriores a la confirmación del pedido. Después de este período, Hey Point! se reserva el derecho 
                de cancelar el pedido y procesar un reembolso.
              </p>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>5.2 Código de Acceso:</strong> Para acceder a su pedido, debe utilizar el código único 
                proporcionado en su confirmación. No comparte este código con terceros.
              </p>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>5.3 Inspección:</strong> Le recomendamos inspeccionar sus productos inmediatamente después 
                de recogerlos. Si encuentra algún problema, contáctenos dentro de las 24 horas.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                <strong>5.4 Productos Perecederos:</strong> Los productos alimenticios o perecederos deben ser 
                recogidos lo antes posible. Hey Point! no se hace responsable por el deterioro de productos no 
                recogidos a tiempo.
              </p>

              {/* Section 6 */}
              <h2 className="text-[#2E2E2E] mb-4">6. Devoluciones y Reembolsos</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>6.1 Política de Devolución:</strong> Aceptamos devoluciones de productos en las siguientes 
                condiciones:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>El producto está defectuoso o dañado</li>
                <li>Recibió un producto incorrecto</li>
                <li>El producto no coincide con la descripción</li>
                <li>La solicitud se realiza dentro de las 24 horas posteriores a la recogida</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>6.2 Productos No Retornables:</strong> No se aceptan devoluciones de productos perecederos, 
                artículos de higiene personal o productos que hayan sido abiertos o utilizados.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                <strong>6.3 Reembolsos:</strong> Los reembolsos aprobados serán procesados al método de pago 
                original dentro de 5-10 días hábiles.
              </p>

              {/* Section 7 */}
              <h2 className="text-[#2E2E2E] mb-4">7. Uso Apropiado del Servicio</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Usted se compromete a:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Utilizar el servicio únicamente para fines legales</li>
                <li>No intentar acceder a casilleros que no le corresponden</li>
                <li>No dañar, alterar o interferir con el funcionamiento de los casilleros</li>
                <li>No realizar actividades fraudulentas o engañosas</li>
                <li>Respetar las instalaciones y el equipo de Hey Point!</li>
                <li>No utilizar el servicio para actividades comerciales no autorizadas</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-8">
                El incumplimiento de estas normas puede resultar en la suspensión o terminación de su cuenta 
                y posibles acciones legales.
              </p>

              {/* Section 8 */}
              <h2 className="text-[#2E2E2E] mb-4">8. Propiedad Intelectual</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Todo el contenido disponible en Hey Point!, incluyendo pero no limitado a textos, gráficos, 
                logos, iconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, es 
                propiedad de Hey Point! o de sus proveedores de contenido y está protegido por leyes de 
                propiedad intelectual.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                No está permitido reproducir, distribuir, modificar, crear trabajos derivados, mostrar públicamente 
                o utilizar de cualquier manera el contenido sin el consentimiento previo por escrito de Hey Point!.
              </p>

              {/* Section 9 */}
              <h2 className="text-[#2E2E2E] mb-4">9. Limitación de Responsabilidad</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                Hey Point! no será responsable por:
              </p>
              <ul className="list-disc pl-6 mb-6 text-[#2E2E2E]/80 space-y-2">
                <li>Daños indirectos, incidentales, especiales o consecuentes</li>
                <li>Pérdida de beneficios, datos o uso</li>
                <li>Interrupciones del servicio por mantenimiento o causas fuera de nuestro control</li>
                <li>Fallas técnicas o problemas de conectividad</li>
                <li>Productos dejados en casilleros más allá del plazo de recogida</li>
              </ul>
              <p className="text-[#2E2E2E]/80 mb-8">
                En ningún caso la responsabilidad total de Hey Point! excederá el monto pagado por el producto 
                o servicio en cuestión.
              </p>

              {/* Section 10 */}
              <h2 className="text-[#2E2E2E] mb-4">10. Privacidad y Protección de Datos</h2>
              <p className="text-[#2E2E2E]/80 mb-8">
                El uso de su información personal está regido por nuestra Política de Privacidad, la cual forma 
                parte integral de estos Términos y Condiciones. Al utilizar nuestros servicios, usted acepta el 
                tratamiento de sus datos personales según lo descrito en nuestra Política de Privacidad.
              </p>

              {/* Section 11 */}
              <h2 className="text-[#2E2E2E] mb-4">11. Modificaciones del Servicio</h2>
              <p className="text-[#2E2E2E]/80 mb-8">
                Hey Point! se reserva el derecho de modificar o discontinuar, temporal o permanentemente, el 
                servicio (o cualquier parte del mismo) con o sin previo aviso. No seremos responsables ante 
                usted o terceros por cualquier modificación, suspensión o discontinuación del servicio.
              </p>

              {/* Section 12 */}
              <h2 className="text-[#2E2E2E] mb-4">12. Terminación de Cuenta</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>12.1 Por el Usuario:</strong> Puede cancelar su cuenta en cualquier momento contactando 
                nuestro servicio al cliente o a través de la configuración de su cuenta.
              </p>
              <p className="text-[#2E2E2E]/80 mb-8">
                <strong>12.2 Por Hey Point!:</strong> Nos reservamos el derecho de suspender o terminar su cuenta 
                si determina que ha violado estos términos, ha cometido fraude o ha utilizado el servicio de 
                manera inapropiada.
              </p>

              {/* Section 13 */}
              <h2 className="text-[#2E2E2E] mb-4">13. Ley Aplicable y Jurisdicción</h2>
              <p className="text-[#2E2E2E]/80 mb-8">
                Estos Términos y Condiciones se regirán e interpretarán de acuerdo con las leyes aplicables en 
                la jurisdicción donde opera Hey Point!. Cualquier disputa relacionada con estos términos estará 
                sujeta a la jurisdicción exclusiva de los tribunales competentes de dicha jurisdicción.
              </p>

              {/* Section 14 */}
              <h2 className="text-[#2E2E2E] mb-4">14. Contacto</h2>
              <p className="text-[#2E2E2E]/80 mb-4">
                Si tiene preguntas, comentarios o inquietudes sobre estos Términos y Condiciones, puede contactarnos:
              </p>
              <ul className="list-none mb-8 text-[#2E2E2E]/80 space-y-2">
                <li><strong>Email:</strong> legal@heypoint.com</li>
                <li><strong>Teléfono:</strong> +1 (555) 123-4567</li>
                <li><strong>Dirección:</strong> Hey Point! HQ, 123 Innovation Drive, Tech City</li>
              </ul>

              {/* Section 15 */}
              <h2 className="text-[#2E2E2E] mb-4">15. Disposiciones Generales</h2>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>15.1 Integridad del Acuerdo:</strong> Estos Términos y Condiciones, junto con nuestra 
                Política de Privacidad, constituyen el acuerdo completo entre usted y Hey Point!.
              </p>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>15.2 Divisibilidad:</strong> Si alguna disposición de estos términos se considera inválida 
                o inaplicable, las disposiciones restantes continuarán en pleno vigor y efecto.
              </p>
              <p className="text-[#2E2E2E]/80 mb-6">
                <strong>15.3 Renuncia:</strong> El hecho de que Hey Point! no haga cumplir alguna disposición de 
                estos términos no constituirá una renuncia a dicha disposición o a cualquier otra disposición.
              </p>
              <p className="text-[#2E2E2E]/80">
                Al utilizar los servicios de Hey Point!, usted reconoce que ha leído, entendido y aceptado estar 
                sujeto a estos Términos y Condiciones de Uso.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
      
      <BackToTopButton />
      <Footer onNavigate={onNavigate} />
    </div>
  );
}