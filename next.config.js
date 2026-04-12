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
  experimental: {
    // Native binary packages must be excluded from webpack bundling.
    // sharp and @napi-rs/canvas both link against .node binaries that
    // webpack will otherwise try (and fail) to parse as JS.
    serverComponentsExternalPackages: ['sharp', '@napi-rs/canvas'],

    // outputFileTracingIncludes ships additional files to each route's
    // Vercel serverless function. Both cover-generate (Step 4d) and
    // spine-generate (Step 5b) use @napi-rs/canvas to render PNG with
    // Noto Serif/Sans KR. The font files live outside node_modules so
    // Next.js's automatic tracer misses them — we must declare them
    // explicitly per route.
    //
    // Caution: JS object literals silently keep only the last value for
    // duplicate keys. Never use the same route path twice here — each
    // route needs its own entry. (Learned from a prior diff that had
    // two '/api/cover-generate' entries.)
    outputFileTracingIncludes: {
      '/api/cover-generate': ['./assets/fonts/**/*'],
      '/api/spine-generate': ['./assets/fonts/**/*'],
    },
  },
};

module.exports = nextConfig;