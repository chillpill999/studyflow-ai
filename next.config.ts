import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['pdf-parse'],
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Link",
            value: '<https://www.thestudyflow.in/.well-known/api-catalog>; rel="api-catalog", <https://www.thestudyflow.in/docs/api>; rel="service-doc"',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
