/**
 * Hard Technology Venture Ecosystem Database
 * Comprehensive list of VCs, lawyers, accountants, and advisors specializing in hard tech
 *
 * Categories: Deep Tech, Climate Tech, Biotech, Space Tech, Robotics, Advanced Manufacturing,
 * Energy, Materials Science, Quantum Computing, AI Hardware
 */

export type AdvisorCategory = 'VC' | 'Law Firm' | 'Accounting Firm' | 'Strategic Advisor' | 'Technical Advisor';
export type HardTechFocus =
  | 'Deep Tech'
  | 'Climate Tech'
  | 'Biotech'
  | 'Space Tech'
  | 'Robotics'
  | 'Advanced Manufacturing'
  | 'Energy'
  | 'Materials Science'
  | 'Quantum Computing'
  | 'AI Hardware'
  | 'Semiconductors'
  | 'Aerospace'
  | 'Cleantech'
  | 'Agtech'
  | 'All Sectors';

export type Stage = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'Growth' | 'All Stages';
export type Geography = 'US' | 'UK' | 'EU' | 'Asia' | 'Global';

export interface HardTechAdvisor {
  id: string;
  name: string;
  category: AdvisorCategory;
  focus: HardTechFocus[];
  stages: Stage[];
  geography: Geography[];
  description: string;
  website: string;
  notableInvestments?: string[]; // For VCs
  specialties?: string[]; // For lawyers/accountants/advisors
  keyPeople?: string[];
  checkSize?: string; // For VCs
  portfolioCount?: number; // For VCs
  founded?: number;
  tags: string[];
}

// ============================================
// VENTURE CAPITAL FIRMS
// ============================================

