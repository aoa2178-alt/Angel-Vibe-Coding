import { useEffect, useState } from "react";
import { Link } from "react-router";

const experience = [
  {
    organization: "Majestic Labs AI",
    period: "2026",
    detailPeriod: "Jul—Aug",
    role: "MBA Operations Intern",
    context: "Los Altos · AI infrastructure",
    summary:
      "Built a 0-to-1 supply-chain operating model for an AI inference server, mapping 20+ ownership and export-control gaps across the path from silicon to manufacturing.",
  },
  {
    organization: "TOPPAN Security",
    period: "2026",
    detailPeriod: "Jan—May",
    role: "MBA Strategy Consultant",
    context: "Paris · Digital identity",
    summary:
      "Built a go-to-market strategy for identity verification, prioritizing four regulated industries representing an estimated $101M revenue opportunity.",
  },
  {
    organization: "Deloitte",
    period: "2021—",
    detailPeriod: "2025",
    role: "Senior Consultant",
    context: "Lagos · Multi-sector consulting",
    summary:
      "Led procurement, payments, telecom, and industrial programs, including work that delivered a 17% cost reduction and cut fulfillment delays by 90%.",
    progression:
      "Senior Consultant 2024–25 · Semi-Senior 2023–24 · Associate II 2022–23 · Associate 2021–22",
  },
  {
    organization: "KPMG",
    period: "2019—",
    detailPeriod: "2021",
    role: "Consultant",
    context: "Lagos · Financial services",
    summary:
      "Assessed more than 50 bank locations after a merger, informing the consolidation of 10+ branches within an approximately $80M cost-synergy program.",
  },
];

const writing = [
  {
    number: "01",
    category: "Mathematics",
    title: "Everything has a structure underneath",
    excerpt:
      "The pleasure was never in calculating. It was in the click—the moment the logic stops being a sequence of steps and becomes a thing you can see whole.",
    meta: "3 min read",
    pullQuote:
      "An answer isn’t right because it sounds convincing. The reasoning has to hold.",
  },
  {
    number: "02",
    category: "Tennis",
    title: "The situation can be difficult without the outcome being decided",
    excerpt:
      "Losing a point does not decide the match. What matters is resetting, owning the next point, and staying mentally present long enough to give yourself a chance.",
    meta: "3 min read",
    pullQuote: "Being behind is a description, not a verdict.",
  },
  {
    number: "03",
    category: "Travel",
    title: "What Paris gave back to me",
    excerpt:
      "I went to Paris for work. What I brought home had almost nothing to do with the work: long walks, unfamiliar streets, and the curiosity I had quietly misplaced.",
    meta: "4 min read",
    pullQuote: "Exploration does not always require a destination.",
  },
];

function SystemDiagram() {
  return (
    <div
      className="system-diagram"
      aria-label="Execution connecting strategy, operations, AI, and infrastructure from constraints to outcomes"
    >
      <div className="diagram-grid" />
      <span className="diagram-label diagram-label--top">Constraints</span>
      <span className="diagram-label diagram-label--bottom">Outcomes</span>
      <span className="node node--one">AI</span>
      <span className="node node--two">EXECUTION</span>
      <span className="node node--three">INFRA</span>
      <span className="node node--four">STRATEGY</span>
      <span className="node node--five">OPS</span>
      <svg className="diagram-lines" viewBox="0 0 600 600" aria-hidden="true">
        <path d="M94 157C186 157 187 300 300 300" />
        <path d="M300 300C420 300 415 130 514 130" />
        <path d="M300 300C415 300 421 463 514 463" />
        <path d="M92 456C184 456 190 300 300 300" />
      </svg>
      <span className="diagram-pulse" />
    </div>
  );
}

function BreakevenProject() {
  return (
    <div className="project-art project-art--breakeven" aria-hidden="true">
      <svg className="breakeven-lines" viewBox="0 0 800 600">
        <path d="M-80 510C129 494 269 410 401 300S650 119 880 91" />
        <path d="M-80 92C148 123 275 203 401 300S652 483 880 514" />
        <circle cx="401" cy="300" r="10" />
      </svg>
      <span className="breakeven-word breakeven-word--break">BREAK</span>
      <span className="breakeven-word breakeven-word--even">EVEN</span>
      <span className="art-caption">The point where the economics work</span>
    </div>
  );
}

