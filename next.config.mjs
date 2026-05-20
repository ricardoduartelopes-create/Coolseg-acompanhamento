/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '5mb' } },

  // Redirects de URLs antigos (pré-reestruturação) para os novos.
  // Mantém bookmarks externos a funcionar.
  async redirects() {
    return [
      // Público — antigas rotas planas → /ciclo/*
      { source: '/v1',        destination: '/ciclo/v1',        permanent: true },
      { source: '/v2',        destination: '/ciclo/v2',        permanent: true },
      { source: '/v3',        destination: '/ciclo/v3',        permanent: true },
      { source: '/lojas',     destination: '/ciclo/lojas',     permanent: true },
      { source: '/lojas/:id', destination: '/ciclo/lojas/:id', permanent: true },

      // Admin — antigas rotas planas → /admin/ciclo/*
      { source: '/admin/import',        destination: '/admin/ciclo/import',        permanent: true },
      { source: '/admin/import-div',    destination: '/admin/ciclo/import-div',    permanent: true },
      { source: '/admin/sync-crafteer', destination: '/admin/ciclo/sync-crafteer', permanent: true },
      { source: '/admin/apolices',      destination: '/admin/ciclo/apolices',      permanent: true },
      { source: '/admin/lista',         destination: '/admin/ciclo/lista',         permanent: true },
      { source: '/admin/objetivos',     destination: '/admin/ciclo/objetivos',     permanent: true },
      { source: '/admin/ramos',         destination: '/admin/ciclo/ramos',         permanent: true },
    ];
  },
};
export default nextConfig;
