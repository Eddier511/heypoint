import { Instagram } from "lucide-react";

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
      // Only scroll to top after navigation is triggered
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const footerLinks = [
    { id: "business", label: "El Modelo HeyPoint" },
    { id: "contact", label: "Contacto" },
    { id: "terms", label: "Términos y Condiciones" },
    { id: "privacy", label: "Política de Privacidad" },
  ];

  const socialLinks = [
    {
      name: "Instagram",
      icon: <Instagram className="w-5 h-5" />,
      url: "https://instagram.com/heypoint",
    },
    {
      name: "TikTok",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      ),
      url: "https://tiktok.com/@heypoint",
    },
  ];

  return (
    <footer className="bg-[#161B23] text-white mt-auto">
      <div className="container mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8">
          {/* Logo and Tagline */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {/* Logo - TEMPORAL: Reemplazar con logo real de HeyPoint! */}
              <img
                src={
                  "https://firebasestorage.googleapis.com/v0/b/heymarket-35d03.firebasestorage.app/o/images%2FHeypoint-header-logo-100x60-white.svg?alt=media&token=9402edf6-17bc-463a-b233-2999af7158c5"
                }
                alt="HeyPoint! Logo"
                className="w-[80px] sm:w-[100px] h-auto transition-all duration-300"
              />
            </div>
            <p className="text-gray-400" style={{ fontSize: "0.938rem" }}>
              Smart shopping, redefined.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-3 md:col-span-1">
            <h3
              className="text-white mb-2"
              style={{ fontSize: "1rem", fontWeight: 600 }}
            >
              Enlaces rápidos
            </h3>
            {footerLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavigation(link.id)}
                className="text-gray-400 hover:text-[#FF6B00] transition-colors text-left w-fit"
                style={{ fontSize: "0.938rem" }}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Social Media */}
          <div className="flex flex-col gap-4">
            <h3
              className="text-white mb-2"
              style={{ fontSize: "1rem", fontWeight: 600 }}
            >
              Seguinos
            </h3>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-[#FF6B00] rounded-full flex items-center justify-center transition-all hover:scale-110"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          {/* Copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p
              className="text-gray-400 text-center md:text-left"
              style={{ fontSize: "0.875rem" }}
            >
              © 2025 HeyPoint! Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => handleNavigation("terms")}
                className="text-gray-400 hover:text-[#FF6B00] transition-colors"
                style={{ fontSize: "0.875rem" }}
              >
                Términos
              </button>
              <button
                onClick={() => handleNavigation("privacy")}
                className="text-gray-400 hover:text-[#FF6B00] transition-colors"
                style={{ fontSize: "0.875rem" }}
              >
                Privacidad
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
