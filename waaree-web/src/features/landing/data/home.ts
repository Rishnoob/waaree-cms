/**
 * Homepage content, taken from waaree.com (homepage components + About Us + navigation),
 * gathered 2026-10-30. Shaped like CMS blocks so the CMS can drive it later.
 * Links point to waaree.com until those pages exist here.
 */

export const WAAREE = "https://www.waaree.com";

/* ── Navigation (waaree.com mega menu) ─────────────────────────────────────── */
export const NAV = [
  {
    label: "Company",
    columns: [
      {
        title: "Company",
        links: [
          ["About Us", "/about-us"],
          ["Leadership", "/waaree-leadership-team"],
          ["Awards & Certificates", "/awards-and-certifications"],
          ["Waaree Foundation", "/waaree-foundation"],
        ],
      },
      {
        title: "Group Business",
        links: [
          ["Waaree Renewable Technologies", "/waaree-rtl"],
          ["Waaree Solar Americas", "/waaree-solar-americas"],
          ["Waaree Technologies", "/waaree-tech"],
          ["Waaree Clean Energy Solutions", "/waaree-ces-green-hydrogen"],
        ],
      },
    ],
  },
  {
    label: "Products",
    columns: [
      {
        title: "PV Modules",
        links: [
          ["All PV Modules", "/solar-pv-modules"],
          ["HJT Module", "/hjt-modules"],
          ["N-Type Module", "/solar-pv-modules/n-type"],
          ["Mono PERC", "/solar-pv-modules/mono-perc"],
          ["Flexible", "/solar-pv-modules/flexible-panels"],
          ["Special Module", "/solar-pv-modules/special-modules"],
        ],
      },
      {
        title: "Power & Storage",
        links: [
          ["Inverters", "/inverter"],
          ["Solar Kits", "/solar-radiance-kit"],
          ["BESS", "/solution/energy-storage"],
          ["Electrolyzer Stacks", "/electrolyser"],
          ["Smart Meter", "/smart-meter"],
          ["Transformer", "/transformer"],
        ],
      },
    ],
  },
  {
    label: "Solutions",
    columns: [
      {
        title: "By application",
        links: [
          ["Rooftop Solar", "/residential-rooftop-solar"],
          ["Energy Storage", "/solution/energy-storage"],
          ["Green Hydrogen", "/solution/green-hydrogen"],
          ["Balcony Solar", "/balcony-solar"],
        ],
      },
      {
        title: "Services",
        links: [
          ["EPC", "/epc"],
          ["Solar Financing", "/solution/financial-solutions"],
          ["Saving Calculator", "/saving-calculator"],
        ],
      },
    ],
  },
  {
    label: "Investors",
    columns: [
      {
        title: "Investor Relations",
        links: [
          ["Investor Relations", "/investor"],
          ["Annual Report", "/investor/annual-report"],
          ["Shareholding Pattern", "/investor/shareholding-pattern"],
          ["Stock Exchange Disclosures", "/investor/stock-exchange-disclosure"],
        ],
      },
      {
        title: "Governance",
        links: [
          ["Board of Directors", "/investor/board-and-committee"],
          ["Corporate Governance", "/investor/corporate-governance"],
          ["Policies", "/investor/policies"],
          ["Disclosure under Regulation 46", "/investor/disclosure-under-regulation-46"],
        ],
      },
    ],
  },
  {
    label: "People",
    columns: [
      {
        title: "People",
        links: [
          ["Life at Waaree", "/life-at-waaree"],
          ["Careers", "/careers"],
        ],
      },
      {
        title: "Network",
        links: [
          ["Franchise Partners", "/partner"],
          ["Rooftop Business Partner", "/rooftop-business"],
          ["Waaree Expert", "/waaree-expert"],
          ["Waaree Prime+", "/waaree-prime"],
        ],
      },
    ],
  },
] as const;

/* ── Hero stats (home-banner) ──────────────────────────────────────────────── */
export const HERO = {
  title: "Accelerating Global Energy Transition",
  oneLiner: "Cleaner, brighter future, one Renewable Energy solution at a time.",
  // Who we are, at a glance: figures not shown elsewhere on the page (IAR26)
  stats: [
    { value: 12.6, decimals: 1, unit: "GW", label: "Of modules made in FY26, a record year" },
    { value: 25, decimals: 0, unit: "+", label: "Countries Waaree supplies" },
    { value: 10633, decimals: 0, unit: "", label: "People who work at Waaree" },
    { value: 5.89, decimals: 2, unit: "GWp", label: "Of solar plants built for others" },
  ],
};

