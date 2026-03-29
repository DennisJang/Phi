/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'trbeccbsjnxdkzxlecvv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'image.aladin.co.kr',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
