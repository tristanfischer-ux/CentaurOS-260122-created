// Elite Consulting Frameworks Module
// Incorporates methodologies from McKinsey, BCG, Bain, Deloitte, Accenture, EY, PwC, KPMG,
// Oliver Wyman, Roland Berger, Mercer, Korn Ferry, Charles River Associates, and Aon

// =============================================================================
// STRATEGY CONSULTING FRAMEWORKS (McKinsey, BCG, Bain, Oliver Wyman, Roland Berger)
// =============================================================================

export interface StrategicPositionAnalysis {
  // McKinsey 7S Framework
  sevenS: {
    strategy: { score: number; assessment: string; actions: string[] };
    structure: { score: number; assessment: string; actions: string[] };
    systems: { score: number; assessment: string; actions: string[] };
    sharedValues: { score: number; assessment: string; actions: string[] };
    style: { score: number; assessment: string; actions: string[] };
    staff: { score: number; assessment: string; actions: string[] };
    skills: { score: number; assessment: string; actions: string[] };
  };
  overallAlignment: number; // 0-100

  // BCG Growth-Share Matrix Positioning
  growthSharePosition: 'star' | 'cash_cow' | 'question_mark' | 'dog';
  marketGrowthRate: number; // %
  relativeMarketShare: number; // ratio

  // Bain Net Promoter Score Framework
  npsAnalysis: {
    score: number; // -100 to 100
    promoters: number; // %
    passives: number; // %
    detractors: number; // %
    benchmark: string;
    improvement_levers: string[];
  };

  // Oliver Wyman Risk-Adjusted Strategy
  riskAdjustedReturns: {
    expectedReturn: number;
    riskFactor: number;
    sharpeRatio: number;
    capitalAtRisk: number;
  };

  // Roland Berger Transformation Readiness
  transformationReadiness: {
    score: number;
    digitalMaturity: number;
    changeCapacity: number;
    leadershipAlignment: number;
    culturalReadiness: number;
  };
}

export interface StrategyContext {
  revenue: number;
  revenueGrowth: number;
  marketSize: number;
  marketGrowthRate: number;
  competitorCount: number;
  teamSize: number;
  executiveAlignment: number; // 0-100
  digitalCapability: number; // 0-100
  customerSatisfaction: number; // 0-100
  employeeEngagement: number; // 0-100
}

