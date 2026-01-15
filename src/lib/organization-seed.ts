// Organization structure seed data
// Shows reporting lines, supplier engagements, and AI agent assignments

import type { AIReadiness, PersonLoadout } from './ai-tools-system';

// Default workspaceId for demo company
const DEFAULT_WORKSPACE_ID = 'workspace-demo-company';

export interface OrganizationMember {
  id: string;
  workspaceId: string; // 🔑 Multi-tenancy key - links member to specific company
  name: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  function: string;
  reportsTo?: string; // ID of who they report to
  manages?: string[]; // IDs of people they manage
  email: string;
  phone?: string;
  costPerDay?: number;
  daysPerWeek?: number; // Number of days per week they work (defaults to 5 for full-time, fractional execs can work 1-5)
  startDate: string;
  status: 'active' | 'inactive';
  linkedIn?: string; // LinkedIn profile URL
  bio?: string; // Professional bio

  // AI Readiness & Loadout (NEW)
  aiReadiness?: AIReadiness; // AI comfort level & constraints
  aiLoadout?: PersonLoadout; // Equipped AI tools per slot
}

export interface SupplierEngagement {
  id: string;
  workspaceId: string; // 🔑 Multi-tenancy key - links engagement to specific company
  supplierName: string;
  supplierId: string; // Reference to UK_SUPPLIERS
  projectName: string;
  description: string;
  status: 'planning' | 'in_progress' | 'delivered' | 'cancelled';
  assignedTo: string; // Apprentice or Exec managing this
  totalCost: number;
  paidToDate: number;
  deliveryDate: string;
  startDate: string;
  tasks: string[]; // Legacy: task names
  linkedWorkPlanIds?: string[]; // NEW: IDs of work plans using this supplier
  componentName?: string; // NEW: What is being made/manufactured
  processDescription?: string; // NEW: Description of the manufacturing process
  estimatedDuration?: number; // NEW: How long the process takes (in days)
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
  location: {
    city: string;
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface AIAgent {
  id: string;
  workspaceId: string; // 🔑 Multi-tenancy key - links AI agent to specific company
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'ElevenLabs' | 'Vibecode' | 'Other';
  model: string;
  purpose: string;
  usedBy: string[]; // Array of user IDs or roles
  functions: string[]; // What business functions it helps with
  costPerMonth: number;
  apiEndpoint?: string;
  website?: string; // Website URL
  capabilities: string[];
  integrations: string[];
  status: 'active' | 'trial' | 'inactive';
  addedDate: string;
  lastUsed?: string;
  usageStats?: {
    requestsThisMonth: number;
    averageResponseTime: string;
    successRate: number;
  };
  // Optional detailed fields for enhanced modal
  description?: string;
  useCases?: string[];
  keyFeatures?: string[];
  category?: 'productivity' | 'sales' | 'marketing' | 'finance' | 'engineering' | 'operations' | 'manufacturing';
  pricing?: {
    starter?: string;
    professional?: string;
    enterprise?: string;
    notes?: string;
  };
  setup?: {
    difficulty?: 'Easy' | 'Moderate' | 'Advanced';
    timeToValue?: string;
    requirements?: string[];
  };
  support?: {
    documentation?: string;
    community?: string;
    email?: boolean;
    phone?: boolean;
  };
  reviews?: {
    rating?: number;
    totalReviews?: number;
    pros?: string[];
    cons?: string[];
  };
}

// Organization structure with reporting lines
export const ORGANIZATION_MEMBERS: OrganizationMember[] = [
  // Founders (no reports to anyone)
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'founder-1',
    name: 'Sarah Chen',
    role: 'Founder',
    function: 'Strategy',
    manages: ['exec-1', 'exec-2', 'exec-3', 'exec-4'],
    email: 'sarah@fractional.com',
    phone: '+44 7700 900101',
    startDate: '2024-01-01',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/sarahchen',
    bio: 'Serial entrepreneur with 15+ years in hardware startups. Previously founded two successful IoT companies. Passionate about lean operations and fractional teams.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'founder-2',
    name: 'Marcus Thompson',
    role: 'Founder',
    function: 'Product',
    manages: ['exec-3', 'exec-4'],
    email: 'marcus@fractional.com',
    phone: '+44 7700 900102',
    startDate: '2024-01-01',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/marcusthompson',
    bio: 'Product leader with deep hardware engineering background. Ex-Dyson, ex-Apple. Specializes in design for manufacturability and rapid prototyping.',
  },

  // Fractional Executives
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'exec-1',
    name: 'Jordan Martinez',
    role: 'FractionalExec',
    function: 'Finance',
    reportsTo: 'founder-1',
    manages: ['apprentice-1', 'apprentice-2'],
    email: 'jordan@fractional.com',
    phone: '+44 7700 900201',
    costPerDay: 850,
    daysPerWeek: 3,
    startDate: '2024-02-01',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/jordanmartinez',
    bio: 'Fractional CFO with 12 years experience. Helped 20+ startups raise Series A funding. Expert in financial modeling and unit economics.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'exec-2',
    name: 'Emma Richardson',
    role: 'FractionalExec',
    function: 'Sales',
    reportsTo: 'founder-1',
    manages: ['apprentice-3', 'apprentice-4'],
    email: 'emma.richardson@fractional.com',
    phone: '+44 7700 900202',
    costPerDay: 920,
    daysPerWeek: 3,
    startDate: '2024-02-15',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/emmarichardson',
    bio: 'Enterprise sales leader with £50M+ closed. Built sales teams from 0 to 15. Specializes in B2B manufacturing and industrial markets.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'exec-3',
    name: 'David Park',
    role: 'FractionalExec',
    function: 'Engineering',
    reportsTo: 'founder-2',
    manages: ['apprentice-5', 'apprentice-6'],
    email: 'david.park@fractional.com',
    phone: '+44 7700 900203',
    costPerDay: 1100,
    daysPerWeek: 3,
    startDate: '2024-03-01',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/davidpark',
    bio: 'Former CTO at Series B hardware startup. 18 years in embedded systems and IoT. Led teams of 30+ engineers. Expert in manufacturing scale-up.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'exec-4',
    name: 'Sophie Adams',
    role: 'FractionalExec',
    function: 'Marketing',
    reportsTo: 'founder-1',
    manages: ['apprentice-7'],
    email: 'sophie.adams@fractional.com',
    phone: '+44 7700 900204',
    costPerDay: 780,
    daysPerWeek: 2,
    startDate: '2024-03-15',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/sophieadams',
    bio: 'Growth marketing specialist for hardware products. 10 years in consumer electronics marketing. Led launches for 5 successful Kickstarter campaigns.',
  },

