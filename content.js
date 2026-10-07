/* ============================================================
   content.js — Lorisca Cessia personal site
   THE ONLY FILE YOU EDIT FOR CONTENT CHANGES.
   Edit text → change the string. Add a project → copy a card
   object, paste it into the right category array, fill it in.
   Never edit HTML/CSS for content changes.
   ============================================================ */

const SITE = {
  name: "Lorisca Cessia",
  role: "People Analytics & Operations",
  email: "loriscatuuk@gmail.com",
  linkedin: "https://www.linkedin.com/in/lorisca",
  github: "https://github.com/lori-sca",
  // Portrait: set to an image path (e.g. "assets/portrait.jpg") when ready.
  // Empty string hides the portrait block entirely — no placeholder shown.
  portrait: "",
};

/* ---------------- HOME ---------------- */

const HOME = {
  hero: {
    eyebrow: "MBA IN ANALYTICS · HULT 2026",
    headline: "I build the hiring systems behind high-growth teams.",
    lede: "I live between business language and technical language: rigorous enough to understand the technical side, fluent enough to translate it for any audience. Tools-agnostic by principle.",
    metric: "▸ Hiring SLA −80% — one system, 10,000+ CVs a year",
    ctas: [
      { label: "See the work", href: "https://lorisca-analytics.github.io" },
      { label: "Get in touch", href: "about.html#contact" },
    ],
  },
  startHere: [
    {
      title: "Systems that survive scale",
      text: "I replaced manual recruiting intake with a single-gate system handling 10,000+ CVs a year, cutting turnaround ~80%. Then I rebuilt how 15 recruiters across six regions were measured. The system outlasted me by 12+ months.",
    },
    {
      title: "Proof over narrative",
      text: "I analyzed 3.47M H-1B filings in SQL to see how sponsorship really works, and I audit AI transformations by following the mechanism underneath, not the story on top.",
    },
    {
      title: "AI in HR, pragmatically",
      text: "I've put scoring, routing, and automation into real hiring workflows with Sheets, Apps Script, and SQL. I care about what actually changes the work, not pilot theater.",
    },
  ],
  aboutTeaser:
    "Banking, food-tech, logistics — different industries, same problem: things breaking the moment they scale. I trace where the work breaks, rebuild the flow, and leave behind a system people can keep using.",
};

/* ---------------- PROJECTS ----------------
   type: "case-study" | "essay" | "tool" | "experiment"
   status: "live" | "building"
   links: { label, url, kind }  kind: github | demo | drive | article | deck | sheet | other
   Only "live" cards render. Nothing placeholder, ever.                        */

const PROJECTS = {
  analytics: [
    {
      id: "h1b-sponsorship",
      title: "Which Employers Reliably Sponsor H-1B Business Roles",
      hook: "SQL analysis of 3.47M H-1B filings (2020–2023). The business-role wage premium survives on medians — then breaks honestly when IT managers are excluded.",
      metric: "3.47M filings · 8 queries",
      visual:
        "https://raw.githubusercontent.com/lorisca-analytics/h1b-sponsorship-sql-analysis/main/visuals/02-wage-premium-by-year.png",
      visualAlt: "Wage premium by year, business vs data roles",
      diagram:
        "https://raw.githubusercontent.com/lorisca-analytics/h1b-sponsorship-sql-analysis/main/visuals/03-durable-business-sponsors.png",
      diagramAlt: "Top durable business-role sponsors, 2020–2023",
      status: "live",
      type: "case-study",
      featured: true,
      links: [
        {
          label: "Repo",
          url: "https://github.com/lorisca-analytics/h1b-sponsorship-sql-analysis",
          kind: "github",
        },
      ],
      body: {
        problem:
          "International graduates pick a track first and ask about visa risk later — on anecdote. Nobody could say whether business and analytics tracks differ on approval odds, or which employers sponsor every year rather than once.",
        approach:
          "Normalized 3.47M federal filings into a five-table MySQL database, then ran eight queries on volume, approval, pay, and four-year employer durability.",
        hers: "Reported the median that broke my own headline finding — the premium flips when IT managers are excluded.",
        result:
          "Approval gap never passed 1.7 points. Business volume +9.1% while analytics fell 6.1%. 77 durable business sponsors identified — EY leads with 13,329 filings at 97.8%.",
        lesson:
          "Visa risk is the wrong variable. The decision turns on market direction and pay, not approval odds.",
      },
    },
  ],
  builds: [
    {
      id: "adhd-project-manager",
      title: "ADHD Project Manager",
      hook: "A scheduled scan that catches everything I leave midway across AI chats and lands it on one prioritized board. Built for my ADHD; built so anyone can repurpose it.",
      metric: "Live demo · open playbook",
      visual:
        "https://raw.githubusercontent.com/lori-sca/muse-adhd-project-manager/main/docs/screenshots/board.png",
      visualAlt: "Prioritized board of open loops",
      diagram:
        "https://raw.githubusercontent.com/lori-sca/muse-adhd-project-manager/main/docs/problem-diagram.svg",
      diagramAlt: "Trap → Insight → Machine diagram",
      status: "live",
      type: "tool",
      featured: true,
      links: [
        {
          label: "Repo",
          url: "https://github.com/lori-sca/muse-adhd-project-manager",
          kind: "github",
        },
        {
          label: "Live demo",
          url: "https://lori-sca.github.io/muse-adhd-project-manager/board/index.html",
          kind: "demo",
        },
      ],
      body: {
        problem:
          "AI chats are where work goes to die midway — brilliant threads abandoned, commitments unconfirmed, and no single place to see what's actually open.",
        approach:
          "A scheduled scan reads every thread, finds open loops, and lands them on one prioritized board: sense → draft → queue → review.",
        hers: "Designed from my own failure modes — ADHD as a design constraint, never an apology. Produced is not shipped.",
        result:
          "One board, every open loop, ranked. The scan runs daily; I clear it in one sitting.",
        lesson: "The job isn't organizing tasks. It's noticing them.",
      },
    },
  ],
};