export function analyzeStrategicPosition(context: StrategyContext): StrategicPositionAnalysis {
  // McKinsey 7S Framework Analysis
  const sevenS = {
    strategy: {
      score: Math.min(100, context.revenueGrowth > 15 ? 85 : context.revenueGrowth > 5 ? 70 : 50),
      assessment: context.revenueGrowth > 15 ? 'Strong growth strategy executing well' :
                  context.revenueGrowth > 5 ? 'Moderate strategy, optimization needed' :
                  'Strategy requires fundamental review',
      actions: context.revenueGrowth < 10 ? [
        'Conduct strategic review workshop',
        'Identify 3 growth levers for next quarter',
        'Define clear strategic priorities'
      ] : ['Maintain momentum', 'Explore adjacent markets']
    },
    structure: {
      score: context.teamSize < 5 ? 60 : context.teamSize < 15 ? 75 : 85,
      assessment: context.teamSize < 5 ? 'Lean structure - scaling considerations needed' :
                  context.teamSize < 15 ? 'Adequate structure for current stage' :
                  'Mature structure supports growth',
      actions: context.teamSize < 10 ? [
        'Document reporting lines',
        'Define clear role boundaries',
        'Plan for scale'
      ] : ['Optimize spans of control', 'Review decision rights']
    },
    systems: {
      score: context.digitalCapability,
      assessment: context.digitalCapability > 75 ? 'Strong systems foundation' :
                  context.digitalCapability > 50 ? 'Adequate systems, modernization opportunities' :
                  'Systems require significant investment',
      actions: context.digitalCapability < 70 ? [
        'Audit current tech stack',
        'Prioritize automation opportunities',
        'Implement real-time dashboards'
      ] : ['Optimize for efficiency', 'Explore AI integration']
    },
    sharedValues: {
      score: context.employeeEngagement,
      assessment: context.employeeEngagement > 75 ? 'Strong culture alignment' :
                  context.employeeEngagement > 50 ? 'Culture needs reinforcement' :
                  'Culture requires transformation',
      actions: context.employeeEngagement < 70 ? [
        'Define and communicate core values',
        'Launch culture initiatives',
        'Recognize aligned behaviors'
      ] : ['Celebrate wins', 'Strengthen rituals']
    },
    style: {
      score: context.executiveAlignment,
      assessment: context.executiveAlignment > 80 ? 'Leadership well-aligned' :
                  context.executiveAlignment > 60 ? 'Leadership alignment adequate' :
                  'Leadership alignment critical issue',
      actions: context.executiveAlignment < 75 ? [
        'Weekly executive sync meetings',
        'Align on shared KPIs',
        'Address conflicting priorities'
      ] : ['Maintain cadence', 'Model desired behaviors']
    },
    staff: {
      score: Math.min(100, context.teamSize > 3 ? 75 : 60),
      assessment: context.teamSize > 10 ? 'Adequate staffing for operations' :
                  context.teamSize > 5 ? 'Lean team, prioritization critical' :
                  'Understaffed - hire key roles',
      actions: context.teamSize < 8 ? [
        'Prioritize critical hires',
        'Document capability gaps',
        'Consider fractional roles'
      ] : ['Develop talent pipeline', 'Cross-train team']
    },
    skills: {
      score: Math.min(100, context.digitalCapability * 0.5 + context.employeeEngagement * 0.5),
      assessment: context.digitalCapability > 70 && context.employeeEngagement > 70 ?
                  'Strong skill base' : 'Skill gaps need addressing',
      actions: context.digitalCapability < 70 ? [
        'Conduct skills assessment',
        'Launch training program',
        'Hire for gaps vs. train'
      ] : ['Advanced skill development', 'Knowledge sharing']
    }
  };

  const overallAlignment = Math.round(
    (sevenS.strategy.score + sevenS.structure.score + sevenS.systems.score +
     sevenS.sharedValues.score + sevenS.style.score + sevenS.staff.score + sevenS.skills.score) / 7
  );

  // BCG Growth-Share Matrix
  const relativeMarketShare = context.revenue / (context.marketSize * 0.1); // Assume 10% is market leader
  const growthSharePosition: StrategicPositionAnalysis['growthSharePosition'] =
    context.marketGrowthRate > 10 && relativeMarketShare > 0.5 ? 'star' :
    context.marketGrowthRate <= 10 && relativeMarketShare > 0.5 ? 'cash_cow' :
    context.marketGrowthRate > 10 && relativeMarketShare <= 0.5 ? 'question_mark' : 'dog';

  // Bain NPS Analysis
  const npsScore = context.customerSatisfaction > 80 ? 50 :
                   context.customerSatisfaction > 60 ? 20 :
                   context.customerSatisfaction > 40 ? -10 : -40;

  return {
    sevenS,
    overallAlignment,
    growthSharePosition,
    marketGrowthRate: context.marketGrowthRate,
    relativeMarketShare,
    npsAnalysis: {
      score: npsScore,
      promoters: Math.max(0, context.customerSatisfaction - 30),
      passives: 30,
      detractors: Math.max(0, 70 - context.customerSatisfaction),
      benchmark: npsScore > 50 ? 'World-class' : npsScore > 20 ? 'Good' : npsScore > 0 ? 'Average' : 'Below average',
      improvement_levers: npsScore < 30 ? [
        'Implement customer success program',
        'Reduce friction in key journeys',
        'Launch voice-of-customer program'
      ] : ['Maintain excellence', 'Delight program']
    },
    riskAdjustedReturns: {
      expectedReturn: context.revenueGrowth,
      riskFactor: context.competitorCount > 10 ? 1.5 : context.competitorCount > 5 ? 1.2 : 1.0,
      sharpeRatio: context.revenueGrowth / (context.competitorCount * 0.5 + 5),
      capitalAtRisk: context.revenue * 0.2
    },
    transformationReadiness: {
      score: Math.round((context.digitalCapability + context.employeeEngagement + context.executiveAlignment) / 3),
      digitalMaturity: context.digitalCapability,
      changeCapacity: context.employeeEngagement,
      leadershipAlignment: context.executiveAlignment,
      culturalReadiness: context.employeeEngagement * 0.8
    }
  };
}

// =============================================================================
// OPERATIONS CONSULTING FRAMEWORKS (McKinsey Ops, BCG, Bain, Deloitte, Accenture)
// =============================================================================

export interface OperationsExcellenceAnalysis {
  // McKinsey Operations Performance
  overallOpsScore: number; // 0-100
  operationalEfficiency: {
    score: number;
    utilizationRate: number;
    throughputRate: number;
    cycleTimeEfficiency: number;
    firstPassYield: number;
  };

  // BCG Lean Operations Assessment
  leanMaturity: {
    score: number; // 1-5 scale
    wasteElimination: number;
    continuousImprovement: number;
    valueStreamOptimization: number;
    pullSystem: number;
  };

  // Deloitte Digital Operations Index
  digitalOpsIndex: {
    score: number;
    automationLevel: number;
    dataUtilization: number;
    processDigitization: number;
    analyticsCapability: number;
  };

  // Accenture Intelligent Operations Framework
  intelligentOps: {
    score: number;
    aiAdoption: number;
    predictiveCapability: number;
    selfHealingProcesses: number;
    realTimeInsights: number;
  };

  // Supply Chain Health (Bain)
  supplyChainHealth: {
    score: number;
    supplierReliability: number;
    inventoryTurns: number;
    orderFulfillmentRate: number;
    leadTimeVariability: number;
  };

  recommendations: OperationsRecommendation[];
}

export interface OperationsRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'efficiency' | 'lean' | 'digital' | 'supply_chain';
  title: string;
  impact: string;
  effort: string;
  timelineWeeks: number;
}

export interface OperationsContext {
  completionRate: number;
  avgTaskDuration: number;
  utilizationRate: number;
  overdueTasks: number;
  totalTasks: number;
  automationLevel: number; // 0-100
  processDocumentation: number; // 0-100
  qualityScore: number; // 0-100
  cycleTime: number; // days
  teamVelocity: number; // tasks per week
}

