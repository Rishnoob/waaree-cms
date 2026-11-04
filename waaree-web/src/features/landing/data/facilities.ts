/**
 * Waaree's sites, as published on waaree.com (Our Offices page + press releases).
 * Every fact carries its source. Don't add numbers that aren't published by Waaree.
 * Later this list comes from the CMS (a "facilities" content type).
 */

export type FacilityKind = "manufacturing" | "office" | "development";
export type FacilityStatus = "operational" | "under-construction";

export type Facility = {
  slug: string;
  name: string;
  /** Short name for pins and lists. */
  short: string;
  kind: FacilityKind;
  status: FacilityStatus;
  /** What happens here, in a few words. */
  makes: string;
  region: string;
  country: "India" | "USA" | "UAE";
  /** Approximate town coordinates (for the map only). */
  lat: number;
  lon: number;
  /** Pins this close together are fanned out as one group on the India map. */
  cluster?: "south-gujarat";
  address?: string;
  image?: string;
  imageAlt?: string;
  /** One-line hook shown in the hover card. */
  headline: string;
  /** Detail-page story (a few short paragraphs). */
  story: string[];
  facts: { label: string; value: string }[];
  source: { label: string; url: string; date?: string };
};

const OFFICES = { label: "waaree.com · Our Offices", url: "https://www.waaree.com/our-office" };

