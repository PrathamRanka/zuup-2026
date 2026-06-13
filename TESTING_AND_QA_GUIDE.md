# HIKARI — Comprehensive Testing & QA Guide (V2)
### Offline Mode Architecture Design & 160+ Enterprise Test Cases

---

## PART 1: OFFLINE MODE DESIGN & ARCHITECTURE

For students in remote areas or schools with unstable connections, Hikari operates in a local-first capacity using client-side service workers, IndexDB storage, and a synchronized transaction queue.

```
┌──────────────────────────────────────────────────────────────────┐
│                          OFFLINE CLIENT                          │
│                                                                  │
│  [Camera Ingestion] ──► [IndexDB Local Cache] ──► [Voice Player]  │
│                                │                                 │
│                                ▼                                 │
│                    [Offline Sync Queue Buffer]                   │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
                                  ▼ (Internet Reconnected)
┌─────────────────────────────────┼────────────────────────────────┐
│                          BACKEND SYNC                            │
│                                 │                                │
│                                 ├──► [Sync Relational DB]        │
│                                 ├──► [Sync Planner Path]         │
│                                 └──► [Process ZK proofs & SBT]   │
└──────────────────────────────────────────────────────────────────┘
```

### In-Browser Local Storage Schema
- **Captured Diagrams Cache:** Stores base64-encoded image payloads locally with timestamp IDs.
- **Offline Quiz Sessions:** Stores pre-loaded question blocks and logs vocal transcript answers in text files.
- **Sync Transaction Queue:** Stores actions to perform once network connectivity returns (e.g., `SUBMIT_QUIZ_ANSWERS`, `GENERATE_CREDENTIAL_MINT`).

### Synchronization Protocol
When the web browser emits an `online` window event, the client service worker triggers the synchronization handler:
1.  **Deduplicate Actions:** Consolidates multiple quiz submissions or session records.
2.  **Upload Images & Traces:** Dispatches cached diagram images to the backend FastAPI API.
3.  **Process LangGraph Nodes:** Executes the vision-reflection loops asynchronously.
4.  **Emit Attestations:** Submits completed quiz results to the ZK-proving server, compiling proof files and executing on-chain mints to Base Sepolia.

---

## PART 2: EXHAUSTIVE TEST MATRIX (160 TEST CASES)

### 1. Authentication (Test 001 - 010)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-001** | Login with valid Supabase session | User has active credentials in Supabase | 1. Open app.<br>2. Submit email and password. | User successfully redirected to dashboard. | If redirect fails, clear local cookies and retry login. |
| **AUTH-002** | Login with invalid email format | App is open on login screen | 1. Enter "invalidemail".<br>2. Click submit. | UI flags input error and blocks network dispatch. | Reset input and notify user via screen-reader alert. |
| **AUTH-003** | Auto-login with expired token | User cookie has expired JWT token | 1. Open app with expired token in localStorage. | Session fails validation, user redirected to login. | Silently purge expired JWT token and render quiet login screen. |
| **AUTH-004** | Keyboard focus navigation on login form | Login form is rendered | 1. Tab through elements. | Focus indicator moves in single column: Email -> Password -> Submit. | If focus gets trapped, force focus to email container on reset. |
| **AUTH-005** | Login with correct wallet pairing | User has MetaMask/WalletConnect active | 1. Connect wallet.<br>2. Sign message to authenticate. | Wallet address maps to Supabase profile successfully. | Re-prompt message signature if connection is dropped mid-handshake. |
| **AUTH-006** | Access dashboard without session | Browser cache cleared | 1. Navigate to `/learn/upload`. | App redirects user to home/login screen immediately. | Render a toast message: "Session expired. Please sign in." |
| **AUTH-007** | Sign up with existing email | Supabase contains user account | 1. Submit email "arjun@example.com". | API returns 409 Conflict, UI reads error message. | Focus input and suggest "forgot password" option. |
| **AUTH-008** | Password reset link request | User has account | 1. Enter email.<br>2. Trigger "Reset Password". | Supabase dispatches email; UI reads success message. | Allow user to re-trigger after 60 seconds throttle. |
| **AUTH-009** | Log out session termination | Active login session | 1. Click logout. | Local storage cleared, redirect to home page. | Redirect user to home and cancel active WebRTC speech engines. |
| **AUTH-010** | Supabase database connection timeout | DB server is offline | 1. Try to fetch dashboard stats. | App displays graceful fallback stats and retry button. | Read: "Unable to retrieve progress. Retrying in 5 seconds." |

