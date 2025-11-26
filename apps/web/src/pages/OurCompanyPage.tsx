import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UnifiedHeader } from "../components/UnifiedHeader";
import { Footer } from "../components/Footer";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Target, Eye, Zap, Users, Shield, Award, Mail } from "lucide-react";

interface OurCompanyPageProps {
  onNavigate?: (page: string) => void;
}

const missionPoints = [
  {
    icon: <Target className="w-8 h-8" />,
    title: "Our Mission",
    description: "To provide seamless access to quality products 24/7 through innovative technology, making everyday shopping effortless and convenient for everyone."
  },
  {
    icon: <Eye className="w-8 h-8" />,
    title: "Our Vision",
    description: "To become the leading smart retail solution globally, transforming how people shop and creating a future where convenience meets quality."
  }
];

const companyValues = [
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Innovation",
    description: "Constantly pushing boundaries with cutting-edge technology"
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Customer First",
    description: "Every decision is made with our customers in mind"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Trust & Security",
    description: "Protecting your data and ensuring safe transactions"
  },
  {
    icon: <Award className="w-8 h-8" />,
    title: "Excellence",
    description: "Delivering the highest quality in every interaction"
  }
];

const stats = [
  { number: "50+", label: "Active Locations" },
  { number: "200K+", label: "Happy Customers" },
  { number: "24/7", label: "Always Available" },
  { number: "98%", label: "Satisfaction Rate" }
];

export function OurCompanyPage({ onNavigate }: OurCompanyPageProps) {
  return (
    <div className="min-h-screen bg-[#FFF4E6]">
      <UnifiedHeader onNavigate={onNavigate} currentPage="ourcompany" isTransparent={false} />
      
      {/* Add padding-top to account for fixed header */}
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-[#1C2335] to-[#2E2E2E] overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-[#FF6B00] rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#B6E322] rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-6 text-center max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block mb-6 px-6 py-2 bg-[#FF6B00] rounded-full">
                <span className="text-white" style={{ fontSize: '0.875rem', fontWeight: 600 }}>About HeyPoint!</span>
              </div>
              <h1 className="text-white mb-6" style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: '1.1' }}>
                Revolutionizing Retail Through Technology
              </h1>
              <p className="text-gray-300 max-w-3xl mx-auto mb-8" style={{ fontSize: '1.25rem', lineHeight: '1.7' }}>
                HeyPoint! is pioneering the future of convenience retail with our innovative smart mini-store system that combines technology, accessibility, and quality.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Company Story Section */}
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
                  Who We Are
                </h2>
                <div className="space-y-4 text-[#2E2E2E]" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                  <p>
                    HeyPoint! was founded with a simple yet ambitious goal: to transform the way people access everyday essentials. We recognized that traditional retail was no longer meeting the needs of modern, busy lifestyles.
                  </p>
                  <p>
                    Our smart mini-store system leverages IoT technology, secure payment systems, and intelligent inventory management to create unmanned retail spaces that are always open, always stocked, and always convenient.
                  </p>
                  <p>
                    Today, we operate in over 50 locations, serving hundreds of thousands of customers who appreciate the freedom to shop on their own terms. Our technology-first approach ensures a seamless experience from product selection to pickup.
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
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1758721321642-485c02d07009?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXRvbWF0ZWQlMjByZXRhaWwlMjBraW9za3xlbnwxfHx8fDE3NjIzMTI5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="HeyPoint! technology"
                    className="w-full h-[450px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1C2335]/60 to-transparent"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-20 bg-[#FFF4E6]">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-[#1C2335] mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                Mission & Vision
              </h2>
              <p className="text-[#2E2E2E] max-w-2xl mx-auto" style={{ fontSize: '1.125rem' }}>
                What drives us and where we're heading
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {missionPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <Card className="p-8 border-none shadow-xl rounded-3xl bg-white hover:shadow-2xl transition-all h-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl mb-6">
                      {point.icon}
                    </div>
                    <h3 className="text-[#1C2335] mb-4" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                      {point.title}
                    </h3>
                    <p className="text-[#2E2E2E]" style={{ fontSize: '1rem', lineHeight: '1.7' }}>
                      {point.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Company Values Section */}
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
                Our Core Values
              </h2>
              <p className="text-[#2E2E2E] max-w-2xl mx-auto" style={{ fontSize: '1.125rem' }}>
                The principles that guide every decision we make
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {companyValues.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="p-6 text-center border-none shadow-md rounded-2xl bg-gradient-to-br from-[#FFF4E6] to-white hover:shadow-xl transition-all h-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B6E322]/20 text-[#5C3A1E] rounded-xl mb-4">
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

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-br from-[#FF6B00] to-[#e56000]">
          <div className="container mx-auto px-6 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-white mb-4" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                Our Impact
              </h2>
              <p className="text-[#FFF4E6]" style={{ fontSize: '1.125rem' }}>
                Numbers that speak for themselves
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
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all">
                    <div className="text-white mb-2" style={{ fontSize: '3.5rem', fontWeight: 700 }}>
                      {stat.number}
                    </div>
                    <div className="text-[#FFF4E6]" style={{ fontSize: '1.125rem' }}>
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-[#1C2335] mb-6" style={{ fontSize: '3rem', fontWeight: 700 }}>
                Partner With Us
              </h2>
              <p className="text-[#2E2E2E] mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
                Interested in bringing HeyPoint! to your location? We're always looking for new partnerships to expand our network and serve more communities.
              </p>
              <Button 
                onClick={() => onNavigate?.("contact")}
                className="bg-[#FF6B00] hover:bg-[#e56000] text-white px-10 py-6 rounded-full shadow-lg transition-all transform hover:scale-105"
                style={{ fontSize: '1.125rem', fontWeight: 600 }}
              >
                <Mail className="w-5 h-5 mr-2" />
                Get in Touch
              </Button>
            </motion.div>
          </div>
        </section>

        <Footer onNavigate={onNavigate} />
      </div>
    </div>
  );
}