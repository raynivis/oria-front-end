import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Desligado: quase toda página do Oria lê a sessão (cookie httpOnly) e é
  // protegida por `proxy.ts` — adotar Cache Components exigiria Suspense +
  // `use cache: private` em praticamente toda rota, sem ganho real para um
  // projeto cujo objetivo é a correção pedagógica da interface, não o tempo
  // de navegação. Renderização dinâmica clássica, como os docs já assumem.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