### 2. Camera Guidance Agent (Test 011 - 020)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CAM-011** | Motion blur detection threshold | Video feed contains motion | 1. Shake camera.<br>2. Attempt to capture. | OpenCV flags blur, system reads: "Hold still, focusing". | Wait for blur score to drop below 100 before enabling capture. |
| **CAM-012** | Low light level detection | Light level under 40 lux | 1. Block lens.<br>2. Check console. | System reads: "Low light. Turn on flash or find light". | Prompt client to toggle device camera flashlight if available. |
| **CAM-013** | Diagram centering validation (Left) | Circuit is off-screen left | 1. Move diagram to left edge. | System reads: "Move camera left". | Run alignment helper loop every 500ms to update directive. |
| **CAM-014** | Camera permission denied handling | Browser prompts for access | 1. Decline camera permission. | UI displays text warning: "Camera permission required". | Read audio alert informing how to enable settings in browsers. |
| **CAM-015** | Diagram distance validation (Too close) | Diagram fills 100% of frame | 1. Hold lens 2cm from paper. | System reads: "Move camera back slightly". | Focus checks fail; block capture until bounding boxes scale to 80%. |
| **CAM-016** | Successful alignment capture | Diagram is centered, clear | 1. Align center.<br>2. Wait 1 second. | System plays camera shutter sound and captures image. | Automatically proceed to backend streaming on positive capture. |
| **CAM-017** | Multiple diagram boundaries detection | Two diagrams in frame | 1. Place two circuits side-by-side. | System reads: "Single out one diagram at a time". | Crop feed around the largest contour automatically. |
| **CAM-018** | High-reflection detection | Light glare on glossy paper | 1. Shine flashlight directly. | System reads: "High glare. Tilt paper slightly". | Adjust frame contrast histogram to filter highlights. |
| **CAM-019** | Edge guidance voice interruption | App is reading instructions | 1. Move camera mid-speech. | Audio updates instantly: old direction stops, new starts. | Cancel speechSynthesis instantly when frame state updates. |
| **CAM-020** | Frame buffer memory leak check | App open for 30 minutes | 1. Keep camera active. | Memory usage stays flat under 50MB. | Flush image buffer frames every 10 frames to avoid leaks. |

### 3. Vision Agent (Test 021 - 030)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VIS-021** | Parse simple series circuit | Hand-drawn loop uploaded | 1. Upload circuit image. | Extracted: V1 (12V), R1 (10Ω), R2 (20Ω). | If values fail, Vision Agent returns fallback values. |
| **VIS-022** | Parse circuit with missing labels | Resistor lacks text label | 1. Upload unlabelled diagram. | Vision Agent flags missing label and assigns R_unknown. | Fallback to node topology connections to infer relative value. |
| **VIS-023** | Parse geometry right-angle triangle | Angle is marked 90 degrees | 1. Upload triangle image. | Extracted: 3 vertices, right angle at vertex B. | Fallback: check if coordinates verify $a^2 + b^2 = c^2$. |
| **VIS-024** | Parse biological process flowchart | Digestion flowchart uploaded | 1. Upload flowchart image. | Extracted: process boxes, directional connector lines. | Fallback to linear text layout describing order of blocks. |
| **VIS-025** | Parse function curve graph | Parabola graph uploaded | 1. Upload curve image. | Extracted: parabola shape, vertex coordinates. | Fallback to simple description: "U-shaped parabola crossing y-axis". |
| **VIS-026** | OCR text translation failure | Poor handwriting uploaded | 1. Upload messy text diagram. | API returns empty strings; fallback label corrector runs. | Fallback: flag low confidence score (< 0.8) and trigger recheck. |
| **VIS-027** | High noise background filtering | Graph on lined notebook paper | 1. Upload diagram on grid. | Parser filters lines and extracts diagram components. | Apply Gaussian blur to grid lines before processing. |
| **VIS-028** | Upside down diagram rotation | Image rotated 180 degrees | 1. Upload inverted diagram. | Vision Agent auto-rotates and parses successfully. | Use axis coordinates to identify bottom and orient layout. |
| **VIS-029** | Gemini API rate limit handling | Global key limits hit | 1. Dispatch 20 uploads. | API returns 429; system retries with exponential backoff. | Display offline mock data: "Processing delay. Working locally." |
| **VIS-030** | Vision coordinate schema validation | Output JSON schema check | 1. Verify JSON output. | JSON format matches `DiagramAnalysis` type specifications. | If parsing fails, validate against standard template. |