export function analyzeOperationsExcellence(context: OperationsContext): OperationsExcellenceAnalysis {
  const efficiency = {
    score: Math.round((context.completionRate + context.utilizationRate + context.qualityScore) / 3),
    utilizationRate: context.utilizationRate,
    throughputRate: context.teamVelocity * 7 / context.totalTasks * 100,
    cycleTimeEfficiency: Math.max(0, 100 - context.cycleTime * 10),
    firstPassYield: context.qualityScore
  };

  const leanMaturity = {
    score: Math.round(
      (Math.min(5, context.completionRate / 20) +
       Math.min(5, (100 - context.overdueTasks / context.totalTasks * 100) / 20) +
       Math.min(5, context.processDocumentation / 20) +
       Math.min(5, context.utilizationRate / 20)) / 4
    ),
    wasteElimination: Math.min(5, (100 - context.overdueTasks / context.totalTasks * 100) / 20),
    continuousImprovement: Math.min(5, context.completionRate / 20),
    valueStreamOptimization: Math.min(5, context.processDocumentation / 20),
    pullSystem: Math.min(5, context.utilizationRate / 20)
  };

  const digitalOps = {
    score: Math.round((context.automationLevel + context.processDocumentation) / 2),
    automationLevel: context.automationLevel,
    dataUtilization: context.processDocumentation * 0.8,
    processDigitization: context.automationLevel * 0.9,
    analyticsCapability: Math.min(100, context.processDocumentation + 10)
  };

  const intelligentOps = {
    score: Math.round(context.automationLevel * 0.7),
    aiAdoption: context.automationLevel * 0.5,
    predictiveCapability: context.automationLevel * 0.4,
    selfHealingProcesses: context.automationLevel * 0.3,
    realTimeInsights: context.processDocumentation * 0.6
  };

  const supplyChain = {
    score: Math.round((context.completionRate + context.qualityScore) / 2),
    supplierReliability: context.qualityScore,
    inventoryTurns: 12, // Default reasonable value
    orderFulfillmentRate: context.completionRate,
    leadTimeVariability: Math.max(0, 100 - context.cycleTime * 5)
  };

  const recommendations: OperationsRecommendation[] = [];

  // Generate recommendations based on gaps
  if (context.completionRate < 70) {
    recommendations.push({
      priority: 'critical',
      category: 'efficiency',
      title: 'Implement Task Completion Acceleration Program',
      impact: `Improve completion rate from ${context.completionRate}% to 80%+`,
      effort: '40 hours executive time + process changes',
      timelineWeeks: 4
    });
  }

  if (context.automationLevel < 50) {
    recommendations.push({
      priority: 'high',
      category: 'digital',
      title: 'Launch Process Automation Initiative',
      impact: `Reduce manual effort by ${50 - context.automationLevel}%, free 20+ hours/week`,
      effort: '60 hours implementation + tool investment',
      timelineWeeks: 8
    });
  }

  if (context.overdueTasks > context.totalTasks * 0.1) {
    recommendations.push({
      priority: 'high',
      category: 'lean',
      title: 'Eliminate Overdue Task Backlog',
      impact: `Clear ${context.overdueTasks} overdue tasks, restore flow`,
      effort: '20 hours planning + team reallocation',
      timelineWeeks: 2
    });
  }

  if (context.cycleTime > 5) {
    recommendations.push({
      priority: 'medium',
      category: 'lean',
      title: 'Reduce Cycle Time Through Value Stream Mapping',
      impact: `Cut cycle time from ${context.cycleTime} days to 3 days`,
      effort: '30 hours analysis + process redesign',
      timelineWeeks: 6
    });
  }

  return {
    overallOpsScore: Math.round((efficiency.score + leanMaturity.score * 20 + digitalOps.score + intelligentOps.score + supplyChain.score) / 5),
    operationalEfficiency: efficiency,
    leanMaturity,
    digitalOpsIndex: digitalOps,
    intelligentOps,
    supplyChainHealth: supplyChain,
    recommendations
  };
}

// =============================================================================
// FINANCE CONSULTING FRAMEWORKS (McKinsey, EY, Deloitte, PwC, Charles River)
// =============================================================================

export interface FinanceAnalysis {
  // McKinsey Financial Health Score
  overallFinancialHealth: number; // 0-100

  // EY Financial Performance Indicators
  eyPerformanceIndicators: {
    profitabilityIndex: number;
    liquidityIndex: number;
    solvencyIndex: number;
    efficiencyIndex: number;
    growthIndex: number;
  };

  // Deloitte Financial Risk Assessment
  financialRiskProfile: {
    overallRisk: 'low' | 'moderate' | 'high' | 'critical';
    liquidityRisk: number; // 0-100
    creditRisk: number;
    marketRisk: number;
    operationalRisk: number;
    concentrationRisk: number;
  };

  // PwC Value Creation Analysis
  valueCreation: {
    economicValueAdded: number;
    returnOnInvestedCapital: number;
    costOfCapital: number;
    valueSpread: number;
    sustainabilityScore: number;
  };

  // Charles River Economic Analysis
  economicIndicators: {
    unitEconomics: {
      ltv: number;
      cac: number;
      ltvCacRatio: number;
      paybackMonths: number;
    };
    marginAnalysis: {
      grossMargin: number;
      contributionMargin: number;
      operatingMargin: number;
      netMargin: number;
    };
    growthMetrics: {
      revenueGrowthRate: number;
      customerGrowthRate: number;
      netRevenueRetention: number;
    };
  };

  keyInsights: FinanceInsight[];
  recommendations: FinanceRecommendation[];
}

