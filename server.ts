import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { getDatabase, saveDatabase } from './src/server_db.js';
import { Memory, Message, DebriefData } from './src/types.js';

dotenv.config();

// Lazily initialize Gemini API client to ensure server doesn't crash on boot if environment variable is absent
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Falling back to mock responses.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Check if Gemini API is configured
function isGeminiEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

const app = express();
app.use(express.json());

const PORT = 3000;

// ----- API ROUTES GENERAL -----

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SalesIQ', gemini_connected: isGeminiEnabled() });
});

// GET list of buyers
app.get('/api/buyers', (req, res) => {
  const db = getDatabase();
  res.json(db.buyers);
});

// POST to create a new buyer (focus account)
app.post('/api/buyers', (req, res) => {
  const { name, company, role } = req.body;
  
  if (!name || !company || !role) {
    return res.status(400).json({ error: 'Name, company, and role are required' });
  }

  const db = getDatabase();
  
  // Format clean human-like ID
  const sanitizedName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
  const sanitizedCompany = company.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
  const baseId = `${sanitizedName}_${sanitizedCompany}`;
  let finalId = baseId;
  let counter = 1;
  while (db.buyers.some(b => b.id === finalId)) {
    finalId = `${baseId}_${counter}`;
    counter++;
  }

  // Pre-selected Unsplash professional avatars for visual fidelity
  const AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face'
  ];
  const avatar = AVATARS[db.buyers.length % AVATARS.length];

  const newBuyer = {
    id: finalId,
    name: name.trim(),
    company: company.trim(),
    role: role.trim(),
    avatar
  };

  db.buyers.push(newBuyer);
  
  // Seed initial system memory for this buyer so they have some initial state
  const initialMemory: Memory = {
    id: `wf_init_${Date.now()}`,
    buyer_id: finalId,
    type: 'world_facts',
    content: `${name} is the ${role} at ${company}. Their account was newly registered to the SalesIQ high-margin focus tracker.`,
    confidence: 1.0,
    timestamp: new Date().toISOString(),
    source: 'Focus Account Creation'
  };
  db.memories.push(initialMemory);

  // Initialize chat history
  db.chatHistory[finalId] = [
    {
      role: 'system',
      content: 'You are SalesIQ, an AI sales intelligence agent. You have perfect memory of every interaction with this buyer. Always reference specific past interactions.'
    }
  ];

  saveDatabase(db);
  res.status(201).json(newBuyer);
});

// GET all memories for a buyer
app.get('/api/memories/:buyer_id', (req, res) => {
  const { buyer_id } = req.params;
  const db = getDatabase();
  const memories = db.memories.filter(m => m.buyer_id === buyer_id);
  
  res.json({
    world_facts: memories.filter(m => m.type === 'world_facts'),
    experiences: memories.filter(m => m.type === 'experiences'),
    mental_models: memories.filter(m => m.type === 'mental_models')
  });
});

