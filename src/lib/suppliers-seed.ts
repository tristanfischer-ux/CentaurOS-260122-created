// Seed data for UK manufacturing suppliers
// This creates a shared supplier network across all Centaur OS workspaces

import { v4 as uuidv4 } from 'uuid';
import type { Supplier, ManufacturingCapability } from '@/types';

export const UK_SUPPLIERS: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Proto Labs UK',
    description: 'Digital manufacturing for custom prototypes and low-volume production parts',
    capabilities: [
      'CNC Machining',
      'Injection Molding',
      'Additive Manufacturing - Plastic',
      'Additive Manufacturing - Metal',
      'Sheet Metal Fabrication',
    ],
    region: 'UK',
    location: {
      city: 'Telford',
      country: 'United Kingdom',
      postcode: 'TF3 3AQ',
    },
    contact: {
      email: 'customerservice@protolabs.co.uk',
      phone: '+44 1952 683047',
      website: 'https://www.protolabs.co.uk',
    },
    certifications: ['ISO 9001:2015', 'ISO 13485'],
    minimumOrderQuantity: 1,
    leadTimeWeeks: 1,
    status: 'verified',
    rating: 4.5,
    reviewCount: 127,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 1999,
      employeeCount: '500-1000',
      priceRange: 'premium',
    },
  },
  {
    name: 'Omega Plastics',
    description: 'Injection moulding specialists for production volumes from 1,000 to 1,000,000+ units',
    capabilities: [
      'Injection Molding',
      'Overmolding',
      'Insert Molding',
      'Ultrasonic Welding',
      'Final Assembly & Packaging',
    ],
    region: 'UK',
    location: {
      city: 'Telford',
      country: 'United Kingdom',
      postcode: 'TF3 5DN',
    },
    contact: {
      email: 'enquiries@omegaplastics.co.uk',
      phone: '+44 1952 607000',
      website: 'https://www.omegaplastics.co.uk',
    },
    certifications: ['ISO 9001:2015', 'ISO 14001'],
    minimumOrderQuantity: 1000,
    leadTimeWeeks: 4,
    status: 'verified',
    rating: 4.7,
    reviewCount: 89,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 1979,
      employeeCount: '100-250',
      priceRange: 'mid-range',
    },
  },
  {
    name: 'Laser Master UK',
    description: 'Precision laser cutting and engraving services for metals, plastics, and composites',
    capabilities: [
      'Laser Cutting',
      'CNC Machining',
      'Sheet Metal Fabrication',
      'Powder Coating',
      'Screen Printing',
    ],
    region: 'UK',
    location: {
      city: 'Birmingham',
      country: 'United Kingdom',
      postcode: 'B6 7BA',
    },
    contact: {
      email: 'sales@lasermaster.co.uk',
      phone: '+44 121 359 5888',
      website: 'https://www.lasermaster.co.uk',
    },
    certifications: ['ISO 9001:2015'],
    minimumOrderQuantity: 1,
    leadTimeWeeks: 2,
    status: 'verified',
    rating: 4.6,
    reviewCount: 156,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 1997,
      employeeCount: '50-100',
      priceRange: 'mid-range',
    },
  },
  {
    name: 'RPWORLD UK',
    description: 'One-stop rapid prototyping and low-volume manufacturing service',
    capabilities: [
      'Additive Manufacturing - Plastic',
      'CNC Machining',
      'Vacuum Forming',
      'Injection Molding',
      'Sheet Metal Fabrication',
      'Anodizing',
      'Powder Coating',
    ],
    region: 'UK',
    location: {
      city: 'London',
      country: 'United Kingdom',
      postcode: 'EC1V 2NX',
    },
    contact: {
      email: 'info@rpworld.co.uk',
      phone: '+44 20 3322 3910',
      website: 'https://www.rpworld.co.uk',
    },
    certifications: ['ISO 9001:2015', 'RoHS'],
    minimumOrderQuantity: 1,
    leadTimeWeeks: 2,
    status: 'verified',
    rating: 4.4,
    reviewCount: 92,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 2010,
      employeeCount: '100-250',
      priceRange: 'mid-range',
    },
  },
  {
    name: 'Newbury Electronics',
    description: 'PCB assembly and electronic manufacturing services',
    capabilities: [
      'PCB Assembly',
      'Electronic Assembly',
      'Cable Assembly',
      'Wire Harness Assembly',
      'Quality Control & Testing',
      'Final Assembly & Packaging',
    ],
    region: 'UK',
    location: {
      city: 'Newbury',
      country: 'United Kingdom',
      postcode: 'RG14 2PZ',
    },
    contact: {
      email: 'sales@newburyelectronics.co.uk',
      phone: '+44 1635 40347',
      website: 'https://www.newburyelectronics.co.uk',
    },
    certifications: ['ISO 9001:2015', 'ISO 13485', 'IPC-A-610', 'AS9100'],
    minimumOrderQuantity: 10,
    leadTimeWeeks: 3,
    status: 'verified',
    rating: 4.8,
    reviewCount: 74,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 1973,
      employeeCount: '50-100',
      priceRange: 'mid-range',
    },
  },
  {
    name: 'Formero',
    description: 'Vacuum forming, pressure forming and thermoforming specialists',
    capabilities: [
      'Vacuum Forming',
      'Compression Molding',
      'CNC Machining',
      'Design for Manufacturing',
    ],
    region: 'UK',
    location: {
      city: 'Sheffield',
      country: 'United Kingdom',
      postcode: 'S9 2YL',
    },
    contact: {
      email: 'info@formero.co.uk',
      phone: '+44 114 244 4500',
      website: 'https://www.formero.co.uk',
    },
    certifications: ['ISO 9001:2015'],
    minimumOrderQuantity: 100,
    leadTimeWeeks: 4,
    status: 'verified',
    rating: 4.5,
    reviewCount: 63,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 1990,
      employeeCount: '50-100',
      priceRange: 'mid-range',
    },
  },
  {
    name: 'MJN Neuro',
    description: 'Specialist in EPS molding, EPP molding, and expanded foam products',
    capabilities: [
      'EPS Molding',
      'EPP Molding',
      'Heat Chest Molding',
      'CNC Machining',
      'Design for Manufacturing',
    ],
    region: 'UK',
    location: {
      city: 'Leicester',
      country: 'United Kingdom',
      postcode: 'LE4 1AW',
    },
    contact: {
      email: 'sales@mjnneuro.co.uk',
      phone: '+44 116 266 8989',
      website: 'https://www.mjnneuro.co.uk',
    },
    certifications: ['ISO 9001:2015', 'ISO 14001'],
    minimumOrderQuantity: 500,
    leadTimeWeeks: 5,
    status: 'verified',
    rating: 4.6,
    reviewCount: 51,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 1987,
      employeeCount: '50-100',
      priceRange: 'mid-range',
    },
  },
  {
    name: 'EMS UK',
    description: 'Full-service electronics manufacturing - from design to finished product',
    capabilities: [
      'PCB Assembly',
      'Electronic Assembly',
      'Wire Harness Assembly',
      'Cable Assembly',
      'Quality Control & Testing',
      'Certification Support',
      'Final Assembly & Packaging',
    ],
    region: 'UK',
    location: {
      city: 'Camberley',
      country: 'United Kingdom',
      postcode: 'GU15 3YL',
    },
    contact: {
      email: 'info@emsuk.com',
      phone: '+44 1276 691371',
      website: 'https://www.emsuk.com',
    },
    certifications: ['ISO 9001:2015', 'ISO 13485', 'ISO 14001', 'IPC-A-610'],
    minimumOrderQuantity: 50,
    leadTimeWeeks: 4,
    status: 'verified',
    rating: 4.7,
    reviewCount: 85,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 1982,
      employeeCount: '100-250',
      priceRange: 'mid-range',
    },
  },
  {
    name: 'Brandauer',
    description: 'Precision stamping, tooling, and metal fabrication since 1862',
    capabilities: [
      'Sheet Metal Fabrication',
      'Die Casting',
      'CNC Machining',
      'Welding & Assembly',
      'Powder Coating',
    ],
    region: 'UK',
    location: {
      city: 'Birmingham',
      country: 'United Kingdom',
      postcode: 'B19 2XF',
    },
    contact: {
      email: 'sales@brandauer.co.uk',
      phone: '+44 121 359 3646',
      website: 'https://www.brandauer.co.uk',
    },
    certifications: ['ISO 9001:2015', 'ISO 14001', 'IATF 16949'],
    minimumOrderQuantity: 5000,
    leadTimeWeeks: 6,
    status: 'verified',
    rating: 4.8,
    reviewCount: 67,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 1862,
      employeeCount: '100-250',
      priceRange: 'mid-range',
    },
  },
  {
    name: 'Tharsus',
    description: 'Robotic and automated assembly solutions with full production capabilities',
    capabilities: [
      'Electronic Assembly',
      'Final Assembly & Packaging',
      'Welding & Assembly',
      'Quality Control & Testing',
      'Design for Manufacturing',
      'Certification Support',
    ],
    region: 'UK',
    location: {
      city: 'Blyth',
      country: 'United Kingdom',
      postcode: 'NE24 1LZ',
    },
    contact: {
      email: 'hello@tharsus.co.uk',
      phone: '+44 1670 734 334',
      website: 'https://www.tharsus.co.uk',
    },
    certifications: ['ISO 9001:2015', 'ISO 14001', 'ISO 45001'],
    minimumOrderQuantity: 100,
    leadTimeWeeks: 8,
    status: 'verified',
    rating: 4.9,
    reviewCount: 42,
    recommendedByWorkspaceIds: [],
    approvedByAdminAt: new Date().toISOString(),
    metadata: {
      yearEstablished: 2007,
      employeeCount: '250-500',
      priceRange: 'premium',
    },
  },
];

// Helper to seed suppliers into the platform
export function createSuppliersSeedData(): Record<string, Supplier> {
  const suppliers: Record<string, Supplier> = {};

  UK_SUPPLIERS.forEach((supplierData) => {
    const supplier: Supplier = {
      ...supplierData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    suppliers[supplier.id] = supplier;
  });

  return suppliers;
}

// Get all unique capabilities for UI filtering
export function getAllCapabilities(): ManufacturingCapability[] {
  const capabilities = new Set<ManufacturingCapability>();
  UK_SUPPLIERS.forEach((supplier) => {
    supplier.capabilities.forEach((cap) => capabilities.add(cap));
  });
  return Array.from(capabilities).sort();
}