export const FACILITIES: Facility[] = [
  {
    slug: "chikhli",
    name: "Chikhli Manufacturing Unit (Waaree Shree Godiji Factory)",
    short: "Chikhli",
    kind: "manufacturing",
    status: "operational",
    makes: "Solar module manufacturing",
    region: "Gujarat",
    country: "India",
    lat: 20.76,
    lon: 73.06,
    cluster: "south-gujarat",
    address: "Waaree Shree Godiji Factory, New Survey no. 1928, Village Degam, Taluka Chikhli – 396530, Gujarat",
    image: "/waaree/factories/chikhli.jpg",
    imageAlt: "Aerial view of Waaree’s Chikhli manufacturing campus",
    headline: "A module campus at the heart of Waaree’s south Gujarat belt.",
    story: [
      "Rows of automated lines under one vast roof: Chikhli is where Waaree’s scale becomes visible from the sky.",
      "The campus is part of the south Gujarat manufacturing belt that, together with Nandigram, Tumb and Sarodhi, powers Waaree’s modules and inverters.",
    ],
    facts: [
      { label: "Type", value: "Solar module manufacturing" },
      { label: "Location", value: "Chikhli, Navsari, Gujarat" },
    ],
    source: OFFICES,
  },
  {
    slug: "nandigram",
    name: "Nandigram Manufacturing Facility",
    short: "Nandigram",
    kind: "manufacturing",
    status: "operational",
    makes: "Solar module manufacturing",
    region: "Gujarat",
    country: "India",
    lat: 20.4,
    lon: 72.95,
    cluster: "south-gujarat",
    address: "CBIPL Nandigram, Nandigram – 396105, Gujarat",
    image: "/waaree/factories/nandigram.webp",
    imageAlt: "Aerial view of the Nandigram facility with its rooftops covered in solar panels",
    headline: "A factory that runs on its own product: its rooftops are covered in solar.",
    story: [
      "From the air, Nandigram looks like what it makes: roof after roof of solar panels, surrounded by green.",
      "It’s a quiet proof of the promise Waaree sells: clean power, made where it’s used.",
    ],
    facts: [
      { label: "Type", value: "Solar module manufacturing" },
      { label: "Location", value: "Nandigram, Gujarat" },
    ],
    source: OFFICES,
  },
  {
    slug: "tumb",
    name: "Tumb Manufacturing Facility",
    short: "Tumb",
    kind: "manufacturing",
    status: "operational",
    makes: "Solar module manufacturing",
    region: "Gujarat",
    country: "India",
    lat: 20.23,
    lon: 72.8,
    cluster: "south-gujarat",
    address: "Survey No. 38/1, Tumb Village, Tumb, Umbergaon, Valsad – 396150, Gujarat",
    image: "/waaree/factories/tumb.webp",
    imageAlt: "Aerial view of the Tumb facility, solar on the roof and trucks loading modules",
    headline: "Solar on the roof, trucks at the gate: modules leaving for the world.",
    story: [
      "At Tumb, the day starts with trucks lined up at the loading bays, ready to carry Waaree modules to projects across India and beyond.",
      "The plant’s own roof is covered in panels, powering the line that makes them.",
    ],
    facts: [
      { label: "Type", value: "Solar module manufacturing" },
      { label: "Location", value: "Umbergaon, Valsad, Gujarat" },
    ],
    source: OFFICES,
  },
  {
    slug: "sarodhi",
    name: "Sarodhi Inverter Manufacturing Facility (Waaree Power)",
    short: "Sarodhi",
    kind: "manufacturing",
    status: "operational",
    makes: "Solar inverters",
    region: "Gujarat",
    country: "India",
    lat: 20.62,
    lon: 72.98,
    cluster: "south-gujarat",
    image: "/waaree/portfolio/inverters.webp",
    imageAlt: "Waaree solar inverter",
    headline: "3.05 GW a year of inverters: the brain of every solar system.",
    story: [
      "Inverters are often called the brain of a solar plant. They turn sunlight’s direct current into power the grid can use, and keep it stable.",
      "Waaree’s Sarodhi facility runs two production lines of 1.525 GW each, taking total inverter capacity to 3.05 GW a year. Commercial operations began on 29 December 2025.",
    ],
    facts: [
      { label: "Inverter capacity", value: "3.05 GW / year" },
      { label: "Lines", value: "2 × 1.525 GW" },
      { label: "Operational since", value: "29 Dec 2025" },
      { label: "Operator", value: "Waaree Power Pvt. Ltd." },
    ],
    source: {
      label: "waaree.com press release",
      url: "https://www.waaree.com/press-release/waaree-energies-strengthens-indias-grid-ready-solar-ecosystem-with-commissioning-of-305-gw-inverter-manufacturing-facility-in-gujarat",
      date: "30 Dec 2025",
    },
  },
  {
    slug: "samakhiali",
    name: "Samakhiali Manufacturing Facility",
    short: "Samakhiali",
    kind: "manufacturing",
    status: "operational",
    makes: "Solar module manufacturing",
    region: "Kutch, Gujarat",
    country: "India",
    lat: 23.3,
    lon: 70.58,
    headline: "Now 3 GW a year: one of Waaree’s most advanced module hubs.",
    story: [
      "In the open landscape of Kutch, Samakhiali grew fast: two new high-efficiency lines of 750 MW each, then another 1.5 GW.",
      "Today the site makes 3 GW of modules a year, with next-generation automation, rigorous quality controls and integrated testing.",
    ],
    facts: [
      { label: "Module capacity", value: "3 GW / year" },
      { label: "Latest addition", value: "+1.5 GW (Dec 2025)" },
      { label: "Location", value: "Kutch, Gujarat" },
    ],
    source: {
      label: "waaree.com press release",
      url: "https://www.waaree.com/press-release/waaree-energies-expands-manufacturing-capacity-with-additional-15-gw-at-its-samakhiali-facility",
      date: "12 Dec 2025",
    },
  },
  {
    slug: "indosolar",
    name: "Indosolar Limited",
    short: "Greater Noida",
    kind: "manufacturing",
    status: "operational",
    makes: "Solar manufacturing (a Waaree group company)",
    region: "Uttar Pradesh",
    country: "India",
    lat: 28.47,
    lon: 77.5,
    address: "3C/1, Eco Tech-II, Udyog Vihar, Greater Noida, Uttar Pradesh",
    image: "/waaree/factories/indosolar.png",
    imageAlt: "A Waaree team member at the Indosolar production line",
    headline: "Where Waaree’s people and precision meet: a group company in the north.",
    story: [
      "Behind every module is a person who checks it. At Indosolar, a Waaree group company in Greater Noida, that care is part of every line.",
    ],
    facts: [
      { label: "Type", value: "Solar manufacturing" },
      { label: "Location", value: "Greater Noida, Uttar Pradesh" },
    ],
    source: OFFICES,
  },
  {
    slug: "nagpur",
    name: "Nagpur Integrated Ingot & Wafer Complex",
    short: "Nagpur",
    kind: "development",
    status: "under-construction",
    makes: "Solar ingots and wafers (upcoming)",
    region: "Butibori, Maharashtra",
    country: "India",
    lat: 20.93,
    lon: 78.94,
    headline: "India’s largest integrated ingot & wafer complex is rising here.",
    story: [
      "Every solar cell begins as an ingot of pure silicon, sliced into wafers. Until now, much of that has come from abroad.",
      "At Butibori, Nagpur, Waaree broke ground on 14 March 2026 on a 300-acre complex with 10 GW each of ingot and wafer capacity: India’s largest. Once operational, it’s expected to create over 8,000 direct and indirect jobs.",
    ],
    facts: [
      { label: "Ingot capacity", value: "10 GW (planned)" },
      { label: "Wafer capacity", value: "10 GW (planned)" },
      { label: "Site", value: "300 acres" },
      { label: "Investment", value: "~₹6,200 crore" },
      { label: "Jobs", value: "8,000+ direct & indirect (expected)" },
      { label: "Groundbreaking", value: "14 Mar 2026" },
    ],
    source: {
      label: "waaree.com press release",
      url: "https://www.waaree.com/press-release/waaree-energies-limited-announces-indias-largest-10-gw-integrated-ingot-and-wafer-manufacturing-facility-in-nagpur",
      date: "14 Mar 2026",
    },
  },
  {
    slug: "mumbai-hq",
    name: "Corporate Headquarters, Mumbai",
    short: "Mumbai HQ",
    kind: "office",
    status: "operational",
    makes: "Corporate headquarters",
    region: "Borivali, Mumbai",
    country: "India",
    lat: 19.23,
    lon: 72.86,
    address: "602, Western Edge I, Off Western Express Highway, Borivali East, Mumbai – 400066",
    image: "/waaree/factories/mumbai-hq.webp",
    imageAlt: "Waaree’s corporate headquarters in Borivali, Mumbai",
    headline: "Where it all began, and where the next decade is planned.",
    story: ["Waaree’s journey began in Mumbai in 1989. The company’s headquarters is still here, in Borivali."],
    facts: [
      { label: "Phone", value: "022 6644 4444" },
      { label: "Email", value: "waaree@waaree.com" },
    ],
    source: OFFICES,
  },
  {
    slug: "texas",
    name: "Waaree Solar Americas, Brookshire",
    short: "Texas, USA",
    kind: "manufacturing",
    status: "operational",
    makes: "Made-in-America solar modules",
    region: "Brookshire, Texas",
    country: "USA",
    lat: 29.78,
    lon: -95.95,
    address: "2439 Discovery Hills Parkway, Brookshire, TX, USA",
    image: "/waaree/factories/texas.webp",
    imageAlt: "Waaree Solar Americas facility in Brookshire, Texas",
    headline: "Made in America, by an Indian champion.",
    story: [
      "In Texas, Waaree Solar Americas makes modules for America’s utility-scale projects, carrying an Indian company’s craft to the world’s largest markets.",
      "As of December 2025, Waaree’s module capacity in the United States stood at about 2.6 GW.",
    ],
    facts: [
      { label: "US module capacity", value: "~2.6 GW (Dec 2025)" },
      { label: "Phone", value: "+1 (281) 375-1000" },
    ],
    source: {
      label: "waaree.com · Our Offices & press release",
      url: "https://www.waaree.com/press-release/waaree-energies-expands-manufacturing-capacity-with-additional-15-gw-at-its-samakhiali-facility",
      date: "12 Dec 2025",
    },
  },
  {
    slug: "arizona",
    name: "Waaree Solar Americas, Arizona",
    short: "Arizona, USA",
    kind: "office",
    status: "operational",
    makes: "Waaree Solar Americas site",
    region: "Goodyear, Arizona",
    country: "USA",
    lat: 33.43,
    lon: -112.36,
    address: "1685 S Litchfield Rd, Goodyear, AZ 85338, USA",
    headline: "Waaree’s growing footprint in the American Southwest.",
    story: ["Waaree Solar Americas’ Arizona site in Goodyear extends the company’s US presence."],
    facts: [{ label: "Location", value: "Goodyear, Arizona" }],
    source: OFFICES,
  },
  {
    slug: "dubai",
    name: "Waaree Energies Middle East FZE",
    short: "Dubai, UAE",
    kind: "office",
    status: "operational",
    makes: "Middle East office",
    region: "Jebel Ali Free Zone, Dubai",
    country: "UAE",
    lat: 25.01,
    lon: 55.06,
    address: "Jebel Ali Free Trade Zone, Dubai, UAE",
    headline: "Serving the Middle East from Jebel Ali.",
    story: ["Waaree’s Middle East office in Jebel Ali, Dubai, serves customers across the region."],
    facts: [
      { label: "Phone", value: "+971 52 689 7374" },
      { label: "Email", value: "waareeme@waaree.com" },
    ],
    source: OFFICES,
  },
];

