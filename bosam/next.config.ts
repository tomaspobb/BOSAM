/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '25mb' }, // ajusta si necesitas más
  },
  api: { bodyParser: { sizeLimit: '25mb' } },
};
module.exports = nextConfig;
