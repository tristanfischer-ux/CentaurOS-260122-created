# CentaurOS Business Model & Architecture
**For AI Analysis: Marketing & Pricing Strategy Recommendations**

---

## Executive Summary

CentaurOS is an operating system for lean companies that enables small teams (2-5 people) to achieve the output of traditionally-sized teams (15-20 people) through a combination of:
1. **Human roles optimization** (Founders, Fractional Executives, Apprentices)
2. **Time Unit (TU) allocation** (4-hour work blocks)
3. **Per-person AI tool equipping** (5 slots: Think, Create, Verify, Execute, Ops)
4. **Supply chain orchestration** (not manufacturing ownership)

**Core Value Proposition**: Build a £10M company with £95K/year team cost instead of £500K+ (81% savings).

---

## 1. BUSINESS MODEL ARCHITECTURE

### 1.1 Target Market Segments

**Primary**: Hardware/physical product startups
- Pre-seed to Series A
- 0-10 employees
- Need to reach product-market fit before running out of money
- High capital efficiency requirements

**Secondary**:
- Service businesses with fractional team needs
- Universities/education (apprentice placement)
- Experienced professionals seeking fractional work (executives)

### 1.2 Customer Personas

#### Persona 1: The Lean Founder
- **Pain**: Can't afford full-time specialists across all functions
- **Gain**: Access to part-time experts + execution capacity
- **Job-to-be-done**: Build a viable product with minimal burn rate
- **Willingness to pay**: £95K/year total team cost acceptable

#### Persona 2: The Fractional Executive
- **Pain**: Bored in corporate, wants variety and autonomy
- **Gain**: Work with 5 startups simultaneously, earn £15K+/month
- **Job-to-be-done**: Apply expertise across multiple contexts, build personal brand
- **Willingness to pay**: 10-15% platform commission acceptable

#### Persona 3: The Apprentice
- **Pain**: Unpaid internships or minimum wage, no real learning
- **Gain**: £180-220/day while learning from experts
- **Job-to-be-done**: Build portfolio of real work for future career
- **Willingness to pay**: 5-10% platform commission acceptable

---

## 2. REVENUE MODEL OPTIONS

### 2.1 Current Implied Model (from code analysis)
**SaaS Subscription + Marketplace Commission**

**For Founders:**
- Base platform access: £X/month per workspace
- Per-seat pricing for team members: £Y/month per active member
- OR: Percentage of TU spend (e.g., 10% commission on all TU transactions)

**For Executives:**
- Commission on engagements: 10-15% of fees charged
- OR: Subscription + lower commission (e.g., £50/month + 5%)

**For Apprentices:**
- Commission on engagements: 5-10% of earnings
- OR: Free access (subsidized by founder/executive fees)

### 2.2 Alternative Models for Consideration

#### Option A: Pure Marketplace (0-20% commission)
- No base subscription fees
- Commission-only on transactions
- **Pros**: Low barrier to entry, scales with usage
- **Cons**: No guaranteed revenue, race to bottom on commissions

#### Option B: Freemium SaaS + Premium Features
- Free tier: 1 workspace, 3 team members, basic features
- Pro tier (£99/month): Unlimited team, AI analytics, integrations
- Enterprise tier (£499/month): Multi-workspace, white-label, API access
- **Pros**: Predictable recurring revenue
- **Cons**: May limit viral growth

#### Option C: Success-Based Pricing
- Free until company raises funding or reaches revenue milestone
- Then: 0.5-1% equity or % of revenue for 2 years
- **Pros**: Aligned incentives, attractive to cash-strapped startups
- **Cons**: Complex to administer, long payback period

#### Option D: Bundled Service Packages
- Starter Pack: £2,500/month (1 Exec + 1 Apprentice + Platform)
- Growth Pack: £7,500/month (2 Execs + 3 Apprentices + Platform + AI tools)
- Scale Pack: £15,000/month (4 Execs + 6 Apprentices + Platform + AI + Concierge)
- **Pros**: Simple, predictable, high margins
- **Cons**: May not fit all customer needs, inflexible