export interface FinanceInsight {
  category: 'strength' | 'concern' | 'opportunity';
  title: string;
  metric: string;
  benchmark: string;
  implication: string;
}

export interface FinanceRecommendation {
  priority: 1 | 2 | 3;
  title: string;
  impact: string;
  timeline: string;
  owner: string;
}

export interface FinanceContext {
  revenue: number;
  previousRevenue: number;
  costs: number;
  burn: number;
  cashBalance: number;
  runway: number;
  grossMargin: number;
  ltv: number;
  cac: number;
  customerCount: number;
  previousCustomerCount: number;
  netRevenueRetention: number;
}

export function analyzeFinancialHealth(context: FinanceContext): FinanceAnalysis {
  const revenueGrowth = ((context.revenue - context.previousRevenue) / context.previousRevenue) * 100;
  const customerGrowth = ((context.customerCount - context.previousCustomerCount) / context.previousCustomerCount) * 100;
  const operatingMargin = ((context.revenue - context.costs) / context.revenue) * 100;
  const netMargin = ((context.revenue - context.burn) / context.revenue) * 100;
  const ltvCacRatio = context.ltv / context.cac;

  // Calculate overall health score
  const runwayScore = Math.min(100, context.runway * 8);
  const growthScore = Math.min(100, Math.max(0, revenueGrowth * 3 + 50));
  const efficiencyScore = Math.min(100, ltvCacRatio * 20);
  const marginScore = Math.min(100, context.grossMargin);
  const overallFinancialHealth = Math.round((runwayScore + growthScore + efficiencyScore + marginScore) / 4);

  // EY Performance Indicators
  const eyPerformanceIndicators = {
    profitabilityIndex: Math.min(100, context.grossMargin + 10),
    liquidityIndex: Math.min(100, context.runway * 8),
    solvencyIndex: context.runway > 12 ? 90 : context.runway > 6 ? 70 : 40,
    efficiencyIndex: Math.min(100, ltvCacRatio * 25),
    growthIndex: Math.min(100, Math.max(0, revenueGrowth * 3 + 50))
  };

  // Deloitte Risk Profile
  const financialRiskProfile = {
    overallRisk: context.runway < 6 ? 'critical' as const :
                 context.runway < 9 ? 'high' as const :
                 context.runway < 12 ? 'moderate' as const : 'low' as const,
    liquidityRisk: Math.max(0, 100 - context.runway * 8),
    creditRisk: 20, // Default for early-stage
    marketRisk: Math.min(80, 100 - revenueGrowth * 2),
    operationalRisk: Math.max(0, 100 - context.grossMargin),
    concentrationRisk: context.customerCount < 10 ? 80 : context.customerCount < 50 ? 50 : 20
  };

  // PwC Value Creation
  const costOfCapital = 15; // Startup hurdle rate
  const roic = operatingMargin * 0.5;
  const valueCreation = {
    economicValueAdded: context.revenue * (roic - costOfCapital) / 100,
    returnOnInvestedCapital: roic,
    costOfCapital,
    valueSpread: roic - costOfCapital,
    sustainabilityScore: context.netRevenueRetention > 100 ? 90 : context.netRevenueRetention > 90 ? 70 : 50
  };

  // Charles River Economic Analysis
  const economicIndicators = {
    unitEconomics: {
      ltv: context.ltv,
      cac: context.cac,
      ltvCacRatio,
      paybackMonths: context.cac / (context.revenue / context.customerCount / 12)
    },
    marginAnalysis: {
      grossMargin: context.grossMargin,
      contributionMargin: context.grossMargin - 10, // Assume 10% variable costs
      operatingMargin,
      netMargin
    },
    growthMetrics: {
      revenueGrowthRate: revenueGrowth,
      customerGrowthRate: customerGrowth,
      netRevenueRetention: context.netRevenueRetention
    }
  };

  // Generate insights
  const keyInsights: FinanceInsight[] = [];

  if (context.runway > 12) {
    keyInsights.push({
      category: 'strength',
      title: 'Strong Runway Position',
      metric: `${context.runway.toFixed(1)} months`,
      benchmark: 'Above 12-month threshold',
      implication: 'Sufficient time to achieve milestones without fundraising pressure'
    });
  } else if (context.runway < 9) {
    keyInsights.push({
      category: 'concern',
      title: 'Runway Below Target',
      metric: `${context.runway.toFixed(1)} months`,
      benchmark: 'Target: 12+ months',
      implication: 'Urgent action needed on cost reduction or fundraising'
    });
  }

  if (ltvCacRatio > 3) {
    keyInsights.push({
      category: 'strength',
      title: 'Excellent Unit Economics',
      metric: `${ltvCacRatio.toFixed(1)}x LTV:CAC`,
      benchmark: 'Above 3x threshold',
      implication: 'Profitable customer acquisition, ready to scale'
    });
  } else if (ltvCacRatio < 2) {
    keyInsights.push({
      category: 'concern',
      title: 'Unit Economics Need Work',
      metric: `${ltvCacRatio.toFixed(1)}x LTV:CAC`,
      benchmark: 'Target: 3x+',
      implication: 'Improve retention or reduce CAC before scaling'
    });
  }

  if (context.netRevenueRetention > 100) {
    keyInsights.push({
      category: 'opportunity',
      title: 'Net Revenue Retention Positive',
      metric: `${context.netRevenueRetention}% NRR`,
      benchmark: 'Above 100%',
      implication: 'Customers expanding - double down on upsell/cross-sell'
    });
  }

  // Generate recommendations
  const recommendations: FinanceRecommendation[] = [];

  if (context.runway < 12) {
    recommendations.push({
      priority: 1,
      title: `Extend runway to 12+ months (currently ${context.runway.toFixed(1)}mo)`,
      impact: `Provides buffer for ${12 - context.runway} additional months of execution`,
      timeline: '60 days',
      owner: 'Founder + Finance'
    });
  }

  if (ltvCacRatio < 3) {
    recommendations.push({
      priority: 2,
      title: `Improve LTV:CAC ratio to 3x+ (currently ${ltvCacRatio.toFixed(1)}x)`,
      impact: 'Enables profitable scaling of customer acquisition',
      timeline: '90 days',
      owner: 'Sales + Product'
    });
  }

  if (context.grossMargin < 60) {
    recommendations.push({
      priority: 2,
      title: `Improve gross margin to 60%+ (currently ${context.grossMargin}%)`,
      impact: 'Improves unit economics and path to profitability',
      timeline: '120 days',
      owner: 'Operations + Product'
    });
  }

  return {
    overallFinancialHealth,
    eyPerformanceIndicators,
    financialRiskProfile,
    valueCreation,
    economicIndicators,
    keyInsights,
    recommendations
  };
}

