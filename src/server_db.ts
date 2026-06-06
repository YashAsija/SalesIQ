import fs from 'fs';
import path from 'path';
import { DatabaseState, Buyer, Memory, Message } from './types.js';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_FILE = path.join(DATA_DIR, 'salesiq_db.json');

const INITIAL_BUYERS: Buyer[] = [
  {
    id: 'sarah_chen_acme',
    name: 'Sarah Chen',
    company: 'Acme Corp',
    role: 'VP of Engineering',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 'marcus_vance_globex',
    name: 'Marcus Vance',
    company: 'Globex Corp',
    role: 'Head of Infrastructure',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  }
];

const INITIAL_MEMORIES: Memory[] = [
  // --- WORLD FACTS (Sarah Chen / Acme Corp) ---
  {
    id: 'wf_1',
    buyer_id: 'sarah_chen_acme',
    type: 'world_facts',
    content: 'Sarah Chen is VP of Engineering at Acme Corp, leading a team of 200 software engineers.',
    confidence: 1.0,
    timestamp: '2026-05-10T14:30:00Z',
    source: 'Discovery Call #1'
  },
  {
    id: 'wf_2',
    buyer_id: 'sarah_chen_acme',
    type: 'world_facts',
    content: 'Acme Corp manages microservices deployed on AWS EKS (Kubernetes) and uses Spinnaker for CI/CD pipelines.',
    confidence: 0.95,
    timestamp: '2026-05-14T11:00:00Z',
    source: 'Technical Review Call'
  },
  {
    id: 'wf_3',
    buyer_id: 'sarah_chen_acme',
    type: 'world_facts',
    content: 'Mike Torres is the CFO at Acme Corp and must sign off on any commercial purchase.',
    confidence: 1.0,
    timestamp: '2026-05-18T16:15:00Z',
    source: 'Commercial Framework Meeting'
  },
  {
    id: 'wf_4',
    buyer_id: 'sarah_chen_acme',
    type: 'world_facts',
    content: 'Mike Torres will reject any subscription pricing agreement over $100K/year unless full board approval is secured.',
    confidence: 0.95,
    timestamp: '2026-05-18T16:30:00Z',
    source: 'Commercial Framework Meeting'
  },
  {
    id: 'wf_5',
    buyer_id: 'sarah_chen_acme',
    type: 'world_facts',
    content: 'Their legal counsel demands concrete compliance proof that user data resides strictly within European Union borders.',
    confidence: 1.0,
    timestamp: '2026-05-28T09:45:00Z',
    source: 'Legal & Compliance Session'
  },

  // --- EXPERIENCES (Sarah Chen / Acme Corp) ---
  {
    id: 'exp_1',
    buyer_id: 'sarah_chen_acme',
    type: 'experiences',
    content: 'Discovery Call (May 10): Sarah expressed frustration over deployment pipeline bottlenecks. Very excited about our automated canary rollback and zero-downtime deployment story.',
    confidence: 0.9,
    timestamp: '2026-05-10T15:00:00Z',
    source: 'Discovery Call #1 Debrief'
  },
  {
    id: 'exp_2',
    buyer_id: 'sarah_chen_acme',
    type: 'experiences',
    content: 'Technical Demo (May 14): Sarah brought 3 Kubernetes infrastructure engineers. Demonstrated auto-scaling clusters. Engineers asked deep questions on rollback safety and rollback trigger isolated configurations.',
    confidence: 0.95,
    timestamp: '2026-05-14T12:30:00Z',
    source: 'Technical Review Debrief'
  },
  {
    id: 'exp_3',
    buyer_id: 'sarah_chen_acme',
    type: 'experiences',
    content: 'CFO Pricing Call (May 18): Presented list proposal of $150K. CFO Mike Torres explicitly objected to the price, stating SaaS budget limits. Asked if contract can be structured as separate Base vs. Implementation Service.',
    confidence: 1.0,
    timestamp: '2026-05-18T17:00:00Z',
    source: 'Commercial Framework Debrief'
  },
  {
    id: 'exp_4',
    buyer_id: 'sarah_chen_acme',
    type: 'experiences',
    content: 'Competitor Mention (May 24): Sarah shared they are evaluating Competitor X, which is quoted 20% cheaper. She admitted Competitor X is technically shallow but is appealing to finance due to the low upfront pricing.',
    confidence: 0.9,
    timestamp: '2026-05-24T14:40:00Z',
    source: 'Competitor Update Debrief'
  },
  {
    id: 'exp_5',
    buyer_id: 'sarah_chen_acme',
    type: 'experiences',
    content: 'Compliance Flag (May 28): Acme legal team warned they will veto the deal if European customer logs fly outside Germany/Ireland. Requested data isolation certification documents.',
    confidence: 0.95,
    timestamp: '2026-05-28T10:15:00Z',
    source: 'Legal & Compliance Debrief'
  },
  {
    id: 'exp_6',
    buyer_id: 'sarah_chen_acme',
    type: 'experiences',
    content: 'POC Finished (Jun 2): Completed successful 3-week sandbox execution. Deploy cycle times were reduced from 4 hours to just 22 minutes. Engineering team is extremely bought in and active on slack.',
    confidence: 1.0,
    timestamp: '2026-06-02T16:00:00Z',
    source: 'POC Evaluation Debrief'
  },

  // --- MENTAL MODELS (Sarah Chen / Acme Corp) ---
  {
    id: 'mm_1',
    buyer_id: 'sarah_chen_acme',
    type: 'mental_models',
    content: 'Acme\'s purchasing process is heavily CFO-gated. Proceeding with a split contract proposal ($95k Base License + $55k implementation setup) will avoid the $100k board approval restriction and close the deal 4 weeks faster.',
    confidence: 0.9,
    timestamp: '2026-05-20T10:00:00Z',
    source: 'System Reflection Loop'
  },
  {
    id: 'mm_2',
    buyer_id: 'sarah_chen_acme',
    type: 'mental_models',
    content: 'Sarah is a strong internal advocate; technical superiority (auto-scaling canary reliability, the 4-hour to 22-min speed validation) is key to neutralizing Competitor X\'s 20% discount appeal.',
    confidence: 0.85,
    timestamp: '2026-05-25T11:20:00Z',
    source: 'System Reflection Loop'
  },
  {
    id: 'mm_3',
    buyer_id: 'sarah_chen_acme',
    type: 'mental_models',
    content: 'Legal clearance is currently the single highest risk path for this deal. We must secure security compliance proof of strict European data sovereignty immediately to keep closing on schedule.',
    confidence: 0.95,
    timestamp: '2026-05-29T15:30:00Z',
    source: 'System Reflection Loop'
  }
];

