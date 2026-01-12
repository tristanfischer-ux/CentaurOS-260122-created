import type { Role, Function as BusinessFunction } from '@/types';

// Candidate interface
export interface Candidate {
  id: string;
  name: string;
  role: Role;
  specialization: BusinessFunction[];
  rating: number;
  experience: number;
  costPerDay: number;
  availability: string;
  bio: string;
  skills: string[];
  previousCompanies: string[];
  avatarColor: string;
  education?: string;
  certifications?: string[];
  achievements?: string[];
  location: string;
  email: string;
  phone: string;
  linkedIn?: string;
}

// Helper to generate realistic UK names
const firstNames = {
  male: ['James', 'Oliver', 'George', 'Noah', 'Oscar', 'Leo', 'Harry', 'Arthur', 'Alfie', 'Archie', 'Henry', 'Theodore', 'Freddie', 'Jack', 'Charlie', 'Thomas', 'Lucas', 'Isaac', 'Ethan', 'Max', 'William', 'Alexander', 'Benjamin', 'Sebastian', 'Samuel', 'Joseph', 'Dylan', 'Edward', 'Harrison', 'Daniel', 'Mason', 'Logan', 'Jacob', 'Finley', 'Elijah', 'Mohammad', 'Caleb', 'Felix', 'Ezra', 'Jayden'],
  female: ['Olivia', 'Amelia', 'Isla', 'Ava', 'Ivy', 'Freya', 'Lily', 'Florence', 'Mia', 'Willow', 'Rosie', 'Sophia', 'Isabella', 'Grace', 'Daisy', 'Sienna', 'Poppy', 'Emily', 'Phoebe', 'Sofia', 'Evie', 'Elsie', 'Charlotte', 'Ella', 'Scarlett', 'Maya', 'Aria', 'Penelope', 'Harper', 'Bonnie', 'Evelyn', 'Matilda', 'Luna', 'Ruby', 'Maisie', 'Millie', 'Emma', 'Chloe', 'Zara', 'Layla'],
};

const lastNames = ['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Johnson', 'Roberts', 'Robinson', 'Wright', 'Thompson', 'Walker', 'White', 'Edwards', 'Hughes', 'Green', 'Lewis', 'Wood', 'Harris', 'Martin', 'Jackson', 'Clarke', 'Clark', 'Turner', 'Hill', 'Scott', 'Cooper', 'Morris', 'Ward', 'Moore', 'King', 'Watson', 'Baker', 'Harrison', 'Morgan', 'Patel', 'Young', 'Allen', 'Mitchell', 'Carter', 'Phillips', 'Campbell', 'Anderson', 'Shaw', 'Lee', 'Bennett', 'Cox'];

const ukCities = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh',
  'Leicester', 'Nottingham', 'Cambridge', 'Oxford', 'Brighton', 'Cardiff', 'Belfast', 'Southampton', 'Portsmouth', 'Reading',
  'Coventry', 'Bradford', 'Hull', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton', 'Derby', 'Swansea', 'Dundee', 'Aberdeen',
  'York', 'Bath', 'Norwich', 'Canterbury', 'Exeter', 'Winchester', 'Durham', 'Chester', 'Inverness', 'Perth',
];

