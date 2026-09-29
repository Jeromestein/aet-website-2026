import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/e-contact.php", destination: "/contact", permanent: true },
      { source: "/e-contact-zh.php", destination: "/zh/contact", permanent: true },
      { source: "/e-contact-es.php", destination: "/es/contact", permanent: true },
      { source: "/e-notarized.php", destination: "/certified-translation", permanent: true },
      { source: "/e-notarized-zh.php", destination: "/zh/certified-translation", permanent: true },
      { source: "/e-notarized-es.php", destination: "/es/certified-translation", permanent: true },
      { source: "/e-fee.php", destination: "/pricing", permanent: true },
      { source: "/e-evaluation.php", destination: "/evaluation", permanent: true },
      { source: "/e-evaluation-zh.php", destination: "/zh/evaluation", permanent: true },
      { source: "/e-evaluation-es.php", destination: "/es/evaluation", permanent: true },
      ...[
        ["e-tech-translation", "technical-translation"],
        ["e-interpretation", "interpretation"],
        ["e-expert-opinion-letter", "expert-opinion-letters"],
        ["e-translation", "general-translation"],
        ["e-nus", "notarization"],
      ].flatMap(([source, destination]) => [
        { source: `/${source}.php`, destination: `/${destination}`, permanent: true },
        { source: `/${source}-zh.php`, destination: `/zh/${destination}`, permanent: true },
        ...(source === 'e-expert-opinion-letter' ? [{ source: `/${source}-es.php`, destination: `/es/${destination}`, permanent: true }] : []),
      ]),
    ];
  },
  turbopack: { root: process.cwd() },
};
export default withNextIntl(nextConfig);