// =============================================================================
// HR/TALENT CONSULTING FRAMEWORKS (McKinsey, Deloitte, Mercer, Korn Ferry, Aon)
// =============================================================================

export interface TalentAnalysis {
  // McKinsey Human Capital Score
  overallTalentScore: number; // 0-100

  // Deloitte HR Transformation Index
  hrTransformationIndex: {
    overall: number;
    digitalHR: number;
    analyticsCapability: number;
    employeeExperience: number;
    agileOrg: number;
  };

  // Mercer Total Rewards Analysis
  totalRewardsHealth: {
    compensationCompetitiveness: number;
    benefitsValue: number;
    developmentInvestment: number;
    recognitionEffectiveness: number;
    workLifeBalance: number;
  };

  // Korn Ferry Talent Assessment
  talentAssessment: {
    leadershipBench: number;
    highPotentialRatio: number;
    successionReadiness: number;
    skillsCoverage: number;
    diversityIndex: number;
  };

  // Aon Human Capital Risk
  humanCapitalRisk: {
    overallRisk: 'low' | 'moderate' | 'high' | 'critical';
    attritionRisk: number;
    burnoutRisk: number;
    skillsGapRisk: number;
    successionRisk: number;
    engagementRisk: number;
  };

  // Team Composition Analysis
  teamComposition: {
    executiveToApprenticeRatio: number;
    avgUtilization: number;
    capacityDistribution: {
      overutilized: number;
      optimal: number;
      underutilized: number;
    };
  };

  insights: TalentInsight[];
  recommendations: TalentRecommendation[];
}

export interface TalentInsight {
  category: 'leadership' | 'engagement' | 'capacity' | 'development' | 'risk';
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  title: string;
  metric: string;
  action: string;
}

export interface TalentRecommendation {
  priority: 1 | 2 | 3;
  category: string;
  title: string;
  impact: string;
  timeline: string;
}

export interface TalentContext {
  teamSize: number;
  executives: number;
  apprentices: number;
  avgUtilization: number;
  overutilizedCount: number;
  underutilizedCount: number;
  avgTenure: number; // months
  recentDepartures: number;
  openRoles: number;
  trainingHoursPerPerson: number;
  engagementScore: number; // 0-100
  performanceDistribution: {
    exceeds: number;
    meets: number;
    below: number;
  };
}

