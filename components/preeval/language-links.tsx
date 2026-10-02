"use client";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
export default function LanguageLinks({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);
  return (
    <>
      {(["en", "zh", "es"] as const).map((language) => (
        <Link
          key={language}
          locale={language}
          lang={language}
          href={pathname + search}
          aria-current={language === locale ? "page" : undefined}
        >
          {language === "zh" ? "中文" : language.toUpperCase()}
        </Link>
      ))}
    </>
  );
}
