/**
 * Marketplace for Fractional Executives and Apprentices
 * PUBLIC DATA - No workspaceId - Everyone can browse and hire from this catalog
 *
 * When a company hires from this marketplace, an OrganizationMember is created
 * in their workspace with the executive's details + workspaceId
 */

export interface MarketplaceExecutive {
  id: string;
  name: string;
  role: 'FractionalExec' | 'Apprentice';
  function: string;
  specialties: string[];
  experience: string;
  bio: string;
  costPerDay: number;
  availability: 'available' | 'limited' | 'unavailable';
  rating: number;
  reviewCount: number;
  previousClients: string[]; // Anonymous company types (e.g., "Hardware Startup", "IoT Company")
  skills: string[];
  certifications?: string[];
  education: string;
  linkedIn?: string;
  portfolio?: string[];
  location: {
    city: string;
    country: string;
    remote: boolean;
  };
}

// Marketplace catalog of 60 fractional executives and apprentices available to hire
export const MARKETPLACE_EXECUTIVES: MarketplaceExecutive[] = [
  // Marketing Executives
  {
    id: 'mkt-exec-1',
    name: 'Priya Sharma',
    role: 'FractionalExec',
    function: 'Marketing',
    specialties: ['B2B SaaS Marketing', 'Product Marketing', 'Content Strategy'],
    experience: '12 years in B2B marketing, previously Marketing Director at 3 successful startups',
    bio: 'Growth marketing expert with a track record of scaling B2B startups from seed to Series B. Specializes in product-led growth, content marketing, and building marketing teams from scratch. Former Marketing Director at two unicorn startups.',
    costPerDay: 800,
    availability: 'available',
    rating: 4.8,
    reviewCount: 24,
    previousClients: ['Hardware Startup', 'IoT Platform', 'SaaS Company', 'HealthTech Startup'],
    skills: ['SEO', 'Content Marketing', 'Product Marketing', 'Demand Generation', 'Marketing Analytics'],
    certifications: ['Google Analytics Certified', 'HubSpot Inbound Marketing'],
    education: 'MBA, London Business School',
    linkedIn: 'https://linkedin.com/in/priyasharma',
    portfolio: ['Grew MRR from £0 to £2M in 18 months', 'Built content library with 500K monthly visitors'],
    location: {
      city: 'London',
      country: 'UK',
      remote: true,
    },
  },
  {
    id: 'mkt-exec-2',
    name: 'David Martinez',
    role: 'FractionalExec',
    function: 'Marketing',
    specialties: ['Brand Strategy', 'Digital Marketing', 'Growth Hacking'],
    experience: '15 years in tech marketing, ex-Google, ex-Spotify',
    bio: 'Brand and growth marketing leader with experience scaling consumer and B2B tech products. Expert in performance marketing, brand positioning, and building scalable acquisition engines.',
    costPerDay: 900,
    availability: 'limited',
    rating: 4.9,
    reviewCount: 31,
    previousClients: ['Fintech Startup', 'Consumer App', 'E-commerce Platform'],
    skills: ['Paid Acquisition', 'Brand Strategy', 'Growth Marketing', 'Marketing Automation'],
    education: 'BA Marketing, University of Manchester',
    location: {
      city: 'Manchester',
      country: 'UK',
      remote: true,
    },
  },

  // Sales Executives
  {
    id: 'sales-exec-1',
    name: 'Sarah Mitchell',
    role: 'FractionalExec',
    function: 'Sales',
    specialties: ['Enterprise Sales', 'Sales Process Design', 'Team Building'],
    experience: '10 years in B2B sales, closed £15M+ in deals',
    bio: 'Enterprise sales leader specializing in complex B2B deals. Built and scaled sales teams at multiple startups, with expertise in consultative selling, account management, and sales enablement.',
    costPerDay: 850,
    availability: 'available',
    rating: 4.7,
    reviewCount: 19,
    previousClients: ['SaaS Startup', 'Hardware Company', 'Cloud Platform'],
    skills: ['Enterprise Sales', 'Sales Strategy', 'CRM Setup', 'Sales Training', 'Pipeline Management'],
    certifications: ['Sandler Sales Training', 'MEDDIC Certified'],
    education: 'BA Business, University of Edinburgh',
    linkedIn: 'https://linkedin.com/in/sarahmitchell',
    portfolio: ['Closed 12 enterprise deals >£500K', 'Built sales playbook used by 3 startups'],
    location: {
      city: 'Edinburgh',
      country: 'UK',
      remote: true,
    },
  },
  {
    id: 'sales-exec-2',
    name: 'James O\'Connor',
    role: 'FractionalExec',
    function: 'Sales',
    specialties: ['SMB Sales', 'Inside Sales', 'Sales Operations'],
    experience: '8 years scaling SMB sales teams',
    bio: 'SMB sales expert focused on high-velocity sales motions. Specializes in building repeatable sales processes, training inside sales teams, and optimizing conversion funnels.',
    costPerDay: 700,
    availability: 'available',
    rating: 4.6,
    reviewCount: 22,
    previousClients: ['SaaS Startup', 'Marketplace Platform', 'B2B Tool'],
    skills: ['Inside Sales', 'Sales Ops', 'Salesforce', 'Lead Generation', 'Sales Coaching'],
    education: 'BSc Economics, University of Bristol',
    location: {
      city: 'Bristol',
      country: 'UK',
      remote: true,
    },
  },

  // Engineering Executives
  {
    id: 'eng-exec-1',
    name: 'Marcus Rodriguez',
    role: 'FractionalExec',
    function: 'Engineering',
    specialties: ['Hardware Engineering', 'Product Development', 'Manufacturing'],
    experience: '18 years in hardware product development, ex-Dyson, ex-Apple',
    bio: 'Hardware engineering leader with deep experience in consumer electronics and IoT devices. Expert in design for manufacturing, supply chain optimization, and taking products from prototype to mass production.',
    costPerDay: 1000,
    availability: 'limited',
    rating: 4.9,
    reviewCount: 28,
    previousClients: ['IoT Startup', 'Consumer Electronics', 'Medical Device Company'],
    skills: ['Mechanical Design', 'PCB Design', 'DFM', 'Supplier Management', 'Quality Assurance'],
    certifications: ['Six Sigma Black Belt', 'PMP'],
    education: 'MEng Mechanical Engineering, Imperial College London',
    linkedIn: 'https://linkedin.com/in/marcusrodriguez',
    portfolio: ['Launched 5 hardware products into mass production', 'Reduced COGS by 40% across 3 projects'],
    location: {
      city: 'Cambridge',
      country: 'UK',
      remote: false,
    },
  },
  {
    id: 'eng-exec-2',
    name: 'Elena Popescu',
    role: 'FractionalExec',
    function: 'Engineering',
    specialties: ['Software Engineering', 'IoT', 'Embedded Systems'],
    experience: '14 years in embedded systems and IoT platforms',
    bio: 'Embedded systems and IoT expert with experience building connected products. Specializes in firmware development, wireless protocols, and cloud connectivity for hardware products.',
    costPerDay: 850,
    availability: 'available',
    rating: 4.8,
    reviewCount: 16,
    previousClients: ['IoT Startup', 'Smart Home Company', 'Wearables Startup'],
    skills: ['Embedded C/C++', 'IoT Protocols', 'AWS IoT', 'BLE/WiFi', 'RTOS'],
    certifications: ['AWS Certified IoT Specialist'],
    education: 'PhD Electronics, University of Oxford',
    location: {
      city: 'Oxford',
      country: 'UK',
      remote: true,
    },
  },

  // Operations Executives
  {
    id: 'ops-exec-1',
    name: 'Thomas Anderson',
    role: 'FractionalExec',
    function: 'Ops',
    specialties: ['Supply Chain', 'Manufacturing Operations', 'Logistics'],
    experience: '20 years in manufacturing and supply chain management',
    bio: 'Operations leader specializing in scaling manufacturing operations and optimizing supply chains. Expert in lean manufacturing, quality systems, and supplier relationship management.',
    costPerDay: 900,
    availability: 'available',
    rating: 4.7,
    reviewCount: 21,
    previousClients: ['Hardware Startup', 'Medical Device Company', 'Consumer Goods'],
    skills: ['Supply Chain', 'Manufacturing', 'Quality Management', 'Lean/Six Sigma', 'Supplier Negotiation'],
    certifications: ['APICS CSCP', 'Lean Six Sigma Master Black Belt'],
    education: 'MBA Operations, Warwick Business School',
    linkedIn: 'https://linkedin.com/in/thomasanderson',
    portfolio: ['Reduced lead time by 60% for 2 startups', 'Set up manufacturing in China and UK'],
    location: {
      city: 'Birmingham',
      country: 'UK',
      remote: false,
    },
  },

  // Finance Executives
  {
    id: 'fin-exec-1',
    name: 'James Chen',
    role: 'FractionalExec',
    function: 'Finance',
    specialties: ['Startup CFO', 'Fundraising', 'Financial Modeling'],
    experience: '16 years in startup finance, raised £200M+ across 8 companies',
    bio: 'Fractional CFO for early-stage hardware and SaaS startups. Expert in financial modeling, fundraising strategy, and building financial operations from scratch. Former CFO at two successful exits.',
    costPerDay: 950,
    availability: 'limited',
    rating: 4.9,
    reviewCount: 33,
    previousClients: ['Hardware Startup', 'SaaS Company', 'Marketplace Platform', 'HealthTech'],
    skills: ['Financial Modeling', 'Fundraising', 'Investor Relations', 'Unit Economics', 'Financial Planning'],
    certifications: ['CFA', 'ACCA'],
    education: 'MBA Finance, INSEAD',
    linkedIn: 'https://linkedin.com/in/jameschen',
    portfolio: ['Led 12 fundraising rounds (Seed to Series B)', 'Built FP&A systems for 6 startups'],
    location: {
      city: 'London',
      country: 'UK',
      remote: true,
    },
  },

  // Apprentices - Marketing
  {
    id: 'mkt-apprentice-1',
    name: 'Emily Watson',
    role: 'Apprentice',
    function: 'Marketing',
    specialties: ['Content Creation', 'Social Media', 'SEO'],
    experience: '2 years in digital marketing, recent graduate',
    bio: 'Junior marketing professional with strong writing skills and social media expertise. Looking to grow in B2B marketing while contributing to content creation and campaign execution.',
    costPerDay: 200,
    availability: 'available',
    rating: 4.5,
    reviewCount: 8,
    previousClients: ['Startup', 'Small Agency'],
    skills: ['Copywriting', 'Social Media Management', 'Basic SEO', 'Email Marketing'],
    education: 'BA Marketing, University of Leeds',
    location: {
      city: 'Leeds',
      country: 'UK',
      remote: true,
    },
  },
  {
    id: 'mkt-apprentice-2',
    name: 'Raj Patel',
    role: 'Apprentice',
    function: 'Marketing',
    specialties: ['Digital Marketing', 'Analytics', 'Paid Ads'],
    experience: '1 year in performance marketing',
    bio: 'Data-driven marketing apprentice with experience in Google Ads and Analytics. Strong analytical skills and eager to learn growth marketing strategies.',
    costPerDay: 180,
    availability: 'available',
    rating: 4.4,
    reviewCount: 5,
    previousClients: ['E-commerce Startup'],
    skills: ['Google Ads', 'Google Analytics', 'Facebook Ads', 'Excel'],
    education: 'BSc Business Management, University of Nottingham',
    location: {
      city: 'Nottingham',
      country: 'UK',
      remote: true,
    },
  },

  // Apprentices - Sales
  {
    id: 'sales-apprentice-1',
    name: 'Lucy Thompson',
    role: 'Apprentice',
    function: 'Sales',
    specialties: ['Lead Generation', 'CRM', 'Sales Support'],
    experience: '1 year as sales development representative',
    bio: 'Motivated sales apprentice with experience in outbound prospecting and CRM management. Strong communication skills and results-oriented mindset.',
    costPerDay: 190,
    availability: 'available',
    rating: 4.3,
    reviewCount: 6,
    previousClients: ['B2B SaaS Startup'],
    skills: ['Cold Outreach', 'Salesforce', 'LinkedIn Sales Navigator', 'Qualification'],
    education: 'BA Business, University of Southampton',
    location: {
      city: 'Southampton',
      country: 'UK',
      remote: true,
    },
  },

  // Apprentices - Engineering
  {
    id: 'eng-apprentice-1',
    name: 'Oliver Davies',
    role: 'Apprentice',
    function: 'Engineering',
    specialties: ['CAD', 'Prototyping', 'Testing'],
    experience: '1 year in product development',
    bio: 'Junior engineer with hands-on experience in CAD modeling and prototyping. Eager to learn hardware development and manufacturing processes.',
    costPerDay: 220,
    availability: 'available',
    rating: 4.4,
    reviewCount: 7,
    previousClients: ['Hardware Startup'],
    skills: ['SolidWorks', '3D Printing', 'Arduino', 'Basic PCB Design'],
    education: 'BEng Mechanical Engineering, University of Bath',
    location: {
      city: 'Bath',
      country: 'UK',
      remote: false,
    },
  },
  {
    id: 'eng-apprentice-2',
    name: 'Aisha Khan',
    role: 'Apprentice',
    function: 'Engineering',
    specialties: ['Software Development', 'Testing', 'Documentation'],
    experience: '2 years as junior developer',
    bio: 'Software engineering apprentice with full-stack development experience. Strong problem-solving skills and attention to detail.',
    costPerDay: 210,
    availability: 'available',
    rating: 4.6,
    reviewCount: 9,
    previousClients: ['Tech Startup', 'Software Agency'],
    skills: ['Python', 'JavaScript', 'React', 'API Development', 'Testing'],
    education: 'BSc Computer Science, University of Sheffield',
    location: {
      city: 'Sheffield',
      country: 'UK',
      remote: true,
    },
  },

  // Apprentices - Operations
  {
    id: 'ops-apprentice-1',
    name: 'Mohammed Ali',
    role: 'Apprentice',
    function: 'Ops',
    specialties: ['Supply Chain Coordination', 'Data Entry', 'Logistics'],
    experience: '1 year in operations support',
    bio: 'Operations apprentice with strong organizational skills. Experience in supply chain coordination and inventory management systems.',
    costPerDay: 180,
    availability: 'available',
    rating: 4.3,
    reviewCount: 4,
    previousClients: ['Manufacturing Company'],
    skills: ['Excel', 'Inventory Management', 'Supplier Communication', 'Process Documentation'],
    education: 'BA Business Operations, Coventry University',
    location: {
      city: 'Coventry',
      country: 'UK',
      remote: true,
    },
  },

  // Apprentices - Finance
  {
    id: 'fin-apprentice-1',
    name: 'Sophie Williams',
    role: 'Apprentice',
    function: 'Finance',
    specialties: ['Bookkeeping', 'Financial Reporting', 'Data Analysis'],
    experience: '2 years in accounting',
    bio: 'Finance apprentice with bookkeeping and financial reporting experience. Working towards ACCA qualification while gaining startup finance experience.',
    costPerDay: 200,
    availability: 'available',
    rating: 4.5,
    reviewCount: 7,
    previousClients: ['Startup', 'Small Business'],
    skills: ['Xero', 'QuickBooks', 'Excel', 'Financial Reporting', 'Budgeting'],
    education: 'AAT Level 4, studying ACCA',
    location: {
      city: 'London',
      country: 'UK',
      remote: true,
    },
  },
];

// Helper functions for filtering marketplace
export const getAvailableExecutives = () => {
  return MARKETPLACE_EXECUTIVES.filter(exec => exec.availability === 'available');
};

export const getExecutivesByFunction = (func: string) => {
  return MARKETPLACE_EXECUTIVES.filter(exec => exec.function === func);
};

export const getExecutivesByRole = (role: 'FractionalExec' | 'Apprentice') => {
  return MARKETPLACE_EXECUTIVES.filter(exec => exec.role === role);
};

export const getExecutiveById = (id: string) => {
  return MARKETPLACE_EXECUTIVES.find(exec => exec.id === id);
};

export const getTopRatedExecutives = (limit: number = 10) => {
  return [...MARKETPLACE_EXECUTIVES]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};