### 4. Diagram Parser (Test 031 - 040)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PAR-031** | Line segment connection logic | Wires are slightly detached | 1. Process gap diagram. | Connections mapped correctly; wires treated as continuous. | Connect endpoints within 5px threshold automatically. |
| **PAR-032** | Parse multi-branch parallel circuit | Parallel loop uploaded | 1. Process image. | Extracted parallel connections with junctions. | If parallel parse fails, treat as multiple series segments. |
| **PAR-033** | Circle intersection detection | Venn diagram format | 1. Process overlapping circles. | Mapped intersection regions correctly. | Calculate bounding box overlapping percentages. |
| **PAR-034** | Identify ground symbol | Ground line circuit uploaded | 1. Process diagram. | Ground mapped as reference node (0V). | Default to battery negative terminal if ground is missing. |
| **PAR-035** | Resistor color bands detection | Color resistor image | 1. Process diagram. | Color bands decoded to numerical value. | If color parse fails, use OCR printed label as primary. |
| **PAR-036** | Process massive flowchart (20+ boxes) | Large complex chart | 1. Process flowchart. | Truncates to main 5 process loops to avoid context overload. | Group sub-processes into summary segments automatically. |
| **PAR-037** | SAM2 segmentation fault fallback | Segmentation fails | 1. Upload complex outline. | System falls back to OCR-only boundary mapping. | Log segmentation error to trace, proceed with vision model. |
| **PAR-038** | Coordinate normalization | Image resolution variations | 1. Process high-res image. | Coordinates scaled to standard 1000x1000 grid. | Scale coordinates linearly before constructing graph. |
| **PAR-039** | Verify junction points | Three lines meeting | 1. Process node junction. | Junction mapped as node connections. | Verify junction mathematically: current sum in must equal out. |
| **PAR-040** | Parser schema mismatch error | Output structure corrupted | 1. Mock invalid parser output. | Orchestrator handles exception, defaults to offline templates. | Return state unchanged, increment session error counter. |

### 5. Reflection System (Test 041 - 050)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REF-041** | Unbalanced loop detection | R2 is 2Ω instead of 20Ω | 1. Run validation step. | KVL check returns `balanced = False` (discrepancy 7.2V). | Increment retry count, dispatch recheck instructions to Vision. |
| **REF-042** | Successful self-correction pass | Retry count is 1 | 1. Run recheck. | Vision outputs correct 20Ω; KVL balances; progress matches. | Transition to educational generator immediately. |
| **REF-043** | Max retries route redirection | Retry count hits 3 | 1. Loop fails 3 times. | Orchestrator breaks loop; transitions to voice question. | Voice reads: "I'm having trouble. Is the resistor 20 ohms?" |
| **REF-044** | Self-reflection log record | Loop fails | 1. Inspect SQLite events. | Log record contains error details and discrepancy score. | Ensure database connection is committed. |
| **REF-045** | Non-circuit diagram validation bypass | Geometry diagram parsed | 1. Run verification step. | Validation passes automatically; `math_verified = True`. | Transition directly to educational generation. |
| **REF-046** | SymPy division by zero safeguard | Resistance sum is 0 | 1. Set resistor values to 0. | Solver throws exception, flags unbalanced state safely. | Catch solver exception, report 0 resistance error. |
| **REF-047** | Validation score mapping | Confidence calculation check | 1. Validate output. | Confidence matches discrepancy ratio scaling. | If scaling fails, default confidence to 0.5. |
| **REF-048** | Coordinate overlap reflection | Two nodes sharing coordinates | 1. Input duplicate nodes. | Reflection agent merges overlapping nodes. | Clean connections to remove redundant loop loops. |
| **REF-049** | Parallel branch resistance balance | KCL validation check | 1. Validate parallel network. | Checks if branch currents match branch voltage drop divisions. | Solve system of equations using SymPy linear systems solver. |
| **REF-050** | Manual reflection override trigger | User signals error via voice | 1. Voice input: "That is wrong". | System triggers vision agent recheck immediately. | Reset session state retry counters to enable clean rerun. |