---

## 3. CORE SYSTEM COMPONENTS

### 3.1 Time Units (TU) System
**Definition**: 1 TU = 4 hours of focused work

**Role Capacities:**
- Founders: 10 TU/week (40 hours)
- Fractional Executives: 2 TU/day × days worked per startup
- Apprentices: 10 TU/week (40 hours)

**Cost Structure (implied from tutorial):**
- Founders: £960/TU (£9,600/week or ~£38,400/month full-time)
- Fractional Executives: £400-475/TU (£800-950/day or 2 TU/day)
- Apprentices: £70/TU (£700/week or ~£2,800/month full-time)

**Platform Value**:
- Standardized work measurement
- Capacity planning and forecasting
- Efficiency tracking (actual vs. estimated TU)

### 3.2 Role Structure

#### Founder Role
- **Access**: Full platform access, all features
- **Capabilities**: Create tasks, invite team, assign work, track everything
- **Responsibilities**: Vision, strategy, key decisions, orchestration
- **Capacity**: 10 TU/week
- **Platform features used**: Mission Control, Tasks, When (timeline), People, Settings

#### Fractional Executive Role
- **Access**: Limited to their function + assigned tasks
- **Capabilities**: Review work, create tasks for their function, mentor apprentices
- **Responsibilities**: Strategic guidance, decision-making, unblocking, quality review
- **Capacity**: Flexible (2 TU/day × days worked)
- **Platform features used**: Dashboard, Tasks (filtered), When (their timeline)

#### Apprentice Role
- **Access**: Limited to assigned tasks
- **Capabilities**: Execute tasks, update progress, ask for help
- **Responsibilities**: Task execution, learning, skill building
- **Capacity**: 10 TU/week
- **Platform features used**: Tasks (assigned to them), When (their timeline)

### 3.3 AI Tools Integration (5 Slots per Person)

**Slot Categories:**
1. **Think**: Research, analysis, strategy (e.g., ChatGPT, Perplexity)
2. **Create**: Content generation, design (e.g., Cursor, Jasper, Midjourney)
3. **Verify**: QA, testing, validation (e.g., automated testing tools)
4. **Execute**: Automation, coding, implementation (e.g., GitHub Copilot, Zapier)
5. **Ops**: Workflow, project management (e.g., Linear AI, Notion AI)

**Value Multipliers:**
- Speed multiplier: 2-5x faster execution
- Quality multiplier: 1.5-3x higher quality output
- Flow multiplier: 1.2-2x better handoffs between people

**Effective TU Formula**: `Effective TU = TU × speed × quality × flow`

**Example**:
- Marketing Exec creates strategy (1 TU)
- Equips Cursor Pro: Drafts 30 social posts (0.5 TU instead of 2 TU, thanks to 4x speed)
- Apprentice equips Linear AI: Schedules posts (0.5 TU instead of 1.5 TU)
- **Result**: 2 TU input → 4.5 TU output = 2.25x multiplier

**Platform Opportunity**:
- AI tool marketplace integration
- Usage tracking and ROI measurement
- Recommendation engine for tool equipping

### 3.4 Supplier Orchestration (Not Manufacturing)

**Philosophy**: Don't own factories, orchestrate suppliers

**Workflow Stages:**
1. Quote Request → Quote Received
2. Purchase Order (PO) Issued
3. Production → In Progress
4. Quality Control (QC) → Inspection
5. Acceptance → Evidence Required (POD, photos, reports)

**Financial Tracking:**
- Value Delivered: £X accepted this month
- Value In Flight: £Y in progress (not accepted yet)
- Cash at Risk: £Z late/disputed/at-risk

**Multi-hop Logistics Support**: Supplier A → Supplier B → Customer

**Platform Differentiator**:
- 'Done' = Accepted with evidence, NOT just shipped
- Real-time financial exposure tracking
- Supplier performance analytics

---

## 4. COMPETITIVE POSITIONING

### 4.1 Direct Competitors

#### Traditional Employment Model
- **Offering**: Full-time specialists (£40K-£80K/year each)
- **Team cost for 5 people**: £200K-£400K/year
- **CentaurOS advantage**: 81% cost reduction, flexible capacity