/* "Building next" — honest pipeline signal, text only. Empty string hides the line. */
const PIPELINE = {
  analytics: "Massachusetts H-1B cleaning notebook — 137,866 rows, every cleaning decision argued in writing.",
  builds: "Event App Starter Kit — open-source template reverse-engineered from the WeAreDevelopers attendee app.",
};

/* ---------------- ABOUT ---------------- */

const ABOUT = {
  chapters: [
    {
      label: "The instinct",
      text: "I started on the business side — the stakeholder who needed bankers, not the HR staff doing paperwork. I kept getting pulled into the same problem: a process has grown, information is scattered, and the team spends its time chasing updates instead of making decisions. I trace where the work breaks, rebuild the flow, and leave behind a system people can keep using.",
    },
    {
      label: "The tooling",
      text: "I did the MBA in Analytics because I wanted stronger tools for the problems I was already solving — not to change lanes, but to gain the language. Generalist business background, technical fluency on purpose.",
    },
    {
      label: "How I work",
      text: "Tools-agnostic. Diagnose before building. I care whether a metric changes a decision and whether a workflow still works after its builder leaves.",
    },
    {
      label: "Now",
      text: "Building a people-analytics portfolio in public and shipping AI-built tools. Looking for teams where hiring is the growth strategy, not an afterthought.",
    },
  ],
  route: [
    {
      when: "Now · San Francisco",
      where: "Open to what's next",
      role: "Talent systems · People analytics · Sourcing leadership",
      detail: [
        "MBA in Analytics (STEM), Hult International Business School, 2026.",
        "Building a people-analytics portfolio in public — and shipping the tools I build along the way.",
      ],
      now: true,
    },
    {
      when: "2023 – 2024 · Jakarta",
      where: "PT Bank Mega Tbk",
      role: "Senior Sales Resourcing & Development",
      detail: [
        "Difficulty-weighted KPI scorecards for 15 recruiters across six regions.",
        "Referral anti-gaming system successors ran and extended for 12+ months.",
        "Turnover −15% in 2023, −17% in 2024.",
      ],
    },
    {
      when: "2022 – 2023 · Jakarta",
      where: "PT Bank Mega Tbk",
      role: "Resourcing Specialist",
      detail: [
        "Single-gate intake handling 10,000+ CVs a year.",
        "Hiring SLA −80%, admin workload −60%.",
      ],
    },
    {
      when: "2021 – 2022 · Jakarta",
      where: "SiCepat Ekspres Group · DigiResto",
      role: "Commercial Project Manager",
      detail: [
        "Real-time merchant acquisition dashboard across field sales and partnerships.",
        "Acquisitions +40% during the period.",
      ],
    },
  ],
  method: [
    {
      title: "Tools-agnostic",
      text: "Sheets to SQL — I build in whatever stack the team uses. Constraints are a design input, not an excuse.",
    },
    {
      title: "Diagnose before building",
      text: "Find where the work breaks under scale, then rebuild the operating flow. Never duties narration.",
    },
    {
      title: "Systems that outlast their builder",
      text: "Documented well enough that successors run it. The best systems don't need their builder in the room.",
    },
  ],
};

/* ---------------- WRITING ---------------- */
/* Essay candidates: real titles from the inventory + MBA adaptations.
   Each graduates to a published essay card. Redaction pass required. */
const WRITING = {
  eyebrow: "WRITING · ESSAYS & FIELD NOTES",
  headline: "Essays & field notes.",
  lede: "Analytical essays and leadership reflections — adapted from MBA coursework and work diaries. Names and proprietary detail redacted before anything publishes.",
  pipeline: [
    { title: "Managing up when the evidence is not the obstacle" },
    { title: "Rebuilding a company after the functions stopped talking" },
    { title: "Two field diaries from a bank strategy sprint" },
    { title: "Where my defaults cost the team" },
    { title: "What leading with purpose costs in practice" },
    { title: "Unlearning the instinct to look prepared" },
    { title: "What AI can and cannot do in an analytics role" },
  ],
  note: "MBA article adaptations — the branding/mental-effort essay and the AI-transformation founder's-voice audit — join this list after redaction.",
};