function LoadlineProject() {
  return (
    <div className="project-art project-art--loadline" aria-hidden="true">
      <svg className="loadline-lines" viewBox="0 0 900 600">
        <path d="M-60 476C112 476 130 412 260 412S401 303 530 303S672 158 960 158" />
        <path d="M-60 518C123 518 143 450 276 450S417 344 546 344S690 199 960 199" />
        <path d="M-60 434C103 434 117 373 244 373S386 264 514 264S653 119 960 119" />
        <circle cx="530" cy="303" r="9" />
      </svg>
      <span className="loadline-word">LOADLINE</span>
      <span className="loadline-unit">POWER → PATH → GO-LIVE</span>
      <span className="art-caption">Power, path, and the cost of delay</span>
    </div>
  );
}

function ThroughlineProject() {
  return (
    <div className="project-art project-art--throughline" aria-hidden="true">
      <svg className="through-lines" viewBox="0 0 600 600">
        <path d="M-40 92C140 92 133 248 302 248S458 97 640 97" />
        <path d="M-40 190C134 190 146 306 302 306S465 194 640 194" />
        <path d="M-40 402C131 402 144 340 302 340S465 430 640 430" />
        <path d="M-40 505C132 505 146 367 302 367S467 511 640 511" />
        <circle cx="302" cy="306" r="15" />
      </svg>
      <span className="throughline-word">THROUGH</span>
      <span className="throughline-word throughline-word--end">LINE</span>
      <span className="model-index">DEMAND → SUPPLY → DELIVERY</span>
    </div>
  );
}

function KeelProject() {
  return (
    <div className="project-art project-art--keel" aria-hidden="true">
      <svg className="keel-system" viewBox="0 0 600 600">
        <ellipse cx="300" cy="285" rx="225" ry="112" />
        <ellipse className="keel-orbit" cx="300" cy="285" rx="116" ry="225" />
        <path className="keel-spine" d="M300 60V530" />
        <path className="keel-water" d="M0 264Q72 232 145 264T290 264T435 264T600 264" />
        <circle cx="300" cy="264" r="8" />
      </svg>
      <span className="keel-word">KEEL</span>
      <span className="flow-note">Plan · Review · Decide · Repeat</span>
    </div>
  );
}

function TenderProject() {
  return (
    <div className="project-art project-art--tender" aria-hidden="true">
      <span className="card-art-label">SHOULD COST / BID MODEL</span>
      <div className="tender-bars">
        <i />
        <i />
        <i />
        <i />
      </div>
      <strong>TENDER</strong>
      <span className="card-art-caption">Compare · Negotiate · Source</span>
    </div>
  );
}

function BuildoutProject() {
  return (
    <div className="project-art project-art--buildout" aria-hidden="true">
      <span className="card-art-label">CAPITAL INTELLIGENCE</span>
      <div className="buildout-bars">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <strong>BUILD<br />OUT</strong>
      <span className="card-art-caption">Spend → Suppliers → Return</span>
    </div>
  );
}

function WhereAILivesProject() {
  return (
    <div className="project-art project-art--where-ai-lives" aria-hidden="true">
      <span className="card-art-label">77 US DATA CENTERS</span>
      <div className="data-center-campus">
        {[0, 1, 2].map((hall) => (
          <div className={`data-hall data-hall--${hall + 1}`} key={hall}>
            {Array.from({ length: 8 }, (_, index) => (
              <i key={index} />
            ))}
          </div>
        ))}
      </div>
      <strong>
        WHERE AI
        <br />
        LIVES
      </strong>
      <span className="card-art-caption">Power · Queue · Location</span>
    </div>
  );
}