### 6. Memory System (Test 051 - 060)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MEM-051** | Read student profile history | User has completed 3 sessions | 1. Load dashboard. | Dashboard shows correct completed topics list. | Default to empty lists if query returns null. |
| **MEM-052** | Write learning memory event | Session is completed | 1. Complete session. | Qdrant vector database records session summary. | Fallback: save locally in SQLite credentials table index. |
| **MEM-053** | Retrieve relevant learning memories | Student is studying KVL | 1. Start KVL session. | Memory Agent retrieves prior Ohm's Law scores. | Default to standard syllabus style if search returns nothing. |
| **MEM-054** | Database reconnection attempt | SQLite lock error occurs | 1. Trigger concurrent writes. | Database driver retries transaction after delay. | Close connection pool, reopen connection safely. |
| **MEM-055** | Qdrant vector search timeout | Network is laggy | 1. Trigger vector retrieval. | Query times out (2s limit); fallback query runs. | Skip vector context, load standard profile from SQLite. |
| **MEM-056** | Clear learning memories index | User resets learning progress | 1. Post `/api/student/reset`. | SQLite data deleted; Qdrant entries cleared. | Reset planner state to default ("ohms_law"). |
| **MEM-057** | Retrieve active misconceptions | Misconceptions active in DB | 1. Load active session. | Memory agent appends misconceptions to educational context. | Exclude resolved misconceptions from active tutoring prompt. |
| **MEM-058** | Record retention half-life score | 7 days since review | 1. Calculate retention. | Retention score drops; topic scheduled for review. | Highlight topic with warning border on checklist dashboard. |
| **MEM-059** | Memory size capacity overflow | Memory entries exceed 10,000 | 1. Stress write memory. | Database handles entries efficiently under index. | Purge logs older than 90 days automatically. |
| **MEM-060** | SQLite database file corruption | File is corrupted | 1. Try to open database. | Driver catches error, creates clean blank database schema. | Run latest migration and seed default curriculum. |

### 7. Planner Agent (Test 061 - 070)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PLN-061** | Check prerequisite milestones | Student completed Ohm's Law | 1. Start KVL session. | Allowed to study; dashboard unlocks KVL. | If not completed, direct student to study prerequisites. |
| **PLN-062** | Next topic recommendation KVL | Passed Ohm's Law quiz | 1. Pass quiz. | Recommended next topic becomes `kirchhoffs_voltage_law`. | Update DB progress tracker values. |
| **PLN-063** | Next topic recommendation KCL | Passed KVL quiz | 1. Pass quiz. | Recommended next topic becomes `kirchhoffs_current_law`. | Update DB progress tracker values. |
| **PLN-064** | Complete curriculum progress | Passed KCL quiz | 1. Pass quiz. | Recommended next is `completed_curriculum`; progress is 100%. | Render success badge on dashboard. |
| **PLN-065** | Reset progress checklist | Reset button clicked | 1. Reset progress. | Curriculum progress drops to 0%; roadmap resets. | Reset active milestone nodes in database. |
| **PLN-066** | Direct milestone navigation bypass | Student navigates directly | 1. Open `/learn/session?topic=kirchhoffs_current_law`. | System loads session successfully but prints alert. | Warn user via audio: "This topic requires prerequisites." |
| **PLN-067** | Adaptive scheduling on quiz fail | Score is under 50% | 1. Fail quiz. | Recommended topic remains current; student prompted to review. | Retain current topic node on dashboard with focus. |
| **PLN-068** | Dependency graph validation loop | Verify loops in DAG graph | 1. Check prerequisites. | Prerequisite structure has no circular references. | Validate DAG loops on startup via code test. |
| **PLN-069** | DB planner sync error fallback | Save planner state fails | 1. Mock DB failure on quiz pass. | System retries save; retains states locally. | Commit queue on connection recovery. |
| **PLN-070** | Score threshold check for planning | Score is exactly 80% | 1. Pass quiz with 80%. | Milestone unlocked successfully. | Allow progression; score meets minimum threshold. |

