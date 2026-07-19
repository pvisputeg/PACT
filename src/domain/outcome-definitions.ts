export type OutcomeLifecycleStage =
  | 'Understand'
  | 'Decide'
  | 'Govern'
  | 'Execute'
  | 'Measure'
  | 'Learn';

export type OutcomeDefinition = {
  id: string;
  title: string;
  domain: string;
  status: string;
  valueLabel: string;
  value: string;
  owner: string;
  stage: OutcomeLifecycleStage;
  nextDecision: string;
  exception?: string;
  attention: 'critical' | 'watch' | 'healthy';
  implementation: 'end-to-end synthetic workflow' | 'illustrative typed contract';
  contract: {
    objective: string;
    metric: string;
    target: string;
    deadline: string;
    constraints: string[];
    decisionAuthority: string;
  };
};

export const OUTCOME_DEFINITIONS: readonly OutcomeDefinition[] = [
  {
    id: 'northstar-material-recovery',
    title: scenario.outcomeContract.name,
    domain: scenario.outcomeContract.domain,
    status: 'Investigation',
    valueLabel: 'Value at risk',
    value: formatCompactMoney(scenario.outcomeContract.baselineExposedRevenue),
    owner: scenario.outcomeContract.authorities.humanApprover,
    stage: 'Understand',
    nextDecision: `Verify whether the ${scenario.material.name} disruption is decision-ready`,
    exception: `${scenario.impact.ordersAtRisk} orders and ${scenario.impact.strategicCustomers} strategic customers exposed`,
    attention: 'critical',
    implementation: 'end-to-end synthetic workflow',
    contract: {
      objective: scenario.outcomeContract.question,
      metric: 'Committed revenue protected',
      target: `At least ${scenario.outcomeContract.targetProtectedRevenuePercent.toFixed(1)}%`,
      deadline: `${scenario.outcomeContract.deadlineDays} days`,
      constraints: [...scenario.outcomeContract.constraints],
      decisionAuthority: scenario.outcomeContract.authorities.humanApprover,
    },
  },
  {
    id: 'supplier-cost-optimization',
    title: 'Supplier Cost Optimization',
    domain: 'Procurement',
    status: 'Executing',
    valueLabel: 'Savings target',
    value: '$3.8M',
    owner: 'Chief Procurement Officer',
    stage: 'Execute',
    nextDecision: 'Release the next supplier wave',
    exception: 'Two suppliers require resilience review',
    attention: 'watch',
    implementation: 'illustrative typed contract',
    contract: {
      objective: 'Capture addressable supplier savings while preserving supply resilience and product quality.',
      metric: 'Annualized validated supplier savings',
      target: 'At least $3.8M',
      deadline: '90 days',
      constraints: ['Do not increase single-source exposure', 'Supplier quality PPM must not worsen', 'Honor contracted service commitments'],
      decisionAuthority: 'Chief Procurement Officer',
    },
  },
  {
    id: 'manufacturing-throughput',
    title: 'Manufacturing Throughput',
    domain: 'Operations',
    status: 'Planning',
    valueLabel: 'Capacity opportunity',
    value: '$2.1M',
    owner: 'VP Manufacturing',
    stage: 'Decide',
    nextDecision: 'Select the bounded-line intervention',
    exception: 'Maintenance window expires in 8 days',
    attention: 'watch',
    implementation: 'illustrative typed contract',
    contract: {
      objective: 'Increase constrained-line output without creating safety, scrap, or maintenance debt.',
      metric: 'Good units per constrained hour',
      target: 'Increase by at least 8.5%',
      deadline: '60 days',
      constraints: ['No safety-control bypass', 'Scrap rate cannot exceed baseline', 'Planned maintenance remains protected'],
      decisionAuthority: 'VP Manufacturing',
    },
  },
  {
    id: 'customer-churn-prevention',
    title: 'Customer Churn Prevention',
    domain: 'Commercial',
    status: 'Awaiting approval',
    valueLabel: 'Revenue protected',
    value: '$7.1M',
    owner: 'Chief Customer Officer',
    stage: 'Govern',
    nextDecision: 'Authorize the retention Action Contract',
    exception: 'Commercial concession authority unresolved',
    attention: 'critical',
    implementation: 'illustrative typed contract',
    contract: {
      objective: 'Retain strategic accounts through evidence-backed recovery commitments.',
      metric: 'Strategic-account recurring revenue retained',
      target: 'Protect at least $7.1M',
      deadline: '45 days',
      constraints: ['No unapproved commercial concessions', 'Customer communication remains human-authorized', 'Commitments must have accountable owners'],
      decisionAuthority: 'Chief Customer Officer',
    },
  },
  {
    id: 'working-capital-improvement',
    title: 'Working Capital Improvement',
    domain: 'Finance',
    status: 'Monitoring',
    valueLabel: 'Cash release target',
    value: '$4.6M',
    owner: 'Group CFO',
    stage: 'Measure',
    nextDecision: 'Accept the Day-30 cash observation',
    attention: 'healthy',
    implementation: 'illustrative typed contract',
    contract: {
      objective: 'Release cash from inventory and receivables without degrading service or supplier continuity.',
      metric: 'Validated cash released',
      target: 'At least $4.6M',
      deadline: '120 days',
      constraints: ['Service-level targets remain intact', 'No overdue critical-supplier payments', 'Finance validates realized cash'],
      decisionAuthority: 'Group CFO',
    },
  },
  {
    id: 'esg-compliance-readiness',
    title: 'ESG Compliance Readiness',
    domain: 'Enterprise Risk',
    status: 'Completed',
    valueLabel: 'Control coverage',
    value: '100%',
    owner: 'Chief Sustainability Officer',
    stage: 'Learn',
    nextDecision: 'Retain the assurance pattern',
    attention: 'healthy',
    implementation: 'illustrative typed contract',
    contract: {
      objective: 'Close material evidence gaps before the reporting assurance window.',
      metric: 'Required evidence controls complete',
      target: '100% validated coverage',
      deadline: 'September 30, 2026',
      constraints: ['Evidence must retain source lineage', 'Control owners attest completion', 'Exceptions remain visible to assurance'],
      decisionAuthority: 'Chief Sustainability Officer',
    },
  },
] as const;
import { scenario } from './engine';
import { formatCompactMoney } from './signal-registry';
