// Organization structure seed data
// Shows reporting lines, supplier engagements, and AI agent assignments

export interface OrganizationMember {
  id: string;
  name: string;
  role: 'Founder' | 'FractionalExec' | 'Apprentice';
  function: string;
  reportsTo?: string; // ID of who they report to
  manages?: string[]; // IDs of people they manage
  email: string;
  phone: string;
  costPerDay?: number;
  startDate: string;
  status: 'active' | 'inactive';
}

export interface SupplierEngagement {
  id: string;
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
  tasks: string[];
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  notes?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'ElevenLabs' | 'Vibecode' | 'Other';
  model: string;
  purpose: string;
  usedBy: string[]; // Array of user IDs or roles
  functions: string[]; // What business functions it helps with
  costPerMonth: number;
  apiEndpoint?: string;
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
}

// Organization structure with reporting lines
export const ORGANIZATION_MEMBERS: OrganizationMember[] = [
  // Founders (no reports to anyone)
  {
    id: 'founder-1',
    name: 'Sarah Chen',
    role: 'Founder',
    function: 'Strategy',
    manages: ['exec-1', 'exec-2', 'exec-3', 'exec-4'],
    email: 'sarah@fractional.com',
    phone: '+44 7700 900101',
    startDate: '2024-01-01',
    status: 'active',
  },
  {
    id: 'founder-2',
    name: 'Marcus Thompson',
    role: 'Founder',
    function: 'Product',
    manages: ['exec-3', 'exec-4'],
    email: 'marcus@fractional.com',
    phone: '+44 7700 900102',
    startDate: '2024-01-01',
    status: 'active',
  },

  // Fractional Executives
  {
    id: 'exec-1',
    name: 'Jordan Martinez',
    role: 'FractionalExec',
    function: 'Finance',
    reportsTo: 'founder-1',
    manages: ['apprentice-1', 'apprentice-2'],
    email: 'jordan@fractional.com',
    phone: '+44 7700 900201',
    costPerDay: 850,
    startDate: '2024-02-01',
    status: 'active',
  },
  {
    id: 'exec-2',
    name: 'Emma Richardson',
    role: 'FractionalExec',
    function: 'Sales',
    reportsTo: 'founder-1',
    manages: ['apprentice-3', 'apprentice-4'],
    email: 'emma.richardson@fractional.com',
    phone: '+44 7700 900202',
    costPerDay: 920,
    startDate: '2024-02-15',
    status: 'active',
  },
  {
    id: 'exec-3',
    name: 'David Park',
    role: 'FractionalExec',
    function: 'Engineering',
    reportsTo: 'founder-2',
    manages: ['apprentice-5', 'apprentice-6'],
    email: 'david.park@fractional.com',
    phone: '+44 7700 900203',
    costPerDay: 1100,
    startDate: '2024-03-01',
    status: 'active',
  },
  {
    id: 'exec-4',
    name: 'Sophie Adams',
    role: 'FractionalExec',
    function: 'Marketing',
    reportsTo: 'founder-1',
    manages: ['apprentice-7'],
    email: 'sophie.adams@fractional.com',
    phone: '+44 7700 900204',
    costPerDay: 780,
    startDate: '2024-03-15',
    status: 'active',
  },

  // Apprentices
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

// Active supplier engagements
export const SUPPLIER_ENGAGEMENTS: SupplierEngagement[] = [
  {
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
    contactPerson: 'John Smith',
    contactEmail: 'john.smith@precisioncomponents.co.uk',
    contactPhone: '+44 1234 567890',
    notes: 'On track for delivery. Prototypes approved, moving to full production.',
  },
  {
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
    contactPerson: 'Emily Watson',
    contactEmail: 'emily@ukplastics.co.uk',
    contactPhone: '+44 1234 567891',
    notes: 'Molds completed. Waiting on color approval from design team.',
  },
  {
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
  },
  {
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
  },
  {
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
  },
];

// AI Agents & Assistants Directory
export const AI_AGENTS: AIAgent[] = [
  {
    id: 'ai-1',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    model: 'gpt-4-turbo-preview',
    purpose: 'Code generation, technical documentation, API integration',
    usedBy: ['apprentice-5', 'apprentice-6', 'exec-3'],
    functions: ['Engineering', 'Ops'],
    costPerMonth: 450,
    capabilities: [
      'Natural language to code',
      'Code review and debugging',
      'API documentation generation',
      'Technical writing',
      'Test case generation',
    ],
    integrations: ['VS Code', 'GitHub Copilot', 'Slack'],
    status: 'active',
    addedDate: '2024-10-01',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 1250,
      averageResponseTime: '2.3s',
      successRate: 97.5,
    },
  },
  {
    id: 'ai-2',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    model: 'claude-3-5-sonnet-20241022',
    purpose: 'Business strategy, long-form content, analysis',
    usedBy: ['founder-1', 'founder-2', 'exec-2', 'exec-4', 'apprentice-7'],
    functions: ['Strategy', 'Marketing', 'Sales', 'Finance'],
    costPerMonth: 380,
    capabilities: [
      'Strategic planning',
      'Market research analysis',
      'Sales pitch generation',
      'Marketing copy writing',
      'Financial modeling assistance',
      'Long document analysis',
    ],
    integrations: ['Vibecode', 'Slack', 'Notion'],
    status: 'active',
    addedDate: '2024-09-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 890,
      averageResponseTime: '3.1s',
      successRate: 98.2,
    },
  },
  {
    id: 'ai-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    model: 'dall-e-3',
    purpose: 'Marketing imagery, product visualization, social media content',
    usedBy: ['apprentice-7', 'exec-4'],
    functions: ['Marketing'],
    costPerMonth: 120,
    capabilities: [
      'Product mockup generation',
      'Social media graphics',
      'Ad creative concepts',
      'Presentation visuals',
      'Website imagery',
    ],
    integrations: ['Figma', 'Canva'],
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
    id: 'ai-4',
    name: 'ElevenLabs Voice AI',
    provider: 'ElevenLabs',
    model: 'eleven_multilingual_v2',
    purpose: 'Sales demo voiceovers, training materials, product videos',
    usedBy: ['apprentice-3', 'apprentice-4', 'apprentice-7'],
    functions: ['Sales', 'Marketing'],
    costPerMonth: 99,
    capabilities: [
      'Text-to-speech for sales demos',
      'Voiceover for product videos',
      'Training material narration',
      'Multi-language support',
      'Voice cloning',
    ],
    integrations: ['Descript', 'Adobe Premiere'],
    status: 'active',
    addedDate: '2024-12-01',
    lastUsed: '2025-01-09',
    usageStats: {
      requestsThisMonth: 45,
      averageResponseTime: '12.0s',
      successRate: 99.1,
    },
  },
  {
    id: 'ai-5',
    name: 'Gemini Pro',
    provider: 'Google',
    model: 'gemini-1.5-pro',
    purpose: 'Data analysis, spreadsheet automation, research',
    usedBy: ['apprentice-1', 'apprentice-2', 'exec-1'],
    functions: ['Finance', 'Ops'],
    costPerMonth: 200,
    capabilities: [
      'Financial data analysis',
      'Google Sheets integration',
      'Market research',
      'Competitor analysis',
      'Report generation',
    ],
    integrations: ['Google Workspace', 'Sheets', 'Docs'],
    status: 'active',
    addedDate: '2024-10-15',
    lastUsed: '2025-01-11',
    usageStats: {
      requestsThisMonth: 420,
      averageResponseTime: '2.8s',
      successRate: 96.8,
    },
  },
  {
    id: 'ai-6',
    name: 'Perplexity Pro',
    provider: 'Other',
    model: 'perplexity-pro',
    purpose: 'Real-time research, competitive intelligence, fact-checking',
    usedBy: ['exec-2', 'exec-4', 'apprentice-3', 'apprentice-7'],
    functions: ['Sales', 'Marketing', 'Strategy'],
    costPerMonth: 80,
    capabilities: [
      'Real-time web search',
      'Competitor research',
      'Market trend analysis',
      'Citation-backed answers',
      'News monitoring',
    ],
    integrations: ['Browser extension'],
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
    id: 'ai-7',
    name: 'GitHub Copilot',
    provider: 'OpenAI',
    model: 'gpt-4-copilot',
    purpose: 'Real-time code completion and suggestions',
    usedBy: ['apprentice-5', 'apprentice-6', 'exec-3'],
    functions: ['Engineering'],
    costPerMonth: 60,
    capabilities: [
      'Code autocomplete',
      'Function generation',
      'Refactoring suggestions',
      'Test generation',
      'Documentation writing',
    ],
    integrations: ['VS Code', 'JetBrains IDEs', 'Neovim'],
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
    id: 'ai-8',
    name: 'ChatGPT Enterprise',
    provider: 'OpenAI',
    model: 'gpt-4',
    purpose: 'General-purpose assistant for all team members',
    usedBy: ['All team members'],
    functions: ['All'],
    costPerMonth: 600,
    capabilities: [
      'Email drafting',
      'Meeting summaries',
      'Task planning',
      'Problem solving',
      'Brainstorming',
      'Data privacy (enterprise)',
    ],
    integrations: ['Web', 'Mobile app', 'API'],
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
    id: 'ai-9',
    name: 'Notion AI',
    provider: 'Other',
    model: 'notion-ai',
    purpose: 'Documentation, meeting notes, knowledge management',
    usedBy: ['All team members'],
    functions: ['All'],
    costPerMonth: 120,
    capabilities: [
      'Note summarization',
      'Action item extraction',
      'Document writing',
      'Table generation',
      'Translation',
    ],
    integrations: ['Notion workspace'],
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
    id: 'ai-10',
    name: 'Midjourney',
    provider: 'Other',
    model: 'midjourney-v6',
    purpose: 'High-quality marketing and product imagery',
    usedBy: ['apprentice-7', 'exec-4'],
    functions: ['Marketing'],
    costPerMonth: 60,
    capabilities: [
      'Photorealistic imagery',
      'Product visualization',
      'Brand identity concepts',
      'Website hero images',
      'Pitch deck visuals',
    ],
    integrations: ['Discord'],
    status: 'trial',
    addedDate: '2024-12-15',
    lastUsed: '2025-01-08',
    usageStats: {
      requestsThisMonth: 85,
      averageResponseTime: '45s',
      successRate: 88.0,
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