// CREATE manual memory
app.post('/api/memories/:buyer_id', (req, res) => {
  const { buyer_id } = req.params;
  const { type, content, confidence, source } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  const db = getDatabase();
  const newMemory: Memory = {
    id: `man_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    buyer_id,
    type: type || 'world_facts',
    content,
    confidence: confidence !== undefined ? parseFloat(confidence) : 1.0,
    timestamp: new Date().toISOString(),
    source: source || 'User Ad-hoc Input'
  };

  db.memories.push(newMemory);
  saveDatabase(db);
  res.status(201).json(newMemory);
});

// UPDATE memory
app.put('/api/memories/:buyer_id/:memory_id', (req, res) => {
  const { buyer_id, memory_id } = req.params;
  const { content, confidence, type } = req.body;

  const db = getDatabase();
  const index = db.memories.findIndex(m => m.id === memory_id && m.buyer_id === buyer_id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Memory not found' });
  }

  if (content !== undefined) db.memories[index].content = content;
  if (confidence !== undefined) db.memories[index].confidence = parseFloat(confidence);
  if (type !== undefined) db.memories[index].type = type;
  db.memories[index].timestamp = new Date().toISOString();

  saveDatabase(db);
  res.json(db.memories[index]);
});

// DELETE memory
app.delete('/api/memories/:buyer_id/:memory_id', (req, res) => {
  const { buyer_id, memory_id } = req.params;
  const db = getDatabase();
  const originalLength = db.memories.length;
  
  db.memories = db.memories.filter(m => !(m.id === memory_id && m.buyer_id === buyer_id));
  
  if (db.memories.length === originalLength) {
    return res.status(404).json({ error: 'Memory not found' });
  }

  saveDatabase(db);
  res.json({ success: true, deleted_id: memory_id });
});

// POST /api/suggest-tags - AI-powered tag suggestions
app.post('/api/suggest-tags', async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    let suggestedTags: string[] = [];

    if (isGeminiEnabled()) {
      const aiClient = getGemini();
      const prompt = `Analyze the following B2B sales memory statement and propose 3 to 5 ultra-relevant, professional, lowercase categorization tags (keywords like: budget, pricing, security, GDPR, legal, competitor, feature-request, contract, stakeholder, timeline, poc).
      
Memory: "${content}"

Your response must be a JSON array of strings containing the tags, such as: ["budget", "pricing", "decision-maker"].
Do not output other words or markdown wrappers.`;

      const result = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });
      
      const parsed = JSON.parse((result.text || "").trim());
      if (Array.isArray(parsed)) {
        suggestedTags = parsed.map((t: any) => String(t).toLowerCase().trim().replace(/[^a-z0-9_-]+/g, ''));
      }
    } else {
      // Offline fallback tags based on simple substring scanning
      const text = content.toLowerCase();
      const candidates = [
        { word: 'budget', tag: 'budget' },
        { word: 'price', tag: 'pricing' },
        { word: 'pricing', tag: 'pricing' },
        { word: 'cost', tag: 'pricing' },
        { word: 'objection', tag: 'objection' },
        { word: 'gdpr', tag: 'compliance' },
        { word: 'compliance', tag: 'compliance' },
        { word: 'security', tag: 'security' },
        { word: 'legal', tag: 'legal' },
        { word: 'contract', tag: 'contract' },
        { word: 'competitor', tag: 'competitor' },
        { word: 'against', tag: 'competitor' },
        { word: 'feature', tag: 'product' },
        { word: 'kubernetes', tag: 'technical' },
        { word: 'cfo', tag: 'stakeholder' },
        { word: 'board', tag: 'stakeholder' },
        { word: 'mike', tag: 'stakeholder' },
        { word: 'torres', tag: 'stakeholder' },
        { word: 'poc', tag: 'poc' },
        { word: 'sandbox', tag: 'poc' },
        { word: 'timeline', tag: 'timeline' }
      ];
      const matchTags = new Set<string>();
      candidates.forEach(c => {
        if (text.includes(c.word)) matchTags.add(c.tag);
      });
      if (matchTags.size === 0) {
        matchTags.add('hindsight');
        matchTags.add('sales-iq');
      }
      suggestedTags = Array.from(matchTags);
    }

    res.json({ tags: suggestedTags });
  } catch (error: any) {
    console.error('Failed to suggest tags:', error);
    res.json({ tags: ['sales-iq', 'analysis-needed'] });
  }
});

// ----- CORE AI ENDPOINTS -----

// POST /api/chat - Sends buyer query and generates side-by-side responsive before/after comparison
app.post('/api/chat', async (req, res) => {
  const { message, buyer_id, conversation_history = [], mode = 'after' } = req.body;
  if (!message || !buyer_id) {
    return res.status(400).json({ error: 'Message and buyer_id are required' });
  }

  const db = getDatabase();
  const memories = db.memories.filter(m => m.buyer_id === buyer_id);
  
  const formattedHistory = conversation_history.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));

  try {
    // 1. Generate WITH Memory Response (SalesIQ After State)
    const worldFacts = memories.filter(m => m.type === 'world_facts').map(m => `- ${m.content} (Confidence: ${Math.round(m.confidence * 100)}%)`).join('\n');
    const experiences = memories.filter(m => m.type === 'experiences').map(m => `- ${m.content} (Source: ${m.source})`).join('\n');
    const mentalModels = memories.filter(m => m.type === 'mental_models').map(m => `- ${m.content} (Belief weight: ${Math.round(m.confidence * 100)}%)`).join('\n');

    const withMemorySystemInstruction = `You are SalesIQ, an elite enterprise sales coaching agent with flawless photographic memory of client interactions.
Analyze the user's tactical query and provide highly specific, actionable sales preparation recommendations.

Your current client profile context:
[WORLD FACTS / STATIC CONTRACT RULES]
${worldFacts || 'None currently stored.'}

[PAST EXPERIENCES & INTERACTION HISTORY]
${experiences || 'No interactions logged yet.'}

[EVOLVED MENTAL MODELS & BELIEFS ABOUT BUYER]
${mentalModels || 'No synthesized models yet.'}

RULES:
1. Ground your advice deeply in these logged memories. Cite specific dates, CFO objections, competitor mentions, or security flags when relevant to justify your response.
2. Be incredibly tactical (e.g. recommend split pricing, suggest bringing engineers to talks, or point out legal audit blocks). Avoid generic fluffy statements.
3. Call out specific past objections (like Mike Torres's $100K board threshold or GDPR German residency issues) and offer exact counters.`;

    let afterResponseText = "";

    if (isGeminiEnabled()) {
      const aiClient = getGemini();
      const withMemoryResult = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: withMemorySystemInstruction,
          temperature: 0.2
        }
      });
      afterResponseText = withMemoryResult.text || "No response generated.";
    } else {
      // Mock Response for SalesIQ with full Memory Context
      afterResponseText = `[SalesIQ Memory Connected Mode] Here is our tactical plan regarding Acme Corp:\n\n1. **Avoid CFO Board Trap**: Since CFO Mike Torres has a firm **$100K board threshold**, we must propose our structured split-pricing layout ($95K base software license + $55K implementation services package) rather than the standard $150K upfront package. This bypasses a 4-week board sign-off cycle.\n2. **GDPR Action**: Our GDPR-compliant hosting sheet must be shared with Sarah immediately, as legal previously threatened a veto regarding European data confinement in Germany/Ireland.\n3. **POC Momentum**: Leverage our measured sandbox success (deploy time cut from **4 hours down to 22 minutes**) to justify the price premium against Competitor X who is bidding 20% cheaper.`;
    }

    // 2. Generate WITHOUT Memory Response (Standard Stateless LLM Before State)
    let beforeResponseText = "";
    if (isGeminiEnabled()) {
      const aiClient = getGemini();
      const withoutMemoryResult = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: "You are a standard, stateless AI chatbot. You are completely blind to any context, purchase history, meetings, company roles, or previous discussions with this user. Respond generically.",
          temperature: 0.7
        }
      });
      beforeResponseText = withoutMemoryResult.text || "No response generated.";
    } else {
      beforeResponseText = `I would love to help you prepare for your sales negotiation, but as a stateless model, I do not have access to any previous call notes, client details, specific budget objections, or competitor configurations for this deal. Please provide me with details about the buyer's organization, their budget limitations, legal flags, and what occurred on past calls so I can assist.`;
    }

    // Dynamic Retain: Attempt to extract new insights or experiences in the background from the user chat query!
    // This allows active real-time learning as the user continues to talk!
    if (isGeminiEnabled() && message.length > 25) {
      try {
        const aiClient = getGemini();
        const extractionPrompt = `Analyze the following user chat message in a sales coaching conversation and see if there are any new solid, specific client facts or epic experiences revealed.
Message: "${message}"

If there are new facts or experiences, output a clean JSON object following this format:
{
  "has_new": true,
  "memories": [
    {
      "type": "world_facts" | "experiences",
      "content": "Description of the concrete truth or interaction",
      "confidence": 0.8
    }
  ]
}
If nothing specific/new is in the statement, return {"has_new": false}. Do not return other text, markdown formatting blocks, or comments outside JSON.`;

        const extractionRes = await aiClient.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: extractionPrompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        const CleanedText = (extractionRes.text || "").trim();
        const extracted = JSON.parse(CleanedText);
        if (extracted && extracted.has_new && Array.isArray(extracted.memories)) {
          extracted.memories.forEach((mem: any) => {
            const memoryItem: Memory = {
              id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              buyer_id,
              type: mem.type || 'experiences',
              content: mem.content,
              confidence: mem.confidence || 0.8,
              timestamp: new Date().toISOString(),
              source: 'Active Chat Extraction'
            };
            db.memories.push(memoryItem);
          });
          saveDatabase(db);
          console.log(`Auto-retained ${extracted.memories.length} new insights from live chat!`);
        }
      } catch (e) {
        console.warn('Silent failure on dynamic memory extraction', e);
      }
    }

    const newMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const assistantResponse: Message = {
      role: 'assistant',
      content: mode === 'after' ? afterResponseText : beforeResponseText,
      timestamp: new Date().toISOString(),
      isBeforeAfter: true,
      beforeContent: beforeResponseText,
      afterContent: afterResponseText
    };

    if (!db.chatHistory[buyer_id]) {
      db.chatHistory[buyer_id] = [];
    }
    db.chatHistory[buyer_id].push(newMessage);
    db.chatHistory[buyer_id].push(assistantResponse);
    saveDatabase(db);

    res.json({
      response: mode === 'after' ? afterResponseText : beforeResponseText,
      beforeResponse: beforeResponseText,
      afterResponse: afterResponseText,
      buyer_id
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error?.message || 'Chat generation failed' });
  }
});