export function analyzeTalent(context: TalentContext): TalentAnalysis {
  const execRatio = context.executives / context.apprentices;
  const attritionRate = (context.recentDepartures / context.teamSize) * 100;
  const optimalCount = context.teamSize - context.overutilizedCount - context.underutilizedCount;

  // Calculate overall talent score
  const capacityScore = optimalCount / context.teamSize * 100;
  const engagementScore = context.engagementScore;
  const structureScore = execRatio >= 0.2 && execRatio <= 0.5 ? 80 : 60;
  const developmentScore = Math.min(100, context.trainingHoursPerPerson * 2);
  const retentionScore = Math.max(0, 100 - attritionRate * 10);

  const overallTalentScore = Math.round(
    (capacityScore * 0.25 + engagementScore * 0.25 + structureScore * 0.2 +
     developmentScore * 0.15 + retentionScore * 0.15)
  );

  // Deloitte HR Transformation Index
  const hrTransformationIndex = {
    overall: Math.round((capacityScore + engagementScore) / 2),
    digitalHR: 60, // Default baseline
    analyticsCapability: 50, // Default baseline
    employeeExperience: engagementScore,
    agileOrg: capacityScore
  };

  // Mercer Total Rewards
  const totalRewardsHealth = {
    compensationCompetitiveness: 70, // Default competitive
    benefitsValue: 65,
    developmentInvestment: developmentScore,
    recognitionEffectiveness: engagementScore * 0.8,
    workLifeBalance: Math.max(0, 100 - context.overutilizedCount / context.teamSize * 100)
  };

  // Korn Ferry Talent Assessment
  const talentAssessment = {
    leadershipBench: Math.min(100, context.executives * 15),
    highPotentialRatio: context.performanceDistribution.exceeds,
    successionReadiness: Math.min(100, context.executives * 10 + context.avgTenure),
    skillsCoverage: Math.min(100, 70 + context.trainingHoursPerPerson),
    diversityIndex: 60 // Default baseline
  };

  // Aon Human Capital Risk
  const burnoutRisk = context.overutilizedCount / context.teamSize * 100;
  const humanCapitalRisk = {
    overallRisk: burnoutRisk > 30 || attritionRate > 20 ? 'critical' as const :
                 burnoutRisk > 20 || attritionRate > 10 ? 'high' as const :
                 burnoutRisk > 10 || attritionRate > 5 ? 'moderate' as const : 'low' as const,
    attritionRisk: Math.min(100, attritionRate * 5),
    burnoutRisk,
    skillsGapRisk: Math.max(0, 100 - developmentScore),
    successionRisk: context.executives < 2 ? 80 : context.executives < 4 ? 50 : 20,
    engagementRisk: Math.max(0, 100 - engagementScore)
  };

  // Team Composition
  const teamComposition = {
    executiveToApprenticeRatio: execRatio,
    avgUtilization: context.avgUtilization,
    capacityDistribution: {
      overutilized: context.overutilizedCount,
      optimal: optimalCount,
      underutilized: context.underutilizedCount
    }
  };

  // Generate insights
  const insights: TalentInsight[] = [];

  if (context.overutilizedCount > 0) {
    insights.push({
      category: 'capacity',
      severity: context.overutilizedCount > context.teamSize * 0.3 ? 'critical' : 'warning',
      title: 'Burnout Risk Detected',
      metric: `${context.overutilizedCount} team members at >90% utilization`,
      action: 'Immediately redistribute workload or hire additional capacity'
    });
  }

  if (context.underutilizedCount > 0) {
    insights.push({
      category: 'capacity',
      severity: 'warning',
      title: 'Underutilized Capacity',
      metric: `${context.underutilizedCount} team members at <60% utilization`,
      action: 'Reallocate tasks from overutilized members or upskill for new responsibilities'
    });
  }

  if (execRatio < 0.2) {
    insights.push({
      category: 'leadership',
      severity: 'warning',
      title: 'Executive Coverage Thin',
      metric: `1:${(1/execRatio).toFixed(0)} exec-to-apprentice ratio`,
      action: 'Consider adding fractional executive to improve oversight'
    });
  }

  if (engagementScore > 75) {
    insights.push({
      category: 'engagement',
      severity: 'positive',
      title: 'Strong Team Engagement',
      metric: `${engagementScore}% engagement score`,
      action: 'Maintain momentum, recognize contributors'
    });
  }

  // Generate recommendations
  const recommendations: TalentRecommendation[] = [];

  if (context.overutilizedCount > 0) {
    recommendations.push({
      priority: 1,
      category: 'Capacity Management',
      title: `Rebalance ${context.overutilizedCount} overutilized team members`,
      impact: 'Reduce burnout risk, improve quality and retention',
      timeline: '7 days'
    });
  }

  if (execRatio < 0.2 && context.apprentices > 5) {
    recommendations.push({
      priority: 2,
      category: 'Leadership',
      title: 'Strengthen executive coverage',
      impact: 'Improve mentorship, decision quality, and execution speed',
      timeline: '30 days'
    });
  }

  if (context.trainingHoursPerPerson < 10) {
    recommendations.push({
      priority: 3,
      category: 'Development',
      title: 'Launch structured training program',
      impact: 'Build capabilities, improve retention, increase productivity',
      timeline: '60 days'
    });
  }

  return {
    overallTalentScore,
    hrTransformationIndex,
    totalRewardsHealth,
    talentAssessment,
    humanCapitalRisk,
    teamComposition,
    insights,
    recommendations
  };
}

// =============================================================================
// PROCESS CONSULTING FRAMEWORKS (Accenture, KPMG, PwC, Deloitte)
// =============================================================================

export interface ProcessAnalysis {
  // Overall Process Maturity (Accenture BPM Framework)
  processMaturityLevel: 1 | 2 | 3 | 4 | 5;
  processMaturityLabel: string;

  // KPMG Process Excellence Dimensions
  processExcellence: {
    efficiency: number; // Time/cost to execute
    effectiveness: number; // Outcome quality
    compliance: number; // Adherence to standards
    adaptability: number; // Change responsiveness
    innovation: number; // Continuous improvement
  };

  // PwC Process Risk Assessment
  processRisks: {
    controlGaps: string[];
    complianceRisks: string[];
    efficiencyLeaks: string[];
    qualityIssues: string[];
  };

  // Deloitte Process Analytics
  processMetrics: {
    avgCycleTime: number;
    processVariability: number; // Standard deviation
    automationRate: number;
    errorRate: number;
    reworkRate: number;
    bottlenecks: string[];
  };

  recommendations: ProcessRecommendation[];
}

export interface ProcessRecommendation {
  priority: 1 | 2 | 3;
  processArea: string;
  title: string;
  currentState: string;
  targetState: string;
  impact: string;
  effort: string;
}

export interface ProcessContext {
  completionRate: number;
  avgCycleTime: number;
  cycleTimeVariability: number;
  automationLevel: number;
  errorRate: number;
  reworkRate: number;
  documentationLevel: number;
  standardizationLevel: number;
}

