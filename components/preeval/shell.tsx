import type { ReactNode } from "react";
import { Navigation } from "@/components/navigation";
import { SiteFooter } from "@/components/site-footer";
import s from "./preeval.module.css";
export default function PreEvaluationShell({
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
  return (
    <div className={s.page}>
      {staff ? (
        <header className={s.header}>
          <a href="/admin/CRM">
            <img className={s.logo} src="/brand/aet-logo-header.svg" width="250" height="58"
              alt="American Education and Translation Services,CORP (AET)" />
          </a>
          <nav className={s.links} aria-label="Workspace navigation">
            <a className={s.statusLink} href="/">Back to website</a>
          </nav>
        </header>
      ) : <Navigation />}
      <main
        id="main-content"
        className={
          s.main +
          (narrow ? " " + s.narrow : "") +
          (workspace ? " " + s.workspace : "")
        }
      >
        {children}
      </main>
      {staff ? <footer className={s.footer}>
        <span>American Education and Translation Services, CORP (AET)</span>
        <span>
          <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a>
        </span>
      </footer> : <SiteFooter />}
    </div>
  );
}
