import { useEffect } from "react";

const SITE_URL = "https://heypoint.com.ar";
const SITE_NAME = "Hey!Point";
const DEFAULT_IMAGE = `${SITE_URL}/images/bg-banner-hey-point-II.png`;
const LOGO_URL = `${SITE_URL}/images/hp-fav-icon-web.png`;

type RobotsValue = "index,follow" | "noindex,nofollow";

export type SeoConfig = {
  title: string;
  description: string;
  path: string;
  robots?: RobotsValue;
  canonical?: string;
  ogType?: "website" | "article";
  image?: string | null;
};

const publicPages: Record<string, Omit<SeoConfig, "path"> & { path: string }> = {
  home: {
    title: "Hey!Point | Comprá online y retirá sin intermediarios",
    description:
      "Hey!Point permite comprar productos online y retirarlos en un stand físico con token digital, de forma rápida, segura y sin intermediarios.",
    path: "/",
  },
  shop: {
    title: "Tienda Hey!Point | Productos para retirar en tu comunidad",
    description:
      "Explorá la tienda Hey!Point, elegí productos de consumo cotidiano, pagá online y retiralos en el punto físico de tu comunidad.",
    path: "/tienda",
  },
  business: {
    title: "Modelo Hey!Point | Mini-tiendas inteligentes para comunidades",
    description:
      "Conocé el modelo Hey!Point para complejos residenciales, edificios, oficinas, gimnasios y espacios que buscan conveniencia 24/7.",
    path: "/modelo",
  },
  contact: {
    title: "Contacto | Hey!Point",
    description:
      "Contactá a Hey!Point para consultas sobre la tienda, el modelo de mini-tiendas inteligentes o la implementación en tu comunidad.",
    path: "/contacto",
  },
  terms: {
    title: "Términos y Condiciones | Hey!Point",
    description:
      "Conocé los Términos y Condiciones de Hey!Point para el uso de la plataforma, las compras online y el retiro en puntos físicos.",
    path: "/terminos",
  },
  privacy: {
    title: "Política de Privacidad | Hey!Point",
    description:
      "Conocé cómo Hey!Point recopila, usa y protege la información personal necesaria para operar la plataforma y gestionar compras.",
    path: "/privacidad",
  },
  cookies: {
    title: "Política de Cookies | Hey!Point",
    description:
      "Conocé cómo Hey!Point usa cookies para mantener sesiones seguras, recordar preferencias y mejorar la experiencia de la plataforma.",
    path: "/cookies",
  },
};

const privatePages: Record<string, { title: string; description: string; path: string }> = {
  cart: {
    title: "Carrito | Hey!Point",
    description: "Carrito de compra de Hey!Point.",
    path: "/carrito",
  },
  checkout: {
    title: "Checkout | Hey!Point",
    description: "Proceso de pago de Hey!Point.",
    path: "/checkout",
  },
  paymentResult: {
    title: "Resultado de pago | Hey!Point",
    description: "Resultado del proceso de pago de Hey!Point.",
    path: "/checkout/resultado",
  },
  profile: {
    title: "Mi perfil | Hey!Point",
    description: "Perfil de usuario de Hey!Point.",
    path: "/account",
  },
  completeProfile: {
    title: "Datos para tu compra | Hey!Point",
    description: "Formulario de datos necesarios para comprar en Hey!Point.",
    path: "/complete-profile",
  },
  verifyEmail: {
    title: "Verificar email | Hey!Point",
    description: "Verificación de correo electrónico de Hey!Point.",
    path: "/verify-email",
  },
  orders: {
    title: "Mis pedidos | Hey!Point",
    description: "Pedidos de usuario de Hey!Point.",
    path: "/orders",
  },
  success: {
    title: "Compra confirmada | Hey!Point",
    description: "Confirmación de compra de Hey!Point.",
    path: "/success",
  },
  ourcompany: {
    title: "Nuestra empresa | Hey!Point",
    description: "Información institucional de Hey!Point.",
    path: "/",
  },
  notFound: {
    title: "Página no encontrada | Hey!Point",
    description: "La página solicitada no existe o ya no está disponible en Hey!Point.",
    path: "/",
  },
};

