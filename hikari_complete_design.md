# HIKARI — Complete Project Design Documentation
### FAR AWAY 2026 Hackathon | Agentic & Autonomous Systems

> **Tagline:** An autonomous STEM learning companion for visually impaired students.

---

# TABLE OF CONTENTS

1. [Product Requirements Document](#1-product-requirements-document)
2. [Problem Research Document](#2-problem-research-document)
3. [System Design Document](#3-system-design-document)
4. [Agent Design Document](#4-agent-design-document)
5. [Tech Spec Document](#5-tech-spec-document)
6. [Database Document](#6-database-document)
7. [API Document](#7-api-document)
8. [Web3 Architecture Document](#8-web3-architecture-document)
9. [MVP Document](#9-mvp-document)
10. [Pitch Deck Document](#10-pitch-deck-document)

---

# 1. PRODUCT REQUIREMENTS DOCUMENT

## Executive Summary

Hikari (光 — Japanese for "light") is a multi-agent autonomous STEM learning system built for visually impaired students. It doesn't just read content — it **understands** STEM diagrams, circuit schematics, geometry figures, flowcharts, and scientific illustrations, then teaches them through adaptive, spoken, structured explanations. The system remembers how each student learns, builds a personal curriculum plan, verifies genuine understanding, and issues tamper-proof on-chain learning credentials. Hikari is the first agentic system that closes the last major accessibility gap in STEM education: visual content.

## Product Vision

A world where a blind student in Nagpur, Osaka, or Nairobi can independently understand a circuit diagram, a geometry proof, or a biology cell diagram — without waiting for a human assistant, without simplified content, and with verified proof that they've actually learned it.

## Problem Statement

Screen readers can read text. They cannot teach a Wheatstone bridge diagram. They cannot explain what a right-angle triangle's altitude line means. They cannot walk through a flowchart's decision branches. For visually impaired STEM students, visual content is a full stop.

This forces dependency on human sighted assistants — an inconsistent, expensive, unavailable resource. It pushes students out of STEM pathways entirely.

## Why This Problem Matters

- **253 million** people globally have visual impairment (WHO, 2024)
- STEM subjects have the highest proportion of visual-only content of any curriculum domain
- In India, fewer than 2% of blind students complete a STEM degree (NIPUN data)
- Japan's accessibility mandate (Act for Eliminating Discrimination against Persons with Disabilities, 2016) requires accessible education but has no technical solution for STEM diagrams
- This isn't a niche problem — it's a structural barrier that AI has only recently become capable of solving

## Market Gap

| What exists | What's missing |
|---|---|
| Screen readers (NVDA, JAWS) | Understanding of visual content |
| AI image captioning | Pedagogical explanation of diagrams |
| Accessible textbooks (Braille) | Interactive STEM tutoring |
| Generic LLM chatbots | Adaptive agent memory per student |
| eBooks with alt-text | Verified learning credentials |

No product combines: autonomous visual understanding + pedagogical reasoning + student memory + adaptive planning + verified achievement.

## Target Users

**Primary:** Visually impaired students (blind, low vision) in secondary and undergraduate STEM education

**Secondary:**
- Special education teachers who want to know what a student has genuinely learned
- Universities issuing accessible course credits
- NGOs running accessible education programs (e.g., NAB India, JFBV Japan)

## User Personas

### Persona 1 — Arjun, 17, Blind, Class 11, Lucknow
Physics and mathematics student. Has a screen reader. His teacher draws circuit diagrams on the board and he sits and waits. He has a smartphone and a Bluetooth speaker. He's intelligent and frustrated.

### Persona 2 — Yuki, 20, Low Vision, Engineering Student, Osaka
Can see shapes but not detail. Uses magnification software. Struggles with detailed circuit diagrams and geometry proofs. Preparing for university entrance exams. Needs independent study tools for nights and weekends.

### Persona 3 — Ms. Lakshmi, 34, Special Education Coordinator, Chennai
Manages 40 visually impaired students. Can't individually assist each one with STEM diagrams. Needs a system that works autonomously and reports back on student progress with verifiable data.

## User Stories

- As a blind student, I want to upload a photo of my textbook diagram and receive a full spoken explanation so that I don't need to wait for my teacher.
- As a student, I want the system to remember that I struggle with Kirchhoff's laws so it revisits them without me asking.
- As a student, I want to receive a verifiable certificate that I've completed a STEM topic that I can share with universities.
- As a teacher, I want to see what topics each student has genuinely mastered (not just completed) so I can focus my attention.
- As a student, I want quiz questions about diagrams I've studied, in spoken form, with adaptive difficulty.

## Success Metrics

| Metric | Target |
|---|---|
| Diagram understanding accuracy | >90% vs. sighted teacher explanation |
| Student retention (7-day return) | >60% |
| Time to first explanation | <8 seconds |
| Quiz relevance to diagram | >85% (user rated) |
| On-chain credential issuance | 100% tamper-proof |
| Accessibility compliance | WCAG 2.1 AAA |

## Non-Goals

- Not a general-purpose chatbot
- Not a document summarizer
- Not replacing Braille or screen readers for text content
- Not a classroom management tool for sighted students
- Not a fee-based tutoring marketplace

## Competitive Analysis

| Product | Diagram Understanding | Agent Memory | Adaptive Curriculum | Verified Credentials |
|---|---|---|---|---|
| NVDA | ✗ | ✗ | ✗ | ✗ |
| Microsoft Seeing AI | Partial (captions) | ✗ | ✗ | ✗ |
| Be My Eyes + GPT-4o | Ad-hoc | ✗ | ✗ | ✗ |
| Khan Academy | ✗ (visual-only) | ✗ | Partial | ✗ |
| **Hikari** | ✓ Full | ✓ | ✓ Agentic | ✓ On-chain |

## Future Vision

- Real-time classroom mode: teacher writes on board, Hikari explains to student simultaneously via earpiece
- Hardware integration: smart glasses with Hikari agents embedded
- Curriculum alignment: India NCERT, Japan MEXT, CBSE, IB mapped
- Educator dashboard with learning analytics
- Multilingual: Hindi, Japanese, Tamil, English out of box

---

# 2. PROBLEM RESEARCH DOCUMENT

## Accessibility Challenges in STEM Education

STEM content has three categories visually:

1. **Diagrams** — circuit diagrams, biology cell diagrams, anatomy illustrations
2. **Geometric figures** — triangles, proofs, coordinate geometry, 3D solids
3. **Graphs and charts** — function curves, bar charts, scatter plots, histograms

Standard accessibility tools treat all three categories identically and inadequately: they either describe the image at surface level ("a triangle with labels") or fail entirely. None can walk a student through the *meaning* of the visual.

### The Alt-Text Illusion
Most textbooks that claim accessibility provide alt-text like: "Figure 3.2: Circuit diagram." This is not accessibility. It's a checkbox.

### The Screen Reader Wall
Screen readers are exceptional at text. The moment content becomes visual — even a labeled diagram in a PDF — screen readers hit a wall. ARIA labels can describe layout but not teach relationships between components.

### The Human Dependency Trap
Most visually impaired students rely on:
- Sighted peers (inconsistent, creates academic inequality)
- Special educators (1:many ratio, unavailable during self-study)
- Transcription services (slow, expensive, doesn't support real-time learning)

## STEM Learning Barriers Specific to Visual Impairment

- **Spatial reasoning** — geometry requires spatial mental models. Blind students need explicit verbalization of spatial relationships that diagrams make implicit.
- **Sequential vs. holistic understanding** — sighted students take in a circuit diagram holistically. Blind students must build it incrementally. No existing tool supports this.
- **Feedback loops** — understanding whether you've grasped a visual concept requires interaction. Quiz tools don't have diagram-aware questions.

## India-Specific Challenges

- 8 million+ visually impaired students in India (Census 2011, estimated growth since)
- NCERT textbooks are rich with diagrams — physics, chemistry, biology, mathematics all heavily visual
- Teacher-student ratio in special schools: 1:40 or worse
- Low smartphone penetration for braille-supported devices; standard Android devices are more common
- State board exams (Class 10, 12) have diagram-based questions worth 30–40% of marks
- Digital India initiative has digitized textbooks but without meaningful accessibility improvements
- RCI (Rehabilitation Council of India) has no STEM-specific accessibility certification standard

## Japan-Specific Challenges

- ~310,000 people with visual impairment in Japan (Cabinet Office 2022)
- University entrance exam (共通テスト) includes diagram-heavy science sections
- Braille textbook production is centralized through National Textbook Publishing Association — slow, costly
- Cultural expectation of independent study (juku culture) makes human-assisted learning socially difficult
- Japan's aging population increases visual impairment prevalence, creating growing adult learner need
- National Institute of Special Needs Education (NISE) lacks AI-integrated learning tools

## Existing Solutions and Their Weaknesses

| Solution | Weakness |
|---|---|
| JAWS / NVDA | Text-only, no image comprehension |
| Microsoft Seeing AI | Caption-only, not pedagogical, no memory |
| Be My Eyes (AI mode) | On-demand human or GPT, no curriculum planning, no memory |
| Bookshare / Learning Ally | Audio textbooks, no diagram explanation |
| Desmos Accessibility | Math graphs only, not general STEM diagrams |
| OrCam MyEye | Text reading hardware, not educational reasoning |

**None** of these systems:
- Understand *what a diagram is teaching*
- Remember *what a student has already learned*
- *Plan* what to teach next
- Issue *verifiable* proof of learning

## Why Now

Three technical convergences make Hikari possible in 2026 that weren't true in 2022:

1. **Vision-language models at diagram-level accuracy** — Gemini 2.5 Pro's native multimodal understanding can interpret circuit diagrams, geometry figures, and scientific illustrations with high fidelity. This didn't exist at production quality two years ago.

2. **Agent frameworks are production-ready** — LangGraph, AutoGen-style multi-agent coordination, and persistent memory via vector stores have matured enough for a student-facing product.

3. **On-chain credential infrastructure** — EIP-4973 (Soul-Bound Tokens), Base's low-fee L2, and Ethereum Attestation Service (EAS) make tamper-proof, transferable credentials practical without crypto-native UX friction.

---

# 3. SYSTEM DESIGN DOCUMENT

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HIKARI SYSTEM                            │
│                                                             │
│  ┌──────────────┐    ┌──────────────────────────────────┐  │
│  │   Frontend   │    │         Agent Orchestrator        │  │
│  │  (Next.js)   │◄──►│          (LangGraph)              │  │
│  │  Voice/UI    │    │                                    │  │
│  └──────────────┘    │  ┌──────────┐  ┌──────────────┐  │  │
│                       │  │ Vision   │  │  Educational │  │  │
│  ┌──────────────┐    │  │ Agent    │  │  Reasoning   │  │  │
│  │  Auth Layer  │    │  └──────────┘  │  Agent       │  │  │
│  │  (Supabase)  │    │               └──────────────┘  │  │
│  └──────────────┘    │  ┌──────────┐  ┌──────────────┐  │  │
│                       │  │ Memory   │  │  Planner     │  │  │
│  ┌──────────────┐    │  │ Agent    │  │  Agent       │  │  │
│  │  File Store  │    │  └──────────┘  └──────────────┘  │  │
│  │  (R2/CDN)    │    │                                    │  │
│  └──────────────┘    │  ┌──────────┐  ┌──────────────┐  │  │
│                       │  │  Quiz    │  │  Achievement │  │  │
│  ┌──────────────┐    │  │  Agent   │  │  Agent       │  │  │
│  │  Blockchain  │    │  └──────────┘  └──────────────┘  │  │
│  │  (Base L2)   │    └──────────────────────────────────┘  │
│  └──────────────┘                                           │
│                       ┌──────────────────────────────────┐  │
│  ┌──────────────┐    │          Data Layer               │  │
│  │  Vector DB   │    │  PostgreSQL (Supabase)            │  │
│  │  (Qdrant)    │◄──►│  Qdrant (vector memory)          │  │
│  └──────────────┘    │  Redis (session cache)            │  │
│                       └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture

### Frontend (Next.js 15 App Router)

```
app/
├── (auth)/          → login, signup (Supabase Auth)
├── learn/           → main learning interface
│   ├── upload/      → diagram upload + voice capture
│   ├── session/     → active learning session (SSE stream)
│   └── history/     → past sessions
├── achievements/    → on-chain credentials
└── api/             → API routes (thin proxies to backend)
```

**Key frontend decisions:**
- Server-Sent Events (SSE) for streaming agent responses — no WebSockets needed
- Web Speech API for TTS (browser-native, free, accessible)
- Web Speech API for STT (student can ask questions by voice)
- All interactions keyboard and voice navigable
- No visual-only affordances

### Backend (FastAPI)

```
hikari-api/
├── agents/          → LangGraph agent definitions
│   ├── vision.py
│   ├── educational.py
│   ├── memory.py
│   ├── planner.py
│   ├── quiz.py
│   └── achievement.py
├── orchestrator.py  → LangGraph graph definition
├── models/          → Pydantic schemas
├── services/        → Gemini, Groq, Qdrant, Supabase clients
├── web3/            → Contract interaction layer
└── main.py
```

## Data Flow — Core Learning Session

```
Student uploads diagram image
         │
         ▼
[Frontend] → POST /api/sessions/start
         │
         ▼
[Orchestrator] spawns session graph
         │
         ▼
[Vision Agent] → Gemini 2.5 Pro Vision
  - Classify diagram type
  - Extract components and relationships
  - Identify educational concept
         │
         ▼
[Memory Agent] → Qdrant semantic search
  - "Has this student encountered Kirchhoff's laws before?"
  - "What misconceptions have they shown?"
  - Retrieve prior context
         │
         ▼
[Educational Reasoning Agent] → Gemini 2.5 Flash
  - Receive: diagram analysis + student memory context
  - Generate: pedagogically ordered explanation
  - Output: structured explanation segments
         │
         ▼
[Planner Agent]
  - Update student's topic graph
  - Determine: "should we quiz now or explain further?"
  - Schedule next recommended topic
         │
         ▼
[Frontend] ← SSE stream of explanation segments
         │
         ▼
[TTS] → spoken audio via Web Speech API
```

## Sequence Diagram — Quiz Flow

```
Student: "Quiz me on this"
         │
         ▼
[Quiz Agent]
  - Pull diagram analysis from session context
  - Pull student memory: what do they already know, what did they struggle with?
  - Generate 3 questions of ascending difficulty
  - Mark questions with concept tags
         │
         ▼
Stream Q1 → Student answers by voice
         │
         ▼
[Quiz Agent] evaluates answer
  - Correct → reinforce, move to Q2
  - Incorrect → trigger micro-explanation, retry variant
         │
         ▼
After 3 questions: calculate comprehension score
         │
         ▼
[Achievement Agent]
  - If score >= threshold AND topic passes mastery check:
    → Issue on-chain achievement
  - Else:
    → Add to "needs revisit" queue in Planner
```

## Event Flow — Background Memory Update

```
Every session end:
  [Memory Agent] asynchronously:
    - Extract concept entities from session transcript
    - Embed and upsert to Qdrant with student_id + timestamp
    - Update topic mastery scores in PostgreSQL
    - Flag unresolved misconceptions
```

## Scalability Considerations

- LangGraph sessions are stateless — each session reconstructs from DB; horizontally scalable
- Qdrant can shard by student namespace
- Gemini 2.5 Flash for most agent steps (cost), Pro only for vision analysis
- Groq (Llama 3.3 70B) as fallback when Gemini quota hits
- SSE keeps connections lightweight vs. WebSockets

---

# 4. AGENT DESIGN DOCUMENT

## Agent Topology

```
                    ┌─────────────────────┐
                    │   ORCHESTRATOR      │
                    │   (LangGraph Graph) │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼──────┐      ┌──────▼─────┐      ┌──────▼─────┐
    │  VISION    │      │  MEMORY    │      │  PLANNER   │
    │  AGENT     │      │  AGENT     │      │  AGENT     │
    └─────┬──────┘      └──────┬─────┘      └──────┬─────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  EDUCATIONAL        │
                    │  REASONING AGENT    │
                    └──────────┬──────────┘
                               │
               ┌───────────────┼───────────────┐
               │                               │
       ┌───────▼───────┐              ┌────────▼───────┐
       │  QUIZ AGENT   │              │  ACHIEVEMENT   │
       │               │              │  AGENT         │
       └───────────────┘              └────────────────┘
```

**Communication protocol:** Agents communicate via a shared LangGraph state object (TypedDict). No direct agent-to-agent HTTP calls. The orchestrator controls execution order.

---

## Agent 1: Vision Understanding Agent

**Responsibility:** Translate visual STEM content into a structured semantic representation that downstream agents can reason about — specifically optimized for pedagogical use.

**Inputs:**
- Image bytes (from Cloudflare R2)
- Diagram metadata (subject, grade level if known)

**Outputs:**
```json
{
  "diagram_type": "circuit_diagram",
  "components": [
    {"id": "R1", "type": "resistor", "value": "10Ω", "position": "branch_1"},
    {"id": "V1", "type": "voltage_source", "value": "12V"}
  ],
  "relationships": [
    {"from": "V1", "to": "R1", "type": "series"},
    {"from": "R1", "to": "R2", "type": "parallel"}
  ],
  "key_concepts": ["Ohm's Law", "Kirchhoff's Voltage Law"],
  "educational_level": "Class 10 Physics",
  "diagram_complexity": "intermediate",
  "spatial_description": "A rectangular circuit with a 12V battery on the left branch..."
}
```

**Memory:** None (stateless per call). Results are passed to orchestrator state.

**Model:** Gemini 2.5 Pro (vision-heavy, needs highest fidelity)

**Decision making:** Uses structured JSON output prompt. If confidence < 0.7 on diagram type classification, flags for a clarifying question to the student.

**Tools:** Gemini Vision API, image preprocessing utility

**Failure handling:**
- Image too blurry → ask student to retake
- Unknown diagram type → classify as "general_illustration" and proceed with generic explanation mode
- Gemini API failure → retry once, then route to Groq (Llava model if available) or return graceful degradation message

---

## Agent 2: Educational Reasoning Agent

**Responsibility:** Transform the Vision Agent's structured output into a spoken, pedagogically ordered explanation. Not just describe — *teach*. The explanation should follow proven pedagogical sequencing: context → components → relationships → application.

**Inputs:**
- Vision Agent output (diagram analysis)
- Memory Agent output (student prior knowledge, misconceptions)
- Student's grade level and subject from profile

**Outputs:**
```json
{
  "explanation_segments": [
    {
      "order": 1,
      "type": "context",
      "text": "This diagram shows a circuit with two resistors...",
      "concept_tags": ["circuit_basics"]
    },
    {
      "order": 2,
      "type": "component_walkthrough",
      "text": "Starting from the battery on the left...",
      "concept_tags": ["components"]
    },
    {
      "order": 3,
      "type": "relationship",
      "text": "Notice that R1 and R2 are connected in parallel...",
      "concept_tags": ["Kirchhoff_Voltage_Law"]
    },
    {
      "order": 4,
      "type": "application",
      "text": "Using Kirchhoff's Voltage Law, we can calculate...",
      "concept_tags": ["Ohm_Law"]
    }
  ],
  "estimated_duration_seconds": 90,
  "difficulty_calibration": "simplified_for_first_encounter"
}
```

**Memory:** Reads from Memory Agent output, but does not write. Writes happen at session end.

**Model:** Gemini 2.5 Flash (reasoning-heavy but text-only after Vision Agent)

**Decision making:**
- If student has seen this concept before (from Memory Agent) → skip introductory context, jump to nuance
- If student has a flagged misconception → proactively address it
- Pedagogical template: Concrete → Abstract → Application (modified Bruner sequencing)

**Failure handling:** If explanation output fails structured parsing → fallback to unstructured prose explanation

---

## Agent 3: Student Memory Agent

**Responsibility:** Maintain and query a persistent, semantic record of each student's learning history. The system's "long-term knowledge" about a student.

**Inputs (write):**
- Session transcript
- Quiz results
- Identified misconceptions

**Inputs (read):**
- Student ID
- Current concept tags (from Vision Agent output)

**Outputs (read):**
```json
{
  "prior_exposure": ["Ohm's Law: 3 sessions", "Series circuits: 2 sessions"],
  "mastery_scores": {"Ohm's Law": 0.82, "Kirchhoff's Voltage": 0.41},
  "active_misconceptions": ["Confuses EMF with terminal voltage"],
  "preferred_explanation_style": "step_by_step_with_analogies",
  "recent_sessions": ["circuit_basics_2025-01-10", "resistors_2025-01-11"]
}
```

**Memory implementation:**
- Vector store (Qdrant): semantic search over session transcripts
- PostgreSQL: structured mastery scores and misconception flags
- Both are keyed by `student_id`

**Decision making:** At session start, always retrieves top-5 semantically relevant prior sessions for current concept. At session end, runs async upsert job.

**Model:** Embedding model via Gemini embeddings API (text-embedding-004)

**Failure handling:** If Qdrant is unreachable → proceed without memory context (degrade gracefully, flag to Planner)

---

## Agent 4: Learning Planner Agent

**Responsibility:** Maintain a personalized topic graph for each student. Decide what they should learn next, in what order, based on mastery data and curriculum alignment.

**Inputs:**
- Current mastery scores (from Memory Agent)
- Completed session summary
- Target curriculum (e.g., Class 10 NCERT Physics)

**Outputs:**
```json
{
  "completed_today": ["parallel_circuits"],
  "recommended_next": ["Kirchhoff's Current Law"],
  "reason": "Student has Ohm's Law at 82% mastery. KCL is the logical prerequisite for full circuit analysis. They've encountered KVL but at 41% mastery.",
  "estimated_sessions_to_mastery": 2,
  "curriculum_progress_percent": 34
}
```

**Memory:** Reads and writes to a student-specific topic DAG (directed acyclic graph) stored in PostgreSQL.

**Decision making:** Uses curriculum alignment map (hardcoded topic prerequisites for NCERT/MEXT curricula) combined with mastery scores to select next topic via topological sort.

**Model:** Gemini 2.5 Flash (reasoning only, no vision)

**Failure handling:** If planner state is corrupted → reset to curriculum start, preserve mastery scores

---

## Agent 5: Quiz Generation Agent

**Responsibility:** Generate diagram-aware quiz questions tied to the specific diagram the student just studied. Questions must be answerable via voice and testable by the agent without human grading.

**Inputs:**
- Vision Agent output (diagram structure)
- Educational Reasoning Agent output (what was explained)
- Memory Agent output (what the student knows)
- Target difficulty

**Outputs:**
```json
{
  "questions": [
    {
      "id": "q1",
      "type": "recall",
      "question": "In the circuit we just studied, what is the total voltage provided by the source?",
      "expected_answer": "12 volts",
      "concept_tag": "voltage_source",
      "difficulty": 1
    },
    {
      "id": "q2",
      "type": "reasoning",
      "question": "If R1 is 10 ohms and R2 is 20 ohms connected in parallel, what is the equivalent resistance?",
      "expected_answer": "approximately 6.67 ohms",
      "concept_tag": "parallel_resistance",
      "difficulty": 2
    },
    {
      "id": "q3",
      "type": "application",
      "question": "If we double R1 in this circuit, will the total current increase or decrease? Why?",
      "expected_answer": "decrease, because resistance and current are inversely proportional by Ohm's Law",
      "concept_tag": "Ohm's Law application",
      "difficulty": 3
    }
  ]
}
```

**Answer evaluation:** Uses LLM-as-judge pattern — student answer + expected answer + rubric → Gemini Flash judges correctness with partial credit.

**Model:** Gemini 2.5 Flash

**Failure handling:** If question generation fails → fall back to 3 generic questions about identified concepts

---

## Agent 6: Achievement Verification Agent

**Responsibility:** Determine when a student has genuinely mastered a topic (not just completed it), then trigger on-chain credential issuance. Prevent credential inflation.

**Inputs:**
- Quiz results (scores, concept tags)
- Historical mastery trend from Memory Agent
- Topic prerequisites completed

**Mastery calculation:**
```
mastery_score = (0.4 × quiz_avg) + (0.3 × retention_score) + (0.3 × consistency_score)

where:
  retention_score = quiz performance 3+ days after first learning
  consistency_score = performance variance across multiple sessions
```

**Decision tree:**
```
mastery_score >= 0.80 AND
sessions_on_topic >= 2 AND
retention_verified = true
    → ISSUE CREDENTIAL
    → Update on-chain via smart contract
    → Notify Planner: topic complete

mastery_score >= 0.60 AND < 0.80
    → "Good progress" badge (off-chain only)
    → Recommend 1 more session

mastery_score < 0.60
    → Flag misconceptions
    → Alert Planner to reschedule topic
    → Do not issue credential
```

**Model:** Gemini 2.5 Flash

**Web3 interaction:** Calls backend Web3 service to invoke `issueCredential()` on Base L2 smart contract

**Failure handling:** If blockchain transaction fails → store credential in "pending" state, retry with exponential backoff, never lose the achievement record

---

## Agent Communication Flow (Complete)

```
Session Start
    │
    ├─► Vision Agent (image → structured analysis)
    │       └─► passes to: Orchestrator state
    │
    ├─► Memory Agent READ (student_id + concept_tags → prior context)
    │       └─► passes to: Orchestrator state
    │
    ├─► Educational Reasoning Agent (analysis + memory → explanation segments)
    │       └─► streams to: Frontend via SSE
    │
    ├─► [User interaction: follow-up questions via voice]
    │       └─► Educational Reasoning Agent (re-enters with question context)
    │
    ├─► [User: "Quiz me"]
    │       └─► Quiz Agent → streams questions → evaluates answers
    │               └─► passes results to: Achievement Agent
    │
    ├─► Achievement Agent (quiz results + mastery history → credential decision)
    │       └─► if credential: Web3 service → Base L2
    │
    ├─► Planner Agent (mastery update → next topic recommendation)
    │       └─► writes to: PostgreSQL topic graph
    │
    └─► Memory Agent WRITE (session transcript + quiz results → Qdrant upsert)
```

## Reflection Strategy

The Educational Reasoning Agent self-reflects after generating an explanation:

```
System prompt includes:
"Review your explanation. Ask: 
1. Did I explain components before relationships?
2. Did I avoid visual-only references ('as you can see...')?
3. Did I address the student's known misconceptions?
4. Is this explanation completable in under 2 minutes via speech?
If no to any: revise before outputting."
```

## Human Override Mechanisms

- Student can interrupt at any point with voice command "stop" or "repeat"
- Student can ask "explain this differently" — triggers Educational Agent re-run with different pedagogical framing
- Teacher dashboard can flag incorrect explanations for review
- All agent decisions are logged for manual audit trail

---

# 5. TECH SPEC DOCUMENT

## Frontend Architecture

**Framework:** Next.js 15 with App Router and React Server Components

**Key dependencies:**
```json
{
  "next": "15.x",
  "react": "19.x",
  "typescript": "5.x",
  "tailwindcss": "4.x",
  "@supabase/supabase-js": "2.x",
  "shadcn/ui": "latest",
  "framer-motion": "11.x"
}
```

**Accessibility stack:**
- All interactive elements: `aria-label`, `role`, keyboard navigable
- Color contrast: WCAG AAA minimum
- Web Speech API: `SpeechSynthesisUtterance` for TTS, `SpeechRecognition` for STT
- `prefers-reduced-motion` respected
- Screen reader tested: NVDA, VoiceOver
- No information conveyed by color alone

**State management:** Zustand (lightweight) for session state, React Query for server state

**SSE implementation:**
```typescript
// Frontend SSE consumer
const eventSource = new EventSource(`/api/sessions/${sessionId}/stream`);
eventSource.onmessage = (e) => {
  const segment = JSON.parse(e.data);
  appendToExplanation(segment);
  speak(segment.text); // Web Speech TTS
};
```

## Backend Architecture

**Framework:** FastAPI (Python 3.11+)

**Key dependencies:**
```
fastapi==0.111.x
langchain==0.2.x
langgraph==0.1.x
google-generativeai==0.7.x
qdrant-client==1.9.x
supabase==2.x
python-jose (JWT)
httpx
```

**Agent execution:** LangGraph `StateGraph` with typed state, compiled to a runnable graph

**Streaming:** FastAPI `StreamingResponse` with `text/event-stream` content type

## Database Design

See full SQL schema in Document 6.

**Summary:**
- `users` — student profiles
- `sessions` — learning sessions per student
- `session_segments` — individual explanation/quiz events in a session
- `topic_mastery` — student × topic mastery scores
- `student_misconceptions` — flagged conceptual errors
- `credentials` — on-chain credential records
- `curriculum_topics` — topic prerequisite graph

## APIs

See full API spec in Document 7.

## Agent Infrastructure

**LangGraph state schema:**
```python
class HikariState(TypedDict):
    student_id: str
    session_id: str
    image_url: str
    diagram_analysis: Optional[DiagramAnalysis]
    memory_context: Optional[MemoryContext]
    explanation_segments: List[ExplanationSegment]
    quiz_state: Optional[QuizState]
    achievement_result: Optional[AchievementResult]
    planner_output: Optional[PlannerOutput]
    errors: List[str]
```

**Graph definition:**
```python
graph = StateGraph(HikariState)
graph.add_node("vision", vision_agent)
graph.add_node("memory_read", memory_read_agent)
graph.add_node("educational", educational_agent)
graph.add_node("quiz", quiz_agent)
graph.add_node("achievement", achievement_agent)
graph.add_node("planner", planner_agent)
graph.add_node("memory_write", memory_write_agent)

graph.set_entry_point("vision")
graph.add_edge("vision", "memory_read")
graph.add_edge("memory_read", "educational")
graph.add_conditional_edges("educational", route_after_explanation)
# route_after_explanation → "quiz" if student requests, "planner" if not
graph.add_edge("quiz", "achievement")
graph.add_edge("achievement", "planner")
graph.add_edge("planner", "memory_write")
graph.add_edge("memory_write", END)
```

## Model Routing Strategy

| Task | Primary | Fallback | Reason |
|---|---|---|---|
| Diagram vision analysis | Gemini 2.5 Pro | Gemini 2.5 Flash | Pro has better vision fidelity |
| Explanation generation | Gemini 2.5 Flash | Groq Llama 3.3 70B | Flash is fast and cheap |
| Quiz generation | Gemini 2.5 Flash | Groq Qwen 2.5 72B | Speed matters for quiz loop |
| Answer evaluation | Gemini 2.5 Flash | Groq DeepSeek R1 | Needs reasoning |
| Memory embedding | Gemini text-embedding-004 | — | Consistent embedding space |

**Routing logic:**
- If Gemini API response time > 5s → switch to Groq
- If Gemini error rate in window > 10% → switch to Groq
- Pro → Flash fallback for vision if Pro quota exceeded

## Cost Optimization

- Gemini 2.5 Flash: ~$0.075/M input tokens (as of 2025). A typical session: ~3000 tokens → ~$0.0002
- Gemini 2.5 Pro: only for Vision Agent → limits Pro usage to 1 call per session
- Qdrant: free tier (1GB) — sufficient for 10,000 session embeddings
- Supabase: free tier — 500MB DB, 1GB file storage
- Cloudflare R2: free tier — 10GB, zero egress fees
- **Estimated cost per student session: ~$0.001**

## Deployment Strategy

**Development:**
- Backend: Railway.app (free tier, FastAPI container)
- Frontend: Vercel (free tier, Next.js)
- Qdrant: Qdrant Cloud free tier

**Production (post-hackathon):**
- Backend: Fly.io (scales to zero)
- Vector DB: Qdrant Cloud standard
- Database: Supabase Pro

## Security Considerations

- All API routes require Supabase JWT
- Student data partitioned strictly by `student_id` in all queries
- Image uploads virus-scanned before processing (ClamAV or Cloudflare Gateway)
- On-chain wallet addresses never stored in plaintext — hashed
- All agent prompts hardened against prompt injection (input sanitization before LLM calls)
- Rate limiting: 10 requests/minute per student (prevents abuse)

---

# 6. DATABASE DOCUMENT

## Complete Schema

```sql
-- ============================================
-- USERS & AUTH
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_auth_id UUID UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    grade_level TEXT,           -- 'class_10', 'class_11', 'undergraduate', etc.
    curriculum TEXT DEFAULT 'ncert',  -- 'ncert', 'mext', 'ib', 'cbse'
    language TEXT DEFAULT 'en',       -- 'en', 'hi', 'ja', 'ta'
    visual_impairment_type TEXT,      -- 'blind', 'low_vision', 'other'
    wallet_address TEXT,              -- Base L2 wallet (optional, for Web3)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_supabase_auth ON users(supabase_auth_id);

-- ============================================
-- LEARNING SESSIONS
-- ============================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url TEXT,                   -- Cloudflare R2 URL
    diagram_type TEXT,                -- 'circuit_diagram', 'geometry', 'graph', etc.
    subject TEXT,                     -- 'physics', 'mathematics', 'biology', etc.
    key_concepts TEXT[],              -- array of concept tags
    status TEXT DEFAULT 'active',     -- 'active', 'completed', 'abandoned'
    duration_seconds INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_concepts ON sessions USING GIN(key_concepts);

-- ============================================
-- SESSION EVENTS (explanation, quiz, feedback)
-- ============================================

CREATE TABLE session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,         -- 'explanation', 'question', 'quiz_q', 'quiz_a', 'feedback'
    agent_source TEXT,                -- which agent generated this
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',      -- structured data (quiz scores, concept tags, etc.)
    sequence_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_events_session ON session_events(session_id);
CREATE INDEX idx_session_events_type ON session_events(event_type);

-- ============================================
-- TOPIC MASTERY
-- ============================================

CREATE TABLE topic_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL,           -- 'kirchhoffs_voltage_law', 'parallel_resistance', etc.
    subject TEXT NOT NULL,
    curriculum TEXT NOT NULL,
    mastery_score DECIMAL(4,3) DEFAULT 0.000,  -- 0.000 to 1.000
    session_count INTEGER DEFAULT 0,
    quiz_attempts INTEGER DEFAULT 0,
    quiz_avg_score DECIMAL(4,3),
    last_retention_score DECIMAL(4,3),
    first_encountered_at TIMESTAMPTZ DEFAULT NOW(),
    last_reviewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, topic_id)
);

CREATE INDEX idx_mastery_student ON topic_mastery(student_id);
CREATE INDEX idx_mastery_topic ON topic_mastery(topic_id);
CREATE INDEX idx_mastery_score ON topic_mastery(mastery_score);

-- ============================================
-- STUDENT MISCONCEPTIONS
-- ============================================

CREATE TABLE misconceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL,
    description TEXT NOT NULL,        -- "Confuses EMF with terminal voltage"
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_session_id UUID REFERENCES sessions(id),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_misconceptions_student ON misconceptions(student_id);
CREATE INDEX idx_misconceptions_active ON misconceptions(is_active);

-- ============================================
-- CURRICULUM TOPIC GRAPH
-- ============================================

CREATE TABLE curriculum_topics (
    id TEXT PRIMARY KEY,              -- 'kirchhoffs_voltage_law'
    display_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    curriculum TEXT NOT NULL,
    grade_level TEXT,
    description TEXT
);

CREATE TABLE topic_prerequisites (
    topic_id TEXT NOT NULL REFERENCES curriculum_topics(id),
    prerequisite_id TEXT NOT NULL REFERENCES curriculum_topics(id),
    PRIMARY KEY (topic_id, prerequisite_id)
);

-- ============================================
-- CREDENTIALS (On-Chain Records)
-- ============================================

CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT NOT NULL,
    credential_type TEXT NOT NULL,    -- 'topic_mastery', 'subject_completion', 'curriculum_badge'
    mastery_score_at_issue DECIMAL(4,3),
    blockchain TEXT DEFAULT 'base',
    contract_address TEXT,
    token_id TEXT,                    -- SBT token ID on-chain
    transaction_hash TEXT,
    ipfs_metadata_uri TEXT,           -- Points to credential metadata on IPFS
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending',    -- 'pending', 'issued', 'failed'
    UNIQUE(student_id, topic_id, credential_type)
);

CREATE INDEX idx_credentials_student ON credentials(student_id);
CREATE INDEX idx_credentials_status ON credentials(status);

-- ============================================
-- STUDENT PLANNER STATE
-- ============================================

CREATE TABLE planner_state (
    student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    curriculum TEXT NOT NULL,
    current_topic_id TEXT,
    completed_topics TEXT[] DEFAULT '{}',
    recommended_next TEXT[] DEFAULT '{}',
    progress_percent DECIMAL(5,2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER planner_updated_at BEFORE UPDATE ON planner_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Supabase Implementation Notes

- Enable Row Level Security (RLS) on all tables
- RLS policy: `student_id = auth.uid()` on all student-facing tables
- Supabase Storage bucket: `diagrams` (private, per-user prefix)
- Supabase Realtime: subscribe to `credentials` table for live credential issuance notification
- Use Supabase Edge Functions for the async memory write job (runs post-session)

---

# 7. API DOCUMENT

## Authentication

All endpoints require `Authorization: Bearer <supabase_jwt>` header.

Student ID is extracted from JWT `sub` claim, never from request body.

---

## Sessions API

### POST /api/sessions/start

Start a new learning session with a diagram upload.

**Request:**
```http
POST /api/sessions/start
Content-Type: multipart/form-data
Authorization: Bearer <jwt>

{
  "image": <file>,
  "subject": "physics",      // optional
  "grade_level": "class_10"  // optional
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "status": "processing",
  "stream_url": "/api/sessions/uuid/stream"
}
```

---

### GET /api/sessions/:id/stream

SSE stream of agent explanation segments.

**Response (event stream):**
```
data: {"type":"explanation","segment_id":"s1","text":"This diagram shows a parallel circuit...","concept_tags":["parallel_circuits"],"order":1}

data: {"type":"explanation","segment_id":"s2","text":"Starting from the 12V battery on the left...","concept_tags":["voltage_source"],"order":2}

data: {"type":"session_ready_for_quiz","message":"Explanation complete. Say 'quiz me' to test your understanding."}

data: {"type":"done"}
```

---

### POST /api/sessions/:id/question

Student asks a follow-up question during a session.

**Request:**
```json
{
  "question": "Can you explain Kirchhoff's law again differently?"
}
```

**Response (SSE stream):** Same format as above, `type: "follow_up_explanation"`

---

### POST /api/sessions/:id/quiz/start

Trigger quiz for current session.

**Response:**
```json
{
  "quiz_id": "uuid",
  "question_count": 3,
  "first_question": {
    "id": "q1",
    "text": "What is the total voltage in the circuit we just studied?",
    "difficulty": 1
  }
}
```

---

### POST /api/sessions/:id/quiz/:quiz_id/answer

Submit voice-transcribed answer to a quiz question.

**Request:**
```json
{
  "question_id": "q1",
  "answer_text": "twelve volts"
}
```

**Response:**
```json
{
  "is_correct": true,
  "feedback": "Correct! The battery provides 12V.",
  "partial_credit": 1.0,
  "next_question": {
    "id": "q2",
    "text": "..."
  }
}
```

---

### GET /api/sessions/:id/summary

Get full session summary after completion.

**Response:**
```json
{
  "session_id": "uuid",
  "diagram_type": "circuit_diagram",
  "key_concepts": ["Ohm's Law", "parallel_resistance"],
  "quiz_score": 0.85,
  "mastery_update": {
    "Ohm's Law": {"before": 0.72, "after": 0.81},
    "parallel_resistance": {"before": 0.0, "after": 0.55}
  },
  "credential_issued": false,
  "recommended_next": "Kirchhoff's Current Law",
  "duration_seconds": 420
}
```

---

## Student API

### GET /api/student/profile

Get student profile and overall progress.

**Response:**
```json
{
  "id": "uuid",
  "display_name": "Arjun",
  "curriculum": "ncert",
  "progress_percent": 34.5,
  "total_sessions": 12,
  "credentials_earned": 3,
  "current_topic": "Kirchhoff's Current Law"
}
```

---

### GET /api/student/mastery

Get all topic mastery scores.

**Response:**
```json
{
  "topics": [
    {
      "topic_id": "ohms_law",
      "display_name": "Ohm's Law",
      "mastery_score": 0.81,
      "sessions": 3,
      "credential_issued": true
    }
  ]
}
```

---

## Credentials API

### GET /api/credentials

List all issued credentials for the authenticated student.

**Response:**
```json
{
  "credentials": [
    {
      "id": "uuid",
      "topic": "Ohm's Law",
      "mastery_score": 0.83,
      "issued_at": "2025-01-15T10:30:00Z",
      "blockchain": "base",
      "token_id": "42",
      "transaction_hash": "0xabc...",
      "ipfs_uri": "ipfs://Qm...",
      "verify_url": "https://hikari.app/verify/uuid"
    }
  ]
}
```

---

### GET /api/credentials/verify/:credential_id

Public endpoint — no auth required. Verify a credential.

**Response:**
```json
{
  "valid": true,
  "student_name": "Arjun S.",
  "topic": "Ohm's Law",
  "mastery_score": 0.83,
  "issued_at": "2025-01-15",
  "blockchain_verified": true,
  "contract_address": "0x...",
  "token_id": "42"
}
```

---

## Error Handling

All errors follow:
```json
{
  "error": {
    "code": "VISION_AGENT_FAILED",
    "message": "Could not analyze the uploaded image. Please try a clearer photo.",
    "retryable": true
  }
}
```

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `SESSION_NOT_FOUND` | 404 | Session doesn't exist or wrong owner |
| `IMAGE_TOO_BLURRY` | 422 | Vision agent couldn't process image |
| `QUOTA_EXCEEDED` | 429 | Too many requests |
| `AGENT_TIMEOUT` | 504 | Agent pipeline took too long |
| `BLOCKCHAIN_PENDING` | 202 | Credential queued, not yet confirmed |

---

# 8. WEB3 ARCHITECTURE DOCUMENT

## Why Blockchain Is Necessary Here

This is not a "we added blockchain" situation. The problem is **credential portability and trust**.

A student learns a topic via Hikari. They want to:
- Show a university they've mastered Class 10 Physics circuits
- Transfer their learning record to a new school
- Prove to a scholarship committee they've completed X topics

If credentials live in Hikari's database, they're:
- Revokable by Hikari
- Unverifiable by third parties without API access
- Lost if Hikari shuts down
- Forgeable

On-chain Soul-Bound Tokens (SBTs) solve all of these. The credential lives on the blockchain permanently, is non-transferable (can't sell a learning achievement), publicly verifiable, and independent of Hikari's infrastructure.

**This is the same reason MIT issues blockchain diplomas. We're doing it for STEM topic mastery.**

---

## Blockchain Choice: Base L2

**Why Base over Polygon or Solana:**

| | Base | Polygon | Solana |
|---|---|---|---|
| Gas fees | ~$0.001 | ~$0.001 | ~$0.0001 |
| EVM compatible | ✓ | ✓ | ✗ |
| Developer tooling | Excellent (Coinbase backing) | Good | Good but different |
| Farcaster/social integration | ✓ (future potential) | ✗ | ✗ |
| Stability | Very high | High | Historically unstable |
| Free testnet | ✓ (Base Sepolia) | ✓ | ✓ |

**Decision: Base L2.** EVM compatibility means we can use existing Solidity tooling. Coinbase's backing ensures uptime. Gas fees are negligible for credential issuance (we're not doing DeFi).

---

## Smart Contract Architecture

### Contract 1: HikariSBT.sol (Soul-Bound Token)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HikariSBT is ERC721, Ownable {
    
    struct LearningCredential {
        string studentId;      // Hikari student UUID (hashed)
        string topicId;        // e.g., "ohms_law"
        string topicName;      // e.g., "Ohm's Law"
        string subject;        // e.g., "physics"
        string curriculum;     // e.g., "ncert"
        uint256 masteryScore;  // scaled x1000 (e.g., 830 = 0.830)
        uint256 issuedAt;
        string metadataUri;    // IPFS URI with full credential JSON
    }
    
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => LearningCredential) public credentials;
    mapping(address => uint256[]) public studentTokens;
    
    // Events
    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed student,
        string topicId,
        uint256 masteryScore
    );
    
    constructor() ERC721("HikariLearning", "HIKARI") Ownable(msg.sender) {}
    
    // SOUL-BOUND: Override transfers to prevent selling/trading
    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Only allow minting (from == address(0)), block all transfers
        require(from == address(0), "Hikari: SBT cannot be transferred");
        return super._update(to, tokenId, auth);
    }
    
    // Issue credential — only callable by Hikari backend (owner)
    function issueCredential(
        address student,
        string memory studentId,
        string memory topicId,
        string memory topicName,
        string memory subject,
        string memory curriculum,
        uint256 masteryScore,
        string memory metadataUri
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(student, tokenId);
        
        credentials[tokenId] = LearningCredential({
            studentId: studentId,
            topicId: topicId,
            topicName: topicName,
            subject: subject,
            curriculum: curriculum,
            masteryScore: masteryScore,
            issuedAt: block.timestamp,
            metadataUri: metadataUri
        });
        
        studentTokens[student].push(tokenId);
        
        emit CredentialIssued(tokenId, student, topicId, masteryScore);
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return credentials[tokenId].metadataUri;
    }
    
    function getStudentCredentials(address student) external view returns (uint256[] memory) {
        return studentTokens[student];
    }
    
    function verifyCredential(uint256 tokenId) external view returns (
        bool valid,
        string memory topicId,
        uint256 masteryScore,
        uint256 issuedAt
    ) {
        return (
            _ownerOf(tokenId) != address(0),
            credentials[tokenId].topicId,
            credentials[tokenId].masteryScore,
            credentials[tokenId].issuedAt
        );
    }
}
```

### IPFS Metadata Schema (stored at metadataUri)

```json
{
  "name": "Ohm's Law — Mastery Credential",
  "description": "Verifiable proof of STEM concept mastery issued by Hikari",
  "image": "ipfs://Qm.../badge_ohms_law.png",
  "attributes": [
    {"trait_type": "Subject", "value": "Physics"},
    {"trait_type": "Topic", "value": "Ohm's Law"},
    {"trait_type": "Curriculum", "value": "NCERT Class 10"},
    {"trait_type": "Mastery Score", "value": "83%"},
    {"trait_type": "Sessions Completed", "value": "3"},
    {"trait_type": "Issued By", "value": "Hikari Learning"},
    {"trait_type": "Verification", "value": "https://hikari.app/verify/42"}
  ],
  "hikari": {
    "student_id_hash": "sha256_of_student_uuid",
    "quiz_avg": 0.85,
    "retention_verified": true,
    "issued_at": "2025-01-15T10:30:00Z"
  }
}
```

---

## Backend Web3 Service

```python
# web3/credential_service.py

from web3 import Web3
import json, os

class CredentialService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(os.getenv("BASE_RPC_URL")))
        self.contract = self.w3.eth.contract(
            address=os.getenv("CONTRACT_ADDRESS"),
            abi=json.load(open("abi/HikariSBT.json"))
        )
        self.backend_account = self.w3.eth.account.from_key(
            os.getenv("BACKEND_PRIVATE_KEY")
        )
    
    async def issue_credential(
        self,
        student_wallet: str,
        student_id: str,
        topic_id: str,
        topic_name: str,
        mastery_score: float,
        ipfs_uri: str
    ) -> str:
        tx = self.contract.functions.issueCredential(
            student_wallet,
            student_id,
            topic_id,
            topic_name,
            "physics",  # from session
            "ncert",    # from student profile
            int(mastery_score * 1000),
            ipfs_uri
        ).build_transaction({
            "from": self.backend_account.address,
            "nonce": self.w3.eth.get_transaction_count(self.backend_account.address),
            "gas": 200000,
        })
        
        signed = self.w3.eth.account.sign_transaction(tx, self.backend_account.key)
        tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return receipt.transactionHash.hex()
```

---

## User Ownership Model

- Students create a wallet (Coinbase Wallet, MetaMask, or Hikari-generated custodial wallet)
- For visually impaired users: **Hikari generates a custodial wallet by default** (zero friction)
- Student can export their private key / connect their own wallet at any time
- Credentials are non-transferable but fully owned by student address
- Student's learning history is theirs forever — even if Hikari disappears

## Custodial vs Self-Custody

Given the target user (visually impaired students, often with limited crypto knowledge):
- Default: Hikari custodial wallet (we manage key, student owns data)
- Upgrade path: "Export your wallet" in settings — generates keystore file
- This matches the UX of "sign in with Google" → own your data model

---

# 9. MVP DOCUMENT

## Scope Philosophy

Two developers, 48 hours. Cut ruthlessly. The demo must be **undeniably real** and **emotionally compelling**. A judge who sees a blind student get a clear, spoken walkthrough of a circuit diagram will remember it forever.

---

## Must-Have Features (Demo-Critical)

1. **Diagram upload + spoken explanation** — the core flow. No diagram, no Hikari.
2. **3-question adaptive quiz** — proves agent reasoning, not just captioning.
3. **One on-chain credential issuance** — live, verifiable. The "wow" moment.
4. **Voice output (TTS)** — it must be audible. This is for blind students.
5. **Voice input (STT)** — student must be able to ask a follow-up question by speaking.
6. **Student memory across sessions** — must demonstrate that Hikari *remembers*.
7. **Planner recommendation** — "Based on today's session, next learn: KCL."

## Nice-to-Have (Build if time permits)

- Teacher dashboard
- Curriculum topic map visualization
- Multiple diagram types (only do circuits for demo)
- Mobile-responsive design (build desktop-first)
- Multi-language support
- Retry/rephrase voice command

---

## Day 1 (Hours 0–24)

### Hour 0–2: Setup Sprint
- [ ] Repo created, both devs branched
- [ ] Next.js 15 + FastAPI scaffolded
- [ ] Supabase project created, schema migrated
- [ ] Gemini API keys confirmed working
- [ ] Qdrant Cloud instance spun up
- [ ] Cloudflare R2 bucket created

### Hour 2–6: Vision + Educational Agent
- [ ] Vision Agent: Gemini 2.5 Pro → structured JSON output from circuit diagram
- [ ] Educational Agent: Explanation generation from Vision output
- [ ] Basic SSE endpoint: stream explanation segments to frontend
- [ ] Frontend: image upload → SSE consumer → TTS output
- [ ] Test with 3 real circuit diagram images

### Hour 6–10: Memory Agent
- [ ] Qdrant setup: collection per student
- [ ] Session transcript embedding and upsert (post-session)
- [ ] Memory READ: top-5 relevant priors for current concept
- [ ] Verify Educational Agent uses memory context (demonstrate with 2-session test)

### Hour 10–14: Quiz Agent
- [ ] Quiz generation from Vision output + session context
- [ ] Answer evaluation (LLM-as-judge)
- [ ] Quiz API endpoints
- [ ] Frontend: voice STT → quiz answer submission → feedback TTS

### Hour 14–18: LangGraph Orchestration
- [ ] Wire all agents into LangGraph StateGraph
- [ ] Session flow: Vision → Memory → Educational → Quiz → Achievement → Planner → Memory Write
- [ ] Error handling at each node
- [ ] Test full session end-to-end

### Hour 18–24: Web3 + Achievement Agent
- [ ] Deploy HikariSBT.sol to Base Sepolia testnet
- [ ] Achievement Agent mastery calculation
- [ ] Backend credential service: issue SBT on mastery threshold
- [ ] IPFS metadata upload (use nft.storage or web3.storage free tier)
- [ ] Frontend: credential badge display with verify link

**End of Day 1:** Full pipeline working. Explanation + quiz + credential. Ugly UI is okay.

---

## Day 2 (Hours 24–48)

### Hour 24–30: Frontend Polish
- [ ] Accessible UI: all keyboard navigable, ARIA labels complete
- [ ] Diagram upload screen with voice instructions
- [ ] Session screen: streaming explanation with visual segments (for sighted judges)
- [ ] Quiz screen: voice input working smoothly
- [ ] Achievements screen: credential gallery with verify links
- [ ] "What to learn next" planner output displayed

### Hour 30–36: Planner Agent + Demo Data
- [ ] Planner Agent: topic DAG + mastery-based recommendation
- [ ] Seed 3 topics in curriculum_topics table: Ohm's Law → Kirchhoff's Voltage → Kirchhoff's Current
- [ ] Pre-load 2 "prior sessions" for demo student to show memory working
- [ ] Test: upload KCL diagram → system references prior KVL session

### Hour 36–42: Bug Fixing + Performance
- [ ] SSE streaming tested on Vercel (timeout edge cases)
- [ ] Voice TTS quality tuned (rate, pitch for clarity)
- [ ] Error states: blurry image, API timeout — user-friendly messages
- [ ] Full demo walkthrough: timed to under 5 minutes

### Hour 42–46: Demo Video + Pitch Materials
- [ ] Record demo video: blind student persona, upload circuit diagram, hear explanation, take quiz, earn credential, verify on blockchain explorer
- [ ] Architecture diagram for slides
- [ ] Pitch deck finalized (see Document 10)

### Hour 46–48: Buffer + Submission
- [ ] Final bug sweep
- [ ] Deploy to production URLs
- [ ] Submit with demo video, GitHub repo, live URL

---

## Demo Flow (5 Minutes)

**Minute 0–1:** Problem statement. "253 million people. This is what they face." Show a circuit diagram. Ask: "What does a screen reader say about this?" Play: "Figure 3.2."

**Minute 1–3:** Live demo. Upload the same circuit diagram. Hikari speaks a full explanation. Ask a follow-up question by voice: "What is Kirchhoff's law?" — Hikari remembers from a prior session and builds on it.

**Minute 3–4:** Quiz. Three questions, answered by voice, real-time evaluation. Score displayed. Mastery threshold reached.

**Minute 4–5:** Live credential issuance. Watch the SBT mint on Base Sepolia. Open BaseScan. Show the credential. Show the verify URL. "This student now owns proof of what they've learned. Forever. On-chain."

---

## Judge Wow Moments

1. **The explanation quality** — judges who know physics will be genuinely impressed at how correctly Hikari explains a complex circuit.
2. **The memory demo** — showing that session 2 skips basics and builds on session 1 is visually and technically convincing.
3. **Live blockchain tx** — watching a credential mint live on BaseScan is a hard technical proof-of-work moment.
4. **The moral weight** — "A blind student in a village in Nagpur can now learn STEM independently." Accessibility + AI + ownership is a powerful story.

---

# 10. PITCH DECK DOCUMENT

---

## Slide 1: Problem

**Headline:** Screen readers can read text. They cannot teach a circuit diagram.

**Body:**
- 253 million people have visual impairment worldwide
- STEM education is 40% visual content: diagrams, graphs, schematics, geometry
- Screen readers say: "Figure 3.2: Circuit diagram."
- That is not accessibility. That is a checkbox.
- Visually impaired STEM students depend entirely on human assistants — or drop out.

**Visual suggestion:** Split screen. Left: a complex circuit diagram. Right: what JAWS says about it. The gap is the product.

---

## Slide 2: Solution

**Headline:** Hikari — an autonomous STEM learning companion that actually teaches.

**What it does:**
- Understands any STEM diagram using multimodal AI vision
- Teaches it through structured, spoken explanation — like a patient tutor
- Remembers every student's learning history and adapts
- Quizzes understanding with diagram-aware questions
- Issues tamper-proof on-chain proof of mastery

**Tagline:** Not a screen reader. Not a chatbot. An autonomous tutor that never leaves.

---

## Slide 3: Live Demo

**Headline:** Upload a diagram. Hear a lecture.

*(Demo video embedded or live demo)*

- Student uploads photo of circuit diagram from textbook
- Hikari speaks: "This diagram shows a parallel circuit with a 12V source..."
- Student asks by voice: "What about Kirchhoff?"
- Hikari recalls: "Based on your last session, you studied KVL — let me build on that..."
- Quiz: 3 questions, voice answers, instant feedback
- Credential minted on Base L2 — live on BaseScan

---

## Slide 4: Technical Innovation

**Headline:** Six agents working in concert. No human required.

| Agent | What it does |
|---|---|
| Vision Agent | Gemini 2.5 Pro: understands diagram structure + educational content |
| Educational Agent | Generates pedagogically ordered spoken explanations |
| Memory Agent | Qdrant vector memory: persistent learning history per student |
| Quiz Agent | Diagram-aware questions with LLM-as-judge evaluation |
| Planner Agent | Curriculum-aligned topic graph, mastery-based progression |
| Achievement Agent | Verifies genuine learning, triggers on-chain credential |

**Stack:** Next.js 15 · FastAPI · LangGraph · Gemini 2.5 · Qdrant · Supabase · Base L2

---

## Slide 5: Architecture

**Headline:** A system that reasons, remembers, and teaches.

*(Include system architecture diagram from Document 3)*

Key architectural choices:
- LangGraph for deterministic multi-agent orchestration
- Gemini 2.5 Pro for vision, Flash for reasoning (cost-optimized)
- Qdrant for semantic student memory across sessions
- Base L2 Soul-Bound Tokens for permanent, portable credentials
- SSE for real-time streaming to accessible frontend

---

## Slide 6: Impact

**Headline:** 253 million people. One upload. Infinite lessons.

- **India:** 8M+ visually impaired students. NCERT diagrams are 40% of exam content.
- **Japan:** University entrance exams have diagram-heavy science sections. No independent study tool exists.
- **Cost per session:** ~$0.001 in API costs. Accessible at scale.
- **SDG alignment:** SDG 4 (Quality Education), SDG 10 (Reduced Inequalities)
- **Web3:** Students own their credentials forever. No company can revoke their learning proof.

**The moral case:** A blind student should be able to learn from a circuit diagram at 2am without waiting for anyone.

---

## Slide 7: Future

**Headline:** Hikari is the first layer of an accessible education stack.

**6 months:**
- Full NCERT Class 10 and 11 curriculum mapped
- Hindi and Japanese language support
- Mobile app with camera-first UX

**1 year:**
- Real-time classroom mode: teacher draws on board, Hikari explains simultaneously via earpiece
- University credential partnerships (accept Hikari SBTs as credit verification)
- Educator analytics dashboard

**3 years:**
- Hardware: smart glasses with Hikari embedded
- Global curriculum coverage: IB, IGCSE, MEXT
- Decentralized learner identity: your entire education history, owned by you

---

*Hikari — because light reaches everywhere.*

---

*Document compiled for FAR AWAY 2026 Hackathon. All specifications are designed for 2-developer, 48-hour implementation. Gemini 2.5, Base L2, Qdrant, and Supabase free tiers verified as of June 2026.*