export const HARD_TECH_VCS: HardTechAdvisor[] = [
  // Top Tier Hard Tech VCs
  {
    id: 'breakthrough-energy-ventures',
    name: 'Breakthrough Energy Ventures',
    category: 'VC',
    focus: ['Climate Tech', 'Energy', 'Advanced Manufacturing'],
    stages: ['Series A', 'Series B', 'Series C+'],
    geography: ['Global'],
    description: 'Bill Gates-backed climate and energy innovation fund investing in technologies to reach net-zero emissions',
    website: 'https://www.breakthroughenergy.org',
    notableInvestments: ['Commonwealth Fusion Systems', 'Form Energy', 'QuantumScape', 'Turntide Technologies'],
    keyPeople: ['Carmichael Roberts', 'Eric Toone'],
    checkSize: '$10M - $100M+',
    portfolioCount: 100,
    founded: 2015,
    tags: ['climate', 'energy', 'net-zero', 'bill-gates', 'deep-tech'],
  },
  {
    id: 'lux-capital',
    name: 'Lux Capital',
    category: 'VC',
    focus: ['Deep Tech', 'Biotech', 'Robotics', 'AI Hardware', 'Space Tech'],
    stages: ['Seed', 'Series A', 'Series B', 'Series C+'],
    geography: ['US', 'Global'],
    description: 'Venture capital firm investing in emerging science and technology ventures at the outermost edges of what is possible',
    website: 'https://www.luxcapital.com',
    notableInvestments: ['Planet Labs', 'Desktop Metal', 'Zoox', 'Anduril', 'Shiru'],
    keyPeople: ['Josh Wolfe', 'Peter Hebert', 'Deena Shakir'],
    checkSize: '$5M - $50M',
    portfolioCount: 200,
    founded: 2000,
    tags: ['deep-tech', 'science', 'frontier-tech', 'dual-use'],
  },
  {
    id: 'dcvc',
    name: 'DCVC (Data Collective)',
    category: 'VC',
    focus: ['Deep Tech', 'AI Hardware', 'Robotics', 'Advanced Manufacturing', 'Biotech'],
    stages: ['Seed', 'Series A', 'Series B'],
    geography: ['US', 'Global'],
    description: 'Deep tech VC firm focused on AI, machine learning, and computational sciences',
    website: 'https://www.dcvc.com',
    notableInvestments: ['Vicarious Surgical', 'Rigetti Computing', 'Mythic AI', 'Seismic'],
    keyPeople: ['Matt Ocko', 'Zachary Bogue', 'Mike Driscoll'],
    checkSize: '$2M - $30M',
    portfolioCount: 150,
    founded: 2011,
    tags: ['ai', 'ml', 'computational-sciences', 'deep-tech'],
  },
  {
    id: 'khosla-ventures',
    name: 'Khosla Ventures',
    category: 'VC',
    focus: ['Climate Tech', 'Energy', 'Biotech', 'Advanced Manufacturing', 'AI Hardware'],
    stages: ['Seed', 'Series A', 'Series B', 'Series C+'],
    geography: ['US', 'Global'],
    description: 'Venture capital firm investing in impactful technologies across energy, health, and enterprise',
    website: 'https://www.khoslaventures.com',
    notableInvestments: ['Impossible Foods', 'Quantumscape', 'Oklo', 'LanzaTech'],
    keyPeople: ['Vinod Khosla', 'Samir Kaul'],
    checkSize: '$1M - $50M',
    portfolioCount: 300,
    founded: 2004,
    tags: ['climate', 'energy', 'biotech', 'impact'],
  },
  {
    id: 'founders-fund',
    name: 'Founders Fund',
    category: 'VC',
    focus: ['Deep Tech', 'Space Tech', 'Biotech', 'AI Hardware', 'Advanced Manufacturing'],
    stages: ['Seed', 'Series A', 'Series B', 'Series C+', 'Growth'],
    geography: ['US', 'Global'],
    description: 'Technology-focused VC firm backing companies building revolutionary technologies',
    website: 'https://foundersfund.com',
    notableInvestments: ['SpaceX', 'Anduril', 'Varda Space', 'Relativity Space'],
    keyPeople: ['Peter Thiel', 'Brian Singerman', 'Trae Stephens'],
    checkSize: '$5M - $100M+',
    portfolioCount: 250,
    founded: 2005,
    tags: ['frontier-tech', 'space', 'defense', 'moonshots'],
  },
  {
    id: 'eclipse-ventures',
    name: 'Eclipse Ventures',
    category: 'VC',
    focus: ['Advanced Manufacturing', 'Robotics', 'Deep Tech', 'AI Hardware'],
    stages: ['Series A', 'Series B'],
    geography: ['US'],
    description: 'Focuses on "atoms not bits" - investing in companies that make physical things',
    website: 'https://eclipse.vc',
    notableInvestments: ['Fictiv', 'Velo3D', 'Bright Machines', 'Formlabs'],
    keyPeople: ['Greg Reichow', 'Lior Susan'],
    checkSize: '$10M - $40M',
    portfolioCount: 50,
    founded: 2015,
    tags: ['manufacturing', 'hardware', 'atoms-not-bits', 'industrial'],
  },
  {
    id: 'playground-global',
    name: 'Playground Global',
    category: 'VC',
    focus: ['Deep Tech', 'Robotics', 'AI Hardware', 'Advanced Manufacturing'],
    stages: ['Seed', 'Series A'],
    geography: ['US', 'Global'],
    description: 'Deep tech venture fund and studio focused on computing, robotics, and advanced hardware',
    website: 'https://playground.global',
    notableInvestments: ['Gecko Robotics', 'Modular', 'Samsara'],
    keyPeople: ['Andy Rubin', 'Peter Barrett', 'Bruce Leak'],
    checkSize: '$5M - $20M',
    portfolioCount: 40,
    founded: 2015,
    tags: ['robotics', 'hardware', 'studio', 'deep-tech'],
  },
  {
    id: 'nea',
    name: 'NEA (New Enterprise Associates)',
    category: 'VC',
    focus: ['Deep Tech', 'Biotech', 'Energy', 'Advanced Manufacturing'],
    stages: ['Seed', 'Series A', 'Series B', 'Series C+', 'Growth'],
    geography: ['US', 'Global'],
    description: 'One of the world\'s largest VC firms with significant hard tech portfolio',
    website: 'https://www.nea.com',
    notableInvestments: ['Desktop Metal', 'Bloom Energy', 'Natera'],
    keyPeople: ['Scott Sandell', 'Mohamad Makhzoumi'],
    checkSize: '$5M - $100M+',
    portfolioCount: 400,
    founded: 1977,
    tags: ['established', 'multi-stage', 'large-fund'],
  },

  // Climate & Energy Focused
  {
    id: 'prime-coalition',
    name: 'Prime Coalition',
    category: 'VC',
    focus: ['Climate Tech', 'Energy', 'Advanced Manufacturing'],
    stages: ['Seed', 'Series A', 'Series B'],
    geography: ['US', 'Global'],
    description: 'Catalytic capital organization focused on climate impact',
    website: 'https://primecoalition.org',
    notableInvestments: ['Boston Metal', 'Sublime Systems', 'KoBold Metals'],
    keyPeople: ['Sarah Kearney'],
    checkSize: '$500K - $10M',
    portfolioCount: 30,
    founded: 2014,
    tags: ['climate', 'catalytic-capital', 'impact'],
  },
  {
    id: 'energy-impact-partners',
    name: 'Energy Impact Partners',
    category: 'VC',
    focus: ['Energy', 'Climate Tech', 'Cleantech'],
    stages: ['Series A', 'Series B', 'Series C+'],
    geography: ['US', 'Global'],
    description: 'Strategic investor backed by major energy companies',
    website: 'https://www.energyimpactpartners.com',
    notableInvestments: ['Stem', 'ChargePoint', 'AutoGrid'],
    keyPeople: ['Hans Kobler', 'Shayle Kann'],
    checkSize: '$10M - $50M',
    portfolioCount: 80,
    founded: 2015,
    tags: ['energy', 'utility-backed', 'grid'],
  },
  {
    id: '50-years',
    name: '50 Years',
    category: 'VC',
    focus: ['Climate Tech', 'Energy', 'Advanced Manufacturing'],
    stages: ['Seed', 'Series A'],
    geography: ['US'],
    description: 'Climate tech venture capital firm',
    website: 'https://www.50years.com',
    keyPeople: ['Seth Bannon'],
    checkSize: '$1M - $10M',
    portfolioCount: 25,
    founded: 2020,
    tags: ['climate', 'early-stage'],
  },

  // Space Tech Focused
  {
    id: 'seraphim-capital',
    name: 'Seraphim Space',
    category: 'VC',
    focus: ['Space Tech', 'Aerospace'],
    stages: ['Seed', 'Series A', 'Series B'],
    geography: ['UK', 'EU', 'US', 'Global'],
    description: 'World\'s leading space tech investor',
    website: 'https://seraphim.vc',
    notableInvestments: ['Spire Global', 'LeoLabs', 'Astroscale'],
    keyPeople: ['Mark Boggett', 'Rob Desborough'],
    checkSize: '$2M - $20M',
    portfolioCount: 100,
    founded: 2016,
    tags: ['space', 'satellite', 'global-leader'],
  },
  {
    id: 'space-capital',
    name: 'Space Capital',
    category: 'VC',
    focus: ['Space Tech', 'Aerospace'],
    stages: ['Seed', 'Series A', 'Series B'],
    geography: ['US', 'Global'],
    description: 'Venture capital firm investing in the Space Economy',
    website: 'https://www.spacecapital.com',
    keyPeople: ['Chad Anderson'],
    checkSize: '$1M - $15M',
    portfolioCount: 60,
    founded: 2012,
    tags: ['space', 'satellite', 'infrastructure'],
  },

  // Biotech & Life Sciences
  {
    id: 'flagship-pioneering',
    name: 'Flagship Pioneering',
    category: 'VC',
    focus: ['Biotech', 'Materials Science'],
    stages: ['Seed', 'Series A', 'Series B', 'Series C+'],
    geography: ['US', 'Global'],
    description: 'Innovation firm creating and building pioneering life sciences companies',
    website: 'https://www.flagshippioneering.com',
    notableInvestments: ['Moderna', 'Indigo Agriculture', 'Sana Biotechnology'],
    keyPeople: ['Noubar Afeyan'],
    checkSize: '$10M - $100M+',
    portfolioCount: 100,
    founded: 2000,
    tags: ['biotech', 'life-sciences', 'venture-creation'],
  },
  {
    id: 'arch-venture-partners',
    name: 'ARCH Venture Partners',
    category: 'VC',
    focus: ['Biotech', 'Deep Tech', 'Materials Science'],
    stages: ['Seed', 'Series A', 'Series B'],
    geography: ['US'],
    description: 'Early-stage VC firm focused on transforming scientific discoveries into new companies',
    website: 'https://www.archventure.com',
    notableInvestments: ['Juno Therapeutics', 'Precigen', 'Lyell Immunopharma'],
    keyPeople: ['Robert Nelsen', 'Keith Crandell'],
    checkSize: '$5M - $40M',
    portfolioCount: 150,
    founded: 1986,
    tags: ['biotech', 'science-based', 'university-spinouts'],
  },

  // Quantum & Advanced Computing
  {
    id: 'innovation-endeavors',
    name: 'Innovation Endeavors',
    category: 'VC',
    focus: ['Deep Tech', 'Quantum Computing', 'AI Hardware'],
    stages: ['Seed', 'Series A', 'Series B'],
    geography: ['US', 'Global'],
    description: 'VC firm investing in transformational technologies',
    website: 'https://www.innovationendeavors.com',
    notableInvestments: ['Planet Labs', 'Aurora', 'Rigetti Computing'],
    keyPeople: ['Eric Schmidt', 'Dror Berman'],
    checkSize: '$5M - $30M',
    portfolioCount: 80,
    founded: 2010,
    tags: ['deep-tech', 'quantum', 'schmidt-backed'],
  },

  // UK/Europe Hard Tech
  {
    id: 'balderton-capital',
    name: 'Balderton Capital',
    category: 'VC',
    focus: ['Deep Tech', 'Climate Tech', 'Advanced Manufacturing'],
    stages: ['Series A', 'Series B', 'Series C+'],
    geography: ['UK', 'EU'],
    description: 'Leading European VC with strong deep tech practice',
    website: 'https://www.balderton.com',
    keyPeople: ['Suranga Chandratillake', 'James Wise'],
    checkSize: '$5M - $40M',
    portfolioCount: 200,
    founded: 2000,
    tags: ['europe', 'deep-tech', 'established'],
  },
  {
    id: 'atomico',
    name: 'Atomico',
    category: 'VC',
    focus: ['Deep Tech', 'Climate Tech', 'Advanced Manufacturing'],
    stages: ['Series A', 'Series B', 'Series C+', 'Growth'],
    geography: ['UK', 'EU', 'Global'],
    description: 'International technology investment firm',
    website: 'https://www.atomico.com',
    keyPeople: ['Niklas Zennström', 'Hiro Tamura'],
    checkSize: '$10M - $100M+',
    portfolioCount: 100,
    founded: 2006,
    tags: ['europe', 'global', 'multi-stage'],
  },
];