/* ── About (home-about-us) ─────────────────────────────────────────────────── */
export const ABOUT = {
  // waaree.com/about-us overview (condensed; country count shown once, from IAR26: 25+)
  text: "India’s largest PV module and solar cell maker. Established in 1990 and headquartered in Mumbai, Waaree brings solar modules, EPC, inverters, energy storage and green hydrogen together, made in India and the U.S.",
  businesses: [
    { label: "Solar Modules", href: "/solar-pv-modules" },
    { label: "Inverters", href: "/inverter" },
    { label: "Turnkey EPC", href: "/epc" },
    { label: "Green Hydrogen", href: "/solution/green-hydrogen" },
    { label: "Energy Storage", href: "/solution/energy-storage" },
  ],
};

/* ── Why Waaree (About Us → “Why Waaree?”) ─────────────────────────────────── */
export const WHY = {
  title: "Why customers choose Waaree as a long-term energy transition partner",
  leadText:
    "From solar PV modules and inverters to energy storage, EPC, green hydrogen, transformers, smart meters and aluminium, Waaree brings multiple energy-transition solutions together under one trusted ecosystem.",
  proof: [
    // IAR26 p. 26–27, as of 30 Jun 2026
    { value: "5.89 GWp", label: "Of solar plants built by Waaree" },
    { value: "~1.15 GWp", label: "Of plants Waaree runs and maintains" },
    { value: "10,461+ km", label: "Of transmission lines put up" },
    { value: "1,000+ MW", label: "Of power purchase agreements signed" },
  ],
  reasons: [
    { title: "Manufacturing strength at global scale", text: "Large-scale capabilities across India and the U.S. in modules, cells, inverters, batteries, electrolyzers and transformers." },
    { title: "From manufacturing to execution", text: "Beyond supplying products: turnkey EPC, renewable power generation, infrastructure projects and long-term asset management." },
    { title: "Quality tested. Reliability proven.", text: "In-house testing infrastructure, global certifications and extensive reliability testing for long-term performance." },
    { title: "Technology built for the future", text: "Next-generation solar technologies, intelligent inverters, advanced energy storage and green hydrogen." },
    { title: "Recognised for quality, bankability & sustainability", text: "Industry recognitions, global certifications and sustainability assessments behind every product." },
    { title: "Building beyond today", text: "Investing across solar, storage, green hydrogen, electrical infrastructure and advanced manufacturing for the next phase of the transition." },
  ],
};

/* ── Legacy (About Us → Our Legacy) ────────────────────────────────────────── */
export const LEGACY = {
  intro:
    "Waaree’s journey began with a bold vision: to lead India’s clean energy transformation. Over the years, it has grown into a global powerhouse in solar energy, known for innovation, reliability and scalable solutions.",
  timeline: [
    { year: "1985", title: "A village boy comes to Mumbai", text: "Hitesh Doshi leaves his village for college in Mumbai, and starts trading instrument gauges with ₹5,000 borrowed from a relative." },
    { year: "1989", title: "Entered instrument trading", text: "An entrepreneurial spirit fuels the birth of a company rooted in precision instruments." },
    { year: "1990", title: "Waaree Instruments founded", text: "A bold new chapter opens, paving the way for a future powered by sustainable innovation." },
    { year: "2007", title: "Forayed into solar", text: "At a Hamburg exhibition, solar thriving with only ~135 sunny days a year sparks a question: why not sunny India? A pioneering 30 MW line follows.", image: "/waaree/story/2007.png" },
    { year: "2011", title: "Launched the EPC business", text: "A strategic shift into Engineering, Procurement and Construction begins." },
    { year: "2014", title: "JV with NEEPCO", text: "A joint venture with NEEPCO (Waaneep) forges a path toward India’s energy goals." },
    { year: "2017", title: "Franchise channel partners", text: "A franchise model expands Waaree’s reach to the most remote corners of the country." },
    { year: "2018–19", title: "Began global expansion", text: "Global EPC begins, including a 49.5 MWp solar power project in Vietnam." },
    { year: "2019–21", title: "Scaled up to 2 GW", text: "Manufacturing capacity expands to 2 GW, with the franchise network soaring past 250 partners." },
    { year: "2022–24", title: "13.3 GW, and listed", text: "A global capacity of 13.3 GW, 1.6 GW in the US, and a listing on NSE & BSE, after an IPO subscribed 76 times." },
    { year: "2024–25", title: "Solar cells, and PLIs won", text: "Trial and commercial production of solar cells begins." },
    { year: "2025", title: "Transformers & smart meters", text: "Majority stakes in Kotsons Transformers and Racemosa Smart Meters." },
    { year: "2025–26", title: "A new scale", text: "23.75 GW of global module capacity, and Waaree reaches upstream into silicon itself." },
  ],
};

