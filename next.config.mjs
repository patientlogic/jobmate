/** @type {import('next').NextConfig} */
const appName = process.env.APP_NAME ?? "JobMate";

const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_NAME: appName,
  },
  async redirects() {
    return [
      {
        source: "/dashboard/myjobs",
        destination: "/dashboard/jobs",
        permanent: true,
      },
      {
        source: "/dashboard/myjobs/:id",
        destination: "/dashboard/jobs/:id",
        permanent: true,
      },
    ];
  },
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
