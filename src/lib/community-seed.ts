// Seed data for community features - company profiles and events

import { v4 as uuidv4 } from 'uuid';
import type { CompanyProfile, CommunityEvent } from '@/types';

// Demo company profiles for the Centaur OS ecosystem
export const DEMO_COMPANY_PROFILES: Omit<CompanyProfile, 'workspaceId' | 'createdAt' | 'updatedAt'>[] = [
  {
    companyName: 'NeuroPulse Labs',
    tagline: 'Brain-computer interfaces for medical diagnostics',
    description: 'Developing non-invasive BCIs for early detection of neurological conditions. Our proprietary sensor array enables real-time monitoring with clinical-grade accuracy.',
    industry: 'Medical Devices',
    stage: 'seed',
    location: {
      city: 'Cambridge',
      country: 'United Kingdom',
      region: 'East of England',
    },
    website: 'https://neuropulse.example.com',
    linkedIn: 'https://linkedin.com/company/neuropulse',
    teamSize: '6-10',
    productType: 'hardware+software',
    lookingFor: ['suppliers', 'advisors', 'investors', 'partnerships'],
    tags: ['Medical Devices', 'HealthTech', 'Neuroscience', 'AI/ML', 'IoT'],
    isPublic: true,
    visibility: 'public',
  },
  {
    companyName: 'GreenCharge Energy',
    tagline: 'Modular solar+battery systems for off-grid communities',
    description: 'Building affordable, scalable renewable energy systems for emerging markets. Our plug-and-play units provide reliable power with 10-year warranties.',
    industry: 'Climate Tech',
    stage: 'pre-seed',
    location: {
      city: 'Bristol',
      country: 'United Kingdom',
      region: 'South West England',
    },
    website: 'https://greencharge.example.com',
    teamSize: '1-5',
    productType: 'hardware',
    lookingFor: ['co-founders', 'suppliers', 'customers', 'investors'],
    tags: ['Climate Tech', 'Energy', 'Sustainability', 'Social Impact'],
    isPublic: true,
    visibility: 'public',
  },
  {
    companyName: 'RoboFarm Systems',
    tagline: 'Autonomous robots for precision agriculture',
    description: 'AI-powered agricultural robots that reduce pesticide use by 80% while increasing yield. Currently deployed on 50+ farms across the UK.',
    industry: 'AgTech',
    stage: 'series-a',
    location: {
      city: 'Edinburgh',
      country: 'United Kingdom',
      region: 'Scotland',
    },
    website: 'https://robofarm.example.com',
    linkedIn: 'https://linkedin.com/company/robofarm',
    twitter: 'https://twitter.com/robofarm',
    teamSize: '26-50',
    productType: 'hardware+software',
    lookingFor: ['partnerships', 'customers'],
    tags: ['AgTech', 'Robotics', 'AI/ML', 'Climate Tech', 'Computer Vision'],
    isPublic: true,
    visibility: 'public',
  },
  {
    companyName: 'SonicWave Audio',
    tagline: 'Next-gen hearing aids with spatial audio processing',
    description: 'Premium hearing aids with AI-enhanced sound processing and smartphone integration. Transforming the hearing health industry.',
    industry: 'Consumer Electronics',
    stage: 'revenue',
    location: {
      city: 'Manchester',
      country: 'United Kingdom',
      region: 'North West England',
    },
    website: 'https://sonicwave.example.com',
    linkedIn: 'https://linkedin.com/company/sonicwave',
    teamSize: '11-25',
    productType: 'hardware+software',
    lookingFor: ['suppliers', 'partnerships'],
    tags: ['Consumer Electronics', 'HealthTech', 'Audio', 'AI/ML'],
    isPublic: true,
    visibility: 'public',
  },
  {
    companyName: 'EdgeSense IoT',
    tagline: 'Industrial IoT sensors for predictive maintenance',
    description: 'Ultra-low-power wireless sensors that predict equipment failures before they happen. Helping manufacturers reduce downtime by 60%.',
    industry: 'Industrial IoT',
    stage: 'seed',
    location: {
      city: 'Birmingham',
      country: 'United Kingdom',
      region: 'West Midlands',
    },
    teamSize: '6-10',
    productType: 'hardware+software',
    lookingFor: ['suppliers', 'customers', 'partnerships', 'advisors'],
    tags: ['IoT', 'Industrial', 'AI/ML', 'Predictive Maintenance', 'SaaS'],
    isPublic: true,
    visibility: 'public',
  },
];

