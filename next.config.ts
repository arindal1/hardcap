import type { NextConfig } from "next";

// Content-Security-Policy is intentionally NOT set here - it needs a
// per-request nonce for script-src/style-src, which requires a value
// generated per-request. That's handled in src/middleware.ts instead;
// setting a second, static CSP header here would make browsers enforce the
// intersection of both and break the nonce'd one.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;