  // Apprentices
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'apprentice-1',
    name: 'Alex Rivera',
    role: 'Apprentice',
    function: 'Finance',
    reportsTo: 'exec-1',
    email: 'alex@fractional.com',
    phone: '+44 7700 900301',
    costPerDay: 140,
    startDate: '2024-04-01',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/alexrivera',
    bio: 'Finance graduate eager to learn startup financial operations. Strong Excel skills and quick learner. Passionate about building unit economics models.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'apprentice-2',
    name: 'Priya Sharma',
    role: 'Apprentice',
    function: 'Finance',
    reportsTo: 'exec-1',
    email: 'priya.sharma@fractional.com',
    phone: '+44 7700 900302',
    costPerDay: 135,
    startDate: '2024-04-15',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/priyasharma',
    bio: 'Accounting background with interest in startup finance. Detail-oriented and methodical. Learning financial modeling and fundraising processes.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'apprentice-3',
    name: 'James Wilson',
    role: 'Apprentice',
    function: 'Sales',
    reportsTo: 'exec-2',
    email: 'james.wilson@fractional.com',
    phone: '+44 7700 900303',
    costPerDay: 145,
    startDate: '2024-05-01',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/jameswilson',
    bio: 'Natural communicator with 2 years in B2B sales. Consistently exceeds outreach targets. Learning enterprise sales methodology.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'apprentice-4',
    name: 'Lily Chen',
    role: 'Apprentice',
    function: 'Sales',
    reportsTo: 'exec-2',
    email: 'lily.chen@fractional.com',
    phone: '+44 7700 900304',
    costPerDay: 150,
    startDate: '2024-05-01',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/lilychen',
    bio: 'Business development enthusiast with strong relationship-building skills. Previous experience in customer success. Learning complex sales cycles.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'apprentice-5',
    name: 'Omar Hassan',
    role: 'Apprentice',
    function: 'Engineering',
    reportsTo: 'exec-3',
    email: 'omar.hassan@fractional.com',
    phone: '+44 7700 900305',
    costPerDay: 155,
    startDate: '2024-05-15',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/omarhassan',
    bio: 'Computer engineering graduate with embedded systems interest. Strong C++ and Python skills. Learning hardware-software integration.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'apprentice-6',
    name: 'Maya Patel',
    role: 'Apprentice',
    function: 'Engineering',
    reportsTo: 'exec-3',
    email: 'maya.patel@fractional.com',
    phone: '+44 7700 900306',
    costPerDay: 160,
    startDate: '2024-06-01',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/mayapatel',
    bio: 'Electronics engineering background. Experienced with PCB design and microcontrollers. Learning manufacturing processes and DFM principles.',
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'apprentice-7',
    name: 'Lucas Silva',
    role: 'Apprentice',
    function: 'Marketing',
    reportsTo: 'exec-4',
    email: 'lucas.silva@fractional.com',
    phone: '+44 7700 900307',
    costPerDay: 142,
    startDate: '2024-06-15',
    status: 'active',
    linkedIn: 'https://www.linkedin.com/in/lucassilva',
    bio: 'Marketing graduate with social media and content creation skills. Creative mindset with data-driven approach. Learning product marketing for hardware.',
  },
];