// ============================================
// LAW FIRMS
// ============================================

export const HARD_TECH_LAW_FIRMS: HardTechAdvisor[] = [
  {
    id: 'wilson-sonsini',
    name: 'Wilson Sonsini Goodrich & Rosati',
    category: 'Law Firm',
    focus: ['Deep Tech', 'Biotech', 'Climate Tech', 'Space Tech', 'All Sectors'],
    stages: ['All Stages'],
    geography: ['US', 'Global'],
    description: 'Premier legal advisor to technology and life sciences companies',
    website: 'https://www.wsgr.com',
    specialties: [
      'Corporate & Securities',
      'Intellectual Property',
      'Regulatory (FDA, EPA)',
      'M&A',
      'Capital Markets',
      'Patent Prosecution',
    ],
    founded: 1961,
    tags: ['top-tier', 'silicon-valley', 'tech-focused', 'established'],
  },
  {
    id: 'cooley',
    name: 'Cooley LLP',
    category: 'Law Firm',
    focus: ['Deep Tech', 'Climate Tech', 'Biotech', 'All Sectors'],
    stages: ['All Stages'],
    geography: ['US', 'Global'],
    description: 'Global law firm with deep expertise in venture capital and emerging companies',
    website: 'https://www.cooley.com',
    specialties: [
      'Venture Capital Financing',
      'Patent Strategy',
      'Life Sciences Regulatory',
      'Climate Tech Transactions',
      'Public Offerings',
    ],
    founded: 1920,
    tags: ['venture-specialist', 'startup-friendly', 'global'],
  },
  {
    id: 'fenwick-west',
    name: 'Fenwick & West LLP',
    category: 'Law Firm',
    focus: ['Deep Tech', 'AI Hardware', 'Biotech', 'All Sectors'],
    stages: ['All Stages'],
    geography: ['US'],
    description: 'Technology and life sciences law firm',
    website: 'https://www.fenwick.com',
    specialties: [
      'Startup Formation',
      'Venture Financing',
      'Patent Litigation',
      'Tax Strategy',
      'Employment',
    ],
    founded: 1972,
    tags: ['silicon-valley', 'startup-focused', 'practical'],
  },
  {
    id: 'orrick',
    name: 'Orrick, Herrington & Sutcliffe',
    category: 'Law Firm',
    focus: ['Energy', 'Climate Tech', 'Biotech', 'Deep Tech'],
    stages: ['All Stages'],
    geography: ['US', 'EU', 'Asia', 'Global'],
    description: 'Global law firm with leading energy and infrastructure practice',
    website: 'https://www.orrick.com',
    specialties: [
      'Project Finance',
      'Energy Transactions',
      'Climate Tech M&A',
      'SPAC Transactions',
      'Clean Energy Incentives',
    ],
    founded: 1863,
    tags: ['energy-specialist', 'project-finance', 'global'],
  },
  {
    id: 'latham-watkins',
    name: 'Latham & Watkins',
    category: 'Law Firm',
    focus: ['Deep Tech', 'Biotech', 'Advanced Manufacturing', 'All Sectors'],
    stages: ['Series B', 'Series C+', 'Growth'],
    geography: ['US', 'EU', 'Asia', 'Global'],
    description: 'Global law firm with extensive corporate and transactional experience',
    website: 'https://www.lw.com',
    specialties: [
      'Corporate Transactions',
      'Capital Markets',
      'Private Equity',
      'Antitrust',
      'International Trade',
    ],
    founded: 1934,
    tags: ['white-shoe', 'global', 'large-deals'],
  },
  {
    id: 'goodwin',
    name: 'Goodwin Procter LLP',
    category: 'Law Firm',
    focus: ['Biotech', 'Deep Tech', 'Climate Tech'],
    stages: ['All Stages'],
    geography: ['US', 'EU', 'Global'],
    description: 'Technology and life sciences focused law firm',
    website: 'https://www.goodwinlaw.com',
    specialties: [
      'Life Sciences Transactions',
      'FDA Regulatory',
      'Technology Transactions',
      'Privacy & Cybersecurity',
      'Emerging Companies',
    ],
    founded: 1912,
    tags: ['life-sciences-leader', 'regulatory-expert'],
  },
  {
    id: 'mintz',
    name: 'Mintz',
    category: 'Law Firm',
    focus: ['Biotech', 'Climate Tech', 'Deep Tech'],
    stages: ['All Stages'],
    geography: ['US', 'UK'],
    description: 'General practice law firm with strong life sciences and technology practices',
    website: 'https://www.mintz.com',
    specialties: [
      'Life Sciences Regulatory',
      'Intellectual Property',
      'Healthcare',
      'Employment',
      'Privacy & Data Security',
    ],
    founded: 1933,
    tags: ['biotech-focused', 'regulatory'],
  },
  {
    id: 'dla-piper',
    name: 'DLA Piper',
    category: 'Law Firm',
    focus: ['Energy', 'Climate Tech', 'Advanced Manufacturing', 'All Sectors'],
    stages: ['All Stages'],
    geography: ['US', 'UK', 'EU', 'Asia', 'Global'],
    description: 'Global law firm with extensive energy and industrial capabilities',
    website: 'https://www.dlapiper.com',
    specialties: [
      'Energy & Natural Resources',
      'International Trade',
      'Manufacturing',
      'Government Contracts',
      'Corporate',
    ],
    founded: 2005,
    tags: ['global', 'energy', 'industrial'],
  },
];