/* ── Portfolio (product-application) ───────────────────────────────────────── */
export const PORTFOLIO = {
  title: "Panels for every roof. Plants for every field.",
  tabs: [
    {
      key: "product",
      label: "By product",
      text: "What Waaree makes, from the panel on your roof to the inverter beside it.",
      items: [
        { title: "Solar panels", text: "TOPCon panels up to 715 W, built to last decades.", image: "/waaree/portfolio/pv-modules.webp", href: "/solar-pv-modules", fit: "contain" },
        { title: "Inverters", text: "Turn the panels’ power into power your home can use.", image: "/waaree/portfolio/inverters.webp", href: "/inverter", fit: "contain" },
        { title: "Solar kits", text: "Everything for a small system, in one box.", image: "/waaree/portfolio/solar-kits.webp", href: "/solar-radiance-kit", fit: "contain" },
      ],
    },
    {
      key: "application",
      label: "By application",
      text: "Where Waaree puts the sun to work: on the ground, on roofs and on water.",
      items: [
        { title: "Solar farms", text: "Rows of panels across open land, built for utilities and industry.", image: "/waaree/portfolio/ground-mounted.webp", href: "/epc", fit: "cover" },
        { title: "Rooftop solar", text: "An empty roof that pays your power bill.", image: "/waaree/portfolio/rooftop.webp", href: "/residential-rooftop-solar", fit: "cover" },
        { title: "Floating solar", text: "Panels on lakes and reservoirs, with no land needed.", image: "/waaree/portfolio/floating.webp", href: "/blog/floating-solar-panels-what-you-need-to-know", fit: "cover" },
      ],
    },
  ],
} as const;

/* ── Solutions + group companies (solution, group-sites) ───────────────────── */
export const SOLUTIONS = {
  title: "Beyond the panel: plants built, fuel made, power stored.",
  items: [
    { title: "Building solar plants (EPC)", text: "Waaree designs, builds and hands over complete solar plants: 5.89 GWp so far.", image: "/waaree/solutions/epc.webp", href: "/epc", company: "WAAREE RTL", companyText: "Delivering turnkey renewable EPC projects with quality, safety & on-time delivery." },
    { title: "Green hydrogen", text: "Electrolysers that turn solar power and water into clean fuel for industry.", image: "/waaree/solutions/green-hydrogen.webp", href: "/solution/green-hydrogen", company: "WAAREE CES", companyText: "Decarbonising industries with cutting-edge green hydrogen solutions." },
    { title: "Battery storage", text: "Store the afternoon sun and use it after dark.", image: "/waaree/solutions/bess.jpg", href: "/solution/energy-storage", company: "WAAREE Tech", companyText: "Fueling industry with innovative battery technologies." },
  ],
};

/* ── Manufacturing excellence (video-section) ──────────────────────────────── */
export const MANUFACTURING = {
  title: "Manufacturing Excellence",
  text: "With world-class manufacturing facilities and automated production lines, Waaree delivers high-performance solar modules, inverters & energy storage systems.",
  innovations: [
    { title: "HTAR front glass", text: "High Transmission Anti-Reflective coated glass enhances light intake." },
    { title: "Extended junction box", text: "Longer junction box length for wiring flexibility." },
    { title: "White masking sheet", text: "Reflects light that would otherwise be lost." },
    { title: "NABL-accredited labs", text: "In-house labs ensure rigorous quality testing and product reliability." },
  ],
  film: { title: "Waaree corporate film", youtubeId: "jCZ0LNS3p5s", poster: "/waaree/story/film.webp" },
};

/* ── Impact (ESG & CSR, vision, values) ────────────────────────────────────── */
export const IMPACT = {
  title: "Empowering communities. Preserving the planet.",
  text: "Waaree’s ESG and CSR initiatives are creating real-world impact by empowering communities, preserving resources, and shaping a sustainable future.",
  links: [
    { label: "Learn about ESG", href: "/esg" },
    { label: "Learn about CSR", href: "/csr" },
  ],
  mission: "Driven by our commitment to stakeholders, we continuously enhance the quality of our products and services to deliver lasting value and impact.",
  vision:
    "To make sustainable energy accessible and affordable across emerging markets by delivering high-quality renewable solutions that reduce carbon emissions and enhance lives through a cleaner, brighter future.",
  values: [
    { title: "Customer First", lines: ["We go beyond expectations", "Your journey is our own", "A partnership for life"] },
    { title: "Integrity", lines: ["Built on trust with you", "Our purpose is our word", "Honoring an ethos of good"] },
    { title: "Safety", lines: ["A safe, reliable future", "Secure & lasting solutions", "The highest quality matters"] },
  ],
  image: "/waaree/story/csr.webp",
};