// Active supplier engagements
export const SUPPLIER_ENGAGEMENTS: SupplierEngagement[] = [
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'eng-1',
    supplierName: 'Precision Components Ltd',
    supplierId: '1',
    projectName: 'Main Circuit Board Manufacturing',
    description: 'PCB design and manufacturing for MVP hardware units',
    status: 'in_progress',
    assignedTo: 'apprentice-5',
    totalCost: 28500,
    paidToDate: 15000,
    deliveryDate: '2025-02-15',
    startDate: '2024-12-01',
    tasks: [
      'PCB schematic review',
      'Component sourcing',
      'Prototype manufacturing (100 units)',
      'Quality testing',
      'Full production run (500 units)',
    ],
    linkedWorkPlanIds: ['wp-f1'], // Linked to PCB design task
    componentName: 'Main Circuit Board v2.0',
    processDescription: 'PCB fabrication with component assembly and testing',
    estimatedDuration: 45, // days
    contactPerson: 'John Smith',
    contactEmail: 'john.smith@precisioncomponents.co.uk',
    contactPhone: '+44 1234 567890',
    notes: 'On track for delivery. Prototypes approved, moving to full production.',
    location: {
      city: 'Birmingham',
      address: 'Birmingham Business Park, B37 7YE',
      latitude: 52.4862,
      longitude: -1.8904,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'eng-2',
    supplierName: 'UK Plastics Manufacturing',
    supplierId: '4',
    projectName: 'Device Housing & Enclosures',
    description: 'Injection molded plastic housings for product line',
    status: 'in_progress',
    assignedTo: 'apprentice-6',
    totalCost: 15200,
    paidToDate: 7500,
    deliveryDate: '2025-02-28',
    startDate: '2024-12-15',
    tasks: [
      'CAD design finalization',
      'Mold creation',
      'Sample production',
      'Color matching',
      'Full production (500 units)',
    ],
    linkedWorkPlanIds: ['wp-f2'], // Linked to product housing design task
    componentName: 'Product Housing Shell',
    processDescription: 'Injection molding with UV-resistant ABS plastic',
    estimatedDuration: 60, // days
    contactPerson: 'Emily Watson',
    contactEmail: 'emily@ukplastics.co.uk',
    contactPhone: '+44 1234 567891',
    notes: 'Molds completed. Waiting on color approval from design team.',
    location: {
      city: 'Leeds',
      address: 'West Yorkshire Trading Estate, LS12 6HH',
      latitude: 53.7997,
      longitude: -1.5492,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'eng-3',
    supplierName: 'Manchester Metal Works',
    supplierId: '2',
    projectName: 'Mounting Brackets & Hardware',
    description: 'CNC machined aluminum mounting brackets and fasteners',
    status: 'delivered',
    assignedTo: 'apprentice-5',
    totalCost: 8900,
    paidToDate: 8900,
    deliveryDate: '2025-01-10',
    startDate: '2024-11-01',
    tasks: [
      'Technical drawings review',
      'CNC programming',
      'First article inspection',
      'Production run (1000 units)',
      'Anodizing & finishing',
    ],
    contactPerson: 'Robert Brown',
    contactEmail: 'robert@manchestermetalworks.co.uk',
    contactPhone: '+44 161 234 5678',
    notes: 'Delivered on time. Quality excellent. Approved for future orders.',
    location: {
      city: 'Manchester',
      address: 'Trafford Park Industrial Estate, M17 1SN',
      latitude: 53.4668,
      longitude: -2.3084,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'eng-4',
    supplierName: 'British Assembly Solutions',
    supplierId: '7',
    projectName: 'Final Product Assembly',
    description: 'End-to-end assembly of hardware units',
    status: 'planning',
    assignedTo: 'exec-3',
    totalCost: 42000,
    paidToDate: 0,
    deliveryDate: '2025-03-31',
    startDate: '2025-02-20',
    tasks: [
      'Assembly line setup',
      'Work instructions creation',
      'Operator training',
      'Pilot run (50 units)',
      'Full production (500 units)',
      'Quality assurance testing',
    ],
    contactPerson: 'Catherine Green',
    contactEmail: 'catherine@britishassembly.co.uk',
    contactPhone: '+44 20 7946 0958',
    notes: 'Waiting for PCB and housing delivery before starting.',
    location: {
      city: 'London',
      address: 'Park Royal Business Centre, NW10 7XP',
      latitude: 51.5319,
      longitude: -0.2893,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'eng-5',
    supplierName: 'London Logistics Ltd',
    supplierId: '15',
    projectName: 'Warehousing & Distribution',
    description: 'Storage and fulfillment for finished goods',
    status: 'in_progress',
    assignedTo: 'apprentice-3',
    totalCost: 6500,
    paidToDate: 2000,
    deliveryDate: '2025-12-31',
    startDate: '2025-01-01',
    tasks: [
      'Warehouse space allocation',
      'Inventory management system setup',
      'Receiving procedures',
      'Pick & pack operations',
      'Shipping carrier integration',
    ],
    contactPerson: 'David Miller',
    contactEmail: 'david@londonlogistics.co.uk',
    contactPhone: '+44 20 7946 0959',
    notes: 'Ongoing monthly contract. First shipments scheduled for Feb 2025.',
    location: {
      city: 'London',
      address: 'Docklands Logistics Park, E16 2EZ',
      latitude: 51.5074,
      longitude: 0.0278,
    },
  },
];

// AI Agents & Assistants Directory
// Organized by business function to match org structure
export const AI_AGENTS: AIAgent[] = [
  // ========== FINANCE (3 agents) ==========
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-finance-1',
    name: 'Vic AI',
    provider: 'Other',
    model: 'vic-ai-ap',
    purpose: 'Autonomous invoice processing and accounts payable automation',
    usedBy: ['apprentice-1', 'apprentice-2', 'exec-1'],
    functions: ['Finance'],
    costPerMonth: 450,
    website: 'https://vic.ai',
    capabilities: [
      'Automated invoice extraction',
      'GL code assignment',
      'Duplicate invoice detection',
      'Purchase order matching',
      'Approval workflow automation',
      'Real-time spend analytics',
    ],
    integrations: ['QuickBooks', 'Xero', 'NetSuite', 'Slack'],
    status: 'active',
    addedDate: '2024-08-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 850,
      averageResponseTime: '3.2s',
      successRate: 98.5,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-finance-2',
    name: 'Digits AI',
    provider: 'Other',
    model: 'digits-bookkeeping',
    purpose: 'AI-powered bookkeeping and financial insights',
    usedBy: ['apprentice-1', 'exec-1'],
    functions: ['Finance'],
    costPerMonth: 350,
    website: 'https://digits.com',
    capabilities: [
      'Automated bookkeeping',
      'Financial reporting dashboards',
      'Cash flow forecasting',
      'Expense categorization',
      'Revenue recognition',
      'Financial health scoring',
    ],
    integrations: ['Bank accounts', 'Credit cards', 'Stripe', 'Plaid'],
    status: 'active',
    addedDate: '2024-09-01',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 620,
      averageResponseTime: '2.1s',
      successRate: 97.8,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-finance-3',
    name: 'Gemini Pro',
    provider: 'Google',
    model: 'gemini-1.5-pro',
    purpose: 'Financial data analysis and spreadsheet automation',
    usedBy: ['apprentice-1', 'apprentice-2', 'exec-1'],
    functions: ['Finance'],
    costPerMonth: 200,
    website: 'https://ai.google.dev',
    capabilities: [
      'Financial modeling',
      'Google Sheets integration',
      'Budget variance analysis',
      'Scenario planning',
      'Chart and report generation',
      'Data validation',
    ],
    integrations: ['Google Workspace', 'Sheets', 'Docs', 'Drive'],
    status: 'active',
    addedDate: '2024-10-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 420,
      averageResponseTime: '2.8s',
      successRate: 96.8,
    },
  },

  // ========== SALES (4 agents) ==========
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-sales-1',
    name: '11x Alice',
    provider: 'Other',
    model: '11x-ai-sdr',
    purpose: 'Autonomous AI SDR for outbound sales',
    usedBy: ['apprentice-3', 'apprentice-4', 'exec-2'],
    functions: ['Sales'],
    costPerMonth: 850,
    website: 'https://11x.ai',
    capabilities: [
      'Automated lead prospecting',
      'Personalized email sequences',
      'Multi-channel outreach',
      'Meeting scheduling',
      'Lead qualification',
      'CRM integration',
    ],
    integrations: ['Salesforce', 'HubSpot', 'LinkedIn', 'Gmail'],
    status: 'active',
    addedDate: '2024-07-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 1450,
      averageResponseTime: '1.5s',
      successRate: 94.2,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-sales-2',
    name: 'Gong AI',
    provider: 'Other',
    model: 'gong-revenue-intelligence',
    purpose: 'Sales call analysis and revenue intelligence',
    usedBy: ['apprentice-3', 'apprentice-4', 'exec-2'],
    functions: ['Sales'],
    costPerMonth: 400,
    website: 'https://gong.io',
    capabilities: [
      'Call recording and transcription',
      'Conversation insights',
      'Deal risk assessment',
      'Coaching recommendations',
      'Competitor mention tracking',
      'Revenue forecasting',
    ],
    integrations: ['Zoom', 'Salesforce', 'Slack', 'Teams'],
    status: 'active',
    addedDate: '2024-08-15',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 320,
      averageResponseTime: '5.4s',
      successRate: 96.5,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-sales-3',
    name: 'Clay AI',
    provider: 'Other',
    model: 'clay-enrichment',
    purpose: 'Lead enrichment and prospecting automation',
    usedBy: ['apprentice-3', 'apprentice-4'],
    functions: ['Sales'],
    costPerMonth: 300,
    website: 'https://clay.com',
    capabilities: [
      'Contact data enrichment',
      'Company intelligence',
      'Tech stack detection',
      'Social media insights',
      'Intent data signals',
      'List building automation',
    ],
    integrations: ['Clearbit', 'LinkedIn', 'Salesforce', 'CSV'],
    status: 'active',
    addedDate: '2024-09-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 890,
      averageResponseTime: '3.7s',
      successRate: 95.8,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-sales-4',
    name: 'ElevenLabs Voice AI',
    provider: 'ElevenLabs',
    model: 'eleven_multilingual_v2',
    purpose: 'Sales demo voiceovers and presentation narration',
    usedBy: ['apprentice-3', 'apprentice-4'],
    functions: ['Sales'],
    costPerMonth: 99,
    website: 'https://elevenlabs.io',
    capabilities: [
      'Text-to-speech for demos',
      'Multi-language support',
      'Voice cloning',
      'Custom pronunciations',
      'Audio editing tools',
      'API integration',
    ],
    integrations: ['Descript', 'Adobe Premiere', 'API'],
    status: 'active',
    addedDate: '2024-12-01',
    lastUsed: '2025-01-09',
    usageStats: {
      requestsThisMonth: 45,
      averageResponseTime: '12.0s',
      successRate: 99.1,
    },
  },

  // ========== MARKETING (6 agents) ==========
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-marketing-1',
    name: 'Jasper AI',
    provider: 'Other',
    model: 'jasper-content',
    purpose: 'Content creation for marketing campaigns',
    usedBy: ['apprentice-7', 'exec-4'],
    functions: ['Marketing'],
    costPerMonth: 200,
    website: 'https://jasper.ai',
    capabilities: [
      'Blog post generation',
      'Social media content',
      'Email campaign copy',
      'SEO optimization',
      'Brand voice consistency',
      'Content templates',
    ],
    integrations: ['WordPress', 'Webflow', 'Grammarly', 'Surfer SEO'],
    status: 'active',
    addedDate: '2024-09-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 540,
      averageResponseTime: '4.2s',
      successRate: 96.3,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-marketing-2',
    name: 'Copy.ai',
    provider: 'Other',
    model: 'copyai-workflows',
    purpose: 'Marketing copy and workflow automation',
    usedBy: ['apprentice-7', 'exec-4'],
    functions: ['Marketing'],
    costPerMonth: 180,
    website: 'https://copy.ai',
    capabilities: [
      'Ad copy generation',
      'Product descriptions',
      'Landing page copy',
      'Email sequences',
      'A/B test variants',
      'Workflow automation',
    ],
    integrations: ['HubSpot', 'Mailchimp', 'Shopify', 'WordPress'],
    status: 'active',
    addedDate: '2024-10-01',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 380,
      averageResponseTime: '2.9s',
      successRate: 95.7,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-marketing-3',
    name: 'Midjourney',
    provider: 'Other',
    model: 'midjourney-v6',
    purpose: 'High-quality imagery for marketing materials',
    usedBy: ['apprentice-7', 'exec-4'],
    functions: ['Marketing'],
    costPerMonth: 60,
    website: 'https://midjourney.com',
    capabilities: [
      'Photorealistic imagery',
      'Product visualization',
      'Brand identity concepts',
      'Website hero images',
      'Pitch deck visuals',
      'Style consistency',
    ],
    integrations: ['Discord', 'Figma'],
    status: 'active',
    addedDate: '2024-11-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 125,
      averageResponseTime: '45s',
      successRate: 92.0,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-marketing-4',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    model: 'dall-e-3',
    purpose: 'Marketing visuals and social media graphics',
    usedBy: ['apprentice-7', 'exec-4'],
    functions: ['Marketing'],
    costPerMonth: 120,
    website: 'https://openai.com',
    capabilities: [
      'Social media graphics',
      'Ad creative concepts',
      'Presentation visuals',
      'Product mockups',
      'Infographic elements',
      'Text rendering in images',
    ],
    integrations: ['Figma', 'Canva', 'OpenAI API'],
    status: 'active',
    addedDate: '2024-11-01',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 180,
      averageResponseTime: '8.5s',
      successRate: 95.0,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-marketing-5',
    name: 'Perplexity Pro',
    provider: 'Other',
    model: 'perplexity-pro',
    purpose: 'Market research and competitive intelligence',
    usedBy: ['apprentice-7', 'exec-4'],
    functions: ['Marketing'],
    costPerMonth: 80,
    website: 'https://perplexity.ai',
    capabilities: [
      'Real-time web search',
      'Competitor research',
      'Market trend analysis',
      'Citation-backed answers',
      'News monitoring',
      'Industry insights',
    ],
    integrations: ['Browser extension', 'API'],
    status: 'active',
    addedDate: '2024-11-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 320,
      averageResponseTime: '4.2s',
      successRate: 94.5,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-marketing-6',
    name: 'Runway Gen-2',
    provider: 'Other',
    model: 'runway-gen2',
    purpose: 'AI video generation for marketing content',
    usedBy: ['apprentice-7', 'exec-4'],
    functions: ['Marketing'],
    costPerMonth: 250,
    website: 'https://runwayml.com',
    capabilities: [
      'Text-to-video generation',
      'Image-to-video animation',
      'Video style transfer',
      'Motion graphics',
      'Product demo videos',
      'Social media content',
    ],
    integrations: ['Adobe Premiere', 'Final Cut Pro', 'DaVinci Resolve'],
    status: 'active',
    addedDate: '2024-12-01',
    lastUsed: '2025-01-09',
    usageStats: {
      requestsThisMonth: 65,
      averageResponseTime: '120s',
      successRate: 89.5,
    },
  },

  // ========== OPS (3 agents) ==========
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-ops-1',
    name: 'Hebbia AI',
    provider: 'Other',
    model: 'hebbia-matrix',
    purpose: 'Document analysis and operational workflows',
    usedBy: ['exec-1', 'exec-3', 'apprentice-1', 'apprentice-5'],
    functions: ['Ops'],
    costPerMonth: 400,
    website: 'https://hebbia.ai',
    capabilities: [
      'Multi-document analysis',
      'Contract review',
      'Compliance checking',
      'Data extraction',
      'Workflow automation',
      'Knowledge synthesis',
    ],
    integrations: ['Google Drive', 'Dropbox', 'SharePoint', 'Slack'],
    status: 'active',
    addedDate: '2024-08-01',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 280,
      averageResponseTime: '6.8s',
      successRate: 95.2,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-ops-2',
    name: 'Zapier AI',
    provider: 'Other',
    model: 'zapier-automation',
    purpose: 'Workflow automation across tools',
    usedBy: ['All team members'],
    functions: ['Ops'],
    costPerMonth: 150,
    website: 'https://zapier.com',
    capabilities: [
      'App integration',
      'Automated workflows',
      'Data syncing',
      'Trigger-based actions',
      'Multi-step automation',
      'AI-powered suggestions',
    ],
    integrations: ['5000+ apps', 'Slack', 'Gmail', 'Sheets', 'CRM'],
    status: 'active',
    addedDate: '2024-07-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 1850,
      averageResponseTime: '1.2s',
      successRate: 97.8,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-ops-3',
    name: 'Harvey AI',
    provider: 'Other',
    model: 'harvey-legal',
    purpose: 'Legal document review and compliance',
    usedBy: ['exec-1', 'founder-1'],
    functions: ['Ops'],
    costPerMonth: 500,
    website: 'https://harvey.ai',
    capabilities: [
      'Contract analysis',
      'Legal research',
      'Compliance checking',
      'Risk assessment',
      'Document drafting',
      'Regulatory updates',
    ],
    integrations: ['Microsoft Word', 'Google Docs', 'DocuSign'],
    status: 'active',
    addedDate: '2024-09-01',
    lastUsed: '2025-01-08',
    usageStats: {
      requestsThisMonth: 95,
      averageResponseTime: '8.5s',
      successRate: 96.8,
    },
  },

  // ========== ENGINEERING (4 agents) ==========
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-eng-1',
    name: 'GitHub Copilot',
    provider: 'OpenAI',
    model: 'gpt-4-copilot',
    purpose: 'Real-time code completion and suggestions',
    usedBy: ['apprentice-5', 'apprentice-6', 'exec-3'],
    functions: ['Engineering'],
    costPerMonth: 60,
    website: 'https://github.com/features/copilot',
    capabilities: [
      'Code autocomplete',
      'Function generation',
      'Refactoring suggestions',
      'Test generation',
      'Documentation writing',
      'Multi-language support',
    ],
    integrations: ['VS Code', 'JetBrains IDEs', 'Neovim', 'GitHub'],
    status: 'active',
    addedDate: '2024-09-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 3400,
      averageResponseTime: '0.5s',
      successRate: 92.0,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-eng-2',
    name: 'Cursor AI',
    provider: 'Other',
    model: 'cursor-gpt4',
    purpose: 'AI code editor with advanced IDE features',
    usedBy: ['apprentice-5', 'apprentice-6', 'exec-3'],
    functions: ['Engineering'],
    costPerMonth: 80,
    website: 'https://cursor.sh',
    capabilities: [
      'Natural language code editing',
      'Codebase understanding',
      'Refactoring assistance',
      'Bug detection',
      'Code generation',
      'Context-aware suggestions',
    ],
    integrations: ['VS Code fork', 'GitHub', 'GitLab', 'Terminal'],
    status: 'active',
    addedDate: '2024-10-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 2200,
      averageResponseTime: '1.8s',
      successRate: 94.5,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-eng-3',
    name: 'Replit Ghostwriter',
    provider: 'Other',
    model: 'replit-ghostwriter',
    purpose: 'Code generation and debugging assistance',
    usedBy: ['apprentice-5', 'apprentice-6'],
    functions: ['Engineering'],
    costPerMonth: 40,
    website: 'https://replit.com',
    capabilities: [
      'Code completion',
      'Error explanation',
      'Code generation',
      'Debugging assistance',
      'Terminal command suggestions',
      'Package recommendations',
    ],
    integrations: ['Replit IDE', 'GitHub import', 'NPM', 'PyPI'],
    status: 'active',
    addedDate: '2024-11-01',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 680,
      averageResponseTime: '1.2s',
      successRate: 91.5,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-eng-4',
    name: 'Tabnine',
    provider: 'Other',
    model: 'tabnine-enterprise',
    purpose: 'Private code completion for sensitive codebases',
    usedBy: ['exec-3', 'apprentice-5', 'apprentice-6'],
    functions: ['Engineering'],
    costPerMonth: 90,
    website: 'https://tabnine.com',
    capabilities: [
      'On-premise code completion',
      'Team model training',
      'Context-aware suggestions',
      'Code pattern learning',
      'Security compliance',
      'No data sharing',
    ],
    integrations: ['VS Code', 'IntelliJ', 'PyCharm', 'WebStorm'],
    status: 'active',
    addedDate: '2024-09-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 1850,
      averageResponseTime: '0.8s',
      successRate: 93.2,
    },
  },

  // ========== ADMIN/ALL (4 agents) ==========
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-admin-1',
    name: 'ChatGPT Enterprise',
    provider: 'OpenAI',
    model: 'gpt-4',
    purpose: 'General-purpose assistant for all team members',
    usedBy: ['All team members'],
    functions: ['Admin'],
    costPerMonth: 600,
    website: 'https://openai.com',
    capabilities: [
      'Email drafting',
      'Meeting summaries',
      'Task planning',
      'Problem solving',
      'Brainstorming',
      'Data privacy (enterprise)',
    ],
    integrations: ['Web', 'Mobile app', 'API', 'Microsoft Teams'],
    status: 'active',
    addedDate: '2024-08-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 2100,
      averageResponseTime: '2.5s',
      successRate: 98.5,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-admin-2',
    name: 'Notion AI',
    provider: 'Other',
    model: 'notion-ai',
    purpose: 'Documentation and knowledge management',
    usedBy: ['All team members'],
    functions: ['Admin'],
    costPerMonth: 120,
    website: 'https://notion.so/product/ai',
    capabilities: [
      'Note summarization',
      'Action item extraction',
      'Document writing',
      'Table generation',
      'Translation',
      'Meeting notes formatting',
    ],
    integrations: ['Notion workspace', 'Slack', 'Google Calendar'],
    status: 'active',
    addedDate: '2024-09-01',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 670,
      averageResponseTime: '1.8s',
      successRate: 97.0,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-admin-3',
    name: 'Otter.ai',
    provider: 'Other',
    model: 'otter-business',
    purpose: 'Meeting transcription and notes',
    usedBy: ['All team members'],
    functions: ['Admin'],
    costPerMonth: 100,
    website: 'https://otter.ai',
    capabilities: [
      'Real-time transcription',
      'Speaker identification',
      'Action item detection',
      'Meeting summaries',
      'Searchable transcripts',
      'Calendar integration',
    ],
    integrations: ['Zoom', 'Google Meet', 'Teams', 'Slack'],
    status: 'active',
    addedDate: '2024-10-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 450,
      averageResponseTime: '5.2s',
      successRate: 96.5,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-admin-4',
    name: 'Grammarly Business',
    provider: 'Other',
    model: 'grammarly-enterprise',
    purpose: 'Writing assistance across all communications',
    usedBy: ['All team members'],
    functions: ['Admin'],
    costPerMonth: 75,
    website: 'https://grammarly.com',
    capabilities: [
      'Grammar checking',
      'Tone detection',
      'Clarity suggestions',
      'Plagiarism detection',
      'Brand style guide',
      'Real-time suggestions',
    ],
    integrations: ['Browser extension', 'Microsoft Office', 'Google Docs', 'Slack'],
    status: 'active',
    addedDate: '2024-09-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 1240,
      averageResponseTime: '0.4s',
      successRate: 98.8,
    },
  },

  // ===== DESIGN & MANUFACTURING AGENTS (6 agents - £1,580/mo) =====
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-design-1',
    name: 'Autodesk Fusion AI',
    provider: 'Other',
    model: 'fusion-360-ai',
    purpose: 'AI-assisted CAD design and generative design for manufacturing',
    usedBy: ['exec-5', 'apprentice-6'],
    functions: ['Engineering', 'Ops'],
    costPerMonth: 420,
    website: 'https://autodesk.com/products/fusion-360',
    capabilities: [
      'Generative design optimization',
      'DFM analysis and suggestions',
      'Automated CAD modeling',
      'Material selection AI',
      'Topology optimization',
      'Real-time design validation',
    ],
    integrations: ['Fusion 360', 'AutoCAD', 'SolidWorks', 'Slack'],
    status: 'active',
    addedDate: '2024-07-20',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 340,
      averageResponseTime: '8.5s',
      successRate: 96.2,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-design-2',
    name: 'Monolith AI',
    provider: 'Other',
    model: 'monolith-simulation',
    purpose: 'AI-powered simulation and material behavior prediction',
    usedBy: ['exec-5', 'apprentice-5'],
    functions: ['Engineering'],
    costPerMonth: 380,
    website: 'https://monolithai.com',
    capabilities: [
      'Virtual material testing',
      'Stress analysis prediction',
      'Fatigue life estimation',
      'Manufacturing process simulation',
      'Material property optimization',
      'Reduced physical prototyping',
    ],
    integrations: ['ANSYS', 'Abaqus', 'Python API', 'Excel'],
    status: 'active',
    addedDate: '2024-08-10',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 180,
      averageResponseTime: '12.3s',
      successRate: 97.8,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-design-3',
    name: 'Diagram AI',
    provider: 'Other',
    model: 'diagram-pcb-designer',
    purpose: 'AI-assisted PCB design and electronic circuit optimization',
    usedBy: ['exec-4', 'apprentice-7'],
    functions: ['Engineering'],
    costPerMonth: 250,
    website: 'https://diagram.com',
    capabilities: [
      'Auto-routing optimization',
      'Component placement suggestions',
      'Signal integrity analysis',
      'Thermal management AI',
      'DFM rule checking',
      'Bill of materials optimization',
    ],
    integrations: ['Altium Designer', 'KiCad', 'Eagle', 'GitHub'],
    status: 'active',
    addedDate: '2024-09-05',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 220,
      averageResponseTime: '5.8s',
      successRate: 95.5,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-design-4',
    name: 'Manufacturing GPT',
    provider: 'OpenAI',
    model: 'gpt-4-manufacturing',
    purpose: 'Manufacturing process planning and supplier sourcing assistance',
    usedBy: ['exec-3', 'apprentice-3', 'apprentice-6'],
    functions: ['Ops', 'Engineering'],
    costPerMonth: 180,
    website: 'https://example.com',
    capabilities: [
      'Process selection recommendations',
      'Supplier capability matching',
      'Cost estimation for processes',
      'Lead time prediction',
      'Quality requirement analysis',
      'Manufacturing documentation generation',
    ],
    integrations: ['ChatGPT', 'API access', 'Slack', 'Notion'],
    status: 'active',
    addedDate: '2024-10-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 580,
      averageResponseTime: '2.1s',
      successRate: 98.9,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-design-5',
    name: 'Spline AI',
    provider: 'Other',
    model: 'spline-3d-designer',
    purpose: '3D product visualization and rendering for marketing materials',
    usedBy: ['apprentice-4', 'exec-2'],
    functions: ['Marketing', 'Engineering'],
    costPerMonth: 150,
    website: 'https://spline.design',
    capabilities: [
      '3D model generation from sketches',
      'Photorealistic rendering',
      'Animation creation',
      'AR/VR export',
      'Marketing visual generation',
      'Web-ready 3D exports',
    ],
    integrations: ['Figma', 'Blender', 'Three.js', 'Web exports'],
    status: 'active',
    addedDate: '2024-11-12',
    lastUsed: '2025-01-10',
    usageStats: {
      requestsThisMonth: 290,
      averageResponseTime: '6.7s',
      successRate: 97.1,
    },
  },
  {
    workspaceId: DEFAULT_WORKSPACE_ID,
    id: 'ai-design-6',
    name: 'Quality AI Inspector',
    provider: 'Other',
    model: 'vision-qa-system',
    purpose: 'Computer vision quality control and defect detection',
    usedBy: ['exec-3', 'apprentice-5'],
    functions: ['Ops'],
    costPerMonth: 200,
    website: 'https://example.com',
    capabilities: [
      'Visual defect detection',
      'Dimensional accuracy checking',
      'Surface finish analysis',
      'Assembly verification',
      'Real-time inspection feedback',
      'Statistical quality reporting',
    ],
    integrations: ['Industrial cameras', 'Python API', 'Excel', 'ERP systems'],
    status: 'active',
    addedDate: '2024-11-20',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 1450,
      averageResponseTime: '1.2s',
      successRate: 99.2,
    },
  },
];