export function analyzeProcessHealth(context: ProcessContext): ProcessAnalysis {
  // Calculate maturity level
  const maturityScore = (
    context.completionRate * 0.2 +
    (100 - context.cycleTimeVariability) * 0.15 +
    context.automationLevel * 0.2 +
    (100 - context.errorRate) * 0.15 +
    context.documentationLevel * 0.15 +
    context.standardizationLevel * 0.15
  );

  const processMaturityLevel: 1 | 2 | 3 | 4 | 5 =
    maturityScore >= 85 ? 5 :
    maturityScore >= 70 ? 4 :
    maturityScore >= 55 ? 3 :
    maturityScore >= 40 ? 2 : 1;

  const maturityLabels = {
    1: 'Initial - Ad-hoc processes, inconsistent outcomes',
    2: 'Developing - Some standardization, high variability',
    3: 'Defined - Documented processes, moderate control',
    4: 'Managed - Measured and controlled processes',
    5: 'Optimizing - Continuous improvement culture'
  };

  const processExcellence = {
    efficiency: Math.round(100 - context.avgCycleTime * 5),
    effectiveness: context.completionRate,
    compliance: context.standardizationLevel,
    adaptability: Math.round((context.automationLevel + context.documentationLevel) / 2),
    innovation: Math.round(context.automationLevel * 0.8)
  };

  // Identify risks
  const controlGaps: string[] = [];
  const complianceRisks: string[] = [];
  const efficiencyLeaks: string[] = [];
  const qualityIssues: string[] = [];

  if (context.documentationLevel < 50) controlGaps.push('Insufficient process documentation');
  if (context.standardizationLevel < 60) controlGaps.push('Lack of standardized procedures');
  if (context.automationLevel < 40) efficiencyLeaks.push('Manual processes creating bottlenecks');
  if (context.cycleTimeVariability > 30) efficiencyLeaks.push('High process variability impacting predictability');
  if (context.errorRate > 10) qualityIssues.push('Error rate above acceptable threshold');
  if (context.reworkRate > 15) qualityIssues.push('High rework rate indicating quality issues');

  const bottlenecks: string[] = [];
  if (context.completionRate < 70) bottlenecks.push('Task completion bottleneck');
  if (context.avgCycleTime > 5) bottlenecks.push('Long cycle times');
  if (context.automationLevel < 30) bottlenecks.push('Manual process constraints');

  const recommendations: ProcessRecommendation[] = [];

  if (context.documentationLevel < 60) {
    recommendations.push({
      priority: 1,
      processArea: 'Documentation',
      title: 'Implement Process Documentation Program',
      currentState: `${context.documentationLevel}% documented`,
      targetState: '80%+ documentation coverage',
      impact: 'Reduces training time, improves consistency, enables automation',
      effort: '40 hours over 4 weeks'
    });
  }

  if (context.automationLevel < 50) {
    recommendations.push({
      priority: 2,
      processArea: 'Automation',
      title: 'Launch Process Automation Initiative',
      currentState: `${context.automationLevel}% automated`,
      targetState: '70%+ automation',
      impact: 'Reduces manual effort by 30%, improves accuracy',
      effort: '80 hours over 8 weeks'
    });
  }

  if (context.cycleTimeVariability > 25) {
    recommendations.push({
      priority: 2,
      processArea: 'Standardization',
      title: 'Reduce Process Variability',
      currentState: `${context.cycleTimeVariability}% variability`,
      targetState: '<15% variability',
      impact: 'Improves predictability, reduces delays',
      effort: '30 hours over 3 weeks'
    });
  }

  return {
    processMaturityLevel,
    processMaturityLabel: maturityLabels[processMaturityLevel],
    processExcellence,
    processRisks: {
      controlGaps,
      complianceRisks,
      efficiencyLeaks,
      qualityIssues
    },
    processMetrics: {
      avgCycleTime: context.avgCycleTime,
      processVariability: context.cycleTimeVariability,
      automationRate: context.automationLevel,
      errorRate: context.errorRate,
      reworkRate: context.reworkRate,
      bottlenecks
    },
    recommendations
  };
}

// =============================================================================
// MANUFACTURING/OPERATIONS CONSULTING (BCG, McKinsey, Deloitte, Accenture, KPMG)
// =============================================================================

export interface ManufacturingAnalysis {
  // BCG Manufacturing Excellence Score
  overallManufacturingScore: number;

  // Industry 4.0 Maturity (Deloitte/Accenture)
  industry40Maturity: {
    level: 1 | 2 | 3 | 4 | 5;
    label: string;
    digitalTwin: number;
    iotIntegration: number;
    predictiveMaintenance: number;
    smartAutomation: number;
  };

  // McKinsey Digital Manufacturing Index
  digitalManufacturingIndex: {
    overall: number;
    connectivity: number;
    intelligence: number;
    flexibility: number;
    agility: number;
  };

  // KPMG Operational Excellence
  operationalExcellence: {
    oee: number; // Overall Equipment Effectiveness
    quality: number;
    availability: number;
    performance: number;
    yieldRate: number;
  };

  // Sustainability Metrics (PwC)
  sustainabilityMetrics: {
    carbonIntensity: number;
    wasteReduction: number;
    energyEfficiency: number;
    circularEconomy: number;
  };

  insights: ManufacturingInsight[];
  recommendations: ManufacturingRecommendation[];
}

