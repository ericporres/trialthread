/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Canonical host: www.trialthread.org (.org = the free, patient-first promise).
  // The .com family 308s here at the app layer — deterministic and versioned,
  // independent of dashboard domain-config state.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.trialthread.com" }],
        destination: "https://www.trialthread.org/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "trialthread.com" }],
        destination: "https://www.trialthread.org/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