const INITIAL_CHATS: Record<string, Message[]> = {
  sarah_chen_acme: [
    {
      role: 'system',
      content: 'You are SalesIQ, an AI sales intelligence agent. You have perfect memory of every interaction with this buyer. Always reference specific past interactions.'
    },
    {
      role: 'user',
      content: 'Remind me why Acme Corp might object to our initial deployment plans.'
    },
    {
      role: 'assistant',
      content: 'Based on your direct interactions with Acme Corp:\n\n1. **Board Gating Threshold**: CFO Mike Torres explicitly objected to any proposal exceeding $100K/year without active board review (which takes 4+ weeks). He requested exploring a separated fee structure (e.g., $95K Software Base plus separate Implementation services) to circumvent this bottleneck.\n2. **European Data Sovereignty**: During legal review on May 28, their counsel flagged that user logs and deployment configuration files must remain strictly within European Union borders (Germany/Ireland) under GDPR scope. Doing so is critical; legal will veto the pipeline plan if European data confinement is not certified.'
    }
  ]
};

export function getDatabase(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading DB, resetting to initial', e);
    }
  }

  const state: DatabaseState = {
    buyers: INITIAL_BUYERS,
    memories: INITIAL_MEMORIES,
    chatHistory: INITIAL_CHATS
  };
  saveDatabase(state);
  return state;
}

export function saveDatabase(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}