#### Freelance Marketplaces (Upwork, Fiverr, Toptal)
- **Offering**: Task-based freelancers, no team structure
- **Weakness**: No orchestration, inconsistent quality, coordination overhead
- **CentaurOS advantage**: Integrated team with defined roles, TU-based planning

#### Project Management Tools (Asana, Monday, ClickUp)
- **Offering**: Task tracking, no team supply
- **Weakness**: You still need to hire everyone yourself
- **CentaurOS advantage**: Team + tools + methodology in one platform

#### Consulting Firms (McKinsey, BCG for strategy; Big 4 for execution)
- **Offering**: Expert advice, expensive (£5K-£15K/day for partners)
- **Weakness**: Pure advice, you still need execution capacity
- **CentaurOS advantage**: Fractional executives provide strategy + oversight at £800/day

### 4.2 Indirect Competitors

#### AI Agent Platforms (AutoGPT, LangChain, CrewAI)
- **Offering**: Autonomous AI agents for task execution
- **Weakness**: Still experimental, no human judgment
- **CentaurOS positioning**: Human + AI centaur model, not full automation

#### Outsourcing/Offshoring (Fiverr, Remote.com)
- **Offering**: Cheap labor in other countries
- **Weakness**: Time zone issues, communication barriers, quality inconsistency
- **CentaurOS advantage**: Local talent (Fractional Execs) + mentored apprentices

#### University Internship Programs
- **Offering**: Free or low-cost labor
- **Weakness**: Short-term (3-6 months), minimal experience, high training overhead
- **CentaurOS advantage**: Paid apprentices, executive mentorship, longer-term

---

## 5. UNIQUE VALUE PROPOSITIONS

### 5.1 For Founders

**Primary UVP**: "Build a £10M company with a £95K/year team"

**Supporting UVPs:**
1. **Capital Efficiency**: 81% cost reduction vs. traditional hiring
2. **Flexibility**: Scale team up/down by adjusting TU allocations
3. **Expertise Access**: Part-time experts you couldn't afford full-time
4. **Execution Capacity**: Apprentices provide hands-on work, not just advice
5. **AI Multiplication**: Equip team with tools that 2-10x their effectiveness
6. **Risk Mitigation**: Don't own factories, orchestrate suppliers instead

**Outcome**: Longer runway, faster iteration, higher survival rate to PMF

### 5.2 For Fractional Executives

**Primary UVP**: "Turn your expertise into £15K+/month across 5 startups"

**Supporting UVPs:**
1. **Income Diversification**: 5 clients × £3K/month = £15K (vs. 1 salary)
2. **Autonomy**: Choose which startups to work with
3. **Variety**: See different challenges, industries, approaches
4. **Leverage**: AI tools + apprentices multiply your impact
5. **Reputation Building**: Platform tracks your success metrics
6. **Reduced Risk**: If 1 client churns, you still have 4 others

**Outcome**: Higher income, more interesting work, personal brand growth

### 5.3 For Apprentices

**Primary UVP**: "Get paid £180-220/day to learn from experts"

**Supporting UVPs:**
1. **Real Income**: 10x unpaid internships, 3x minimum wage jobs
2. **Real Learning**: Work with 10-20 year experienced executives
3. **Real Portfolio**: Tangible results to show future employers
4. **Multiple Startups**: See 2-3 different approaches simultaneously
5. **Skill Building**: Structured tasks + feedback + mentorship
6. **Career Acceleration**: 1 year here = 3 years at one company

**Outcome**: Better-paid, better-prepared for full-time employment

---

## 6. PRICING STRATEGY CONSIDERATIONS

### 6.1 Value-Based Pricing Anchors

**For Founders:**
- **Anchor**: Cost of hiring 5 full-time employees = £200K-£400K/year
- **CentaurOS value**: Achieve same output with £95K/year (75-81% savings)
- **Willingness to pay**: Up to 20% of savings (£20K-£60K/year or £1.7K-£5K/month)

