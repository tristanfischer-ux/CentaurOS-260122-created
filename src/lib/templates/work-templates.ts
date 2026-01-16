// Task templates for common workflows

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  function: string;
  estimatedSquares: number;
  subtasks: {
    title: string;
    estimatedSquares: number;
  }[];
}

export const taskTemplates: TaskTemplate[] = [
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Complete product launch workflow',
    function: 'Marketing',
    estimatedSquares: 40,
    subtasks: [
      { title: 'Market research and competitive analysis', estimatedSquares: 5 },
      { title: 'Define target audience and messaging', estimatedSquares: 3 },
      { title: 'Create marketing materials (deck, one-pager)', estimatedSquares: 8 },
      { title: 'Set up landing page and email campaigns', estimatedSquares: 6 },
      { title: 'Coordinate with PR and influencers', estimatedSquares: 4 },
      { title: 'Plan launch event or webinar', estimatedSquares: 6 },
      { title: 'Execute launch day activities', estimatedSquares: 4 },
      { title: 'Monitor metrics and gather feedback', estimatedSquares: 4 },
    ],
  },
  {
    id: 'fundraising-round',
    name: 'Fundraising Round',
    description: 'Complete fundraising workflow from deck to close',
    function: 'Finance',
    estimatedSquares: 60,
    subtasks: [
      { title: 'Update financial model and projections', estimatedSquares: 8 },
      { title: 'Create investor pitch deck', estimatedSquares: 10 },
      { title: 'Build target investor list', estimatedSquares: 4 },
      { title: 'Prepare data room materials', estimatedSquares: 6 },
      { title: 'Schedule intro meetings', estimatedSquares: 4 },
      { title: 'Conduct partner meetings', estimatedSquares: 12 },
      { title: 'Negotiate term sheets', estimatedSquares: 8 },
      { title: 'Complete due diligence', estimatedSquares: 6 },
      { title: 'Finalize legal docs and close', estimatedSquares: 2 },
    ],
  },
  {
    id: 'marketing-campaign',
    name: 'Marketing Campaign',
    description: 'Plan and execute a marketing campaign',
    function: 'Marketing',
    estimatedSquares: 25,
    subtasks: [
      { title: 'Define campaign goals and KPIs', estimatedSquares: 2 },
      { title: 'Research audience and channels', estimatedSquares: 3 },
      { title: 'Create content calendar', estimatedSquares: 2 },
      { title: 'Design creative assets', estimatedSquares: 6 },
      { title: 'Write copy for all channels', estimatedSquares: 4 },
      { title: 'Set up tracking and analytics', estimatedSquares: 2 },
      { title: 'Launch campaign', estimatedSquares: 2 },
      { title: 'Monitor and optimize', estimatedSquares: 4 },
    ],
  },
  {
    id: 'hire-engineer',
    name: 'Hire Engineering Role',
    description: 'Complete hiring process for technical role',
    function: 'Ops',
    estimatedSquares: 30,
    subtasks: [
      { title: 'Define role requirements and JD', estimatedSquares: 3 },
      { title: 'Post on job boards and source candidates', estimatedSquares: 4 },
      { title: 'Screen resumes and applications', estimatedSquares: 4 },
      { title: 'Conduct phone screens', estimatedSquares: 6 },
      { title: 'Schedule technical interviews', estimatedSquares: 2 },
      { title: 'Conduct onsite/final round', estimatedSquares: 6 },
      { title: 'Make offer and negotiate', estimatedSquares: 3 },
      { title: 'Complete onboarding', estimatedSquares: 2 },
    ],
  },
  {
    id: 'feature-development',
    name: 'Feature Development',
    description: 'Build and ship a new product feature',
    function: 'Engineering',
    estimatedSquares: 35,
    subtasks: [
      { title: 'Requirements gathering and scoping', estimatedSquares: 4 },
      { title: 'Technical design and architecture', estimatedSquares: 6 },
      { title: 'UI/UX design and prototyping', estimatedSquares: 5 },
      { title: 'Backend development', estimatedSquares: 8 },
      { title: 'Frontend development', estimatedSquares: 8 },
      { title: 'Testing and QA', estimatedSquares: 2 },
      { title: 'Deploy to production', estimatedSquares: 1 },
      { title: 'Monitor and iterate', estimatedSquares: 1 },
    ],
  },
];

// OKR templates by stage/industry
export interface OKRTemplate {
  id: string;
  name: string;
  description: string;
  function: string;
  objective: string;
  keyResults: string[];
}

export const okrTemplates: OKRTemplate[] = [
  {
    id: 'product-market-fit',
    name: 'Achieve Product-Market Fit',
    description: 'For early-stage startups validating their product',
    function: 'Marketing',
    objective: 'Validate product-market fit with target customers',
    keyResults: [
      'Conduct 50 customer interviews with target segment',
      'Achieve 40% customer satisfaction score (NPS)',
      'Generate 10 qualified leads from pilot customers',
      'Reduce churn rate to below 15%',
    ],
  },
  {
    id: 'revenue-growth',
    name: 'Scale Revenue',
    description: 'For growth-stage companies scaling sales',
    function: 'Sales',
    objective: 'Accelerate revenue growth and expand customer base',
    keyResults: [
      'Close £500K in new recurring revenue',
      'Increase average deal size by 30%',
      'Build pipeline of 100 qualified prospects',
      'Achieve 75% quota attainment across team',
    ],
  },
  {
    id: 'team-building',
    name: 'Build Foundation Team',
    description: 'For teams scaling their organization',
    function: 'Ops',
    objective: 'Assemble and onboard core team to execute strategy',
    keyResults: [
      'Hire 2 fractional executives in key functions',
      'Onboard 5 apprentices across functions',
      'Achieve 85% team capacity utilization',
      'Maintain team satisfaction score above 8/10',
    ],
  },
  {
    id: 'product-launch',
    name: 'Launch New Product',
    description: 'For companies launching new offerings',
    function: 'Marketing',
    objective: 'Successfully launch and gain traction for new product',
    keyResults: [
      'Generate 1000 signups in first month',
      'Achieve 25% activation rate',
      'Get featured in 3 major publications',
      'Secure 20 pilot customers',
    ],
  },
];