// ============================================
// ACCOUNTING FIRMS
// ============================================

export const HARD_TECH_ACCOUNTING_FIRMS: HardTechAdvisor[] = [
  {
    id: 'armanino',
    name: 'Armanino LLP',
    category: 'Accounting Firm',
    focus: ['Deep Tech', 'Climate Tech', 'Biotech', 'All Sectors'],
    stages: ['All Stages'],
    geography: ['US'],
    description: 'Top 25 accounting firm specializing in technology and life sciences',
    website: 'https://www.armanino.com',
    specialties: [
      'R&D Tax Credits',
      'ASC 606 Revenue Recognition',
      'Stock Compensation (ASC 718)',
      '409A Valuations',
      'GAAP Compliance',
      'Audit & Assurance',
    ],
    founded: 1953,
    tags: ['tech-specialist', 'startup-focused', 'r&d-credits'],
  },
  {
    id: 'moss-adams',
    name: 'Moss Adams',
    category: 'Accounting Firm',
    focus: ['Deep Tech', 'Advanced Manufacturing', 'Energy', 'All Sectors'],
    stages: ['All Stages'],
    geography: ['US'],
    description: 'Top 15 accounting and consulting firm with deep tech industry expertise',
    website: 'https://www.mossadams.com',
    specialties: [
      'Manufacturing & Distribution',
      'Energy & Utilities',
      'Technology',
      'R&D Tax Credits',
      'Transaction Advisory',
    ],
    founded: 1913,
    tags: ['west-coast', 'manufacturing', 'industrial'],
  },
  {
    id: 'kpmg',
    name: 'KPMG',
    category: 'Accounting Firm',
    focus: ['Deep Tech', 'Biotech', 'Energy', 'Advanced Manufacturing', 'All Sectors'],
    stages: ['Series B', 'Series C+', 'Growth'],
    geography: ['US', 'UK', 'EU', 'Asia', 'Global'],
    description: 'Big 4 accounting firm with dedicated emerging technology practice',
    website: 'https://home.kpmg',
    specialties: [
      'Audit & Assurance',
      'Tax Strategy',
      'International Expansion',
      'ESG Reporting',
      'IPO Readiness',
      'Transfer Pricing',
    ],
    founded: 1987,
    tags: ['big-4', 'global', 'established'],
  },
  {
    id: 'pwc',
    name: 'PwC (PricewaterhouseCoopers)',
    category: 'Accounting Firm',
    focus: ['Deep Tech', 'Biotech', 'Energy', 'All Sectors'],
    stages: ['Series B', 'Series C+', 'Growth'],
    geography: ['US', 'UK', 'EU', 'Asia', 'Global'],
    description: 'Big 4 firm with extensive technology and life sciences capabilities',
    website: 'https://www.pwc.com',
    specialties: [
      'Deals & Transactions',
      'ESG & Sustainability',
      'Digital Transformation',
      'Tax',
      'Forensics',
    ],
    founded: 1998,
    tags: ['big-4', 'global', 'deals'],
  },
  {
    id: 'deloitte',
    name: 'Deloitte',
    category: 'Accounting Firm',
    focus: ['Deep Tech', 'Biotech', 'Energy', 'Advanced Manufacturing', 'All Sectors'],
    stages: ['Series B', 'Series C+', 'Growth'],
    geography: ['US', 'UK', 'EU', 'Asia', 'Global'],
    description: 'Big 4 with strong technology, media, and telecommunications practice',
    website: 'https://www2.deloitte.com',
    specialties: [
      'Technology Consulting',
      'M&A Advisory',
      'Risk & Compliance',
      'Sustainability Services',
      'IPO Services',
    ],
    founded: 1845,
    tags: ['big-4', 'global', 'consulting'],
  },
  {
    id: 'ey',
    name: 'EY (Ernst & Young)',
    category: 'Accounting Firm',
    focus: ['Deep Tech', 'Biotech', 'Energy', 'All Sectors'],
    stages: ['Series B', 'Series C+', 'Growth'],
    geography: ['US', 'UK', 'EU', 'Asia', 'Global'],
    description: 'Big 4 firm with dedicated emerging technology and life sciences teams',
    website: 'https://www.ey.com',
    specialties: [
      'Strategic Growth Markets',
      'IPO Services',
      'Tax Incentives',
      'Transaction Support',
      'Climate Change & Sustainability',
    ],
    founded: 1989,
    tags: ['big-4', 'global', 'strategic-growth'],
  },
  {
    id: 'bdo',
    name: 'BDO USA',
    category: 'Accounting Firm',
    focus: ['Advanced Manufacturing', 'Energy', 'Deep Tech'],
    stages: ['All Stages'],
    geography: ['US', 'Global'],
    description: 'Top 5 accounting firm with strong manufacturing and industrial practice',
    website: 'https://www.bdo.com',
    specialties: [
      'Manufacturing',
      'Energy & Mining',
      'R&D Tax Credits',
      'International Tax',
      'Business Valuations',
    ],
    founded: 1910,
    tags: ['manufacturing', 'mid-market', 'practical'],
  },
  {
    id: 'grant-thornton',
    name: 'Grant Thornton',
    category: 'Accounting Firm',
    focus: ['Advanced Manufacturing', 'Energy', 'Deep Tech'],
    stages: ['All Stages'],
    geography: ['US', 'Global'],
    description: 'Top 6 accounting firm serving dynamic organizations',
    website: 'https://www.grantthornton.com',
    specialties: [
      'Manufacturing Services',
      'Energy',
      'Private Equity',
      'Transaction Advisory',
      'Technology',
    ],
    founded: 1924,
    tags: ['mid-market', 'manufacturing', 'growing-companies'],
  },
];

