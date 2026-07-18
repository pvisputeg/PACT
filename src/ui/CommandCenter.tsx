import type { ComponentType } from 'react';
import {
  Activity, ArrowRight, BadgeCheck, BookOpenCheck, Boxes, Building2, ChevronRight,
  CircleAlert, CircleDollarSign, Clock3, Fingerprint, GitBranch, History, LayoutGrid,
  Leaf, LockKeyhole, Network, PackageCheck, Route, SearchCheck, Settings, ShieldCheck,
  Target, TrendingUp, Users,
} from 'lucide-react';

type CommandCenterProps = {
  onOpenOutcome: () => void;
  onOpenLedger: () => void;
};

type Outcome = {
  title: string;
  domain: string;
  status: string;
  valueLabel: string;
  value: string;
  owner: string;
  stage: string;
  icon: ComponentType<{ size?: number }>;
  tone: 'cyan' | 'amber' | 'violet' | 'emerald';
  featured?: boolean;
};

const outcomes: Outcome[] = [
  {
    title: 'Strategic Delivery Recovery', domain: 'Supply Chain', status: 'Investigation',
    valueLabel: 'Value at risk', value: '$1.24M', owner: 'Supply Chain COO', stage: 'Understand',
    icon: Route, tone: 'cyan', featured: true,
  },
  {
    title: 'Supplier Cost Optimization', domain: 'Procurement', status: 'Executing',
    valueLabel: 'Savings target', value: '$3.8M', owner: 'Chief Procurement Officer', stage: 'Execute',
    icon: PackageCheck, tone: 'emerald',
  },
  {
    title: 'Manufacturing Throughput', domain: 'Operations', status: 'Planning',
    valueLabel: 'Capacity opportunity', value: '$2.1M', owner: 'VP Manufacturing', stage: 'Decide',
    icon: Boxes, tone: 'violet',
  },
  {
    title: 'Customer Churn Prevention', domain: 'Commercial', status: 'Awaiting approval',
    valueLabel: 'Revenue protected', value: '$7.1M', owner: 'Chief Customer Officer', stage: 'Govern',
    icon: Users, tone: 'amber',
  },
  {
    title: 'Working Capital Improvement', domain: 'Finance', status: 'Monitoring',
    valueLabel: 'Cash release target', value: '$4.6M', owner: 'Group CFO', stage: 'Measure',
    icon: CircleDollarSign, tone: 'cyan',
  },
  {
    title: 'ESG Compliance Readiness', domain: 'Enterprise Risk', status: 'Completed',
    valueLabel: 'Control coverage', value: '100%', owner: 'Chief Sustainability Officer', stage: 'Learn',
    icon: Leaf, tone: 'emerald',
  },
];

const navigation = [
  { label: 'Command Center', icon: LayoutGrid, target: 'command-overview' },
  { label: 'Outcomes', icon: Target, target: 'outcome-portfolio' },
  { label: 'Investigations', icon: SearchCheck, target: 'outcome-portfolio' },
  { label: 'Approvals', icon: LockKeyhole, target: 'executive-attention' },
  { label: 'Action Graph', icon: GitBranch, target: 'outcome-portfolio' },
  { label: 'Outcome Ledger', icon: History, action: 'ledger' },
  { label: 'Replay', icon: BookOpenCheck, target: 'organizational-learning' },
  { label: 'Settings', icon: Settings, target: 'platform-status' },
] as const;

