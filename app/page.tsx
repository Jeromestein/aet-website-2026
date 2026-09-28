import Image from "next/image";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { SiteFooter } from "@/components/site-footer";
import { CardRail } from "@/components/card-rail";
import { InstitutionCarousel } from "@/components/institution-carousel";
import { ImpactStory, ProcessStory } from "@/components/scroll-stories";
import {
  ArrowRight,
  ArrowUpRight,
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
  { icon: Languages, number: "02", title: "Certified Translation", text: "Certified / Notarized Translation. Used for: USCIS / Colleges / DMV etc.", href: "/e-notarized.php", tag: "Translation" },
  { icon: MessageCircle, number: "03", title: "Interpretation", text: "Professional Interpretation covers most metropolitan areas.", href: "/e-interpretation.php", tag: "Interpretation" },
  { icon: FileCheck2, number: "04", title: "Technical Translation", text: "Including Scientific / Industrial / Medical / Business / Legal / Education Translation.", href: "/e-tech-translation.php", tag: "Specialized translation" },
  { icon: Globe2, number: "05", title: "Visa Services", text: "China, Canada, Schengen(Europe), UK, Japan, Korea, etc.", href: "/e-visaservice.php", tag: "Visa services" },
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
    "Yes. Use Apply Now to access our existing online application portal. You can also contact our team for guidance on the service and documents you need.",
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
              <Image src="/images/bbb-hero-transparent.png" alt="BBB A+ Rating" width={2172} height={724} sizes="(max-width: 760px) 233px, 252px" />
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image">
              <Image
                src="/images/hero.webp"
                alt="Professional seated at a desk with a laptop"
                fill
                sizes="(max-width: 760px) max(100vw, 1100px), max(60vw, 1210px)"
                loading="eager"
              />
            </div>
          </div>
        </section>
        </div>
        <InstitutionCarousel />
        <ImpactStory />
        <section className="section wrap" id="services">
          <div className="section-heading" data-reveal>
            <div>
              <span className="eyebrow">01 / WHAT WE DO</span>
              <h2>
                Foreign Credential Evaluation
              </h2>
            </div>
            <p>
              Professional evaluation of international educational credentials for employment, immigration, and education purposes in the United States.
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
                  Types of Evaluations We Offer
                </h3>
              </div>
              <dl className="evaluation-types">
                <div><dt>Document by Document Evaluation</dt><dd>Basic evaluation that includes U.S. degree equivalency only. Often satisfies requirements for employment and immigration.</dd></div>
                <div><dt>Course by Course Evaluation</dt><dd>Complete report including U.S. degree equivalency, credits, grades, and GPA. Recommended for college admission, licensing, and USCIS RFE.</dd></div>
                <div><dt>Expert Opinion Letters</dt><dd>Pairs relevant professional experience with academic coursework to determine U.S. degree equivalency.</dd></div>
              </dl>
              <div className="card-bottom">
                <span>Learn More About FCE</span>
                <span className="circle-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </div>
            </a>
            <div className="other-services"><h3 className="rail-heading">Other Services</h3>
            <CardRail className="service-list" label="Other services">
              {services.map((s) => (
                <a
                  href={old + s.href}
                  className="service-row"
                  key={s.number}
                  data-rail-card
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
            </CardRail></div>
          </div>
          <div className="service-footnote">
            <Globe2 size={17} />
            <span>Translation and evaluation services.</span>
            <a href={old + "/e-contact.php"}>
              Contact Us <ArrowRight size={16} />
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
                PRE-EVALUATION SERVICES
              </span>
            </div>
            <div className="preview-copy">
              <span className="eyebrow">YOUR EDUCATIONAL QUALIFICATIONS</span>
              <h2>
                Pre-Evaluation Services
              </h2>
              <p>
                Not sure what your foreign degree is equivalent to in the U.S.? Our comprehensive pre-evaluation service provides instant insights about your educational qualifications, helping you understand how your international credentials translate in the American education system.
              </p>
              <a href={pre} className="button light">
                Start Your Pre-Evaluation <ArrowUpRight size={18} />
              </a>
              <span className="preview-note">
                A preliminary assessment before formal credential evaluation.
              </span>
            </div>
          </div>
        </section>
        <section className="faq-section wrap" id="questions">
          <div data-reveal>
            <span className="eyebrow">QUESTIONS & ANSWERS</span>
            <h2>
              Frequently Asked Questions
            </h2>
            <a href={old + "/e-contact.php"} className="text-link">
              Contact Us <ArrowUpRight size={18} />
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
              GET STARTED
            </span>
            <h2>
              Start Application
            </h2>
          </div>
          <div>
            <p>
              Choose your evaluation type based on your purpose.
            </p>
            <a className="button primary" href={apply}>
              <SquarePen size={19} /> Apply Now
            </a>
          </div>
          <span className="closing-decoration" aria-hidden="true">
            ↗
          </span>
        </section>
        <TestimonialCarousel />
      </main>
      <SiteFooter />
    </>
  );
}