// Calculate total AI spend
export const getTotalAISpend = (): number => {
  return AI_AGENTS.filter(agent => agent.status === 'active').reduce(
    (total, agent) => total + agent.costPerMonth,
    0
  );
};

// Calculate total team cost
export const getTotalTeamCost = (): {
  total: number;
  founders: number;
  execs: number;
  apprentices: number;
} => {
  const founders = ORGANIZATION_MEMBERS.filter(m => m.role === 'Founder' && m.status === 'active');
  const execs = ORGANIZATION_MEMBERS.filter(m => m.role === 'FractionalExec' && m.status === 'active');
  const apprentices = ORGANIZATION_MEMBERS.filter(m => m.role === 'Apprentice' && m.status === 'active');

  // Founders typically don't have daily costs in this model
  const foundersTotal = 0;

  // Execs are calculated per day - assume 2-3 days/week, so roughly 10 days/month
  const execsTotal = execs.reduce((sum, m) => sum + (m.costPerDay || 0) * 10, 0);

  // Apprentices are full-time - assume 20 working days/month
  const apprenticesTotal = apprentices.reduce((sum, m) => sum + (m.costPerDay || 0) * 20, 0);

  return {
    total: foundersTotal + execsTotal + apprenticesTotal,
    founders: foundersTotal,
    execs: execsTotal,
    apprentices: apprenticesTotal,
  };
};

// Calculate total supplier spend
export const getTotalSupplierSpend = (): {
  total: number;
  paid: number;
  remaining: number;
} => {
  const total = SUPPLIER_ENGAGEMENTS.reduce((sum, eng) => sum + eng.totalCost, 0);
  const paid = SUPPLIER_ENGAGEMENTS.reduce((sum, eng) => sum + eng.paidToDate, 0);
  return {
    total,
    paid,
    remaining: total - paid,
  };
};