const lifecycle = ['Signal', 'Proof', 'Decision', 'Approval', 'Execution', 'Observation', 'Outcome', 'Learning'];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function CommandCenter({ onOpenOutcome, onOpenLedger }: CommandCenterProps) {
  return <div className="command-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <header className="topbar command-topbar">
      <div className="brand-block">
        <div className="brand-mark"><span/><span/><span/></div>
        <div><strong>PACT</strong><small>Proof · Action · Coordination · Tracking</small></div>
      </div>
      <div className="command-context"><Building2 size={15}/><span>Enterprise Outcome Command Center</span></div>
      <div className="top-actions">
        <div className="portfolio-period"><Clock3 size={14}/><span>FY26 · SYNTHETIC PORTFOLIO</span></div>
        <div className="live-pill"><i/> GOVERNANCE ONLINE</div>
      </div>
    </header>

    <aside className="command-nav" aria-label="Enterprise outcome navigation">
      <div className="nav-context"><span>ENTERPRISE CONTROL PLANE</span><strong>Northstar Group</strong><small>Global operations</small></div>
      <nav>
        {navigation.map(({ label, icon: Icon, ...item }, index) => <button
          key={label}
          className={index === 0 ? 'active' : ''}
          onClick={() => 'action' in item ? onOpenLedger() : scrollToSection(item.target)}
        ><Icon size={16}/><span>{label}</span>{label === 'Approvals' && <b>5</b>}</button>)}
      </nav>
      <div className="nav-authority"><ShieldCheck size={16}/><div><span>Authority model</span><strong>Human-governed</strong><small>All material commitments locked</small></div></div>
    </aside>

    <main className="command-workspace" id="command-overview">
      <section className="command-hero">
        <div>
          <span className="page-eyebrow">PACT · ENTERPRISE OUTCOME OPERATING SYSTEM</span>
          <h1>Enterprise Outcome<br/>Command Center</h1>
          <strong>Business doesn’t execute projects. Business executes measurable outcomes.</strong>
          <p>PACT verifies business signals, coordinates AI and human work, enforces authority, and proves measurable results across the enterprise.</p>
        </div>
        <div className="command-loop" aria-label="PACT governed outcome lifecycle">
          <span>GOVERNED OUTCOME LOOP</span>
          <div>{lifecycle.map((stage, index) => <span key={stage}><b>{stage}</b>{index < lifecycle.length - 1 && <ChevronRight size={12}/>}</span>)}</div>
          <small>One operating model · Any measurable business outcome</small>
        </div>
      </section>

      <section className="enterprise-snapshot panel" aria-labelledby="snapshot-title">
        <div className="section-heading"><div><span>ENTERPRISE SNAPSHOT</span><h2 id="snapshot-title">Outcomes that matter now</h2></div><small>SAFE ENTERPRISE TWIN · 14 FEEDS SIMULATED</small></div>
        <div className="snapshot-grid">
          <div><Target size={16}/><strong>8</strong><span>Active outcomes</span></div>
          <div><CircleDollarSign size={16}/><strong>$11.8M</strong><span>Business value at stake</span></div>
          <div><Users size={16}/><strong>27</strong><span>Teams coordinating</span></div>
          <div><GitBranch size={16}/><strong>132</strong><span>Active commitments</span></div>
          <div className="attention"><LockKeyhole size={16}/><strong>5</strong><span>Awaiting approval</span></div>
          <div className="healthy"><ShieldCheck size={16}/><strong>96%</strong><span>Governance compliance</span></div>
        </div>
      </section>

      <section className="portfolio-section" id="outcome-portfolio">
        <div className="section-heading"><div><span>OUTCOME PORTFOLIO</span><h2>Governed business outcomes</h2></div><p>Select an outcome to enter its evidence, decision, execution, and measurement room.</p></div>
        <div className="outcome-grid">
          {outcomes.map((outcome) => {
            const Icon = outcome.icon;
            const content = <>
              <div className="outcome-card-top"><div className={`outcome-icon tone-${outcome.tone}`}><Icon size={18}/></div><span className={`outcome-status status-${outcome.tone}`}><i/>{outcome.status}</span></div>
              <span className="outcome-domain">{outcome.domain}</span>
              <h3>{outcome.title}</h3>
              <div className="outcome-value"><span>{outcome.valueLabel}</span><strong>{outcome.value}</strong></div>
              <div className="outcome-meta"><div><span>OWNER</span><strong>{outcome.owner}</strong></div><div><span>CURRENT STAGE</span><strong>{outcome.stage}</strong></div></div>
              <div className="outcome-card-footer"><span>{outcome.featured ? 'Implemented synthetic contract' : 'Illustrative outcome template'}</span>{outcome.featured ? <strong>Enter Outcome Room <ArrowRight size={14}/></strong> : <strong>Not executed</strong>}</div>
            </>;
            return outcome.featured
              ? <button className="outcome-card outcome-card-featured panel" key={outcome.title} onClick={onOpenOutcome}>{content}</button>
              : <article className="outcome-card panel" key={outcome.title}>{content}</article>;
          })}
        </div>
      </section>

      <section className="learning-section panel" id="organizational-learning">
        <div className="section-heading"><div><span>RECENT ORGANIZATIONAL LEARNING</span><h2>Completed outcomes strengthen the next decision</h2></div><BookOpenCheck size={20}/></div>
        <div className="learning-grid">
          <div><span>OUTCOME</span><strong>Inventory obsolescence reduction</strong><small>Operations · closed 6 days ago</small></div>
          <div><span>PROTECTED VALUE</span><strong>$2.4M</strong><small>CALCULATED · finance validated</small></div>
          <div><span>VARIANCE</span><strong>+3.2%</strong><small>Against approved contract</small></div>
          <div><span>LESSON RETAINED</span><strong>Supplier confirmation is the leading recovery indicator.</strong><small>Added to enterprise replay</small></div>
        </div>
      </section>
    </main>

    <aside className="command-intelligence" aria-label="Executive portfolio intelligence">
      <section id="executive-attention">
        <div className="rail-section-heading"><CircleAlert size={16}/><span>NEEDS EXECUTIVE ATTENTION</span></div>
        <div className="attention-list">
          <button onClick={() => scrollToSection('outcome-portfolio')}><strong>5</strong><span>approvals waiting</span><ChevronRight size={14}/></button>
          <button onClick={() => scrollToSection('outcome-portfolio')}><strong>2</strong><span>outcomes behind plan</span><ChevronRight size={14}/></button>
          <button onClick={() => scrollToSection('platform-status')}><strong>1</strong><span>governance exception</span><ChevronRight size={14}/></button>
          <button onClick={() => scrollToSection('organizational-learning')}><strong>3</strong><span>outcomes completed this month</span><ChevronRight size={14}/></button>
        </div>
      </section>

      <section className="portfolio-health">
        <div className="rail-section-heading"><Activity size={16}/><span>OUTCOME HEALTH</span></div>
        {[['Investigation', 2, 25], ['Planning', 1, 13], ['Executing', 2, 25], ['Measuring', 2, 25], ['Completed', 1, 12]].map(([label, count, width]) => <div className="health-row" key={label}>
          <div><span>{label}</span><strong>{count}</strong></div><i><b style={{ width: `${width}%` }}/></i>
        </div>)}
      </section>

      <section className="platform-status" id="platform-status">
        <div className="rail-section-heading"><Network size={16}/><span>PLATFORM STATUS</span></div>
        <div><Fingerprint size={15}/><span>Evidence contracts</span><strong>Verified</strong></div>
        <div><LockKeyhole size={15}/><span>Authority gates</span><strong>Enforced</strong></div>
        <div><BadgeCheck size={15}/><span>Outcome ledger</span><strong>Immutable</strong></div>
        <div><TrendingUp size={15}/><span>Learning replay</span><strong>Online</strong></div>
      </section>

      <div className="portfolio-principle"><Activity size={17}/><div><span>OPERATING PRINCIPLE</span><strong>Every signal must end in proof—or organizational learning.</strong></div></div>
    </aside>
  </div>;
}