// POST /api/debrief - Debrief 5 questions form and parse into memories using Gemini
app.post('/api/debrief', async (req, res) => {
  const data: DebriefData = req.body;
  const { buyer_id, call_summary, objections_raised, positive_signals, next_steps, outcome } = data;

  if (!buyer_id || !call_summary) {
    return res.status(400).json({ error: 'Buyer ID and Call Summary are required' });
  }

  const db = getDatabase();

  try {
    let extractionText = "";

    if (isGeminiEnabled()) {
      const aiClient = getGemini();
      const debriefPrompt = `You are SalesIQ\'s background knowledge parser. Analyze this completed B2B post-call sales debrief form and extract key facts (World Facts), past interactions (Experiences), and strategic beliefs (Mental Models) to populate the Hindsight memory storage.

Debrief Input Details:
- Buyer ID: ${buyer_id}
- Outcome Segment: ${outcome}
- Call Core Summary: ${call_summary}
- Objections Raised: ${objections_raised}
- Positive Buyer Signals: ${positive_signals}
- Next Action Steps: ${next_steps}

Your job is to generate a highly granular list of extracted memory items.
Generate exactly a structured JSON response of this exact schema:
{
  "extracted_memories": [
    {
      "type": "world_facts" | "experiences" | "mental_models",
      "content": "Write a highly specific, comprehensive statement containing dates, names, or clear commercial numbers where possible",
      "confidence": 0.85
    }
  ]
}
Ensure confidence scores are between 0.5 and 1.0 depending on the clarity of the source detail. Avoid generic notes. Be crisp and informative.`;

      const geminiResult = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: debriefPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });
      extractionText = geminiResult.text || "";
    } else {
      // Mock Extraction when Gemini key is not configured
      extractionText = JSON.stringify({
        extracted_memories: [
          {
            type: 'experiences',
            content: `Completed debrief under ${outcome} outcome. Summary: ${call_summary}.`,
            confidence: 0.9
          },
          {
            type: 'world_facts',
            content: `Next steps committed: ${next_steps}. Flags: ${objections_raised || 'None'}.`,
            confidence: 0.85
          }
        ]
      });
    }

    const { extracted_memories } = JSON.parse(extractionText.trim());
    if (extracted_memories && Array.isArray(extracted_memories)) {
      extracted_memories.forEach((item: any) => {
        const memoryItem: Memory = {
          id: `debrief_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          buyer_id,
          type: item.type || 'experiences',
          content: item.content,
          confidence: item.confidence || 0.8,
          timestamp: new Date().toISOString(),
          source: `Debrief Form - ${outcome}`
        };
        db.memories.push(memoryItem);
      });
    }

    // Save debrief history as experience itself
    const mainExperience: Memory = {
      id: `call_${Date.now()}`,
      buyer_id,
      type: 'experiences',
      content: `Call Summary: ${call_summary}. Objections: ${objections_raised || 'None'}. Next Steps: ${next_steps}. Status: ${outcome}.`,
      confidence: 1.0,
      timestamp: new Date().toISOString(),
      source: `Post-Call Submission (${outcome})`
    };
    db.memories.push(mainExperience);
    saveDatabase(db);

    res.json({
      success: true,
      extracted_count: extracted_memories ? extracted_memories.length : 0,
      confirmation: `Successfully processed debrief. Logged new experiences and extracted World Facts to memory ledger.`
    });

  } catch (error: any) {
    console.error('Debrief processing failed:', error);
    res.status(500).json({ error: error?.message || 'Failed to process deal debrief' });
  }
});

// GET /api/briefing/:buyer_id - Generates an elite Pre-call BRIEFING report with Markdown
app.get('/api/briefing/:buyer_id', async (req, res) => {
  const { buyer_id } = req.params;
  const db = getDatabase();
  const memories = db.memories.filter(m => m.buyer_id === buyer_id);
  const buyer = db.buyers.find(b => b.id === buyer_id);

  if (!buyer) {
    return res.status(404).json({ error: 'Buyer not found' });
  }

  const worldFacts = memories.filter(m => m.type === 'world_facts').map(m => `- ${m.content}`).join('\n');
  const experiences = memories.filter(m => m.type === 'experiences').map(m => `- ${m.content} (Source: ${m.source})`).join('\n');
  const mentalModels = memories.filter(m => m.type === 'mental_models').map(m => `- ${m.content}`).join('\n');

  try {
    let briefingContent = "";

    if (isGeminiEnabled()) {
      const aiClient = getGemini();
      const briefingPrompt = `You are the ultimate elite sales VP whisperer and executive strategist at SalesIQ.
Your task is to generate a comprehensive, raw, street-smart Pre-call Briefing report for an SDR preparation before their meeting with **${buyer.name}** at **${buyer.company}** (Role: ${buyer.role}).

We have the following high-value Hindsight memory context for this deal:
[WORLD FACTS / STRUCTURAL RULES]
${worldFacts || 'None logged.'}

[INTERACTION CHRONOLOGY]
${experiences || 'No interactions logged.'}

[EVOLVED MENTAL MODELS]
${mentalModels || 'No synthesized mental models.'}

Please output a beautifully structured Markdown briefing that is direct, actionable, and uses high-impact human sales coaching language.

Strictly adhere to this exact outline structure (use exact headers including emojis so the parser detects them perfectly):

# PRE-CALL PLAYBOOK: ${buyer.name.toUpperCase()} @ ${buyer.company.toUpperCase()}
*SalesIQ Real-Time Tactical Synthesis*

## 🎯 Executive Context Grid
Provide a crisp 2-3 sentence strategic breakdown of the buyer's mindset, what they genuinely care about (cutting past corporate talk), and our primary objective for this call. Format the key details (like Tech Stack, Champion status, or Timing) as standard bullet lists.

## ⚡ Predicted Objection Playbook
Identify the top 3 highest-probability objections we will face (e.g. Mike Torres's board signature limit, Pricing friction, GDPR residency concerns).
Structure each objection as a separate sub-header exactly following this naming standard for parsing:
### OBJECTION: [Brief Name] | Confidence: [X]%
In 2-3 direct sentences, detail *why* they will object (the unspoken fear) and provide a concrete "Battle-tested Counterplay" in a separate block start with "> **Battle-tested Counterplay:**" describing how to pivot, redirect, or split pricing.

## 💬 Conversation Openers & Live Speaking Scripts
Provide 2-3 natural, high-performance verbal scripts the SDR can say out loud. Do not write generic "Hello, how are you." Write authentic, warm, and highly persuasive scripts. Cite exact quantified proof-of-concept success metrics (e.g. dropping compile/deploy speed from 4 hours to 22 minutes, auto-scaling savings) to establish authority instantly.
Format each speaking script as a blockade blockquote starting with "> **SDR speaking script:**"

## ⚠️ Deal Blockers & Red Flags
List 2-4 critical things to avoid doing, saying, or triggering during the call. Highlight legal hurdles, competitive landmines (e.g., Competitor X biddings), or board traps. Keep it snappy.

Draft this briefing with extreme polish. Avoid passive corporate-speak and preambles. Deliver maximum tactical density right from the start.`;

      const result = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: briefingPrompt,
        config: {
          temperature: 0.1
        }
      });
      briefingContent = result.text || "";
    } else {
      // Mock Briefing
      briefingContent = `# PRE-CALL PLAYBOOK: ${buyer.name.toUpperCase()} @ ${buyer.company.toUpperCase()}
*SalesIQ Real-Time Tactical Synthesis*

## 🎯 Executive Context Grid
We are entering a late-stage validation alignment. **${buyer.name}** is highly enthusiastic, but her main concern is developer friction and technical debt rollout. Our primary objective is to align on legal parameters and lock in signature-friendly pricing structures before competitor discounts derail momentum.

- **Account Champion**: **${buyer.name}** (${buyer.role}) - Deeply technical, values speed over sales pageantry.
- **Infrastructure Context**: Custom Kubernetes clusters running AWS EKS with Spinnaker continuous deployment.
- **Current Temperature**: Highly enthusiastic. The sandbox POC successfully validated all runtime speed vectors.

## ⚡ Predicted Objection Playbook

### OBJECTION: The CFO $100K Trap | Confidence: 95%
Mike Torres (CFO) is known to veto any SaaS agreements above six figures, pushing them to an exhaustive 4-week board sign-off procedure. Sarah is highly likely to request a single packaged invoice that inadvertently triggers this cycle.
> **Battle-tested Counterplay:** Proactively present a split commercial proposal: $95K upfront annual recurring platform license, and $55K modular onboarding/integration services. This keeps signature authority under Sarah's direct department delegation limit, bypassing Mike's board triggers completely and letting us close this Friday.

### OBJECTION: Competitor X Lowball | Confidence: 85%
Sarah has received a last-minute discount bid from Competitor X, who is 20% cheaper on baseline sticker price. She will use this as leverage to demand a price match.
> **Battle-tested Counterplay:** Do not negotiate on price. Pivot the conversation directly to runtime efficiency and developer hours. Remind Sarah that we reduced their cluster deploy bottleneck from **4 hours down to 22 minutes** during our sandbox POC. Competitor X lacks native vertical auto-scaling, meaning Sarah's team would pay 3x more in idle cloud compute costs, erasing any cheap license fee savings.

### OBJECTION: Data Residency Veto | Confidence: 90%
German sub-legal audits frequently block SaaS contracts that route customer logs outside the EU. Sarah's security champion will likely raise this issue.
> **Battle-tested Counterplay:** Do not wait for them to ask. Deliver our pre-signed EU Data Sovereignty addendum immediately. Highlight that all logging telemetry remains entirely isolated in Ireland/Frankfurt zones, ensuring flawless compliance right out of the box.

## 💬 Conversation Openers & Live Speaking Scripts

> **SDR speaking script:** *"Sarah, great to connect again. We're still celebrating that sandbox result over here—collapsing your deployment cycle down from 4 hours to just 22 minutes is a massive win for your dev velocity. I've already pre-empted your legal review by preparing our Frankfurt isolation sheet, so your team doesn't have to spend weeks chasing compliance approvals."*

> **SDR speaking script:** *"On the commercial side, I want to make this as painless as possible for you. Since I know contract committees can drag things out, we've structured a modular option: a $95K base license with a separate services package. This keeps the transaction clean, fits comfortably within internal department levels, and bypasses standard board bottlenecks completely."*

## ⚠️ Deal Blockers & Red Flags
- **Do NOT mention raw discounts upfront**: Selling on price dilutes our automation speed story. Standardize on the quantified 4hr vs 22min metric.
- **Never promise customized Kubernetes operators**: Our current core product satisfies their CD flow natively; any custom branch will derail standard delivery SLA timelines.
- **Avoid CC-ing Mike Torres directly**: Keep the negotiation thread focused with ${buyer.name} to avoid triggering CFO oversight until the proposal is perfectly packaged.`;
    }

    res.json({
      buyer_id,
      buyer_name: buyer.name,
      company: buyer.company,
      briefing: briefingContent
    });

  } catch (error: any) {
    console.error('Failed to generate briefing:', error);
    res.status(500).json({ error: error?.message || 'Briefing compilation failed' });
  }
});

// POST /api/reflect/:buyer_id - Runs manual Hindsight Reflect() pattern to synthesize mental models
app.post('/api/reflect/:buyer_id', async (req, res) => {
  const { buyer_id } = req.params;
  const db = getDatabase();
  const buyer = db.buyers.find(b => b.id === buyer_id);

  if (!buyer) {
    return res.status(404).json({ error: 'Buyer not found' });
  }

  const memories = db.memories.filter(m => m.buyer_id === buyer_id);
  const worldFacts = memories.filter(m => m.type === 'world_facts').map(m => m.content).join('\n');
  const experiences = memories.filter(m => m.type === 'experiences').map(m => m.content).join('\n');

  try {
    let reflectionText = "";

    if (isGeminiEnabled()) {
      const aiClient = getGemini();
      const prompt = `You are Hindsight\'s core "Reflect" pattern engine. Your job is to analyze several user-logged facts and experiences with buyer ${buyer.name} and synthesize them into high-value, deep-state Mental Models (beliefs/insights).

Historical client facts:
${worldFacts}

Client experiences & call notes:
${experiences}

Output exactly a JSON structures representing the synthesized beliefs:
{
  "beliefs": [
    {
      "content": "A crucial B2B sales hypothesis detailing buying patterns, commercial tricks, champion advocate traits, or legal blockers.",
      "confidence": 0.9
    }
  ]
}
Generate 2-3 highly distinct, high-weight mental models. Overwrite vague notes with real, actionable heuristics.`;

      const result = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });
      reflectionText = result.text || "";
    } else {
      // Mock reflection
      reflectionText = JSON.stringify({
        beliefs: [
          {
            content: "Acme prefers base subscription structuring underneath $100K to completely delegate signature authority away from full board triggers.",
            confidence: 0.95
          },
          {
            content: "Auto-rollbacks and EKS integration is our primary functional advantage. Focus sales arguments around developer speed (the 4h to 22m metric) to push back competitor discounts.",
            confidence: 0.85
          }
        ]
      });
    }

    const { beliefs } = JSON.parse(reflectionText.trim());

    if (beliefs && Array.isArray(beliefs)) {
      // Remove old mental models for this buyer to prevent duplicate bloating during manual reflect
      db.memories = db.memories.filter(m => !(m.buyer_id === buyer_id && m.type === 'mental_models'));

      beliefs.forEach((belief: any, idx: number) => {
        const mentalModelItem: Memory = {
          id: `reflect_${Date.now()}_${idx}`,
          buyer_id,
          type: 'mental_models',
          content: belief.content,
          confidence: belief.confidence || 0.85,
          timestamp: new Date().toISOString(),
          source: 'System Reflection Loop'
        };
        db.memories.push(mentalModelItem);
      });

      saveDatabase(db);
    }

    const updatedMemories = db.memories.filter(m => m.buyer_id === buyer_id && m.type === 'mental_models');
    res.json({
      success: true,
      beliefs: updatedMemories
    });

  } catch (error: any) {
    console.error('Reflection loop failed:', error);
    res.status(500).json({ error: error?.message || 'Reflection synthesis loop failed' });
  }
});


// ----- SERVE VITE STATIC CONTENT IN PRODUCTION OR HOST VITE IN DEVELOPMENT -----

const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware");
  } else {
    // Serve static files from compiled dist folder in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving compiled production assets from /dist");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SalesIQ fullstack application running on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error("Failed to start SalesIQ server:", err);
});
