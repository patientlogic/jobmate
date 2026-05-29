/** @type {import('next').NextConfig} */
const appName = process.env.APP_NAME ?? "JobMate";

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_NAME: appName,
  },
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