**For Fractional Executives:**
- **Anchor**: Corporate salary £80K-£120K/year (£6.7K-£10K/month) for 1 company
- **CentaurOS value**: Earn £15K-£30K/month across 5 companies
- **Willingness to pay**: 10-15% commission (£1.5K-£4.5K/month) acceptable

**For Apprentices:**
- **Anchor**: Unpaid internship (£0) or minimum wage (£1.3K/month)
- **CentaurOS value**: Earn £3.5K-£4.5K/month (2-3 days/week)
- **Willingness to pay**: 5-10% commission (£175-£450/month) acceptable

### 6.2 Cost Structure to Consider

**Platform Operating Costs:**
- **Infrastructure**: Hosting, database, storage (~£500-£2K/month)
- **Third-party APIs**: AI tools, email, payments (~£200-£1K/month)
- **Support**: Customer success, technical support (~£5K-£15K/month)
- **Development**: Ongoing features, maintenance (~£10K-£30K/month)
- **Total**: ~£15K-£50K/month at scale

**Marketplace Operating Costs:**
- **Vetting**: Executive/apprentice screening (time cost)
- **Quality Assurance**: Dispute resolution, quality issues
- **Payment Processing**: 2-3% of transactions (Stripe/PayPal fees)
- **Insurance/Legal**: Professional indemnity, contracts

**Break-Even Analysis:**
- **Scenario A**: 100 founders × £200/month = £20K MRR → covers base costs
- **Scenario B**: £100K monthly TU transactions × 10% commission = £10K → needs 250K/month volume
- **Scenario C**: 50 executives × £3K/month avg × 12% commission = £18K → needs strong exec adoption

### 6.3 Pricing Psychology

**Decoy Pricing**: Offer 3 tiers (Starter, Growth, Scale) where Growth is the "sweet spot"

**Freemium Hook**: Free for first 30 days or first £5K TU spend, then paid

**Usage-Based**: Pay-as-you-go TU commission = scales with customer success

**Subscription Certainty**: Fixed monthly fee = predictable budgeting for founders

**Performance Guarantees**: "If your team doesn't save 50% vs. traditional hiring, we refund"

---

## 7. GO-TO-MARKET STRATEGY IMPLICATIONS

### 7.1 Customer Acquisition Channels

**For Founders:**
1. **Hardware startup accelerators** (Y Combinator, Techstars, HAX)
2. **University entrepreneurship programs** (Cambridge, Imperial, UCL)
3. **Startup pitch events** (Demo days, pitch competitions)
4. **Content marketing** (Blog posts on "How to build hardware with £95K/year")
5. **LinkedIn outreach** (Target hardware founders at pre-seed/seed stage)

**For Fractional Executives:**
1. **LinkedIn targeting** (Experienced professionals 10-20 years, looking for flexibility)
2. **Referrals** (Existing executives recruit their network)
3. **Industry events** (Executive conferences, fractional executive communities)
4. **Content** (Case studies: "How I went from £80K/year to £300K/year fractional")

**For Apprentices:**
1. **University partnerships** (Career services, job boards)
2. **LinkedIn campus outreach** (Recent grads, final-year students)
3. **Apprentice success stories** (Portfolio showcases)
4. **Paid ads** (Target students searching for internships/apprenticeships)

### 7.2 Sales Motion

**Founder Sales Cycle:**
1. **Lead gen**: Content marketing, events, referrals
2. **Qualification**: Are they pre-seed/seed? Hardware/physical product?
3. **Demo**: Show how to build team with TU allocation
4. **Trial**: Free first month or first hire
5. **Conversion**: Subscribe + first TU transactions
6. **Expansion**: Add more execs/apprentices as they grow

**Expected CAC**: £500-£2K per founder customer
**Target LTV**: £10K-£50K (12-24 month retention × £500-£2K/month)
**LTV:CAC Ratio**: 5:1 to 10:1 target