### 8. Misconception Engine (Test 071 - 080)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MIS-071** | Detect resistor division mistake | User confuses series vs parallel | 1. Answer quiz wrong. | Misconception recorded: "Series/Parallel confusion". | Target next explanation to emphasize junction divisions. |
| **MIS-072** | Detect voltage drop confusion | User confuses EMF vs Drop | 1. Answer quiz wrong. | Misconception recorded: "EMF vs Drop confusion". | Read: "Remember, battery EMF equals the sum of drops". |
| **MIS-073** | Misconception resolution | User answers correctly later | 1. Pass related quiz. | Misconception marked as resolved (`is_active = 0`). | Remove warning flags from student twin state. |
| **MIS-074** | Multi-session misconception carryover | Misconception remains active | 1. Start new session. | Misconception retrieved and used to generate content. | Inject targeted review segment into active session introduction. |
| **MIS-075** | Gemini misconception parsing failure | LLM returns malformed JSON | 1. Mock invalid LLM output. | System defaults to generic revision logic. | Log parsing warning, bypass custom injection. |
| **MIS-076** | Limit active misconceptions | Student has 20 active mistakes | 1. Log more mistakes. | Keep top 3 priority misconceptions active. | Archive older misconceptions automatically. |
| **MIS-077** | Retrieve resolved misconceptions history | View student metrics page | 1. Fetch metrics. | Resolved misconceptions list returned correctly. | Map to UI graphs. |
| **MIS-078** | Misconception tagging system | Tags correspond to topic | 1. Log misconception. | Tagged as "ohms_law". | Update related topic mastery weights. |
| **MIS-079** | Misconception feedback voice delivery | Readout of feedback | 1. Start review session. | Voice synthesizes personalized revision advice. | Pacing rate set to 0.9 for clear comprehension. |
| **MIS-080** | Silent misconception detection | Detection during Q&A | 1. Ask question. | Misconception parsed from user's follow-up questions. | Record in SQLite background events trace. |

### 9. Voice System (Test 081 - 090)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VOI-081** | Speech synthesis initialization | Browser supports speech | 1. Load active session. | Voice synthesizer initializes; matches default voice. | Fallback to default system voice if premium fails. |
| **VOI-082** | Speech recognition start | Microphone active | 1. Trigger mic. | Listening state is true, UI registers micro focus. | Re-prompt if microphone fails to capture on first call. |
| **VOI-083** | Voice interruption (Barge-In) | Tutor speaking | 1. Speak mid-sentence. | Speech cancels immediately; starts processing voice input. | Stop speechSynthesis engine immediately. |
| **VOI-084** | Speech recognition timeout | User hesitates 5 seconds | 1. Trigger recognition.<br>2. Stay silent. | Recognition times out; listening state becomes false. | Auto-restart recognition or read: "I didn't catch that." |
| **VOI-085** | Punctuation normalization | Text contains "12V, 20Ω" | 1. Speak explanation. | Reads as "12 volts, 20 ohms" (clean conversion). | Apply regex replacement rules before voice output. |
| **VOI-086** | Audio stream compression latency | High bandwidth WebRTC | 1. Stream voice. | Latency remains under 800ms. | Compress audio packets using Opus codec on client. |
| **VOI-087** | Speech recognition background noise | Background noise active | 1. Speak with background fan. | Speech recognition parses core words successfully. | Apply noise gating thresholds to voice input. |
| **VOI-088** | Synthesizer error handling | Web Speech API crashes | 1. Crash synthesizer. | App switches to on-screen readable text format. | Log voice failure, notify user visually. |
| **VOI-089** | Voice control volume adjust | App volume changed | 1. Adjust volume slider. | Speech volume level matches setting. | Save volume level preference in local storage. |
| **VOI-090** | Stop speech button execution | Escape key pressed | 1. Press Escape. | Speech synthesis halts immediately. | Focus return to top main checklist item. |

