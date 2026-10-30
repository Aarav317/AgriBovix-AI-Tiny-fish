import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Leaf,
  Sprout,
  ScanLine,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Upload,
  Search,
  ClipboardCheck,
  Check,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { CowIcon as Beef } from "../components/CowIcon";
import { Brand } from "../components/Brand";
import { Photo } from "../components/Photo";
import { LanguageSelector } from "../components/LanguageSelector";
import { useLanguage } from "../i18n/LanguageContext";
export function WorkspaceCards() {
  const { t } = useLanguage();
  return (
    <div className="workspace-cards">
      {[
        {
          id: "agrivision",
          title: "AgriVision",
          subtitle: t("home.agriSubtitle"),
          description:
            t("home.agriDescription"),
          image: "/images/crop-leaves.png",
          icon: Sprout,
        },
        {
          id: "pashuvision",
          title: "PashuVision",
          subtitle: t("home.pashuSubtitle"),
          description:
            t("home.pashuDescription"),
          image: "/images/cattle.png",
          icon: Beef,
        },
      ].map((c) => (
        <article className="workspace-card" key={c.id}>
          <div className="workspace-copy">
            <div className="workspace-card-title">
              <span className="circle-icon dark">
                <c.icon size={27} />
              </span>
              <div>
                <h2>{c.title}</h2>
                <p className="workspace-subtitle">{c.subtitle}</p>
              </div>
            </div>
            <p>{c.description}</p>
            <Link className="button small" to={`/${c.id}`}>
              {t("home.explore", { name: c.title })}
              <ArrowRight size={16} />
            </Link>
          </div>
          <Photo
            src={c.image}
            alt={
              c.id === "agrivision"
                ? t("home.photoAltLeaves")
                : t("home.photoAltCow")
            }
            className="workspace-photo"
          />
        </article>
      ))}
    </div>
  );
}
export default function HomePage() {
  const [menu, setMenu] = useState(false);
  const { t } = useLanguage();
  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <button
            className="icon-button mobile-menu"
            aria-label={t("nav.open")}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
          <nav
            className={menu ? "home-nav open" : "home-nav"}
            aria-label={t("nav.main")}
          >
            {[
              [t("nav.home"), "/", "home"],
              [t("nav.about"), "/#about", "about"],
              [t("nav.features"), "/#features", "features"],
              [t("nav.how"), "/#how-it-works", "how"],
              [t("nav.contact"), "/#contact", "contact"],
            ].map(([label, url]) => (
              <a
                className={url === "/" ? "active" : ""}
                href={url}
                key={label}
                onClick={() => setMenu(false)}
              >
                {label}
              </a>
            ))}
            <Link
              className="mobile-nav-login"
              to="/auth/login"
              onClick={() => setMenu(false)}
            >
              {t("nav.login")}
            </Link>
          </nav>
          <LanguageSelector />
          <Link to="/auth/login" className="button small header-login">
            <span className="user-dot" />
            {t("nav.login")}
          </Link>
        </div>
      </header>
      <main id="main">
        <section className="hero">
          <Photo
            src="/images/farmer-hero.png"
            alt={t("home.photoAltFarmer")}
            className="hero-image"
          />
          <div className="hero-shade" />
          <div className="container hero-content">
            <div className="hero-copy">
              <span className="hero-pill">
                <Leaf size={14} />
                {t("home.pill")}
              </span>
              <h1>
                {t("home.heroLine1")}
                <br />
                {t("home.heroLine2")}
                <br />
                <span>{t("home.heroLine3")}</span>
              </h1>
              <p>
                {t("home.heroDescription")}
              </p>
              <div className="hero-buttons">
                <a href="#workspaces" className="button light">
                  {t("home.getStarted")}
                  <ArrowRight size={18} />
                </a>
                <a href="#how-it-works" className="button outline-light">
                  <span className="play-icon">
                    <Play size={12} />
                  </span>
                  {t("home.seeHow")}
                </a>
              </div>
              <div className="hero-values">
                <span>
                  <ScanLine size={16} />
                  {t("home.aiInsights")}
                </span>
                <span>
                  <ShieldCheck size={16} />
                  {t("home.farmerFirst")}
                </span>
                <span>
                  <Sprout size={16} />
                  {t("home.betterCare")}
                </span>
              </div>
            </div>
          </div>
          <div className="hero-caption">
            <span className="caption-icon">
              <Leaf size={22} />
            </span>
            <div>
              <strong>{t("home.caption")}</strong>
              <small>{t("home.captionText")}</small>
            </div>
          </div>
        </section>
        <section className="workspace-section container" id="workspaces">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("home.twoPurposes")}</span>
              <h2>{t("home.rightSupport")}</h2>
            </div>
            <p>{t("home.chooseWorkspace")}</p>
          </div>
          <WorkspaceCards />
        </section>
        <section className="benefits-section" id="features">
          <div className="container">
            <div className="section-heading">
              <div>
                <span className="eyebrow">{t("home.builtForYou")}</span>
                <h2>{t("home.why")}</h2>
              </div>
              <p>{t("home.simpleUseful")}</p>
            </div>
            <div className="benefits-grid">
              {[
                {
                  icon: ScanLine,
                  title: t("home.analysis"),
                  text: t("home.analysisText"),
                },
                {
                  icon: Smartphone,
                  title: t("home.easy"),
                  text: t("home.easyText"),
                },
                {
                  icon: ShieldCheck,
                  title: t("home.reliable"),
                  text: t("home.reliableText"),
                },
                {
                  icon: TrendingUp,
                  title: t("home.productivity"),
                  text: t("home.productivityText"),
                },
              ].map((b) => (
                <div className="benefit" key={b.title}>
                  <span className="circle-icon">
                    <b.icon size={23} />
                  </span>
                  <div>
                    <h3>{b.title}</h3>
                    <p>{b.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="how-section container" id="how-it-works">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("home.clarity")}</span>
              <h2>{t("home.photoToPlan")}</h2>
            </div>
            <a className="text-link" href="#workspaces">
              {t("home.getStarted")}
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="steps-grid">
            {[
              {
                icon: Upload,
                title: t("home.uploadPhoto"),
                text: t("home.uploadPhotoText"),
              },
              {
                icon: Search,
                title: t("home.exploreAI"),
                text: t("home.exploreAIText"),
              },
              {
                icon: ClipboardCheck,
                title: t("home.reviewFindings"),
                text: t("home.reviewFindingsText"),
              },
              {
                icon: Check,
                title: t("home.nextStep"),
                text: t("home.nextStepText"),
              },
            ].map((s, i) => (
              <div className="step" key={s.title}>
                <span className="step-number">0{i + 1}</span>
                <s.icon size={27} />
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                {i < 3 && <ChevronRight className="step-chevron" size={20} />}
              </div>
            ))}
          </div>
        </section>
        <section className="about-section container" id="about">
          <div>
            <span className="eyebrow">{t("home.aboutEyebrow")}</span>
            <h2>
              {t("home.aboutTitle")}
            </h2>
          </div>
          <div>
            <p>
              {t("home.aboutText")}
            </p>
            <p className="muted">
              {t("home.aboutSubtext")}
            </p>
          </div>
        </section>
      </main>
      <footer className="site-footer" id="contact">
        <div className="container">
          <div className="footer-main">
            <div>
              <Brand />
              <p>
                {t("home.footerTagline")}
              </p>
            </div>
            <div>
              <h3>{t("home.exploreFooter")}</h3>
              <Link to="/agrivision">AgriVision</Link>
              <Link to="/pashuvision">PashuVision</Link>
              <a href="/#how-it-works">{t("nav.how")}</a>
            </div>
            <div>
              <h3>{t("home.contactUs")}</h3>
              <p>{t("home.contactUnavailable")}</p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} AgriBovix AI</span>
            <p>{t("home.educational")}</p>
            <div>
              <Link to="/privacy">{t("home.privacy")}</Link>
              <Link to="/terms">{t("home.terms")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