// ============================================
// STRATEGIC & TECHNICAL ADVISORS
// ============================================

export const HARD_TECH_ADVISORS: HardTechAdvisor[] = [
  {
    id: 'activate',
    name: 'Activate',
    category: 'Strategic Advisor',
    focus: ['Deep Tech', 'Climate Tech', 'Energy', 'Advanced Manufacturing'],
    stages: ['Pre-Seed', 'Seed', 'Series A'],
    geography: ['US'],
    description: 'Fellowship program and ecosystem builder for science and technology entrepreneurship',
    website: 'https://www.activate.org',
    specialties: [
      'Commercialization Strategy',
      'Business Model Development',
      'Fundraising Support',
      'Technical Mentorship',
      'Network Access',
    ],
    founded: 2015,
    tags: ['fellowship', 'hard-tech', 'commercialization', 'berkeley'],
  },
  {
    id: 'cyclotron-road',
    name: 'Cyclotron Road',
    category: 'Strategic Advisor',
    focus: ['Energy', 'Climate Tech', 'Advanced Manufacturing'],
    stages: ['Pre-Seed', 'Seed'],
    geography: ['US'],
    description: 'Lawrence Berkeley National Lab\'s hard tech incubator',
    website: 'https://www.cyclotronroad.org',
    specialties: [
      'Technology Development',
      'Lab Access',
      'Technical Mentorship',
      'Entrepreneurship Training',
      'Funding Pathways',
    ],
    founded: 2014,
    tags: ['incubator', 'national-lab', 'berkeley', 'deep-tech'],
  },
  {
    id: 'prime-movers-lab',
    name: 'Prime Movers Lab',
    category: 'VC',
    focus: ['Deep Tech', 'Energy', 'Advanced Manufacturing', 'Robotics'],
    stages: ['Seed', 'Series A', 'Series B'],
    geography: ['US', 'Global'],
    description: 'Breakthrough science venture capital firm',
    website: 'https://www.primemoverslab.com',
    notableInvestments: ['Impulse Space', 'Atomic Semi', 'Fleetzero'],
    keyPeople: ['Dakin Sloss'],
    checkSize: '$3M - $20M',
    founded: 2017,
    tags: ['breakthrough-science', 'physics-based', 'hard-tech'],
  },
  {
    id: 'engine-ventures',
    name: 'The Engine',
    category: 'VC',
    focus: ['Deep Tech', 'Climate Tech', 'Biotech', 'Advanced Manufacturing'],
    stages: ['Seed', 'Series A'],
    geography: ['US'],
    description: 'MIT\'s venture firm for Tough Tech',
    website: 'https://www.engine.xyz',
    notableInvestments: ['Commonwealth Fusion Systems', 'Form Energy', 'Via Separations'],
    keyPeople: ['Katie Rae', 'Reed Sturtevant'],
    checkSize: '$1M - $15M',
    founded: 2016,
    tags: ['mit', 'tough-tech', 'patient-capital', 'deep-tech'],
  },
  {
    id: 'techstars-space',
    name: 'Techstars Space Accelerator',
    category: 'Strategic Advisor',
    focus: ['Space Tech', 'Aerospace'],
    stages: ['Pre-Seed', 'Seed'],
    geography: ['US'],
    description: 'Leading accelerator for space tech startups',
    website: 'https://www.techstars.com/accelerators/space',
    specialties: [
      'Accelerator Program',
      'Mentor Network',
      'Investor Access',
      'Space Industry Connections',
    ],
    founded: 2015,
    tags: ['accelerator', 'space', 'techstars', 'boulder'],
  },
  {
    id: 'y-combinator',
    name: 'Y Combinator',
    category: 'Strategic Advisor',
    focus: ['Deep Tech', 'Biotech', 'Climate Tech', 'All Sectors'],
    stages: ['Pre-Seed', 'Seed'],
    geography: ['Global'],
    description: 'World\'s most prestigious startup accelerator, now funding hard tech',
    website: 'https://www.ycombinator.com',
    specialties: [
      'Accelerator Program',
      'Fundraising Support',
      'Network Effects',
      'Go-to-Market Strategy',
    ],
    founded: 2005,
    tags: ['accelerator', 'prestigious', 'network', 'silicon-valley'],
  },
  {
    id: 'creative-destruction-lab',
    name: 'Creative Destruction Lab',
    category: 'Strategic Advisor',
    focus: ['Deep Tech', 'AI Hardware', 'Quantum Computing', 'Space Tech'],
    stages: ['Pre-Seed', 'Seed'],
    geography: ['US', 'Global'],
    description: 'Seed-stage program for massively scalable science-based companies',
    website: 'https://www.creativedestructionlab.com',
    specialties: [
      'Objectives-Based Mentorship',
      'Investor Connections',
      'Expert Network',
      'Scientific Advisory',
    ],
    founded: 2012,
    tags: ['accelerator', 'science-based', 'canadian', 'objectives-driven'],
  },
];