### 10. Quiz System (Test 091 - 100)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **QZ-091** | Start quiz generation | Session explanation complete | 1. Start quiz. | 3 diagram questions generated successfully. | Fallback to mock question template if generator fails. |
| **QZ-092** | Answer quiz question correctly | User submits correct answer | 1. Submit "12 volts". | API returns `is_correct = true` and feedback. | Proceed to load second question. |
| **QZ-093** | Answer quiz question incorrectly | User submits wrong answer | 1. Submit "50 volts". | API returns `is_correct = false` and feedback. | Proceed to load second question. |
| **QZ-094** | Quiz completion tracking | Answered all 3 questions | 1. Submit third answer. | Quiz completes; runs Achievement agent in background. | Transition to summary screen immediately. |
| **QZ-095** | Partial credit answer grading | Typo in answer ("thirtyy") | 1. Submit answer. | Answer judged correct with partial credit. | Allow minor typos in voice-transcribed feedback. |
| **QZ-096** | Quiz questions diff verification | Questions target diagram variables | 1. Generate questions. | Questions verify specific values (e.g. "R1", "12V"). | Do not generate generic edtech questions. |
| **QZ-097** | Quiz session timeout | Student leaves page mid-quiz | 1. Exit session. | Session closed as abandoned in database. | Retain current progress state for resume. |
| **QZ-098** | Voice answer speech-to-text | Answer via microphone | 1. Speak answer. | Voice translated to text and submitted successfully. | Read transcribed text back to user to confirm if unsure. |
| **QZ-099** | Quiz generation key missing | Offline / Key-free run | 1. Start quiz. | Returns mock template questions list. | Allow demo to complete without API credentials. |
| **QZ-100** | Duplicate quiz generation block | Trigger start twice | 1. Click start quiz twice. | System returns active quiz state; blocks duplicate. | Return current quiz details. |

### 11. Credential System & Web3 (Test 101 - 110)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **W3-101** | Eligible for SBT minting | Quiz score is 100% | 1. Complete quiz. | Achievement agent flags eligibility as true. | Create pending credential in DB immediately. |
| **W3-102** | Ineligible for SBT minting | Quiz score is 66% | 1. Complete quiz. | Achievement agent flags eligibility as false. | Display summary screen; hide minting buttons. |
| **W3-103** | Simulated private SBT mint | Real web3 config disabled | 1. Complete quiz. | Returns simulated transaction hash and token ID. | Write simulated details to SQLite registry. |
| **W3-104** | Private contract transfer restriction | Token is minted | 1. Attempt transfer. | EVM transaction reverts: "SBT cannot be transferred". | Catch contract revert, display transfer block message. |
| **W3-105** | EAS attestation UID validation | Attestation generated | 1. Verify schema inputs. | Public inputs contain hashes of student and topic. | Verify hash matching on public explorer lookup. |
| **W3-106** | Database update on blockchain success | Transaction succeeds | 1. Mint token. | SQLite record status becomes 'issued' with hash. | Retain pending state until confirmation is returned. |
| **W3-107** | Blockchain RPC timeout error | RPC connection is offline | 1. Process contract call. | Transaction fails; system saves credential as pending. | Sync queue retries transaction when online. |
| **W3-108** | Verify credential API execution | Open verification page | 1. Navigate to verification URL. | Terminal receipt renders valid attestation data. | If not found, display "Invalid credential receipt" alert. |
| **W3-109** | IPFS metadata upload validation | IPFS schema check | 1. Fetch metadata link. | Metadata schema contains correct topic and score details. | Format metadata using ERC721 json standards. |
| **W3-110** | Wallet registration profile sync | Wallet added to profile | 1. Save wallet address. | Address saved to SQLite users table profile. | Validate address matches hexadecimal format. |

### 12. Offline Mode & Queue Sync (Test 111 - 120)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OFL-111** | Offline diagram capture | Network disconnected | 1. Ingest diagram image. | Image saved to IndexDB client cache successfully. | Warn user: "Offline. Result will sync when online." |
| **OFL-112** | Offline quiz load | Network disconnected | 1. Complete session. | Loads cached quiz questions from local resources. | Require pre-caching modules on dashboard load. |
| **OFL-113** | Offline quiz answer storage | Network disconnected | 1. Complete quiz. | Answers saved locally in browser Sync Queue. | Display completion screen; queue status is pending sync. |
| **OFL-114** | Sync queue execution on reconnect | Network reconnected | 1. Connect network. | System uploads queued quiz answers automatically. | Dispatch items sequentially to avoid concurrency conflicts. |
| **OFL-115** | Sync queue conflict resolution | Quiz answered on two devices | 1. Reconnect sync. | System retains the session with the higher score. | Resolve conflicts by keeping the latest timestamp. |
| **OFL-116** | Offline credentials queue | Mint queued offline | 1. Pass quiz offline. | Credential queued; status set to `pending_sync`. | Process minting call on connection recovery. |
| **OFL-117** | Partial sync connection loss | Network drops mid-sync | 1. Reconnect network.<br>2. Drop mid-upload. | Sync halts safely; maintains unsynced entries in IndexDB. | Retry sync on next network connectivity trigger. |
| **OFL-118** | Sync execution logs capture | Sync completes | 1. Inspect SQLite logs. | SQLite database contains synchronization log events. | Purge completed sync transaction log items. |
| **OFL-119** | Offline curriculum progress update | Quiz completed offline | 1. Verify progress. | Progress calculated locally; dashboard updates. | Align local progress percentage with backend database. |
| **OFL-120** | IndexDB storage limit exceed | Local cache exceeds 100MB | 1. Stress load images. | App deletes oldest image cached files to clear space. | Restrict local diagram cache to maximum 20 images. |