**Executive/Apprentice Sales Cycle:**
1. **Application**: Submit profile, experience, availability
2. **Vetting**: Interview, reference checks, portfolio review
3. **Onboarding**: Platform training, first engagement setup
4. **First Match**: Introduce to 1-2 startups
5. **Success**: Complete first 3 months, get reviews
6. **Growth**: Add more clients to portfolio

**Expected CAC**: £200-£500 per exec/apprentice (vetting time cost)
**Target LTV**: £5K-£20K commission over 2-3 years

---

## 8. KEY METRICS FOR BUSINESS SUCCESS

### 8.1 Platform Metrics

**Activation:**
- % of founders who invite first team member (within 7 days)
- % of founders who create first task (within 14 days)
- % of execs/apprentices who complete first TU (within 30 days)

**Engagement:**
- TUs transacted per month (total volume)
- Active founders per month (created task in last 30 days)
- Active execs/apprentices per month (completed TU in last 30 days)

**Retention:**
- Founder churn rate (monthly, cohort-based)
- Exec/apprentice churn rate
- Net revenue retention (NRR) - target 100%+

**Growth:**
- Month-over-month TU volume growth
- Month-over-month new founder signups
- Viral coefficient (invites sent → signups)

### 8.2 Marketplace Metrics

**Liquidity:**
- Time-to-first-match for executives (target: <7 days)
- Time-to-first-match for apprentices (target: <14 days)
- % of executive capacity utilized (target: 70%+)

**Quality:**
- Average founder rating of executives (target: 4.5+/5)
- Average executive rating of founders (target: 4.3+/5)
- Repeat engagement rate (target: 70%+)

**Economics:**
- Average TU rate by role (Exec: £400-£475, Apprentice: £70)
- Average commission per transaction (target: 10-15%)
- Gross margin after payment processing (target: 85%+)

---

## 9. RISKS & MITIGATION

### 9.1 Business Model Risks

**Risk 1: Chicken-and-egg marketplace**
- **Description**: Need founders to attract execs, need execs to attract founders
- **Mitigation**:
  - Start with supply (recruit 10-20 execs first)
  - Seed with demo founders (pilot customers)
  - Offer guarantees (find you an exec in 7 days or money back)

