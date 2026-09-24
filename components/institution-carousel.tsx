"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import styles from "./institution-carousel.module.css";

const institutions = [
  {
    "src": "/images/institutions/SNU.png",
    "name": "Southern New Hampshire University"
  },
  {
    "src": "/images/institutions/OHSBE.png",
    "name": "Ohio State Board of Education"
  },
  {
    "src": "/images/institutions/NIH-logo.jpg.webp",
    "name": "National Institutes of Health"
  },
  {
    "src": "/images/institutions/uoalegal.jpeg",
    "name": "UOA Legal Immigration Attorneys"
  },
  {
    "src": "/images/institutions/California-state-board-of-PHARMACY.png",
    "name": "California State Board of Pharmacy"
  },
  {
    "src": "/images/institutions/Angelo-State-University.png",
    "name": "Angelo State University"
  },
  {
    "src": "/images/institutions/GCU.png",
    "name": "Grand Canyon University"
  },
  {
    "src": "/images/institutions/FLORIDA-LEGAL-GROUP.png",
    "name": "Florida Legal Group"
  },
  {
    "src": "/images/institutions/NYC-FIRE-DEPARTMENT.png",
    "name": "NYC Fire Department"
  },
  {
    "src": "/images/institutions/ISBE.png",
    "name": "Illinois State Board of Education"
  },
  {
    "src": "/images/institutions/USC.png",
    "name": "Universidad del Sagrado Corazón (USC)"
  },
  {
    "src": "/images/institutions/NMPED.png",
    "name": "New Mexico Public Education Department"
  },
  {
    "src": "/images/institutions/ALEX-LAW.png",
    "name": "Alex Yoonki Park Law"
  },
  {
    "src": "/images/institutions/COLLIER-SHERIFF.png",
    "name": "Collier County Sheriff's Office"
  },
  {
    "src": "/images/institutions/Universal_Technical_Institute_Logo.jpg",
    "name": "Universal Technical Institute"
  },
  {
    "src": "/images/institutions/SCC-WCUI.png",
    "name": "Smith Chason College - WCUI"
  }
];
const rows = [institutions.slice(0, 8), institutions.slice(8)];

export function InstitutionCarousel() {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  return (
    <section id="institutions" className={styles.section} aria-labelledby="institutions-title" data-ready={ready}>
      <div className={`wrap ${styles.heading}`}>
        <span className="eyebrow">RECOGNITION THAT GOES FURTHER</span>
        <h2 id="institutions-title">Trusted by leading institutions.</h2>
        <p>Our credential evaluation services are recognized and accepted by educational institutions, government agencies, and professional organizations across the United States.</p>
      </div>
      <div className={styles.carousel} role="group" aria-label="Institution logos, two rows" aria-roledescription="carousel">
        {rows.map((row, rowIndex) => (
          <div className={styles.row} key={rowIndex} tabIndex={0} role="group" aria-label={`Institution logos, row ${rowIndex + 1}`}>
            <div className={styles.track}>
              {[false, true].map((duplicate) => (
                <ul className={`${styles.group} ${duplicate ? styles.duplicate : ""}`} key={String(duplicate)} aria-hidden={duplicate || undefined}>
                  {row.map((institution) => (
                    <li className={styles.card} key={institution.src} title={institution.name}>
                      <div className={styles.logo}>
                        <Image src={institution.src} alt={duplicate ? "" : institution.name} fill sizes="(max-width: 600px) 148px, 200px" />
                      </div>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className={`wrap ${styles.footer}`}>
        <p>
          Our evaluations are widely accepted by universities, employers, and government agencies nationwide.{" "}
          <a className="text-link" href="https://www.americantranslationservice.com/e-credential-evaluation-partners.php">Explore all institutions <ArrowUpRight size={16} aria-hidden="true" /></a>
        </p>
      </div>
    </section>
  );
}