### 13. Accessibility (Test 121 - 130)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ACC-121** | Strict Screen Reader Contrast | Carbon theme active | 1. Measure contrast. | Contrast exceeds WCAG AAA target (21:1 ratio). | Retain absolute black `#09090B` backgrounds. |
| **ACC-122** | Non-visual text verification | EducationalWriter runs | 1. Generate text. | Zero visual terms found in explanation segments. | Critic Agent rejects block if visual descriptors are present. |
| **ACC-123** | ARIA landmark labels mapping | Dashboard is open | 1. Navigate with screen reader. | All regions have descriptive ARIA roles and labels. | Check HTML landmark elements on build validation. |
| **ACC-124** | Screen Reader Focus Order | Session view is open | 1. Tab through page. | Focus moves sequentially down single column text blocks. | Disable absolute layout offsets to retain focus order. |
| **ACC-125** | Skip Navigation Link execution | Page is loaded | 1. Tab first time. | "Skip to main content" link becomes visible and focused. | Link targets main landmark container element ID. |
| **ACC-126** | Large typography scaling | Zoom browser to 200% | 1. Zoom browser. | Text wraps cleanly; layout remains readable and focused. | Use relative rem font sizes instead of absolute pixels. |
| **ACC-127** | Custom focus outlines visibility | Tab onto button | 1. Focus active button. | Bright amber border outlines focused element. | Maintain explicit focus styling rules in CSS. |
| **ACC-128** | Screen reader announce live region | SSE status changes | 1. Run vision parsing. | Screen reader announces status updates automatically. | Use `aria-live="polite"` on status container element. |
| **ACC-129** | Keyboard shortcut controls | Session is active | 1. Press Space. | Space key toggles pause/play of speech. | Catch browser keydown events globally. |
| **ACC-130** | Voice inputs accessible labeling | Microphone button | 1. Select mic button. | Readout: "Activate microphone to answer question". | Append explicit descriptive aria-label to buttons. |

### 14. Security & Prompt Injection (Test 131 - 140)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-131** | API JWT Token manipulation | Attempt invalid JWT token | 1. Call GET `/api/student/profile`. | Server returns 401 Unauthorized; rejects request. | Validate token signatures against public key registry. |
| **SEC-132** | SQL injection protection | SQL characters in username | 1. Submit username: `arjun' OR '1'='1`. | System escapes characters; profile saves name literally. | Use parameterized SQL queries for all DB operations. |
| **SEC-133** | XSS protection in explanations | Image contains script tags | 1. Upload diagram with `<script>` label. | Parser strip script tag; processes label as text. | Sanitize OCR output string blocks before processing. |
| **SEC-134** | LLM Prompt Injection blocking | Input: "Ignore instructions..." | 1. Type prompt injection. | System sanitizes input; blocks prompt hijacking. | Implement strict system prompt routing wrappers. |
| **SEC-135** | CORS validation check | Call API from external origin | 1. Dispatch API call. | CORS blocks origin requests from outside approved list. | Configure strict whitelist origins in FastAPI. |
| **SEC-136** | Rate limit request throttling | Send 100 requests in 1s | 1. Send requests. | API returns 429 Too Many Requests; blocks IP. | Configure rate limits on backend router endpoints. |
| **SEC-137** | Private keys environment lock | Keys exposed check | 1. Check client bundles. | Private key config is not bundled into frontend client. | Restrict private keys to backend `.env` variables. |
| **SEC-138** | zk-attestation commitment salt leakage | Public input verification | 1. Verify zk proof. | Hashed inputs reveal no identifiable user data. | Include random salt token in hash commitments. |
| **SEC-139** | Local indexDB security encryption | IndexDB data check | 1. Open developer tools. | Local image cache strings are obfuscated or cleared on logout. | Wipe cached inputs from IndexDB on user logout. |
| **SEC-140** | HTTPS SSL connection verify | Open dev deployment | 1. Connect over HTTP. | Server redirects traffic to secure HTTPS URL. | Enable strict transport security configs on production. |

