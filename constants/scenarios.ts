export interface Scenario {
  id: string;
  title: string;
  role: string;
  context: string;
  isProOnly: boolean;
  idealFramework: string;
}

export interface EvaluationResult {
  score: number;
  verdict: string;
  assertiveness: number;
  diplomacy: number;
  clarity: number;
  strengths: string;
  blindspot: string;
  executiveRewrite: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: '1',
    title: 'Saying "No" to Unrealistic Deadlines',
    role: 'Tech Lead / Engineering Manager',
    context:
      'Your manager asks you to deliver a 3-week feature sprint in 4 days without QA testing.',
    isProOnly: false,
    idealFramework:
      'Acknowledge urgency -> State concrete production risk -> Offer phased compromise.',
  },
  {
    id: '2',
    title: 'Delivering Critical Feedback Upward',
    role: 'Director of Engineering',
    context:
      'Sprint priorities change daily with no roadmap visibility, causing team burnout and tech debt.',
    isProOnly: true,
    idealFramework:
      'Objective metric framing -> Team velocity impact -> Structured roadmap cadence proposal.',
  },
  {
    id: '3',
    title: 'Pushing Back on Scope Creep',
    role: 'Principal Product Manager',
    context:
      'A partner team requests 3 out-of-scope microservices right before code freeze.',
    isProOnly: true,
    idealFramework:
      'Firm SLA boundary -> Impact on current release stability -> Defer to Phase 2 backlog.',
  },
  {
    id: '4',
    title: 'Defending Tech Debt Refactor',
    role: 'VP of Product',
    context:
      'Product wants to pause all tech-debt refactors for 6 months to ship quick surface features.',
    isProOnly: true,
    idealFramework:
      'Quantify latency/outage risk -> Connect refactor to feature velocity -> Propose 80/20 split.',
  },
];

export const analyzeExecutiveResponse = (
  text: string,
  scenario: Scenario
): EvaluationResult => {
  void scenario;
  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length < 8) {
    return {
      score: 38,
      verdict: 'Passive / Deficient Context',
      assertiveness: 30,
      diplomacy: 45,
      clarity: 40,
      strengths: 'Acknowledged the request promptly.',
      blindspot: 'Lacks rationale, risk assessment, and operational alternative.',
      executiveRewrite:
        'I understand the urgency behind this timeline. However, delivering without QA introduces critical production vulnerability. I propose shipping the core endpoint by Friday and running automated regression over the weekend for full release next Tuesday.',
    };
  }

  const hasCompromise =
    /suggest|propose|alternative|timeline|phase|trade-off|split|rollout/i.test(clean);
  const hasBoundary =
    /cannot|unrealistic|risk|quality|blocker|stability|uptime|debt|compromise/i.test(
      clean
    );
  const hasData =
    /qa|test|bug|metric|latency|hours|velocity|production|customer/i.test(clean);

  let assertiveness = 60 + (hasBoundary ? 28 : 0);
  let diplomacy = 55 + (hasCompromise ? 32 : 5);
  let clarity = 50 + (hasData ? 35 : 15);

  assertiveness = Math.min(assertiveness, 98);
  diplomacy = Math.min(diplomacy, 96);
  clarity = Math.min(clarity, 95);

  const totalScore = Math.round(
    assertiveness * 0.4 + diplomacy * 0.3 + clarity * 0.3
  );

  let verdict = 'Moderate Alignment';
  if (totalScore >= 88) verdict = 'Executive Caliber';
  else if (totalScore < 65) verdict = 'Reactive / High Friction';

  return {
    score: totalScore,
    verdict,
    assertiveness,
    diplomacy,
    clarity,
    strengths: hasBoundary
      ? 'Clear, unambiguous professional boundaries established early.'
      : 'Maintained polite and approachable tone.',
    blindspot: !hasCompromise
      ? 'Did not present a constructive alternative timeline, putting burden back on management.'
      : 'Ensure concrete metrics (days, error rates) back up your proposed phased timeline.',
    executiveRewrite: `While I recognize the need to accelerate this delivery, bypassing our QA suite introduces an unacceptable regression risk for production. To meet our core objective safely, I propose deploying the core API by Thursday, followed by targeted integration testing, ensuring stable release by early next week.`,
  };
};