// Executive specializations by experience level
const execSpecializations: Record<BusinessFunction, { skills: string[]; companies: string[]; certifications: string[] }> = {
  Sales: {
    skills: ['B2B Sales', 'Enterprise Sales', 'Revenue Operations', 'Sales Strategy', 'CRM Strategy', 'Deal Management', 'Sales Enablement', 'Pipeline Management', 'Account Management', 'Channel Sales'],
    companies: ['Salesforce', 'HubSpot', 'Stripe', 'Oracle', 'SAP', 'ServiceNow', 'Microsoft', 'AWS', 'Cisco', 'Gong', 'Outreach', 'Twilio', 'Segment', 'Intercom', 'Zendesk'],
    certifications: ['Salesforce Certified', 'MEDDIC Certified', 'Challenger Sales', 'Strategic Sales', 'Sales Leadership'],
  },
  Marketing: {
    skills: ['Growth Marketing', 'SEO/SEM', 'Content Strategy', 'Brand Strategy', 'Product Marketing', 'Demand Generation', 'Marketing Automation', 'ABM', 'Performance Marketing', 'Social Media'],
    companies: ['Google', 'Meta', 'HubSpot', 'Marketo', 'Adobe', 'Notion', 'Airtable', 'Figma', 'Slack', 'Buffer', 'Canva', 'Mailchimp', 'Hootsuite', 'Sprout Social', 'Moz'],
    certifications: ['Google Analytics', 'HubSpot Inbound', 'Product Marketing', 'Growth Marketing', 'Digital Marketing'],
  },
  Finance: {
    skills: ['Financial Planning', 'Fundraising', 'FP&A', 'Unit Economics', 'M&A', 'Valuation', 'Strategic Finance', 'Investor Relations', 'Financial Modeling', 'Cash Flow Management'],
    companies: ['Goldman Sachs', 'J.P. Morgan', 'McKinsey', 'BCG', 'Revolut', 'Monzo', 'TransferWise', 'Stripe', 'Brex', 'Ramp', 'Silicon Valley Bank', 'Deloitte', 'KPMG', 'PwC', 'EY'],
    certifications: ['CFA', 'ACA', 'ACCA', 'FP&A Certified', 'M&A Certified'],
  },
  Engineering: {
    skills: ['System Architecture', 'Cloud Infrastructure', 'DevOps', 'Platform Engineering', 'Technical Strategy', 'Team Leadership', 'Scalability', 'Security', 'AI/ML', 'Mobile Development'],
    companies: ['Google', 'Meta', 'Amazon', 'Microsoft', 'Netflix', 'Uber', 'Airbnb', 'Spotify', 'Twitter', 'LinkedIn', 'Dropbox', 'GitHub', 'GitLab', 'Stripe', 'Cloudflare'],
    certifications: ['AWS Solutions Architect', 'Kubernetes Certified', 'CISSP', 'Google Cloud Architect', 'Azure Solutions Architect'],
  },
  Ops: {
    skills: ['Operations Excellence', 'Process Optimization', 'Supply Chain', 'Project Management', 'RevOps', 'Customer Operations', 'Lean Six Sigma', 'Systems Integration', 'Data Analytics', 'Automation'],
    companies: ['Amazon', 'Tesla', 'Uber', 'Deliveroo', 'McKinsey', 'BCG', 'Deloitte', 'SAP', 'Oracle', 'NetSuite', 'Salesforce', 'Twilio', 'Intercom', 'Zendesk', 'Freshworks'],
    certifications: ['Lean Six Sigma Black Belt', 'PMP', 'RevOps Certified', 'Operations Management', 'Process Excellence'],
  },
  Admin: {
    skills: ['Executive Support', 'Office Management', 'Event Planning', 'Calendar Management', 'Travel Coordination', 'Project Coordination', 'Documentation', 'Stakeholder Management', 'Budget Management', 'Vendor Management'],
    companies: ['Meta', 'Google', 'Amazon', 'Microsoft', 'Apple', 'Salesforce', 'Oracle', 'SAP', 'Adobe', 'IBM', 'Accenture', 'Deloitte', 'KPMG', 'PwC', 'EY'],
    certifications: ['PMP', 'Certified Administrative Professional', 'Project Management', 'Event Management', 'Office Management'],
  },
};

const apprenticeSpecializations: Record<BusinessFunction, { skills: string[]; companies: string[] }> = {
  Sales: {
    skills: ['Cold Calling', 'Email Outreach', 'CRM (Salesforce)', 'Lead Qualification', 'Product Demos', 'Pipeline Management', 'Objection Handling', 'Customer Service'],
    companies: ['SaaS Startup', 'Tech Startup', 'Inside Sales', 'SDR Role', 'Telesales', 'Retail Sales'],
  },
  Marketing: {
    skills: ['Social Media', 'Content Writing', 'Email Marketing', 'SEO Writing', 'Graphic Design', 'Canva', 'Basic Analytics', 'Mailchimp', 'WordPress', 'Video Editing'],
    companies: ['Marketing Agency', 'Content Agency', 'Digital Agency', 'Social Media Management', 'Startup Intern'],
  },
  Finance: {
    skills: ['Excel', 'Bookkeeping', 'Financial Modeling', 'QuickBooks', 'Xero', 'Sage', 'Data Analysis', 'Invoicing', 'AR/AP', 'Reconciliation'],
    companies: ['Accounting Firm', 'Finance Startup', 'Bookkeeping', 'Accounting Assistant'],
  },
  Engineering: {
    skills: ['React', 'Node.js', 'Python', 'JavaScript', 'HTML/CSS', 'Git', 'Firebase', 'SQL', 'REST APIs', 'React Native'],
    companies: ['University Projects', 'Coding Bootcamp', 'Freelance', 'Startup Developer', 'Web Agency'],
  },
  Ops: {
    skills: ['Notion', 'Asana', 'Process Documentation', 'Data Entry', 'Project Coordination', 'Supply Chain Basics', 'Inventory Tracking', 'Excel', 'Data Analysis'],
    companies: ['Operations Intern', 'Logistics Company', 'Supply Chain Intern', 'Business Operations'],
  },
  Admin: {
    skills: ['Calendar Management', 'Travel Coordination', 'Google Workspace', 'Microsoft Office', 'Meeting Preparation', 'Event Planning', 'Scheduling', 'Task Management'],
    companies: ['Executive Assistant', 'Office Manager', 'Admin Assistant', 'Project Coordinator'],
  },
};

