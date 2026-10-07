/* ============================================================
   content.js — project case-study bodies (featured cards on home).
   Everyday text (hero, about, writing, site links) now lives in
   data/*.json and is edited from the /admin/ page. Do not add
   page copy here.
   ============================================================ */

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
