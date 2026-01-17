/**
 * Analytics Data & Calculations
 * Metrics for team performance, OKR health, and resource utilization
 */

export interface TeamVelocityData {
  week: string;
  tasksCompleted: number;
  tasksAssigned: number;
  completionRate: number;
}

export interface OKRHealthData {
  okrName: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'off-track';
  function: string;
}

export interface ResourceUtilizationData {
  name: string;
  role: string;
  hoursWorked: number;
  hoursAvailable: number;
  utilizationRate: number;
}

export interface AIToolUsageData {
  toolName: string;
  uses: number;
  category: string;
}

export interface FunctionPerformanceData {
  function: string;
  okrsCompleted: number;
  tasksCompleted: number;
  avgCompletionTime: number;
  score: number;
}

// DISABLED: Mock data generators disabled for multi-tenant architecture
// Analytics data should be calculated from real OKRs, tasks, and team data
export const generateTeamVelocityData = (): TeamVelocityData[] => {
  return [];
  /* REFERENCE: Original mock data
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
  return weeks.map((week, idx) => ({
    week,
    tasksCompleted: Math.floor(Math.random() * 20) + 15,
    tasksAssigned: Math.floor(Math.random() * 10) + 35,
    completionRate: Math.floor(Math.random() * 30) + 60,
  }));
  */
};

export const generateOKRHealthData = (): OKRHealthData[] => {
  return [];
  /* REFERENCE: Original mock data
  return [
    {
      okrName: 'Increase Monthly Revenue',
      progress: 85,
      status: 'on-track',
      function: 'Sales',
    },
    {
      okrName: 'Ship MVP to 100 Beta Users',
      progress: 92,
      status: 'on-track',
      function: 'Engineering',
    },
    {
      okrName: 'Achieve 10k Social Media Followers',
      progress: 65,
      status: 'at-risk',
      function: 'Marketing',
    },
    {
      okrName: 'Onboard 5 Manufacturers',
      progress: 40,
      status: 'off-track',
      function: 'Operations',
    },
    {
      okrName: 'Complete User Research Study',
      progress: 78,
      status: 'on-track',
      function: 'Product',
    },
  ];
  */
};

export const generateResourceUtilizationData = (): ResourceUtilizationData[] => {
  return [];
  /* REFERENCE: Original mock data
  return [
    {
      name: 'Sarah Chen',
      role: 'Marketing Exec',
      hoursWorked: 32,
      hoursAvailable: 40,
      utilizationRate: 80,
    },
    {
      name: 'Marcus Johnson',
      role: 'Engineering Lead',
      hoursWorked: 38,
      hoursAvailable: 40,
      utilizationRate: 95,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Sales Executive',
      hoursWorked: 28,
      hoursAvailable: 40,
      utilizationRate: 70,
    },
    {
      name: 'James Kim',
      role: 'Product Manager',
      hoursWorked: 35,
      hoursAvailable: 40,
      utilizationRate: 87,
    },
    {
      name: 'Alex Thompson',
      role: 'Apprentice',
      hoursWorked: 18,
      hoursAvailable: 20,
      utilizationRate: 90,
    },
  ];
  */
};

export const generateAIToolUsageData = (): AIToolUsageData[] => {
  return [];
  /* REFERENCE: Original mock data
  return [
    { toolName: 'ChatGPT', uses: 127, category: 'Writing' },
    { toolName: 'GitHub Copilot', uses: 89, category: 'Development' },
    { toolName: 'Midjourney', uses: 45, category: 'Design' },
    { toolName: 'Jasper', uses: 62, category: 'Marketing' },
    { toolName: 'ElevenLabs', uses: 23, category: 'Audio' },
    { toolName: 'Claude', uses: 98, category: 'Research' },
  ];
  */
};

export const generateFunctionPerformanceData = (): FunctionPerformanceData[] => {
  return [];
  /* REFERENCE: Original mock data
  return [
    {
      function: 'Marketing',
      okrsCompleted: 8,
      tasksCompleted: 47,
      avgCompletionTime: 3.2,
      score: 85,
    },
    {
      function: 'Engineering',
      okrsCompleted: 12,
      tasksCompleted: 82,
      avgCompletionTime: 4.5,
      score: 92,
    },
    {
      function: 'Sales',
      okrsCompleted: 6,
      tasksCompleted: 35,
      avgCompletionTime: 2.8,
      score: 78,
    },
    {
      function: 'Product',
      okrsCompleted: 5,
      tasksCompleted: 28,
      avgCompletionTime: 5.1,
      score: 74,
    },
    {
      function: 'Operations',
      okrsCompleted: 4,
      tasksCompleted: 19,
      avgCompletionTime: 3.9,
      score: 68,
    },
  ];
  */
};

// Utility functions
export const calculateTotalTasksCompleted = (data: TeamVelocityData[]): number => {
  return data.reduce((sum, week) => sum + week.tasksCompleted, 0);
};

export const calculateAverageCompletionRate = (data: TeamVelocityData[]): number => {
  const total = data.reduce((sum, week) => sum + week.completionRate, 0);
  return Math.round(total / data.length);
};

export const calculateTeamUtilization = (data: ResourceUtilizationData[]): number => {
  const totalWorked = data.reduce((sum, person) => sum + person.hoursWorked, 0);
  const totalAvailable = data.reduce((sum, person) => sum + person.hoursAvailable, 0);
  return Math.round((totalWorked / totalAvailable) * 100);
};

export const getOKRsByStatus = (data: OKRHealthData[], status: OKRHealthData['status']): OKRHealthData[] => {
  return data.filter((okr) => okr.status === status);
};

export const calculateAIToolUsage = (data: AIToolUsageData[]): number => {
  return data.reduce((sum, tool) => sum + tool.uses, 0);
};
