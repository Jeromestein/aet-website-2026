import type { ReactNode } from "react";
import LanguageLinks from "./language-links";
import { pathFor } from "@/lib/preeval/domain";
import { copy } from "@/lib/preeval/copy";
import s from "./preeval.module.css";
export default function PreEvaluationShell({
  locale,
  children,
  narrow = false,
  workspace = false,
  staff = false,
}: {
  locale: string;
  children: ReactNode;
  narrow?: boolean;
  workspace?: boolean;
  staff?: boolean;
}) {
  const t = copy(staff ? "en" : locale);
  return (
    <div className={s.page}>
      <header className={s.header}>
        <a href={staff ? "/admin/CRM" : pathFor(locale, "/")}>
          <img
            className={s.logo}
            src="/brand/aet-logo-header.svg"
            width="250"
            height="58"
            alt="American Education and Translation Services,CORP (AET)"
          />
        </a>
        <nav className={s.links} aria-label={staff ? "Workspace navigation" : "Pre-evaluation navigation"}>
          {staff ? (
            <a className={s.statusLink} href="/">Back to website</a>
          ) : (
            <>
              <a className={s.statusLink} href={pathFor(locale, "/status-check")}>
                {t.check}
              </a>
              <LanguageLinks locale={locale} />
            </>
          )}
        </nav>
      </header>
      <main
        className={
          s.main +
          (narrow ? " " + s.narrow : "") +
          (workspace ? " " + s.workspace : "")
        }
      >
        {children}
      </main>
      <footer className={s.footer}>
        <span>American Education and Translation Services, CORP (AET)</span>
        <span>
          <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
        </span>
      </footer>
    </div>
  );
}