/* ── Saving calculator (calculator-banner) ─────────────────────────────────── */
export const CALCULATOR = { title: "Higher electricity bill? Know your saving potential.", cta: "Calculate your savings", href: "/saving-calculator" };

/* ── Newsroom (resources) — a selection of the latest items on waaree.com ──── */
export const NEWS = [
  { date: "01 Sep 2026", title: "Waaree Transpower invests ₹192 crore to expand high-voltage transformer manufacturing", tag: "Press release" },
  { date: "29 Jul 2026", title: "New orders worth ~₹16k crore take the total order book to ~₹61.5k crore", tag: "Press release" },
  { date: "16 Jul 2026", title: "Waaree Energy Storage Solutions commences India’s advanced automated BESS container manufacturing facility", tag: "Press release" },
  { date: "30 Jun 2026", title: "Waaree Solar Americas expands U.S. order book with a 236 MW utility-scale module contract", tag: "Press release" },
  { date: "27 May 2026", title: "Waaree solar panels named among the world’s most reliable for the 5th year in a row", tag: "Recognition" },
  { date: "30 Apr 2026", title: "FY26: revenue up 83.72% to ₹26,536.77 crore; PAT grows 101.45%", tag: "Results" },
];

export const EVENTS = [
  { date: "22–24 Oct 2026", title: "Renewable Energy India Expo", place: "India Expo Mart, Noida" },
  { date: "17–19 Sep 2026", title: "SEMICON India", place: "Yashobhoomi, Delhi" },
  { date: "10 Sep 2026", title: "3rd Energy Storage Conference", place: "New Delhi" },
  { date: "9–11 Sep 2026", title: "H2 & FC Expo", place: "Makuhari Messe, Japan" },
  { date: "1–3 Sep 2026", title: "Middle East Energy (Intersolar)", place: "World Trade Center, Dubai" },
  { date: "23–25 Jun 2026", title: "Intersolar Europe", place: "Messe München, Germany" },
];

export const CASE_STUDIES = [
  { title: "153.6 MW hybrid solar project, Dalavaipuram", text: "End-to-end EPC by Waaree RTL with bifacial technology, advancing Tamil Nadu’s clean energy goals." },
  { title: "100 MW high-efficiency installation for Morjar Renewables", text: "Bifacial modules, central inverters and precision engineering in Gujarat." },
  { title: "Ground-mount solar for Continuum, Rajkot", text: "A grid-connected utility-scale plant supporting Gujarat’s renewable goals." },
  { title: "Industrial rooftop for Asahi India Glass", text: "Lower electricity costs and lower emissions at a manufacturing site." },
];

/* ── Enquiry (home-form) ───────────────────────────────────────────────────── */
export const ENQUIRY = {
  title: "Let’s go green",
  topics: [
    "Solar PV Modules",
    "Renewable EPC Solutions",
    "Public Relations",
    "Media Relations",
    "Channel Partner",
    "Waaree Prime+ Loyalty Program",
    "Become a Vendor",
    "Others",
  ],
};

/* ── Footer ────────────────────────────────────────────────────────────────── */
export const FOOTER = {
  address: "602, 6th Floor, Western Edge – I, off Western Express Highway, Borivali (East), Mumbai – 400066",
  phone: "022 6644 4444",
  email: "waaree@waaree.com",
  columns: [
    { title: "Company", links: [["About Us", "/about-us"], ["Leadership", "/waaree-leadership-team"], ["Awards & Recognitions", "/awards-and-certifications"], ["Waaree India Foundation", "/waaree-foundation"]] },
    { title: "Group", links: [["Waaree Renewable Technologies", "/waaree-rtl"], ["Waaree Technologies", "/waaree-tech"], ["Waaree Solar Americas", "/waaree-solar-americas"], ["Indosolar Limited", "/our-office"], ["Waaree Transpower", "/transformer"]] },
    { title: "Resources", links: [["Blogs", "/blogs"], ["Case Studies", "/filter-data"], ["Download Center", "/download-center"], ["Saving Calculator", "/saving-calculator"], ["Whitepapers", "/whitepapers"]] },
    { title: "Contact", links: [["Contact us", "/contact-us"], ["Our Offices", "/our-office"], ["Careers", "/careers"], ["Press Release", "/press-release"], ["Warranty Support – Module", "/waaree-support-module"]] },
  ],
  legal: [["Terms of use", "/term-of-us"], ["Privacy policy", "/privacy-policy"]],
} as const;
