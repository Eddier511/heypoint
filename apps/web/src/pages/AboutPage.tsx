import { Leaf, Heart, Users, Award } from "lucide-react";
import { Card } from "../components/ui/card";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface AboutPageProps {
  onNavigate?: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const values = [
    {
      icon: <Leaf className="w-10 h-10" />,
      title: "Sustainability",
      description: "We partner with local farms that practice sustainable agriculture, reducing our environmental impact while supporting our community."
    },
    {
      icon: <Heart className="w-10 h-10" />,
      title: "Quality First",
      description: "Every product is carefully selected and inspected to ensure you receive only the freshest, highest-quality groceries."
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Community Focus",
      description: "We believe in supporting local farmers and producers, creating a stronger, more connected community."
    },
    {
      icon: <Award className="w-10 h-10" />,
      title: "Excellence",
      description: "Our commitment to excellence drives everything we do, from sourcing to delivery, ensuring your satisfaction."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Happy Customers" },
    { number: "50+", label: "Local Partners" },
    { number: "5 Years", label: "in Business" },
    { number: "99.9%", label: "Satisfaction Rate" }
  ];

  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader onNavigate={onNavigate} currentPage="about" isTransparent={false} />
      
      {/* Add padding-top to account for fixed header */}
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-white to-[#FFF4E6] py-16">
          <div className="container mx-auto px-6 text-center max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-[#1C2335] mb-6" style={{ fontSize: '3rem', fontWeight: 700 }}>
                Sobre HeyPoint!
              </h1>
              <p className="text-[#2E2E2E] max-w-3xl mx-auto" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                Nos apasiona traerte productos frescos y de calidad directo a tu edificio. Nuestra misión es hacer que la comida saludable y sostenible sea accesible para todos.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-[#1C2335] mb-6" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                  Our Story
                </h2>
                <div className="space-y-4 text-[#2E2E2E]" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                  <p>
                    Founded in 2019, The Grocers Market began as a simple idea: to connect our community with the freshest, most sustainable produce available. What started as a small farmers market booth has grown into a full-service grocery delivery platform.
                  </p>
                  <p>
                    We believe that everyone deserves access to fresh, healthy food. That's why we work directly with over 50 local farms and producers to bring you the best selection of organic fruits, vegetables, dairy products, and artisanal goods.
                  </p>
                  <p>
                    Our commitment goes beyond just delivering groceries – we're building a more sustainable food system that benefits both our customers and our planet.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1747503331142-27f458a1498c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXJzJTIwbWFya2V0JTIwZnJlc2glMjBwcm9kdWNlfGVufDF8fHx8MTc2MjMzOTA1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Fresh produce at farmers market"
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
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
                Our Values
              </h2>
              <p className="text-[#2E2E2E]" style={{ fontSize: '1.125rem' }}>
                The principles that guide everything we do
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 text-center border-none shadow-md rounded-2xl bg-white hover:shadow-xl transition-all h-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B6E322]/20 text-[#B6E322] rounded-xl mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-[#1C2335] mb-3" style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                      {value.title}
                    </h3>
                    <p className="text-[#2E2E2E]" style={{ fontSize: '0.875rem', lineHeight: '1.6' }}>
                      {value.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* By the Numbers Section */}
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
                By the Numbers
              </h2>
              <p className="text-[#2E2E2E]" style={{ fontSize: '1.125rem' }}>
                Our impact in the community
              </p>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-[#B6E322] mb-2" style={{ fontSize: '3rem', fontWeight: 700 }}>
                    {stat.number}
                  </div>
                  <div className="text-[#2E2E2E]" style={{ fontSize: '1rem' }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Mission Section */}
        <section className="py-20 bg-[#B6E322]">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-white mb-6" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                Nuestra Misión
              </h2>
              <p className="text-white" style={{ fontSize: '1.25rem', lineHeight: '1.7' }}>
                Hacer que productos frescos, sostenibles y saludables sean accesibles para todos. No solo entregamos compras – estamos cultivando un futuro mejor para nuestro planeta y nuestra gente.
              </p>
            </motion.div>
          </div>
        </section>

        <Footer onNavigate={onNavigate} />
      </div>
    </div>
  );
}