**Risk 2: Disintermediation**
- **Description**: Founders hire execs directly, cut out platform
- **Mitigation**:
  - Lock-in via platform value (TU tracking, AI tools, analytics)
  - Contract terms (non-circumvention for 12 months)
  - Make platform indispensable (can't manage team without it)

**Risk 3: Quality control at scale**
- **Description**: Bad execs/apprentices damage reputation
- **Mitigation**:
  - Strict vetting (interviews, references, trial projects)
  - Rating/review system (public reputation)
  - Quality guarantees (replace bad match within 30 days)

**Risk 4: Pricing compression**
- **Description**: Race to bottom on TU rates or commissions
- **Mitigation**:
  - Focus on quality, not cost (best execs, not cheapest)
  - Value-added services (AI tools, analytics, concierge)
  - Lock in early customers before competition emerges

### 9.2 Technology Risks

**Risk 5: AI tools don't deliver promised multipliers**
- **Description**: 2-10x effectiveness is exaggerated
- **Mitigation**:
  - Track actual TU efficiency data
  - A/B test tool impact (with vs. without)
  - Under-promise, over-deliver on multipliers

**Risk 6: Platform complexity overwhelms users**
- **Description**: TU system too complicated for non-technical founders
- **Mitigation**:
  - Simplified onboarding (auto-suggest TU allocations)
  - Templates for common team structures
  - Concierge service for first 3 months

---

## 10. SUCCESS SCENARIOS

### 10.1 Year 1 Target (Validation)

**Founders**: 50 active workspaces
- **Avg team size**: 3 people (1 exec + 1 apprentice each)
- **Avg TU spend**: £5K/month per workspace
- **Total TU volume**: £250K/month (£3M/year)
- **Platform revenue** (10% commission): £25K/month (£300K/year)

**Executives**: 100 active execs
- **Avg clients**: 2 startups each
- **Avg earnings**: £6K/month per exec
- **Total exec volume**: £600K/month
- **Platform revenue** (12% commission): £72K/month (£864K/year)

**Total Year 1 ARR**: ~£1.2M (£300K founders + £864K execs)

### 10.2 Year 3 Target (Scale)

**Founders**: 500 active workspaces
- **Avg team size**: 4 people (2 execs + 2 apprentices)
- **Avg TU spend**: £8K/month per workspace
- **Total TU volume**: £4M/month (£48M/year)
- **Platform revenue** (10% commission): £400K/month (£4.8M/year)

**Executives**: 1,000 active execs
- **Avg clients**: 3 startups each
- **Avg earnings**: £12K/month per exec
- **Total exec volume**: £12M/month
- **Platform revenue** (12% commission): £1.44M/month (£17.3M/year)

**Total Year 3 ARR**: ~£22M (£4.8M founders + £17.3M execs)

### 10.3 Exit Scenarios

**Strategic Acquisition:**
- **Potential acquirers**: LinkedIn (for professional marketplace), Workday (for workforce management), Notion (for team productivity)
- **Valuation**: 5-10x ARR = £110M-£220M at Year 3

**Private Equity/Growth Investment:**
- **Target**: Series A at Year 1 (£5M on £20M valuation)
- **Target**: Series B at Year 3 (£20M on £100M valuation)

**IPO:**
- **Unlikely before £50M ARR** (Year 5+)
- **Comparable**: Upwork IPO'd at £300M revenue

---

## 11. QUESTIONS FOR AI ANALYSIS

### 11.1 Pricing Strategy Questions

1. **What should the commission rate be?** (Founders: X%, Execs: Y%, Apprentices: Z%)
2. **Should there be a base subscription fee?** (e.g., £99/month + commission vs. pure commission)
3. **How to price AI tool access?** (Included in commission? Separate add-on? Per-tool pricing?)
4. **Should pricing be tiered?** (Starter/Growth/Enterprise vs. usage-based)
5. **What payment terms?** (Monthly subscription? Per-TU transaction? Upfront credits?)

### 11.2 Go-to-Market Questions

6. **Which customer segment to prioritize first?** (Founders, Execs, or Apprentices?)
7. **What geography to launch in?** (UK only? UK + EU? Global from day 1?)
8. **B2B or B2C positioning?** (Sell to founders as businesses or individuals?)
9. **Channel strategy?** (Direct sales, partnerships, self-serve signup?)
10. **Marketing message priority?** (Cost savings? Speed to market? Team flexibility?)

### 11.3 Product Strategy Questions

11. **What's the MVP feature set?** (TU tracking only? Or full supplier orchestration?)
12. **AI tool integration depth?** (Just tracking usage? Or embedding APIs?)
13. **Should there be a mobile app first?** (Or web-only to start?)
14. **How to handle payments?** (Escrow? Direct pay? Platform holds funds?)
15. **Expand beyond hardware startups?** (Service businesses? Agencies? Consultancies?)

### 11.4 Competitive Strategy Questions

16. **How to defend against Upwork/Fiverr cloning this?** (They have distribution)
17. **What if LinkedIn builds fractional executive marketplace?** (They have professionals)
18. **Can AI agents replace fractional executives in 2-3 years?** (Technology risk)
19. **What's the moat?** (Network effects? Data? Brand? Methodology?)
20. **Partner or compete with consulting firms?** (McKinsey, BCG could adopt this model)

---

## 12. DATA SOURCES & ASSUMPTIONS

### 12.1 Market Data
- UK startup ecosystem size: ~50,000 active startups (British Business Bank, 2024)
- Hardware startup percentage: ~5-10% = 2,500-5,000 potential customers
- Average startup failure rate: 90% within 3 years (mostly due to cash burn)

### 12.2 Pricing Benchmarks
- Fractional executive day rates: £800-£1,500/day (Flexa, Catalant data)
- Apprentice salaries: £18K-£25K/year (gov.uk apprenticeship standards)
- Platform commission rates: 5-20% (Upwork: 5-20%, Toptal: 15-30%)

### 12.3 Key Assumptions
1. **TU adoption**: Founders can adapt to 4-hour work blocks
2. **AI multipliers**: 2-10x is achievable with current AI tools (validated via case studies)
3. **Fractional model acceptance**: Executives willing to work part-time for multiple companies
4. **Apprentice value**: Junior talent can deliver value with executive oversight
5. **Platform necessity**: Teams can't coordinate effectively without CentaurOS

### 12.4 Uncertainty Factors
- **Regulation**: Apprenticeship legal requirements, contractor vs. employee classification
- **Economic**: Startup funding environment (currently depressed in 2024)
- **Technology**: AI capability acceleration (could automate more roles)
- **Competition**: Established players entering market (LinkedIn, Upwork)

---

## 13. APPENDIX: SYSTEM FEATURES INVENTORY

### 13.1 Core Platform Features (from codebase analysis)

**Mission Control (Home Tab)**
- Interactive stats bar (Tasks, Doing, Blocked, Team) - navigates to filtered views
- Focus Today section - AI-prioritized top 3 tasks
- Filing cabinet drawers - Team (left) and Timeline (right) side-by-side tabs

**Tasks Tab**
- Create tasks with TU estimates
- Assign to team members
- Track status (not-started, in-progress, blocked, completed)
- Filter by status, function, priority

**When Tab (Timeline)**
- Gantt chart view of tasks
- Task quick actions modal - status change, progress bar, reschedule, team preview
- Resource allocation visualization

**People Tab**
- Team member list with capacity bars
- TU allocation tracking (used vs. available)
- Role indicators (Founder, Executive, Apprentice)
- Person details modal with full profile

**Settings**
- Company profile editing
- Team member invitation with role selection
- Role change functionality (Apprentice → Executive → Founder)
- Role guide with clear descriptions

**Onboarding/Tutorial**
- CentaurOS explanation (centaur philosophy: human + AI)
- Role-specific walkthroughs (3 intro slides + role slides)
- TU capacity visualization
- Interactive demo mode

### 13.2 Advanced Features (implied but not fully implemented)

**AI Tools System**
- 5 slot categories per person (Think, Create, Verify, Execute, Ops)
- Usage tracking and ROI measurement
- Tool recommendation engine
- Effectiveness multiplier calculation

**Supplier Orchestration**
- Quote → PO → Production → QC → Acceptance workflow
- Financial tracking (Delivered, In Flight, At Risk)
- Multi-hop logistics support
- Evidence-based acceptance (POD, photos, reports)

**Analytics Dashboard**
- TU efficiency tracking (actual vs. estimated)
- Team performance metrics
- AI ROI measurement
- Optimization opportunities with auto-fix suggestions

**Marketplace Features** (implied, not visible in code)
- Executive/apprentice profiles and portfolios
- Matching algorithm
- Rating and review system
- Engagement management

---

## 14. CONCLUSION & NEXT STEPS

**CentaurOS represents a novel business model** combining:
1. Fractional work marketplaces (like Upwork, but with structure)
2. Team productivity platforms (like Monday, but with team supply)
3. AI augmentation (like GitHub Copilot, but for all functions)
4. Lean startup methodology (like Lean Canvas, but operationalized)

**The core insight**: Small teams + AI tools + structured roles can outperform large traditional teams at 1/5th the cost.

**For AI agents analyzing this document**, please provide recommendations on:
1. **Optimal pricing model** (subscription vs. commission vs. hybrid)
2. **Go-to-market priority** (which customer segment first?)
3. **Competitive positioning** (how to differentiate from Upwork, LinkedIn, consultancies)
4. **Feature prioritization** (what to build first for PMF?)
5. **Growth strategy** (how to achieve liquidity in the marketplace?)

**Key constraints to consider:**
- Early-stage funding environment (assume pre-seed, <£500K raised)
- Competitive threats (Upwork, LinkedIn, AI agents)
- Regulatory compliance (apprenticeship laws, contractor classification)
- Network effects (need critical mass of both sides)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-19
**Purpose**: Marketing & Pricing Strategy Input for AI Analysis
**Confidence Level**: 0.75 (based on codebase analysis, market research, and startup benchmarks)
