import type { StartupPackSection } from '@/types';

export const STARTUP_PACK_SECTIONS: StartupPackSection[] = [
  {
    id: 'incorporation',
    title: 'Incorporation & Companies House',
    description: 'Set up your UK limited company properly from the start',
    order: 1,
    tags: ['legal', 'companies-house', 'directors', 'formation'],
    icon: 'Building2',
    color: '#3b82f6',
  },
  {
    id: 'share-structure',
    title: 'Share Structure & Cap Table',
    description: 'Understand equity, share classes, and ownership basics',
    order: 2,
    tags: ['equity', 'shares', 'cap-table', 'vesting'],
    icon: 'PieChart',
    color: '#8b5cf6',
  },
  {
    id: 'seis-eis',
    title: 'SEIS/EIS Readiness',
    description: 'Prepare for UK tax-advantaged investment schemes',
    order: 3,
    tags: ['seis', 'eis', 'hmrc', 'tax-relief', 'investors'],
    icon: 'BadgeCheck',
    color: '#10b981',
  },
  {
    id: 'shareholders-agreement',
    title: "Shareholders' Agreement",
    description: 'Protect founders and set governance rules',
    order: 4,
    tags: ['legal', 'governance', 'founders', 'voting'],
    icon: 'FileText',
    color: '#f59e0b',
  },
  {
    id: 'articles',
    title: 'Articles of Association',
    description: 'Your company constitution and internal rules',
    order: 5,
    tags: ['legal', 'constitution', 'model-articles'],
    icon: 'ScrollText',
    color: '#ef4444',
  },
  {
    id: 'fundraising',
    title: 'Fundraising Prep',
    description: 'Build your data room, pitch deck, and investor pipeline',
    order: 6,
    tags: ['fundraising', 'pitch', 'data-room', 'investors'],
    icon: 'Rocket',
    color: '#06b6d4',
  },
  {
    id: 'ip-trademarks',
    title: 'IP: Trademarks, Domains, URLs',
    description: 'Protect your brand and secure your digital presence',
    order: 7,
    tags: ['ip', 'trademark', 'domain', 'brand'],
    icon: 'Shield',
    color: '#d946ef',
  },
  {
    id: 'banking-tax',
    title: 'Banking, Accounting & Tax',
    description: 'Set up business banking, bookkeeping, and tax basics',
    order: 8,
    tags: ['banking', 'accounting', 'vat', 'paye', 'tax'],
    icon: 'Landmark',
    color: '#14b8a6',
  },
  {
    id: 'employment',
    title: 'Employment Basics',
    description: 'Contracts, IP assignment, and contractor management',
    order: 9,
    tags: ['employment', 'contracts', 'hr', 'ip-assignment'],
    icon: 'Users',
    color: '#f97316',
  },
  {
    id: 'operations',
    title: 'Operational Setup',
    description: 'Tools, security, policies, and GDPR compliance',
    order: 10,
    tags: ['operations', 'tools', 'security', 'gdpr', 'policies'],
    icon: 'Settings',
    color: '#64748b',
  },
];

export function getSectionById(id: string): StartupPackSection | undefined {
  return STARTUP_PACK_SECTIONS.find(s => s.id === id);
}

export function getSectionsByTag(tag: string): StartupPackSection[] {
  return STARTUP_PACK_SECTIONS.filter(s => s.tags.includes(tag));
}
