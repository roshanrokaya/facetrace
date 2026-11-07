/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
    ],
  },
  swcMinify: true,
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: false,
        ignored: ['**/node_modules/**', '**/.next/**'],
      };
    }
    return config;
  },
}

module.exports = nextConfig