export interface ManufacturingInsight {
  category: 'efficiency' | 'quality' | 'digital' | 'sustainability';
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  title: string;
  metric: string;
  benchmark: string;
}

export interface ManufacturingRecommendation {
  priority: 1 | 2 | 3;
  category: string;
  title: string;
  impact: string;
  investment: string;
  timeline: string;
}

export interface ManufacturingContext {
  throughput: number; // units per period
  targetThroughput: number;
  qualityRate: number; // % first-pass yield
  availability: number; // % uptime
  performance: number; // actual vs theoretical speed
  automationLevel: number;
  digitalMaturity: number;
  wasteRate: number;
  energyEfficiency: number;
}

export function analyzeManufacturing(context: ManufacturingContext): ManufacturingAnalysis {
  // Calculate OEE (Overall Equipment Effectiveness)
  const oee = (context.availability * context.performance * context.qualityRate) / 10000;

  // Industry 4.0 Maturity
  const i40Score = (context.automationLevel + context.digitalMaturity) / 2;
  const i40Level: 1 | 2 | 3 | 4 | 5 =
    i40Score >= 80 ? 5 : i40Score >= 65 ? 4 : i40Score >= 50 ? 3 : i40Score >= 35 ? 2 : 1;

  const i40Labels = {
    1: 'Computerization - Basic digital tools',
    2: 'Connectivity - Connected systems',
    3: 'Visibility - Real-time monitoring',
    4: 'Transparency - Understanding root causes',
    5: 'Predictability - AI-driven operations'
  };

  // Calculate overall score
  const overallScore = Math.round(
    (oee * 0.3 + context.qualityRate * 0.25 + context.digitalMaturity * 0.25 + (100 - context.wasteRate) * 0.2)
  );

  const insights: ManufacturingInsight[] = [];

  if (oee > 85) {
    insights.push({
      category: 'efficiency',
      status: 'excellent',
      title: 'World-Class OEE',
      metric: `${(oee).toFixed(0)}%`,
      benchmark: 'Above 85% world-class threshold'
    });
  } else if (oee < 60) {
    insights.push({
      category: 'efficiency',
      status: 'critical',
      title: 'OEE Below Target',
      metric: `${(oee).toFixed(0)}%`,
      benchmark: 'Target: 65%+ for competitive operations'
    });
  }

  if (context.qualityRate > 95) {
    insights.push({
      category: 'quality',
      status: 'excellent',
      title: 'Excellent Quality Rate',
      metric: `${context.qualityRate}%`,
      benchmark: 'Above Six Sigma threshold'
    });
  }

  const recommendations: ManufacturingRecommendation[] = [];

  if (oee < 70) {
    recommendations.push({
      priority: 1,
      category: 'OEE Improvement',
      title: 'Launch OEE Improvement Program',
      impact: `Increase throughput by ${Math.round((70 - oee) / oee * 100)}%`,
      investment: 'Process optimization, minimal capex',
      timeline: '90 days'
    });
  }

  if (context.digitalMaturity < 50) {
    recommendations.push({
      priority: 2,
      category: 'Digital Transformation',
      title: 'Accelerate Industry 4.0 Adoption',
      impact: 'Enable predictive operations, reduce downtime 20%',
      investment: 'IoT sensors, analytics platform',
      timeline: '180 days'
    });
  }

  return {
    overallManufacturingScore: overallScore,
    industry40Maturity: {
      level: i40Level,
      label: i40Labels[i40Level],
      digitalTwin: context.digitalMaturity * 0.7,
      iotIntegration: context.digitalMaturity * 0.8,
      predictiveMaintenance: context.digitalMaturity * 0.6,
      smartAutomation: context.automationLevel
    },
    digitalManufacturingIndex: {
      overall: context.digitalMaturity,
      connectivity: context.digitalMaturity * 0.9,
      intelligence: context.digitalMaturity * 0.7,
      flexibility: context.automationLevel * 0.8,
      agility: Math.round((context.automationLevel + context.digitalMaturity) / 2)
    },
    operationalExcellence: {
      oee,
      quality: context.qualityRate,
      availability: context.availability,
      performance: context.performance,
      yieldRate: context.qualityRate
    },
    sustainabilityMetrics: {
      carbonIntensity: 100 - context.energyEfficiency,
      wasteReduction: 100 - context.wasteRate,
      energyEfficiency: context.energyEfficiency,
      circularEconomy: (100 - context.wasteRate) * 0.8
    },
    insights,
    recommendations
  };
}

// =============================================================================
// INTEGRATED CONSULTING DASHBOARD
// =============================================================================

export interface IntegratedConsultingAnalysis {
  generatedAt: Date;
  overallHealthScore: number;

  strategy: StrategicPositionAnalysis;
  operations: OperationsExcellenceAnalysis;
  finance: FinanceAnalysis;
  talent: TalentAnalysis;
  process: ProcessAnalysis;
  manufacturing: ManufacturingAnalysis;

  executiveSummary: {
    status: 'excellent' | 'good' | 'attention_needed' | 'critical';
    headline: string;
    topStrengths: string[];
    topRisks: string[];
    immediateActions: string[];
  };

  prioritizedRecommendations: Array<{
    rank: number;
    source: string;
    recommendation: string;
    impact: string;
    timeline: string;
    owner: string;
  }>;
}