// Sample community events
export function createDemoCommunityEvents(workspaceIds: string[], userIds: string[]): Omit<CommunityEvent, 'id' | 'createdAt' | 'updatedAt'>[] {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return [
    {
      title: 'Hardware Founders Meetup - London',
      description: 'Monthly meetup for hardware startup founders in London. Share challenges, swap supplier contacts, and learn from each other. Drinks and snacks provided!',
      eventType: 'meetup',
      organizerWorkspaceId: workspaceIds[0] || 'demo-workspace-1',
      organizerUserId: userIds[0] || 'demo-user-1',
      startTime: new Date(nextWeek.setHours(18, 0, 0, 0)).toISOString(),
      endTime: new Date(nextWeek.setHours(21, 0, 0, 0)).toISOString(),
      timezone: 'Europe/London',
      location: {
        type: 'in-person',
        venue: 'The Hardware Hub',
        address: '42 Shoreditch High Street',
        city: 'London',
        country: 'United Kingdom',
      },
      capacity: 30,
      isPublic: true,
      requiresApproval: false,
      tags: ['Networking', 'London', 'Founders'],
    },
    {
      title: 'DFM Workshop: Injection Molding Best Practices',
      description: 'Hands-on workshop covering design for manufacturing principles for injection molding. Bring your CAD files for review! Led by expert from Omega Plastics.',
      eventType: 'workshop',
      organizerWorkspaceId: workspaceIds[0] || 'demo-workspace-1',
      organizerUserId: userIds[0] || 'demo-user-1',
      startTime: new Date(twoWeeks.setHours(14, 0, 0, 0)).toISOString(),
      endTime: new Date(twoWeeks.setHours(17, 0, 0, 0)).toISOString(),
      timezone: 'Europe/London',
      location: {
        type: 'hybrid',
        venue: 'Omega Plastics HQ',
        address: 'Stafford Park 1',
        city: 'Telford',
        country: 'United Kingdom',
        virtualLink: 'https://zoom.us/j/example',
      },
      capacity: 20,
      isPublic: true,
      requiresApproval: true,
      tags: ['Manufacturing', 'DFM', 'Education', 'Injection Molding'],
    },
    {
      title: 'Fractional Executive Office Hours',
      description: 'Free 30-minute 1-on-1 sessions with experienced fractional executives. Get advice on sales, ops, engineering, or finance. Book your slot!',
      eventType: 'office-hours',
      organizerWorkspaceId: workspaceIds[0] || 'demo-workspace-1',
      organizerUserId: userIds[0] || 'demo-user-1',
      startTime: new Date(nextWeek.setHours(10, 0, 0, 0)).toISOString(),
      endTime: new Date(nextWeek.setHours(16, 0, 0, 0)).toISOString(),
      timezone: 'Europe/London',
      location: {
        type: 'virtual',
        virtualLink: 'https://calendly.com/fractional-exec-hours',
      },
      capacity: 12,
      isPublic: true,
      requiresApproval: true,
      tags: ['Mentorship', 'Office Hours', 'Advice'],
    },
    {
      title: 'Demo Day: Spring 2026 Cohort',
      description: 'See what the latest Fractional Foundry cohort has built! 10 hardware startups pitch their products. Investors, partners, and customers welcome.',
      eventType: 'demo-day',
      organizerWorkspaceId: workspaceIds[0] || 'demo-workspace-1',
      organizerUserId: userIds[0] || 'demo-user-1',
      startTime: new Date(oneMonth.setHours(17, 0, 0, 0)).toISOString(),
      endTime: new Date(oneMonth.setHours(20, 30, 0, 0)).toISOString(),
      timezone: 'Europe/London',
      location: {
        type: 'hybrid',
        venue: 'Level39 Canary Wharf',
        address: 'One Canada Square',
        city: 'London',
        country: 'United Kingdom',
        virtualLink: 'https://youtube.com/live/example',
      },
      capacity: 100,
      isPublic: true,
      requiresApproval: false,
      tags: ['Demo Day', 'Pitching', 'Investors', 'London'],
    },
    {
      title: 'PCB Design Masterclass (Virtual)',
      description: 'Learn PCB design from scratch to production. Covering schematic capture, layout, DFM, and working with manufacturers. 3-hour intensive.',
      eventType: 'webinar',
      organizerWorkspaceId: workspaceIds[0] || 'demo-workspace-1',
      organizerUserId: userIds[0] || 'demo-user-1',
      startTime: new Date(twoWeeks.setHours(19, 0, 0, 0)).toISOString(),
      endTime: new Date(twoWeeks.setHours(22, 0, 0, 0)).toISOString(),
      timezone: 'Europe/London',
      location: {
        type: 'virtual',
        virtualLink: 'https://zoom.us/j/pcb-masterclass',
      },
      capacity: 50,
      isPublic: true,
      requiresApproval: false,
      tags: ['Education', 'PCB', 'Engineering', 'Electronics'],
    },
    {
      title: 'Hardware Startup Social - Birmingham',
      description: 'Casual evening social for hardware founders and makers in the Midlands. No agenda, just good conversation and connections. First drink on us!',
      eventType: 'social',
      organizerWorkspaceId: workspaceIds[0] || 'demo-workspace-1',
      organizerUserId: userIds[0] || 'demo-user-1',
      startTime: new Date(nextWeek.setHours(19, 0, 0, 0)).toISOString(),
      endTime: new Date(nextWeek.setHours(22, 0, 0, 0)).toISOString(),
      timezone: 'Europe/London',
      location: {
        type: 'in-person',
        venue: 'The Old Crown',
        address: '188 High Street, Digbeth',
        city: 'Birmingham',
        country: 'United Kingdom',
      },
      isPublic: true,
      requiresApproval: false,
      tags: ['Social', 'Birmingham', 'Networking'],
    },
  ];
}

// Helper to create company profiles with workspace IDs
export function createCompanyProfilesSeedData(workspaceIds: string[]): Record<string, CompanyProfile> {
  const profiles: Record<string, CompanyProfile> = {};

  DEMO_COMPANY_PROFILES.forEach((profileData, index) => {
    const workspaceId = workspaceIds[index + 1] || uuidv4(); // Skip index 0 (main workspace)
    const profile: CompanyProfile = {
      ...profileData,
      workspaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    profiles[workspaceId] = profile;
  });

  return profiles;
}
