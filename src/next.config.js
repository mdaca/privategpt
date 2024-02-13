/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverActions: true,
    serverActionsBodySizeLimit: "22mb",
    headers: () => [
      {
        source: '/vectorstore*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ],
  },
};
module.exports = nextConfig;
