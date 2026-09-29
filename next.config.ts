import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/e-fee.php", destination: "/pricing", permanent: true },
      { source: "/e-evaluation.php", destination: "/evaluation", permanent: true },
      { source: "/e-evaluation-zh.php", destination: "/zh/evaluation", permanent: true },
      { source: "/e-evaluation-es.php", destination: "/es/evaluation", permanent: true },
    ];
  },
  turbopack: { root: process.cwd() },
};
export default withNextIntl(nextConfig);
