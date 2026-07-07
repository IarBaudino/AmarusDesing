/** @type {import('next').NextConfig} */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    domains: ["res.cloudinary.com"],
    qualities: [75, 80, 85, 90, 95],
    /** Cachea imágenes optimizadas en el CDN de Vercel (menos egress en Supabase). */
    minimumCacheTTL: 2678400,
  },
  async redirects() {
    return [
      { source: "/joyeria-artesanal", destination: "/categorias/joyeria-artesanal", permanent: true },
      { source: "/macrame", destination: "/categorias/macrame", permanent: true },
      { source: "/minerales-del-mundo", destination: "/categorias/minerales-del-mundo", permanent: true },
      { source: "/tesoros-del-mundo", destination: "/categorias/tesoros-del-mundo", permanent: true },
      { source: "/ropa-artesanal", destination: "/categorias/ropa-artesanal", permanent: true },
      { source: "/coleccion-etiopia", destination: "/categorias/coleccion-etiopia", permanent: true },
    ];
  },
};

const hasSentryUpload =
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT;

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  sourcemaps: {
    disable: !hasSentryUpload,
  },
});
