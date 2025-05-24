import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["rrgizyghrnkfamkveezf.supabase.co"],
    unoptimized: process.env.NEXT_PUBLIC_IMAGE_OPTIMIZATION === "false",
  },
  // Pindahkan transpilePackages ke luar experimental sesuai dengan Next.js 15.3.2
  transpilePackages: ["canvas", "jsdom"],
  webpack(config) {
    // Allow importing of shader files (.glsl, .vs, .fs)
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;
  },
  // Remove the /login to /auth/login redirect to avoid the loop
  async redirects() {
    return [
      {
        source: "/register",
        destination: "/auth/register",
        permanent: true,
      },
      {
        source: "/forgot-password",
        destination: "/auth/forgot-password",
        permanent: true,
      },
    ];
  },
};

// Make sure adding Sentry options is the last code to run before exporting
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(withBundleAnalyzer(nextConfig), {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options
      silent: true,
    })
  : withBundleAnalyzer(nextConfig);