// Generate a random element from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// Generate random number in range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random rating
function randomRating(): number {
  return parseFloat((4.4 + Math.random() * 0.6).toFixed(1));
}

// Generate a random name
function generateName(): { first: string; last: string; email: string } {
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const first = randomFrom(firstNames[gender]);
  const last = randomFrom(lastNames);
  const email = `${first.toLowerCase()}.${last.toLowerCase()}@${Math.random() > 0.5 ? 'fractional' : 'executive'}.com`;
  return { first, last, email };
}

// Generate phone number
function generatePhone(offset: number): string {
  return `+44 7700 ${String(900000 + offset).padStart(6, '0')}`;
}

// Generate executive candidates
export function generateExecutives(startId: number, count: number): Candidate[] {
  const executives: Candidate[] = [];
  const functions: BusinessFunction[] = ['Sales', 'Marketing', 'Finance', 'Engineering', 'Ops', 'Admin'];

  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const { first, last, email } = generateName();
    const primaryFunc = randomFrom(functions);
    const secondaryFunc = Math.random() > 0.6 ? randomFrom(functions.filter(f => f !== primaryFunc)) : null;
    const specialization = secondaryFunc ? [primaryFunc, secondaryFunc] : [primaryFunc];

    const { skills, companies, certifications } = execSpecializations[primaryFunc];
    const selectedSkills = Array.from({ length: randomInt(3, 5) }, () => randomFrom(skills));
    const selectedCompanies = Array.from({ length: 3 }, () => randomFrom(companies));
    const selectedCerts = Array.from({ length: randomInt(1, 2) }, () => randomFrom(certifications));

    const experience = randomInt(10, 22);
    const costPerDay = Math.round((700 + Math.random() * 500) / 50) * 50; // Round to nearest £50

    const availabilityOptions = [
      'Available Now',
      'Available from Jan 20',
      'Available from Jan 25',
      'Available from Feb 1',
      'Available from Feb 5',
      'Available from Feb 10',
    ];

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#ef4444', '#a855f7'];

    const bios = [
      `Former ${randomFrom(['VP', 'Director', 'Head'])} of ${primaryFunc} with ${experience} years scaling high-growth startups. Expert in ${selectedSkills[0]} and ${selectedSkills[1]}.`,
      `${primaryFunc} leader with extensive experience at top tech companies. Specialized in ${selectedSkills[0]} and building high-performing teams.`,
      `Strategic ${primaryFunc.toLowerCase()} executive. Led initiatives generating £${randomInt(50, 500)}M+ in value across multiple successful companies.`,
      `Proven ${primaryFunc.toLowerCase()} expert. ${randomInt(15, 25)}+ years optimizing operations and driving ${randomInt(200, 500)}% growth.`,
      `Senior ${primaryFunc.toLowerCase()} professional with track record of transforming ${primaryFunc.toLowerCase()} functions at unicorn startups.`,
    ];

    executives.push({
      id: `exec-${id}`,
      name: `${first} ${last}`,
      role: 'FractionalExec',
      specialization,
      rating: randomRating(),
      experience,
      costPerDay,
      availability: randomFrom(availabilityOptions),
      bio: randomFrom(bios),
      skills: selectedSkills,
      previousCompanies: selectedCompanies,
      avatarColor: randomFrom(colors),
      location: `${randomFrom(ukCities)}, UK`,
      email,
      phone: generatePhone(431 + i),
      education: randomFrom([
        `MBA, ${randomFrom(['London Business School', 'INSEAD', 'Harvard', 'Stanford', 'Cambridge', 'Oxford'])}`,
        `MSc ${primaryFunc}, ${randomFrom(['Imperial', 'UCL', 'Warwick', 'Manchester', 'LSE'])}`,
        `BA ${primaryFunc}, ${randomFrom(['Cambridge', 'Oxford', 'Durham', 'Bristol', 'Edinburgh'])}`,
      ]),
      certifications: selectedCerts,
      achievements: [
        `${randomFrom(['Scaled', 'Built', 'Led', 'Grew'])} ${randomFrom(['revenue', 'operations', 'team', 'platform'])} from £${randomInt(1, 10)}M to £${randomInt(20, 200)}M`,
        `${randomFrom(['Reduced', 'Improved', 'Optimized'])} ${randomFrom(['costs', 'efficiency', 'performance'])} by ${randomInt(30, 80)}%`,
        `${randomFrom(['Managed', 'Built', 'Led'])} ${randomFrom(['team of', 'organization with', 'group of'])} ${randomInt(20, 150)}+ ${randomFrom(['people', 'professionals', 'specialists'])}`,
      ],
      linkedIn: `linkedin.com/in/${first.toLowerCase()}${last.toLowerCase()}`,
    });
  }

  return executives;
}