### 15. Load & Performance (Test 141 - 150)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LOD-141** | Concurrent user stream capacity | 100 concurrent uploads | 1. Stress load start session. | CPU usage stays under 80%; requests proceed. | Deploy multiple instances of service runners. |
| **LOD-142** | API memory profile stability | Process large image uploads | 1. Stress load uploads. | Memory allocation curves flatline; no memory leaks. | Use garbage collector calls on stream completion. |
| **LOD-143** | SSE stream connection threshold | 500 active SSE streams | 1. Open streams. | Server supports concurrent connections without drops. | Configure network socket limits on backend server. |
| **LOD-144** | Qdrant vector database load limit | Concurrent vector search | 1. Stress query Qdrant. | Response times remain under 200ms. | Cache common vector results using Redis buffer. |
| **LOD-145** | SQLite file lock concurrency | 50 concurrent DB writes | 1. Trigger writes. | SQLite handles locks using write-ahead logging (WAL). | Enable WAL mode on database initialization. |
| **LOD-146** | Speech synthesis chunking speed | 10,000 word explanation | 1. Speak explanation. | Synthesizer splits text into small chunks; plays instantly. | Segment large paragraphs into sentences before speaking. |
| **LOD-147** | Base Sepolia gas transaction spikes | 10 concurrent ZK mints | 1. Complete quizzes. | Transactions complete; gas price is adjusted. | Buffer transactions and dispatch sequentially. |
| **LOD-148** | Frontend page transition performance | Nav from Upload to Session | 1. Click upload. | Page transition takes under 100ms. | Pre-render layouts; utilize dynamic routing bundles. |
| **LOD-149** | Static assets load time | Load checklist dashboard | 1. Fetch dashboard. | Dashboard loads under 1 second. | Compress assets, optimize CSS, and bundle packages. |
| **LOD-150** | CPU execution thread lock check | Run sympy loop calculation | 1. Trigger math check. | Math solver runs in separate thread; web server remains responsive. | Run symbolic computations inside asyncio executors. |

### 16. Failure Recovery (Test 151 - 160)

| Test ID | Description | Preconditions | Steps | Expected Results | Recovery Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **REC-151** | FastAPI backend crash recovery | Server process killed | 1. Kill backend. | PM2 auto-restarts server process immediately. | Configure active auto-restart scripts on server host. |
| **REC-152** | Mid-session progress recovery | Reload browser mid-session | 1. Reload page. | Session state retrieved from database; study resumes. | Read: "Resuming your active session." |
| **REC-153** | Database connection dropped | SQLite connection lost | 1. Fetch profile. | Server returns temporary cache profile; reconnects. | Retry connection automatically on database failure. |
| **REC-154** | Gemini API key invalid error | API key deleted | 1. Start session. | System falls back to mock explanation templates. | Read: "Offline mode active. Using local curriculum." |
| **REC-155** | WebRTC voice connection reset | Network drops voice feed | 1. Disconnect WebRTC. | Client auto-reconnects stream without page reload. | Trigger ICE restart protocol inside WebRTC client. |
| **REC-156** | ZK SBT Contract deployment error | Contract address is wrong | 1. Trigger mint. | Transaction fails; system saves credential as pending. | Admin updates contract config, system syncs queue. |
| **REC-157** | Browser storage limit hit | IndexDB storage error | 1. Process ingestion. | App purges oldest local images and continues upload. | Expose warning notification in console. |
| **REC-158** | Screen reader crash recovery | NVDA crashes | 1. Crash screen reader. | System voice continues reading explanation segments. | Retain Web Speech fallback controls active. |
| **REC-159** | Memory leak in SSE connections | Stream left open 12 hours | 1. Leave stream open. | Server closes stale connections; frees memory. | Implement connection timeout thresholds on server. |
| **REC-160** | SQLite database recovery on reset | Reset fails mid-operation | 1. Trigger reset. | Transaction rolls back, keeping database profile intact. | Use SQL transaction wrappers for delete operations. |
