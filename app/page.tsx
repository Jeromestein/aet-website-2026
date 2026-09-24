import Image from "next/image";
import { InstitutionCarousel } from "@/components/institution-carousel";
import { ImpactStory, ProcessStory } from "@/components/scroll-stories";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  GraduationCap,
  Languages,
  Globe2,
  FileCheck2,
  MessageCircle,
  Plus,
  SquarePen,
  Phone,
} from "lucide-react";
import { Navigation, RevealObserver } from "@/components/navigation";
const old = "https://www.americantranslationservice.com";
const apply =
  "https://app.americantranslationservice.com/credential-evaluation-application";
const pre =
  "https://app.americantranslationservice.com/degree-equivalency-tool";
const services = [
  {
    icon: Languages,
    number: "02",
    title: "Certified translation",
    text: "Your words, understood. Certified and notarized translations for immigration, education, and everyday life.",
    href: "/e-notarized.php",
    tag: "100+ language pairs",
  },
  {
    icon: MessageCircle,
    number: "03",
    title: "Interpretation",
    text: "Connect with confidence. Professional interpretation for the conversations that matter most.",
    href: "/e-interpretation.php",
    tag: "A more human connection",
  },
  {
    icon: FileCheck2,
    number: "04",
    title: "Specialized services",
    text: "Expert opinion letters, technical translation, visa services, and document authentication.",
    href: "/e-expert-opinion-letter.php",
    tag: "Support beyond translation",
  },
];
const faqs = [
  [
    "Which evaluation is right for me?",
    "A document-by-document evaluation provides a U.S. degree equivalency and is often used for employment or immigration. A course-by-course evaluation also includes credits, grades, and GPA, and is commonly requested for education or licensing. Always confirm the requirements with the organization receiving your report.",
  ],
  [
    "How long does a credential evaluation take?",
    "Our standard processing time is 7 business days, with expedited options available. Contact our team to confirm the timeline for your documents and service before applying.",
  ],
  [
    "Can I start my application online?",
    "Yes. Use Start your application to access our existing online application portal. You can also contact our team for guidance on the service and documents you need.",
  ],
  [
    "What languages do you work with?",
    "We offer over 100 language pairs, including English, Chinese, Spanish, French, German, Russian, Arabic, Italian, Portuguese, Japanese, and Korean. Contact us to confirm availability for your documents.",
  ],
];
export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navigation />
      <RevealObserver />
      <main id="main-content">
        <div className="hero-band">
        <section className="hero wrap">
          <div className="hero-copy">
            <h1>
              <span>Professional</span>{" "}
              <span>Translation &amp;</span>{" "}
              <span>Evaluation Services</span>
            </h1>
            <p className="hero-description">
              Professional translations and credential evaluations trusted by USCIS, colleges, and government agencies nationwide.
            </p>
            <div className="hero-buttons">
              <a className="button primary hero-apply" href={apply}>
                <SquarePen size={19} aria-hidden="true" /> Apply Now
              </a>
              <a className="button hero-contact" href={old + "/e-contact.php"}>
                <Phone size={18} aria-hidden="true" /> Contact Us
              </a>
            </div>
            <div className="hero-credentials">
              <Image src="/images/bbb.jpg" alt="BBB A+ Rating" width={1650} height={870} sizes="180px" />
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <Image
                src="/images/hero.webp"
                alt="Professional seated at a desk with a laptop"
                fill
                sizes="(max-width: 760px) 100vw, 48vw"
                priority
              />
              <div className="photo-caption">
                <span className="mini-label">
                  BEYOND BORDERS. TOWARD YOUR FUTURE.
                </span>
                <p>
                  A world of opportunity.
                  <br />A partner by your side.
                </p>
              </div>
            </div>
            <div className="floating-card">
              <div className="badge-icon">
                <GraduationCap size={27} />
              </div>
              <div>
                <span>YOUR AMBITION, TRANSLATED.</span>
                <strong>
                  Local expertise.
                  <br />
                  Global understanding.
                </strong>
              </div>
              <span className="badge-check">
                <Check size={14} />
              </span>
            </div>
            <div className="photo-index">
              <span>01 — A NEW BEGINNING</span>
              <span>USA ↗ WORLD</span>
            </div>
          </div>
        </section>
        </div>
        <InstitutionCarousel />
        <section className="trust-strip">
          <div className="wrap trust-inner">
            <p>
              EXPERIENCE YOU CAN
              <br />
              <strong>move forward with.</strong>
            </p>
            <div className="stat">
              <strong>
                15<span>+</span>
              </strong>
              <span>Years of experience</span>
            </div>
            <div className="stat">
              <strong>
                100<span>+</span>
              </strong>
              <span>Language pairs</span>
            </div>
            <div className="membership">
              <Image
                src="/images/ata.jpg"
                alt="American Translators Association"
                width={86}
                height={62}
              />
              <span>
                ATA member
                <br />
                <strong>Since 2009</strong>
              </span>
            </div>
            <div className="membership bbb">
              <Image
                src="/images/bbb.jpg"
                alt="BBB A+ rating"
                width={112}
                height={60}
              />
            </div>
          </div>
        </section>
        <ImpactStory />
        <section className="section wrap" id="services">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow">01 / WHAT WE DO</span>
              <h2>
                Big ambitions.
                <br />
                The right support.
              </h2>
            </div>
            <p>
              From a new degree to a new beginning,
              <br />
              we make your next step feel simpler.
            </p>
          </div>
          <div className="services-grid">
            <a
              href={old + "/e-evaluation.php"}
              className="featured-service"
              data-reveal
            >
              <div className="card-top">
                <GraduationCap size={31} />
                <span>01</span>
              </div>
              <div>
                <span className="small-label">OUR CORE EXPERTISE</span>
                <h3>
                  Foreign credential
                  <br />
                  evaluation
                </h3>
                <p>
                  Turn your international education into a clear U.S.
                  equivalency. For your career, your education, and what comes
                  next.
                </p>
              </div>
              <div className="service-tags">
                <span>Document by document</span>
                <span>Course by course</span>
              </div>
              <div className="card-bottom">
                <span>Explore evaluations</span>
                <span className="circle-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </div>
            </a>
            <div className="service-list">
              {services.map((s) => (
                <a
                  href={old + s.href}
                  className="service-row"
                  key={s.number}
                  data-reveal
                >
                  <span className="service-icon">
                    <s.icon size={24} />
                  </span>
                  <div>
                    <span className="small-label">{s.tag}</span>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                  <ArrowUpRight className="row-arrow" size={23} />
                </a>
              ))}
            </div>
          </div>
          <div className="service-footnote">
            <Globe2 size={17} />
            <span>Built around your goals. Wherever you’re starting from.</span>
            <a href={old + "/e-contact.php"}>
              Find your service <ArrowRight size={16} />
            </a>
          </div>
        </section>
        <ProcessStory />
        <section className="section wrap">
          <div className="preview-panel" data-reveal>
            <div className="preview-photo">
              <Image
                src="/images/graduates.jpg"
                alt="Graduates celebrating their academic achievement"
                fill
                sizes="(max-width: 760px) max(100vw, 516px), max(50vw, 854px)"
              />
              <span className="image-note">
                YOUR EDUCATION IS JUST THE BEGINNING.
              </span>
            </div>
            <div className="preview-copy">
              <span className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</span>
              <h2>
                Not sure where
                <br />
                your degree
                <br />
                <em>can take you?</em>
              </h2>
              <p>
                Start with a pre-evaluation. Explore how your international
                education may compare to a U.S. degree before taking the next
                step.
              </p>
              <a href={pre} className="button light">
                Explore your degree equivalency <ArrowUpRight size={18} />
              </a>
              <span className="preview-note">
                A preliminary assessment. A more informed beginning.
              </span>
            </div>
          </div>
        </section>
        <section className="section wrap reviews" id="stories">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow">
                03 / REAL PEOPLE. REAL NEXT CHAPTERS.
              </span>
              <h2>
                Good words.
                <br />
                From the people we help.
              </h2>
            </div>
            <div className="rating-note">
              <span className="stars" aria-label="5 stars">
                ★★★★★
              </span>
              <span>Client experiences with AET</span>
            </div>
          </div>
          <div className="review-grid">
            <article className="review-card" data-reveal>
              <span className="quote-mark">“</span>
              <blockquote>
                It is a good company that will give you a good service. I’ve
                just used their credential evaluation service and I strongly
                recommend it if you’re looking for professional evaluation
                services. They replied almost immediately to all of my emails,
                and their evaluation report looks professional and
                comprehensive.
              </blockquote>
              <div className="review-person">
                <span className="avatar">NT</span>
                <div>
                  <strong>Nicole Truong</strong>
                  <span>Credential evaluation</span>
                </div>
                <CheckCheck size={20} />
              </div>
            </article>
            <article className="review-card" data-reveal>
              <span className="quote-mark">“</span>
              <blockquote>
                American Education Translation Services did a great job
                evaluating my foreign credentials for professional licensing.
                The evaluator was very friendly, smart and professional. Very
                fast turnaround time. Will definitely use again. Highly
                recommendable!
              </blockquote>
              <div className="review-person">
                <span className="avatar blue">NE</span>
                <div>
                  <strong>Niva E</strong>
                  <span>Professional licensing</span>
                </div>
                <CheckCheck size={20} />
              </div>
            </article>
          </div>
        </section>
        <section className="faq-section wrap" id="questions">
          <div data-reveal>
            <span className="eyebrow">A FEW THINGS YOU MIGHT BE WONDERING</span>
            <h2>
              Clear answers.
              <br />
              Confident next steps.
            </h2>
            <a href={old + "/e-contact.php"} className="text-link">
              Ask us anything <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="faq-list" data-reveal>
            {faqs.map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary>
                  {q}
                  <Plus size={20} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing wrap" data-reveal>
          <div>
            <span className="eyebrow">
              YOUR FUTURE DOESN’T STOP AT A BORDER.
            </span>
            <h2>
              Let’s open the
              <br />
              <em>next door.</em>
            </h2>
          </div>
          <div>
            <p>
              Wherever you want to go,
              <br />
              we’re here to help you move forward.
            </p>
            <a className="button primary" href={apply}>
              Start your application <ArrowUpRight size={19} />
            </a>
          </div>
          <span className="closing-decoration" aria-hidden="true">
            ↗
          </span>
        </section>
      </main>
      <footer className="footer">
        <div className="wrap">
          <div className="footer-main">
            <div className="footer-brand">
              <a href="#" className="footer-wordmark" aria-label="AET home">
                <Image src="/brand/aet-logo-footer.svg" alt="American Education and Translation Services" width={520} height={120} />
              </a>
              <span>Global expertise. Personal attention.</span>
            </div>
            <div>
              <h3>EXPLORE</h3>
              <a href="#services">Our services</a>
              <a href={old + "/e-aboutus.php"}>About AET</a>
              <a href={old + "/blog/"}>Insights & resources</a>
              <a href={old + "/e-pay.php"}>Make a payment</a>
            </div>
            <div>
              <h3>LET’S CONNECT</h3>
              <a href={old + "/e-contact.php"}>
                Contact our team <ArrowUpRight size={14} />
              </a>
              <a href={apply}>Start an application</a>
              <a href={old + "/e-fee.php"}>Service fees</a>
            </div>
            <div className="offices">
              <h3>LOCAL ROOTS. GLOBAL REACH.</h3>
              <p>
                {[
                  { n: "Miami", p: "miami" },
                  { n: "Boston", p: "boston" },
                  { n: "San Francisco", p: "san-francisco" },
                  { n: "Los Angeles", p: "los-angeles" },
                  { n: "New York", p: "nyc" },
                  { n: "Beijing", p: "beijing" },
                ].map((o) => (
                  <a key={o.p} href={old + "/e-office-" + o.p + ".php"}>
                    {o.n}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} American Education and Translation
              Services.
            </span>
            <div>
              <a href={old + "/e-privacy-policy.php"}>Privacy policy</a>
              <a href={old + "/e-terms-of-use.php"}>Terms of use</a>
              <a href="#">Back to top ↑</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