function SignalProject() {
  return (
    <div className="project-art project-art--signal" aria-hidden="true">
      <span className="card-art-label">DIGITAL INCLUSION</span>
      <div className="signal-rings">
        <i />
        <i />
        <i />
        <i />
      </div>
      <strong>SIGNAL</strong>
      <span className="card-art-caption">Access · Affordability · Funding</span>
    </div>
  );
}

function SitePage({ view }: { view: "home" | "blog" }) {
  const [introVisible, setIntroVisible] = useState(view === "home");
  const [introLeaving, setIntroLeaving] = useState(false);

  const enterSite = () => {
    if (introLeaving) return;
    setIntroLeaving(true);
    window.setTimeout(() => setIntroVisible(false), 900);
  };

  useEffect(() => {
    document.body.style.overflow = introVisible ? "hidden" : "";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (introVisible && (event.key === "Enter" || event.key === "Escape")) {
        enterSite();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [introVisible, introLeaving]);

  useEffect(() => {
    document.title =
      view === "home"
        ? "Toki's Portfolio | Strategy & Operations"
        : "Toki's Blog | Connecting Ideas";
  }, [view]);

  return (
    <main className={`site-shell ${view === "blog" ? "site-shell--blog" : ""}`} id="top">
      {view === "home" && introVisible && (
        <div
          className={`intro-screen ${introLeaving ? "is-leaving" : ""}`}
          aria-label="Introduction"
        >
          <div className="intro-name">
            <span>Angel Toki Ade-Oduntan</span>
            <div className="intro-disciplines" aria-label="Strategy, Operations, AI">
              <span>Strategy</span>
              <i aria-hidden="true" />
              <span>Operations</span>
              <i aria-hidden="true" />
              <span>AI</span>
            </div>
          </div>

          <button className="intro-enter" type="button" onClick={enterSite}>
            <span>Enter portfolio</span>
            <span aria-hidden="true">↘</span>
          </button>
        </div>
      )}

      <header className="topbar">
        <Link className="brand" to="/" aria-label="Portfolio home">
          {view === "home" ? "Toki's Portfolio" : "Toki's Blog"}
        </Link>
        <p className="role">Angel Toki Ade-Oduntan</p>
        <nav className="nav" aria-label="Main navigation">
          {view === "home" ? (
            <>
              <a href="#project-experience">Project experience</a>
              <a href="#work">Work</a>
              <Link to="/blog">Blog</Link>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <a href="#thinking">Thinking</a>
              <a href="#profile">Profile</a>
            </>
          )}
        </nav>
      </header>

      {view === "home" ? (
        <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            Hi, I’m Angel
          </div>
          <h1>
            Turning complex systems
            <br />
            <em>into practical decisions.</em>
          </h1>
          <p className="hero-intro">
            I’m a strategy and operations professional focused on technology,
            AI, and infrastructure-intensive companies. A former Deloitte and
            KPMG consultant and MBA candidate at UC Berkeley Haas, I’m currently
            expanding that perspective through Columbia Business School. My
            work connects technical and operational constraints, commercial
            priorities, and execution.
          </p>
          <a className="text-link" href="#project-experience">
            See project experience <span>↓</span>
          </a>
        </div>
        <SystemDiagram />
      </section>

      <section className="portfolio" id="work" aria-labelledby="ai-builds-heading">
        <div className="portfolio-heading">
          <div className="section-label">
            <span>01</span>
            <p>Selected work</p>
          </div>
          <div className="portfolio-title-row">
            <h2 id="ai-builds-heading">AI Builds</h2>
            <div className="portfolio-intro">
              <p>
                Eight working products built to turn dense questions across AI
                infrastructure, strategy, operations, and supply chains into
                clear, practical decisions.
              </p>
              <a href="#ai-builds-grid">Explore all eight below ↓</a>
            </div>
          </div>
        </div>

        <div className="ai-build-grid" id="ai-builds-grid">
          <article className="ai-build-card">
            <BreakevenProject />
            <div className="ai-build-card__body">
              <div className="ai-build-card__meta">
                <span>01 / AI economics</span>
                <span className="live-status">Live</span>
              </div>
              <h3>
                <a className="ai-build-card__link" href="https://breakeven-silk.vercel.app" target="_blank" rel="noreferrer">
                  <span className="sr-only">Breakeven — </span>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </h3>
              <p>
                Decides whether to pay per token, rent GPUs, or own them—and
                whether an AI use case pays off.
              </p>
            </div>
          </article>

          <article className="ai-build-card">
            <LoadlineProject />
            <div className="ai-build-card__body">
              <div className="ai-build-card__meta">
                <span>02 / Data centers</span>
                <span className="live-status">Live</span>
              </div>
              <h3>
                <a className="ai-build-card__link" href="https://loadline-weld.vercel.app" target="_blank" rel="noreferrer">
                  <span className="sr-only">Loadline — </span>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </h3>
              <p>
                Plans power, the critical path to go-live, the cost of delay,
                and what to fix first.
              </p>
            </div>
          </article>

          <article className="ai-build-card">
            <ThroughlineProject />
            <div className="ai-build-card__body">
              <div className="ai-build-card__meta">
                <span>03 / Supply chain</span>
                <span className="live-status">Live</span>
              </div>
              <h3>
                <a className="ai-build-card__link" href="https://throughline-gilt.vercel.app" target="_blank" rel="noreferrer">
                  <span className="sr-only">Throughline — </span>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </h3>
              <p>
                Models demand, scarce-supply allocation, bullwhip effects, and
                delivery risk across 180,519 orders.
              </p>
            </div>
          </article>

          <article className="ai-build-card">
            <KeelProject />
            <div className="ai-build-card__body">
              <div className="ai-build-card__meta">
                <span>04 / Operating rhythm</span>
                <span className="live-status">Live</span>
              </div>
              <h3>
                <a className="ai-build-card__link" href="https://keel-one-rho.vercel.app" target="_blank" rel="noreferrer">
                  <span className="sr-only">Keel — </span>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </h3>
              <p>
                Runs annual plans, OKRs, monthly reviews, gap analysis, and
                funding decisions for an AI company.
              </p>
            </div>
          </article>

          <article className="ai-build-card">
            <TenderProject />
            <div className="ai-build-card__body">
              <div className="ai-build-card__meta">
                <span>05 / Procurement</span>
                <span className="live-status">Live</span>
              </div>
              <h3>
                <a className="ai-build-card__link" href="https://tender-six-iota.vercel.app" target="_blank" rel="noreferrer">
                  <span className="sr-only">Tender — </span>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </h3>
              <p>
                Compares total-cost bids, builds should-cost models, and sets
                negotiation targets for critical equipment.
              </p>
            </div>
          </article>

          <article className="ai-build-card">
            <BuildoutProject />
            <div className="ai-build-card__body">
              <div className="ai-build-card__meta">
                <span>06 / Capital intelligence</span>
                <span className="live-status">Live</span>
              </div>
              <h3>
                <a className="ai-build-card__link" href="https://buildout-three.vercel.app" target="_blank" rel="noreferrer">
                  <span className="sr-only">Buildout — </span>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </h3>
              <p>
                Tracks Big Tech AI spending, its returns, and the suppliers
                receiving the investment.
              </p>
            </div>
          </article>

          <article className="ai-build-card">
            <WhereAILivesProject />
            <div className="ai-build-card__body">
              <div className="ai-build-card__meta">
                <span>07 / Site selection</span>
                <span className="live-status">Live</span>
              </div>
              <h3>
                <a className="ai-build-card__link" href="https://where-ai-lives.vercel.app" target="_blank" rel="noreferrer">
                  <span className="sr-only">Where AI Lives — </span>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </h3>
              <p>
                Maps 77 US AI data centers, power prices, and grid queues to
                score the next location.
              </p>
            </div>
          </article>

          <article className="ai-build-card">
            <SignalProject />
            <div className="ai-build-card__body">
              <div className="ai-build-card__meta">
                <span>08 / Digital inclusion</span>
                <span className="live-status">Live</span>
              </div>
              <h3>
                <a className="ai-build-card__link" href="https://signal-zeta-five.vercel.app" target="_blank" rel="noreferrer">
                  <span className="sr-only">Signal — </span>
                  Explore <span aria-hidden="true">↗</span>
                </a>
              </h3>
              <p>
                Shows who is offline, why access is unaffordable, what coverage
                costs, and who should pay.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="about section" id="project-experience">
        <div className="section-label">
          <span>02</span>
          <p>Project experience</p>
        </div>
        <div className="about-content">
          <div className="industry-intro">
            <span>Industry breadth</span>
            <p>Six sectors shaped by operating, advisory, and project work.</p>
          </div>
          <div className="industry-grid" aria-label="Industry breadth">
            <article className="industry-card">
              <div className="industry-card__top">
                <span>01</span>
                <strong>10+ partners</strong>
              </div>
              <div className="industry-mark industry-mark--infra" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <h3>AI Infrastructure</h3>
              <p>Silicon-to-system operations, supply chains, production planning, and TCO.</p>
            </article>

            <article className="industry-card">
              <div className="industry-card__top">
                <span>02</span>
                <strong>$300M+</strong>
              </div>
              <div className="industry-mark industry-mark--finance" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <h3>Financial Services & Payments</h3>
              <p>Banking, fintech, mobile money, transaction controls, and procurement.</p>
            </article>

            <article className="industry-card">
              <div className="industry-card__top">
                <span>03</span>
                <strong>50M users</strong>
              </div>
              <div className="industry-mark industry-mark--telecom" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <h3>Telecom & Connectivity</h3>
              <p>Network assets, mobile-data operations, infrastructure, and digital access.</p>
            </article>

            <article className="industry-card">
              <div className="industry-card__top">
                <span>04</span>
                <strong>7 countries</strong>
              </div>
              <div className="industry-mark industry-mark--industrial" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <h3>Energy & Industrials</h3>
              <p>Power generation, cement, manufacturing, physical assets, and supplier risk.</p>
            </article>

            <article className="industry-card">
              <div className="industry-card__top">
                <span>05</span>
                <strong>$1.5B program</strong>
              </div>
              <div className="industry-mark industry-mark--public" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </div>
              <h3>Public Sector & Health</h3>
              <p>Central banking, national programs, budgeting, and vaccine distribution.</p>
            </article>

            <article className="industry-card">
              <div className="industry-card__top">
                <span>06</span>
                <strong>~$101M</strong>
              </div>
              <div className="industry-mark industry-mark--identity" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <h3>Digital Identity</h3>
              <p>Identity verification, secure payments, market entry, and commercialization.</p>
            </article>
          </div>

          <div className="project-footprint">
            <div className="footprint-graphic" aria-hidden="true">
              <svg viewBox="0 0 320 320">
                <circle cx="160" cy="160" r="118" />
                <ellipse cx="160" cy="160" rx="118" ry="48" />
                <ellipse cx="160" cy="160" rx="52" ry="118" />
                <path d="M48 126C92 75 145 215 194 145S260 104 278 134" />
                <circle className="footprint-node" cx="62" cy="112" r="7" />
                <circle className="footprint-node" cx="126" cy="149" r="7" />
                <circle className="footprint-node" cx="201" cy="137" r="7" />
                <circle className="footprint-node" cx="270" cy="124" r="7" />
              </svg>
            </div>
            <div className="footprint-content">
              <div className="footprint-intro">
                <span>Geographic footprint</span>
                <i aria-hidden="true" />
              </div>
              <div className="footprint-route">
                <div>
                  <i />
                  <span>North America</span>
                  <strong>Silicon Valley · New York</strong>
                </div>
                <div>
                  <i />
                  <span>Europe</span>
                  <strong>Paris</strong>
                </div>
                <div>
                  <i />
                  <span>West Africa</span>
                  <strong>Nigeria · Senegal · Burkina Faso</strong>
                </div>
                <div>
                  <i />
                  <span>East Africa</span>
                  <strong>Uganda · Kenya · Ethiopia · Tanzania</strong>
                </div>
                <div>
                  <i />
                  <span>Central Africa</span>
                  <strong>Republic of the Congo · Brazzaville</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="experience section">
        <div className="section-label">
          <span>03</span>
          <p>Career</p>
        </div>
        <div className="experience-content">
          <div className="career-grid">
            <section className="career-column" aria-labelledby="experience-heading">
              <div className="career-column__heading">
                <h2 id="experience-heading">Experience</h2>
                <span>Most recent → earlier</span>
              </div>
              <div className="experience-tiles">
                {experience.map((item, index) => (
                  <article
                    className={`experience-tile experience-tile--${index + 1}`}
                    key={item.organization}
                  >
                    <span className="experience-step" aria-hidden="true">
                      0{index + 1}
                    </span>
                    <div className="experience-tile__meta">
                      <span>
                        {item.period} {item.detailPeriod}
                      </span>
                      <span>{item.context}</span>
                    </div>
                    <h3>{item.organization}</h3>
                    <h4>{item.role}</h4>
                    {item.progression && (
                      <span className="career-progression">{item.progression}</span>
                    )}
                    <p>{item.summary}</p>
                  </article>
                ))}
              </div>
            </section>

            <section
              className="career-column career-column--education"
              aria-labelledby="education-heading"
            >
              <div className="career-column__heading">
                <h2 id="education-heading">Education</h2>
                <span>03 programs</span>
              </div>
              <div className="education-tiles">
                <article className="education-tile education-tile--haas">
                  <div className="education-tile__meta">
                    <span>2025—2027</span>
                    <span>Berkeley · California</span>
                  </div>
                  <h3>UC Berkeley Haas</h3>
                  <h4>Master of Business Administration</h4>
                  <p>
                    Strategy, energy, and technology, with leadership across
                    MBA admissions, the African Business Club, and Haas Tech
                    Club.
                  </p>
                </article>

                <article className="education-tile education-tile--columbia">
                  <div className="education-tile__meta">
                    <span>Fall 2026</span>
                    <span>New York · New York</span>
                  </div>
                  <h3>Columbia Business School</h3>
                  <h4>MBA Exchange Program</h4>
                  <p>
                    Coursework and community focused on operations, AI, and
                    technology.
                  </p>
                </article>

                <article className="education-tile education-tile--ibadan">
                  <div className="education-tile__meta">
                    <span>December 2016</span>
                    <span>Ibadan · Nigeria</span>
                  </div>
                  <h3>University of Ibadan</h3>
                  <h4>BSc Mathematics</h4>
                  <p>
                    Graduated in the top 5% of the class and applied analytics
                    to public-sector budget planning.
                  </p>
                </article>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="blog-cta" aria-label="Read the blog">
        <Link to="/blog">
          <span>Connecting ideas: Read my blog</span>
          <span aria-hidden="true">▶</span>
        </Link>
      </section>
        </>
      ) : (
        <>
      <section className="blog-hero">
        <span>Ideas · Interests · Working notes</span>
        <h1>Connecting ideas.</h1>
        <p>
          Notes on how I work, what shapes my perspective, and the patterns I
          keep returning to across mathematics, resilience, place, operations,
          and AI.
        </p>
      </section>

      <section className="profile section" id="profile">
        <div className="section-label">
          <span>04</span>
          <p>Profile</p>
        </div>
        <div className="profile-content">
          <div className="profile-heading">
            <p>Outside the work</p>
            <h2>
              Art, cities, movement,
              <br />
              <em>and ideas.</em>
            </h2>
          </div>
          <div className="profile-grid">
            <article className="profile-card profile-card--statement">
              <span>01 / Art</span>
              <p>
                I paint abstract work because not everything needs a framework.
                The unstructured part is often the point.
              </p>
              <div className="paint-mark" aria-hidden="true" />
            </article>
            <article className="profile-card">
              <span>02 / Cities & art spaces</span>
              <h3>I come alive in cities made for walking.</h3>
              <p>
                Paris, New York, and Lagos—their pace, neighborhoods,
                architecture, galleries, and the discoveries between
                destinations.
              </p>
              <div className="art-space-list">
                <span>Nike Art Gallery</span>
                <span>BAMPFA</span>
                <span>SFMoMA</span>
                <span>The Louvre</span>
                <span>Musée de l’Orangerie</span>
              </div>
            </article>
            <article className="profile-card profile-card--dark">
              <span>03 / Racquet sports</span>
              <h3>Tennis to watch. Badminton to play.</h3>
              <p>
                A long-time tennis fan, hard-court loyalist, and happiest when
                I can get onto a badminton court.
              </p>
              <div className="court-lines" aria-hidden="true" />
            </article>
          </div>
          <div className="teaching-note">
            <span>04 / Teaching</span>
            <p>
              Teaching students who struggled with numbers showed me that
              clarity begins with understanding how another person sees the
              problem—not repeating the explanation that worked for me.
            </p>
            <strong>Clarity is an act of empathy.</strong>
          </div>
          <div className="profile-note">
            <p>How it connects</p>
            <p>
              Art, sport, and operations all reward the same habits: seeing
              patterns, understanding structure, and knowing when to move.
            </p>
          </div>
        </div>
      </section>

      <section className="thinking section" id="thinking">
        <div className="section-label">
          <span>05</span>
          <p>Thinking</p>
        </div>
        <div className="thinking-content">
          <div className="thinking-heading">
            <h2>Notes on the things that shape how I see.</h2>
            <p>
              Personal reflections on mathematics, resilience, and place.
              Notes on operations, AI, and infrastructure will follow.
            </p>
          </div>
          <div className="essay-list">
            {writing.map((essay) => (
              <article
                className={`essay-card ${essay.number === "01" ? "essay-card--featured" : ""} ${essay.number === "03" ? "essay-card--dark" : ""}`}
                key={essay.title}
              >
                <div className="essay-topline">
                  <span>{essay.number}</span>
                  <span>{essay.category}</span>
                </div>
                <h3>{essay.title}</h3>
                <p>{essay.excerpt}</p>
                {essay.pullQuote && (
                  <blockquote className="essay-quote">
                    “{essay.pullQuote}”
                  </blockquote>
                )}
                <span className="essay-meta">{essay.meta}</span>
              </article>
            ))}
          </div>
          <div className="thinking-foot">
            <span>Words in progress</span>
            <p>
              Writing is where I make sense of the patterns that stay with me.
            </p>
          </div>
        </div>
      </section>
        </>
      )}

      <footer className="contact-footer" id="contact">
        <div className="contact-footer__intro">
          <span>Contact</span>
          <div className="contact-title-row">
            <h2>
              <em>Let’s</em>
              <br />
              talk.
            </h2>
            <svg
              className="coffee-cup"
              viewBox="0 0 32 32"
              aria-hidden="true"
            >
              <path d="M6 10h17v8a8 8 0 0 1-8 8h-1a8 8 0 0 1-8-8v-8Z" />
              <path d="M23 13h2a4 4 0 0 1 0 8h-3" />
              <path d="M10 6c0-2 2-2 2-4M16 6c0-2 2-2 2-4" />
              <path d="M4 29h22" />
            </svg>
          </div>
          <p>
            Always ready to talk strategy and operations, especially across
            technology, AI, and infrastructure-intensive companies. Happy to
            share notes or grab coffee.
          </p>
          <small>© 2026 Angel Ade-Oduntan</small>
        </div>
        <div className="contact-footer__links">
          <a href="mailto:angel_ade-oduntan@berkeley.edu">
            <strong>Email</strong>
            <span>angel_ade-oduntan@berkeley.edu →</span>
          </a>
          <a
            href="https://www.linkedin.com/in/angel-toki-adeoduntan/"
            target="_blank"
            rel="noreferrer"
          >
            <strong>LinkedIn</strong>
            <span>in/angel-toki-adeoduntan →</span>
          </a>
        </div>
      </footer>
    </main>
  );
}

export function HomePage() {
  return <SitePage view="home" />;
}

export function BlogPage() {
  return <SitePage view="blog" />;
}