// Generate apprentice candidates
export function generateApprentices(startId: number, count: number): Candidate[] {
  const apprentices: Candidate[] = [];
  const functions: BusinessFunction[] = ['Sales', 'Marketing', 'Finance', 'Engineering', 'Ops', 'Admin'];

  for (let i = 0; i < count; i++) {
    const id = startId + i;
    const { first, last, email } = generateName();
    const primaryFunc = randomFrom(functions);
    const secondaryFunc = Math.random() > 0.7 ? randomFrom(functions.filter(f => f !== primaryFunc)) : null;
    const specialization = secondaryFunc ? [primaryFunc, secondaryFunc] : [primaryFunc];

    const { skills, companies } = apprenticeSpecializations[primaryFunc];
    const selectedSkills = Array.from({ length: randomInt(3, 5) }, () => randomFrom(skills));
    const selectedCompanies = Array.from({ length: 2 }, () => randomFrom(companies));

    const experience = randomInt(1, 3);
    const costPerDay = Math.round((120 + Math.random() * 60) / 5) * 5; // Round to nearest £5

    const availabilityOptions = [
      'Available Now',
      'Available from Jan 20',
      'Available from Jan 25',
      'Available from Feb 1',
      'Available from Feb 5',
    ];

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#ef4444', '#a855f7'];

    const bios = [
      `${randomFrom(['Recent graduate', 'Early-career professional', 'Motivated learner'])} in ${primaryFunc} with hands-on experience in ${selectedSkills[0]} and ${selectedSkills[1]}.`,
      `${randomFrom(['Eager', 'Enthusiastic', 'Driven'])} ${primaryFunc.toLowerCase()} apprentice. ${randomFrom(['Strong', 'Solid', 'Good'])} ${selectedSkills[0]} skills and passion for learning.`,
      `${primaryFunc} ${randomFrom(['trainee', 'junior', 'apprentice'])} with ${experience} year${experience > 1 ? 's' : ''} experience. Looking to grow skills in ${selectedSkills[0]}.`,
      `${randomFrom(['Detail-oriented', 'Results-focused', 'Team player'])} ${primaryFunc.toLowerCase()} professional. Experience with ${selectedSkills[0]} and ${selectedSkills[1]}.`,
    ];

    const educationOptions = [
      `BA ${primaryFunc}, ${randomFrom(['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Bristol', 'Edinburgh', 'Liverpool', 'Sheffield', 'Nottingham'])} University`,
      `BSc ${primaryFunc}, ${randomFrom(['Warwick', 'Durham', 'Bath', 'Southampton', 'York', 'Exeter', 'Lancaster', 'Loughborough', 'Surrey', 'Sussex'])}`,
      `${randomFrom(['AAT Level 3', 'AAT Level 4', 'Apprenticeship Level 3', 'HND', 'Foundation Degree'])}`,
      `${randomFrom(['Self-taught', 'Coding Bootcamp', 'Online Courses'])}`,
    ];

    apprentices.push({
      id: `app-${id}`,
      name: `${first} ${last}`,
      role: 'Apprentice',
      specialization,
      rating: randomRating(),
      experience,
      costPerDay,
      availability: randomFrom(availabilityOptions),
      bio: randomFrom(bios),
      skills: selectedSkills,
      previousCompanies: selectedCompanies,
      avatarColor: randomFrom(colors),
      location: `${randomFrom(ukCities)}, UK`,
      email: email.replace('@fractional.com', '@apprentice.com').replace('@executive.com', '@apprentice.com'),
      phone: generatePhone(531 + i),
      education: randomFrom(educationOptions),
      achievements: [
        `${randomFrom(['Completed', 'Delivered', 'Managed'])} ${randomInt(10, 100)}+ ${randomFrom(['projects', 'tasks', 'assignments'])}`,
        `${randomFrom(['Achieved', 'Maintained', 'Reached'])} ${randomInt(85, 99)}% ${randomFrom(['accuracy', 'completion rate', 'satisfaction score'])}`,
        `${randomFrom(['Learned', 'Mastered', 'Developed'])} ${randomInt(3, 10)}+ ${randomFrom(['new skills', 'tools', 'technologies'])}`,
      ],
    });
  }

  return apprentices;
}
