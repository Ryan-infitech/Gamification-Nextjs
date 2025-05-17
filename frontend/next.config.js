/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Disable strict mode as it can cause issues with Phaser
  images: {
    domains: [
      "localhost",
      "your-supabase-project.supabase.co", // Replace with your actual Supabase URL domain
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle Phaser dependencies
    config.module.rules.push({
      test: /\.(png|jpg|gif|mp3|wav|ogg)$/i,
      type: "asset/resource",
    });

    // Optimize Phaser for serverless environment
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups.phaser = {
        test: /[\\/]node_modules[\\/](phaser)[\\/]/,
        name: "phaser",
        chunks: "all",
      };
    }

    return config;
  },
  // Add custom headers for security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