/** Recent developments (waaree.com press releases), newest first. */
export const DEVELOPMENTS = [
  {
    date: "Sep 2026",
    title: "500 MVA, 400 kV transformer facility",
    text: "Waaree Transpower invests ~₹192 crore to expand high-voltage transformer manufacturing.",
    tag: "Transformers",
  },
  {
    date: "Jul 2026",
    title: "India’s advanced automated BESS container factory",
    text: "5.15 GWh, Industry 4.0 with AGVs: the first milestone of Waaree ESS’s 20 GWh roadmap.",
    tag: "Energy storage",
  },
  {
    date: "Mar 2026",
    title: "10 GW ingot & wafer complex, Nagpur",
    text: "Ground broken on India’s largest integrated ingot & wafer facility: 300 acres, ~₹6,200 crore.",
    tag: "Under construction",
    slug: "nagpur",
  },
  {
    date: "Dec 2025",
    title: "3.05 GW inverter facility, Sarodhi",
    text: "Two 1.525 GW lines commissioned in Valsad, Gujarat.",
    tag: "Inverters",
    slug: "sarodhi",
  },
  {
    date: "Dec 2025",
    title: "Samakhiali scales to 3 GW",
    text: "An additional 1.5 GW of module capacity in Kutch, Gujarat.",
    tag: "Modules",
    slug: "samakhiali",
  },
];

export const facilityBySlug = (slug: string) => FACILITIES.find((f) => f.slug === slug);