function absoluteUrl(path: string) {
  return path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

function cleanImageUrl(image?: string | null) {
  if (!image) return null;
  const value = image.trim();
  if (!value || value.startsWith("data:") || value.includes("placehold.co")) {
    return null;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return null;
}

function setMetaByName(name: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setMetaByProperty(property: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(href?: string) {
  const existing = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  );
  if (!href) {
    existing?.remove();
    return;
  }
  const tag = existing ?? document.createElement("link");
  tag.setAttribute("rel", "canonical");
  tag.setAttribute("href", href);
  if (!existing) document.head.appendChild(tag);
}

function setJsonLd(id: string, data: unknown) {
  let tag = document.getElementById(id) as HTMLScriptElement | null;
  if (!tag) {
    tag = document.createElement("script");
    tag.id = id;
    tag.type = "application/ld+json";
    document.head.appendChild(tag);
  }
  tag.textContent = JSON.stringify(data);
}

export function getSeoForPage(page: string): SeoConfig {
  if (publicPages[page]) {
    const config = publicPages[page];
    return {
      ...config,
      robots: "index,follow",
      canonical: absoluteUrl(config.path),
      ogType: "website",
      image: DEFAULT_IMAGE,
    };
  }

  const privateConfig = privatePages[page] ?? {
    title: "Hey!Point",
    description: "Página funcional de Hey!Point.",
    path: "/",
  };
  return {
    ...privateConfig,
    robots: "noindex,nofollow",
    canonical: undefined,
    ogType: "website",
    image: DEFAULT_IMAGE,
  };
}

export function getProductSeo(params: {
  id?: string;
  name?: string;
  description?: string;
  image?: string;
  notFound?: boolean;
}): SeoConfig {
  const id = params.id?.trim();
  const name = params.name?.trim();
  const path = id ? `/producto/${encodeURIComponent(id)}` : "/tienda";
  if (params.notFound) {
    return {
      title: "Producto no disponible | Hey!Point",
      description: "Este producto no se encuentra disponible en Hey!Point.",
      path,
      robots: "noindex,nofollow",
      canonical: undefined,
      ogType: "website",
      image: DEFAULT_IMAGE,
    };
  }

  const title = name
    ? `${name} | Hey!Point`
    : "Producto | Hey!Point";
  const description = params.description?.trim()
    ? params.description.trim()
    : name
    ? `Conocé ${name} en Hey!Point. Comprá online y retiralo en el punto físico de tu comunidad.`
    : "Conocé este producto en Hey!Point. Comprá online y retiralo en el punto físico de tu comunidad.";

  return {
    title,
    description,
    path,
    robots: "index,follow",
    canonical: absoluteUrl(path),
    ogType: "website",
    image: cleanImageUrl(params.image) ?? DEFAULT_IMAGE,
  };
}

export function applySeo(config: SeoConfig) {
  const robots = config.robots ?? "index,follow";
  const canonical = config.canonical ?? (robots === "index,follow" ? absoluteUrl(config.path) : undefined);
  const image = cleanImageUrl(config.image) ?? null;
  const url = canonical ?? absoluteUrl(config.path);

  document.title = config.title;
  setMetaByName("description", config.description);
  setMetaByName("robots", robots);
  setCanonical(canonical);

  setMetaByProperty("og:site_name", SITE_NAME);
  setMetaByProperty("og:locale", "es_AR");
  setMetaByProperty("og:type", config.ogType ?? "website");
  setMetaByProperty("og:title", config.title);
  setMetaByProperty("og:description", config.description);
  setMetaByProperty("og:url", url);

  setMetaByName("twitter:card", image ? "summary_large_image" : "summary");
  setMetaByName("twitter:title", config.title);
  setMetaByName("twitter:description", config.description);

  const ogImage = document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]');
  const twitterImage = document.head.querySelector<HTMLMetaElement>('meta[name="twitter:image"]');
  if (image) {
    setMetaByProperty("og:image", image);
    setMetaByName("twitter:image", image);
  } else {
    ogImage?.remove();
    twitterImage?.remove();
  }

  setJsonLd("heypoint-jsonld-organization", {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO_URL,
    sameAs: ["https://www.instagram.com/heypoint.ar/"],
  });

  setJsonLd("heypoint-jsonld-website", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  });
}

export function usePageSeo(config: SeoConfig | null) {
  useEffect(() => {
    if (!config) return;
    applySeo(config);
  }, [
    config?.title,
    config?.description,
    config?.path,
    config?.robots,
    config?.canonical,
    config?.ogType,
    config?.image,
  ]);
}