// ============================================
// COMBINED DATABASE
// ============================================

// DISABLED: Advisors should be loaded from Supabase
// All hardcoded advisor data has been disabled for multi-tenant architecture
export const ALL_HARD_TECH_ADVISORS: HardTechAdvisor[] = [];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get advisors by category
 */
export function getAdvisorsByCategory(category: AdvisorCategory): HardTechAdvisor[] {
  return ALL_HARD_TECH_ADVISORS.filter(a => a.category === category);
}

/**
 * Get advisors by focus area
 */
export function getAdvisorsByFocus(focus: HardTechFocus): HardTechAdvisor[] {
  return ALL_HARD_TECH_ADVISORS.filter(a => a.focus.includes(focus));
}

/**
 * Get advisors by stage
 */
export function getAdvisorsByStage(stage: Stage): HardTechAdvisor[] {
  return ALL_HARD_TECH_ADVISORS.filter(a => a.stages.includes(stage) || a.stages.includes('All Stages'));
}

/**
 * Get advisors by geography
 */
export function getAdvisorsByGeography(geography: Geography): HardTechAdvisor[] {
  return ALL_HARD_TECH_ADVISORS.filter(a => a.geography.includes(geography) || a.geography.includes('Global'));
}

/**
 * Search advisors
 */
export function searchAdvisors(query: string): HardTechAdvisor[] {
  const lowerQuery = query.toLowerCase();
  return ALL_HARD_TECH_ADVISORS.filter(a =>
    a.name.toLowerCase().includes(lowerQuery) ||
    a.description.toLowerCase().includes(lowerQuery) ||
    a.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    a.specialties?.some(s => s.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get VCs only
 */
export function getVCs(): HardTechAdvisor[] {
  return HARD_TECH_VCS;
}

/**
 * Get Law Firms only
 */
export function getLawFirms(): HardTechAdvisor[] {
  return HARD_TECH_LAW_FIRMS;
}

/**
 * Get Accounting Firms only
 */
export function getAccountingFirms(): HardTechAdvisor[] {
  return HARD_TECH_ACCOUNTING_FIRMS;
}
