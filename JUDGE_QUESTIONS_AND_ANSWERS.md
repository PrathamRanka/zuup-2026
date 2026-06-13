# HIKARI — Hackathon & Investor Q&A Guide (V2)
### 100 Judge Questions, Ideal Answers, & Technical Defenses

---

## CATEGORY 1: TECHNICAL (Q1 – Q10)

### Q1: How do you handle diagram parsing when connection bandwidth drops significantly on the edge?
- **Ideal Answer:** The client app utilizes a local OpenCV frame validation script on the browser using WebAssembly. This ensures that blur and alignment checks run locally before the image is compressed and sent to the server. If the network is offline, the image is stored in IndexedDB.
- **Follow-up Answer:** Upon reconnection, the synchronization queue uploads the compressed image in the background, minimizing bandwidth usage.
- **Technical Justification:** WebAssembly-compiled OpenCV scripts reduce data overhead because the client only dispatches valid, high-contrast, cropped images to the backend.

### Q2: What prevents your system from running into infinite execution loops when resolving an unbalanced circuit?
- **Ideal Answer:** The orchestrator agent limits the self-correction loop to 3 retries. If the circuit doesn't balance after the third pass, it flags the discrepancy and prompts the student via voice.
- **Follow-up Answer:** Storing the error trace in SQLite helps us debug failure trends.
- **Technical Justification:** Adding a loop counter limit prevents API runtime timeouts.

### Q3: Why did you build the backend with FastAPI and Server-Sent Events (SSE) instead of traditional HTTP polling?
- **Ideal Answer:** SSE provides a persistent, unidirectional push connection. This allows the backend to stream parsing updates and explanation segments instantly with low overhead.
- **Follow-up Answer:** It avoids the connection-handshake latency of repetitive HTTP requests.
- **Technical Justification:** SSE uses a single persistent TCP connection, keeping server memory overhead low compared to WebSockets.

### Q4: How is the NetworkX graph representation structured for circuit diagrams?
- **Ideal Answer:** We build an adjacency list representing junctions as graph vertices, and components as edges labeled with impedance/voltage values.
- **Follow-up Answer:** This allows us to run standard graph traversal algorithms (DFS/BFS) to identify loops.
- **Technical Justification:** Defining nodes as junctions and components as edges aligns directly with Kirchhoff’s Voltage Law loop calculations.

### Q5: How do you normalize hand-drawn circuit lines versus clean textbook illustrations?
- **Ideal Answer:** We run Segment Anything 2 (SAM2) visual mask regions on the image, extracting clean bounding boxes for components and treating remaining traces as connecting wires.
- **Follow-up Answer:** Gaps under 5 pixels are connected automatically to form continuous paths.
- **Technical Justification:** Distance-threshold checks merge disconnected lines, reducing visual noise.

### Q6: How do you prevent thread blocking when running SymPy equations validation on FastAPI?
- **Ideal Answer:** SymPy solver processes are run asynchronously using Python's `asyncio` loop executors.
- **Follow-up Answer:** Stale solver threads are automatically terminated after a 2-second timeout.
- **Technical Justification:** Delegating calculations to thread pools prevents math execution from blocking the event loop.

### Q7: What is the database connection strategy to prevent write locks during high concurrent loads?
- **Ideal Answer:** We configure the SQLite database to run in Write-Ahead Logging (WAL) mode.
- **Follow-up Answer:** This allows concurrent reads while a write transaction is executing.
- **Technical Justification:** WAL mode avoids write-lock blockages.

### Q8: How does your frontend render equations without slowing down the screen-reader focus flow?
- **Ideal Answer:** We convert LaTeX equations into clean text strings (e.g. "x squared equals four") instead of rendering visual-only MathML equations.
- **Follow-up Answer:** Screen readers process plain text blocks linearly without get trapped in equation containers.
- **Technical Justification:** Plain text alternatives bypass the inconsistent rendering of math tags in older screen readers.

### Q9: How are the IPFS metadata schemas structured for SBT validation?
- **Ideal Answer:** Metadata follows standard ERC721 metadata JSON schemas, containing the topic name, hashed student ID, and IPFS URI.
- **Follow-up Answer:** This allows marketplaces like OpenSea to render the credential badge correctly.
- **Technical Justification:** Standardizing JSON schemas ensures compatibility with indexers.

### Q10: How do you calculate the Ebbinghaus retention decay curve for students?
- **Ideal Answer:** We apply the half-life equation $R = e^{-t/S}$, where $S$ is the student's mastery score and $t$ is the time since their last review.
- **Follow-up Answer:** When the score drops below 0.6, we schedule the topic for review on their dashboard.
- **Technical Justification:** Dynamic scheduler checks update topic weights in the database after every session.

---

## CATEGORY 2: AI (Q11 – Q20)

### Q11: Why use Gemini 2.5 Pro instead of smaller open-source vision models like LLaVA?
- **Ideal Answer:** Gemini 2.5 Pro offers higher reasoning accuracy for spatial coordinates and supports large context windows for processing textbook pages.
- **Follow-up Answer:** Once the system is stable, we plan to fine-tune LLaVA on our parsed coordinate schemas to reduce API costs.
- **Technical Justification:** Pro's structured JSON output minimizes JSON validation errors.

### Q12: How do you prevent Gemini from hallucinating components not present in the diagram?
- **Ideal Answer:** We restrict the vision prompt to return a strict list of coordinates and component labels, sanitizing the output against a predefined set of labels.
- **Follow-up Answer:** The Critic Agent audits the outputs, stripping out items without coordinates.
- **Technical Justification:** Validation rules block unmapped components from passing to the graph construction step.

### Q13: What embeddings model do you use in Qdrant for semantic search?
- **Ideal Answer:** We use `text-embedding-004` from Google AI Studio. It is free-tier compatible and offers solid semantic search performance.
- **Follow-up Answer:** We generate 384-dimension vectors to keep memory usage low.
- **Technical Justification:** Shorter vector lengths speed up search lookups in Qdrant.

### Q14: How does the Educational Agent adapt its explanation to match the student's learning style?
- **Ideal Answer:** The agent queries prior learning records from memory and adjusts the description style (e.g., step-by-step or analogical).
- **Follow-up Answer:** This helps clear up specific misconceptions flagged in their profile.
- **Technical Justification:** Context injection structures the prompt based on active database flags.

### Q15: How does the Critic Agent detect and remove visual references from explanations?
- **Ideal Answer:** We scan the generated text against a list of visual terms (e.g. "red wire", "look at the left").
- **Follow-up Answer:** If visual references are found, the Critic Agent flags the block for a rewrite.
- **Technical Justification:** Pattern-matching rules ensure WCAG AAA text compliance.

### Q16: How does the Assessment Agent calibrate question difficulty?
- **Ideal Answer:** Question difficulty scales (1 to 3) based on the student's average quiz scores.
- **Follow-up Answer:** If a student scores under 60%, the system drops the difficulty of the next question.
- **Technical Justification:** Difficulty variables map directly to question generation prompts.

### Q17: Why use LLM-as-a-judge for grading conversational answers instead of keyword matching?
- **Ideal Answer:** Spoken answers transcribed by voice-to-text contain minor typos or variations. An LLM can evaluate conceptual accuracy regardless of phrasing.
- **Follow-up Answer:** It allows us to award partial credit for partially correct answers.
- **Technical Justification:** Semantic evaluation handles input variance better than strict string matching.

### Q18: What is your mitigation strategy if Google AI Studio API key limits are hit mid-session?
- **Ideal Answer:** The backend catches 429 rate limit exceptions and switches the session to offline mock templates.
- **Follow-up Answer:** The user is notified via audio: "Using cached learning modules."
- **Technical Justification:** Fallback routes keep the app functional during API drops.

### Q19: How do you evaluate the quality of the generated coordinate translations?
- **Ideal Answer:** We evaluate the parser's coordinates against a benchmark set of 100 annotated STEM diagrams.
- **Follow-up Answer:** We use IoU (Intersection over Union) metrics to check spatial accuracy.
- **Technical Justification:** Automated testing runs verify parser accuracy on new code deployments.

### Q20: Can your engine parse biology cycle diagrams (like the carbon cycle)?
- **Ideal Answer:** Yes. The Vision Agent identifies process blocks, labels, and flow directions, representing them as a Directed Acyclic Graph (DAG) for step-by-step walk-throughs.
- **Follow-up Answer:** This allows us to walk students through the diagram sequentially.
- **Technical Justification:** Nodes represent stages, and directed edges represent flow pathways.

---

## CATEGORY 3: AGENTS (Q21 – Q30)

### Q21: What is the architectural difference between your LangGraph setup and a linear pipeline?
- **Ideal Answer:** A linear pipeline runs steps sequentially without validation. Our LangGraph setup uses cyclic loops, allowing the Reflection Agent to send feedback back to the Vision Agent if calculations don't balance.
- **Follow-up Answer:** This mimics human self-reflection and catches errors before they reach the student.
- **Technical Justification:** Conditional routing nodes allow state updates to loop back to prior steps.

### Q22: How do you manage state sharing across the 14 agents?
- **Ideal Answer:** We use a centralized `HikariState` dictionary to store all session variables.
- **Follow-up Answer:** This ensures that agents only access variables relevant to their task.
- **Technical Justification:** Encapsulated state dictionaries keep memory usage clean and make testing easier.

### Q23: How does the Camera Guidance Agent decide when to trigger an image capture?
- **Ideal Answer:** The agent monitors the video stream. When blur scores and light levels stabilize and the diagram is centered, it automatically triggers a capture.
- **Follow-up Answer:** This removes the need for blind users to find and click a manual shutter button.
- **Technical Justification:** Stream state calculations run locally to minimize lag.

### Q24: What is the role of the Misconception Agent in the overall pipeline?
- **Ideal Answer:** It analyzes quiz responses to find conceptual gaps, recording active mistakes in the database.
- **Follow-up Answer:** The Educational Agent uses these flags to adapt future explanation scripts.
- **Technical Justification:** Isolating misconception tracking keeps the main planner agent logic focused.

### Q25: Why is the Voice Agent decoupled from the primary LangGraph flow?
- **Ideal Answer:** Decoupling the Voice Agent allows it to act as an asynchronous interrupt handler, instantly pausing speech output when user voice activity is detected.
- **Follow-up Answer:** This keeps voice controls responsive even when the main agent graph is busy.
- **Technical Justification:** Independent thread handlers bypass state blockages.

### Q26: How does the Critic Agent evaluate the output of the Educational Agent?
- **Ideal Answer:** The Critic Agent acts as an automated editor, auditing descriptions against accessibility rules and formatting text for text-to-speech.
- **Follow-up Answer:** It ensures that descriptions remain clear and avoid visual-only references.
- **Technical Justification:** Filtering output text blocks prevents visual descriptions from reaching screen readers.

### Q27: How does the Planner Agent calculate curriculum progression?
- **Ideal Answer:** It checks the count of mastered topic IDs against the total curriculum topics list.
- **Follow-up Answer:** If a student passes KVL, it recommends KCL next.
- **Technical Justification:** Progress calculations run on SQLite tables after every quiz submission.

### Q28: How does the Credential Agent verify zk-proof eligibility?
- **Ideal Answer:** It checks if the final quiz score stored in the session state is $\ge 80\%$.
- **Follow-up Answer:** If eligible, it triggers proof generation; if not, it blocks contract calls.
- **Technical Justification:** Score checks run before transaction execution.

### Q29: What happens if the Reflection Agent incorrectly rejects a valid diagram?
- **Ideal Answer:** The retry counter increment prevents infinite loops, defaulting the state to bypass validation after 3 attempts.
- **Follow-up Answer:** This ensures the student can still access the diagram explanation.
- **Technical Justification:** Fallback routing paths guarantee system availability.

### Q30: How do you test the interaction boundaries between agents?
- **Ideal Answer:** We run integration tests that mock agent inputs and verify that outputs match the target state schema.
- **Follow-up Answer:** This ensures state transitions remain correct.
- **Technical Justification:** Type assertions validate schemas across nodes.

---

## CATEGORY 4: ACCESSIBILITY (Q31 – Q40)

### Q31: How do you verify that your frontend meets WCAG AAA standards?
- **Ideal Answer:** We run automated audits using tools like Axe-core, and manually verify that colors maintain a strict 21:1 contrast ratio.
- **Follow-up Answer:** We also ensure all elements are keyboard-navigable.
- **Technical Justification:** Strict carbon-black styling (`#09090B`) ensures high contrast.

### Q32: Why do you avoid using multiple columns in your page layouts?
- **Ideal Answer:** Screen readers process layouts linearly. Multi-column designs can cause focus traversal to jump around randomly.
- **Follow-up Answer:** A single-column design guarantees a clear reading path.
- **Technical Justification:** Linear DOM layouts prevent focus traps.

### Q33: How does client-side voice barge-in handle delayed STT processing?
- **Ideal Answer:** The frontend cancels speech synthesis immediately on mic activation, holding the UI in a loading state while STT runs.
- **Follow-up Answer:** This stops the tutor from talking over the user.
- **Technical Justification:** Immediate cancellation triggers keep voice interactions feeling responsive.

### Q34: What keyboard shortcut controls are mapped for blind students?
- **Ideal Answer:** Pressing `Space` pauses/plays text-to-speech, and `Enter` triggers mic recording.
- **Follow-up Answer:** This removes the need to navigate the page using the mouse.
- **Technical Justification:** Global keydown event listeners handle shortcut triggers.

### Q35: How do you format math equations for screen readers?
- **Ideal Answer:** We translate equations into plain-text descriptive strings instead of using complex MathML tags.
- **Follow-up Answer:** For example, $V = I R$ is read as "Voltage equals current times resistance."
- **Technical Justification:** Text conversion ensures consistent readout across different screen readers.

### Q36: How does the system handle students with tremors who struggle to hold the camera steady?
- **Ideal Answer:** The Camera Guidance Agent calculates motion blur and delays capture until the feed stabilizes.
- **Follow-up Answer:** We suggest using cheap phone stands to keep the camera steady.
- **Technical Justification:** Image frame buffering checks variance before triggering capture.

### Q37: Why are visual diagram previews hidden on the active learning screen?
- **Ideal Answer:** The page is designed for visually impaired users. Removing visual elements prevents clutter and keeps the screen-reader focus on text descriptions.
- **Follow-up Answer:** Sighted tutors can toggle the diagram preview if needed.
- **Technical Justification:** Hiding visual elements speeds up DOM rendering.

### Q38: How do you announce status updates to screen-reader users in real time?
- **Ideal Answer:** We use an element with `aria-live="polite"` to wrap our status messages.
- **Follow-up Answer:** The screen reader reads out messages (e.g. "Vision parsing...") without interrupting active speech.
- **Technical Justification:** Aria live regions announce updates dynamically.

### Q39: How do you ensure your audio cues are understandable in noisy classrooms?
- **Ideal Answer:** We set our voice speed to 0.95 and use clear, distinct pitch ranges for speech.
- **Follow-up Answer:** We recommend students use bone-conduction headphones.
- **Technical Justification:** Pacing adjustments improve speech comprehension.

### Q40: How do blind users navigate your verification receipt page?
- **Ideal Answer:** The page is structured like a vertical list, using clear text markers to separate fields like Transaction Hash and Attestation UID.
- **Follow-up Answer:** This layout mimics a standard print receipt in text format.
- **Technical Justification:** Pre-formatted tag styling ensures clean, linear layout readout.

---

## CATEGORY 5: PRODUCT (Q41 – Q50)

### Q41: How does Hikari prevent competitive cloning by big edtech platforms?
- **Ideal Answer:** Our product moat is built on our cyclic math-verification loop and active misconception modeling. Standard platforms focus on flat OCR wrappers.
- **Follow-up Answer:** Our ZK-SBT attestation pipeline provides direct institutional integrations that are hard to replicate.
- **Technical Justification:** Combining SymPy verification with student digital twins creates a highly defensible platform.

### Q42: What is your primary metric for user engagement?
- **Ideal Answer:** We track the number of successfully completed diagram tutoring sessions per week.
- **Follow-up Answer:** We also monitor quiz success rates.
- **Technical Justification:** Relational database counts track active sessions weekly.

### Q43: How do you choose which educational curriculum to support first?
- **Ideal Answer:** We start with the Indian NCERT Physics curriculum for Class 10.
- **Follow-up Answer:** This curriculum has standardized textbooks, making it a great pilot testbed.
- **Technical Justification:** Seed configurations pre-populate NCERT topics into database tables on startup.

### Q44: Why include Web3 components in an edtech tool for blind students?
- **Ideal Answer:** On-chain attestations provide verifiable credentials that students own forever.
- **Follow-up Answer:** This bypasses centralized databases and provides a transparent way to prove mastery.
- **Technical Justification:** Base Sepolia contract calls verify completion status cryptographically.

### Q45: How do you gather product feedback from visually impaired users?
- **Ideal Answer:** We partner with blind student centers and schools to run hands-on testing sessions.
- **Follow-up Answer:** This helps us locate accessibility blockers directly.
- **Technical Justification:** User telemetry logging tracks where students get stuck.

### Q46: What is the purpose of the `/api/student/reset` endpoint in your product flow?
- **Ideal Answer:** It clears the student's database history so they can test or rerun the demo curriculum from scratch.
- **Follow-up Answer:** This is helpful for testing and demo presentations.
- **Technical Justification:** SQL scripts delete user records across mastery and credentials tables cleanly.

### Q47: Why is your uploader screen designed as a single drop zone?
- **Ideal Answer:** A single drop zone reduces clutter and is easier for screen readers to locate.
- **Follow-up Answer:** It makes uploading diagrams straightforward.
- **Technical Justification:** Linear button groups are easy to target with standard tab navigation.

### Q48: How do you handle multi-language localization in the future?
- **Ideal Answer:** We plan to translate text templates and utilize localized TTS models.
- **Follow-up Answer:** The database schema already includes a language configuration column.
- **Technical Justification:** User language preferences adjust text output generation.

### Q49: What is your user acquisition strategy for schools?
- **Ideal Answer:** We offer a free workstation license for classrooms to start, then charge for premium features.
- **Follow-up Answer:** This low friction encourages adoption.
- **Technical Justification:** Workspace tiers are configured via API organization schemas.

### Q50: How does Hikari scale to other domains like Chemistry?
- **Ideal Answer:** The parser can adapt to recognize chemical structures as graphs (atoms as vertices, bonds as edges).
- **Follow-up Answer:** The underlying agent graph remains the same.
- **Technical Justification:** Graph construction models scale to handle chemical formula structures.

---

## CATEGORY 6: BUSINESS (Q51 – Q60)

### Q51: How do you sustain a free tier on a hackathon budget?
- **Ideal Answer:** Our core APIs run on Google AI Studio's free tier, and we utilize local Web Speech engines for the free plan.
- **Follow-up Answer:** This keeps operational hosting costs under \$20/month.
- **Technical Justification:** Client-side processing minimizes backend server load.

### Q52: What is your customer acquisition cost (CAC) target for school licenses?
- **Ideal Answer:** We target a CAC under \$30 per school workstation license.
- **Follow-up Answer:** This is achieved through direct outreach and partnerships with blind edtech foundations.
- **Technical Justification:** Low-cost pipelines reduce marketing spend.

### Q53: What is the projected Year 3 gross margin?
- **Ideal Answer:** We project an 87.9% gross margin in Year 3.
- **Follow-up Answer:** Hosting and API costs remain low relative to subscription pricing.
- **Technical Justification:** Standardizing on serverless deployment structures keeps infrastructure costs low.

### Q54: Why would a university pay \$2,400/year for your Enterprise Tier?
- **Ideal Answer:** Universities are legally required to provide equal access. Hikari helps them meet compliance standards.
- **Follow-up Answer:** It is cheaper than hiring dedicated human readers.
- **Technical Justification:** LMS-compatible API frameworks integrate with university portals.

### Q55: How do you monetize credential verification?
- **Ideal Answer:** We charge institutions \$0.50 to verify credentials on our explorer interface.
- **Follow-up Answer:** This provides a steady source of B2B revenue.
- **Technical Justification:** Verification checks pull directly from EAS contract logs.

### Q56: What is your Go-To-Market (GTM) pathway in India?
- **Ideal Answer:** Partnering with the National Association for the Blind (NAB) to pilot Hikari in Class 10 classrooms.
- **Follow-up Answer:** This builds credibility and accelerates adoption.
- **Technical Justification:** Textbooks follow standard NCERT curricula, matching database configurations.

### Q57: How do you model unit economics per user session?
- **Ideal Answer:** The API cost per session is \$0.04 (Gemini + database requests).
- **Follow-up Answer:** The Pro subscription (\$5/month) covers this cost easily.
- **Technical Justification:** Efficient prompts keep token usage low.

### Q58: Can you support corporate corporate sponsorships for school licensing?
- **Ideal Answer:** Yes. Corporate sponsors can pay workstation fees to earn ESG impact badges.
- **Follow-up Answer:** This helps fund free licenses for schools in developing areas.
- **Technical Justification:** Sponsor details link directly to sponsored school licenses in databases.

### Q59: What is your pricing strategy for API licensing?
- **Ideal Answer:** We charge edtech publishers \$0.10 per parsed diagram coordinates API request.
- **Follow-up Answer:** This creates a solid B2B revenue stream.
- **Technical Justification:** API gateways track usage using unique API keys.

### Q60: How do you plan to reach break-even status?
- **Ideal Answer:** We expect to break even in Year 2 with 80 school licenses and 1,000 Pro subscribers.
- **Follow-up Answer:** This requires minimal operational overhead.
- **Technical Justification:** Low hosting costs help keep burn rates low.

---

## CATEGORY 7: SECURITY (Q61 – Q70)

### Q61: How do you prevent student performance data leaks on-chain?
- **Ideal Answer:** We generate a salted commitment hash of the student ID: `hash(studentAddress + salt)`.
- **Follow-up Answer:** This prevents observers from linking address identities.
- **Technical Justification:** Commitments verify completion without public ID leakage.

### Q62: How do you sanitize OCR text inputs against XSS injections?
- **Ideal Answer:** We parse and clean OCR output strings before passing them to the database or LLM.
- **Follow-up Answer:** This strips out script tags.
- **Technical Justification:** Input formatting sanitizes labels against XSS injections.

### Q63: Where are your Web3 private keys stored on production?
- **Ideal Answer:** Private keys are stored as environment variables on Railway.
- **Follow-up Answer:** They are never exposed to client-side bundles.
- **Technical Justification:** Environment configurations restrict key access to servers.

### Q64: How does your SQLite database handle parameterized queries?
- **Ideal Answer:** All DB operations use parameterized SQL statements to prevent SQL injections.
- **Follow-up Answer:** This secures student records against data manipulation.
- **Technical Justification:** Query execution prevents SQL injection strings.

### Q65: How do you defend against prompt hijacking on your agents?
- **Ideal Answer:** We wrap user inputs in structured prompts that define the exact output JSON schema.
- **Follow-up Answer:** The Critic Agent audits outputs, blocking prompts that attempt to override instructions.
- **Technical Justification:** Content filtering blocks unexpected system prompt overrides.

### Q66: What is the security strategy for IndexedDB client storage?
- **Ideal Answer:** IndexedDB stores diagram base64 cache files locally. We purge this cache immediately upon logout.
- **Follow-up Answer:** It prevents other users from accessing data on shared devices.
- **Technical Justification:** Client-side cache wipes clean IndexDB variables.

### Q67: How do you prevent Denial of Service (DoS) attacks on your endpoints?
- **Ideal Answer:** We apply rate limits to our endpoints (e.g. limit to 10 uploads/min per IP).
- **Follow-up Answer:** This protects server resources.
- **Technical Justification:** Middleware routing throttles spam requests.

### Q68: How do you ensure your WebRTC audio feeds are encrypted?
- **Ideal Answer:** All WebRTC streams are encrypted end-to-end using standard Secure Real-time Transport Protocol (SRTP).
- **Follow-up Answer:** This keeps student conversations private.
- **Technical Justification:** WebRTC standards enforce DTLS-SRTP encryption.

### Q69: What is the risk of key compromise on the backend deployer account?
- **Ideal Answer:** The deployer key only has permission to mint private SBTs. It cannot modify contract ownership.
- **Follow-up Answer:** This limits risk if a key is compromised.
- **Technical Justification:** Contract execution restricts minter roles.

### Q70: How do you handle password storage securely in Supabase?
- **Ideal Answer:** Supabase handles authentication and password hashing using bcrypt.
- **Follow-up Answer:** This follows standard security guidelines.
- **Technical Justification:** Third-party auth delegation keeps password tables secure.

---

## CATEGORY 8: WEB3 (Q71 – Q80)

### Q71: Why base your SBT on Base L2 instead of Ethereum Mainnet?
- **Ideal Answer:** Base Sepolia L2 gas fees average $< \$0.001$, making deployment and verification free for developers.
- **Follow-up Answer:** Ethereum Mainnet transaction costs are too high for educational credentials.
- **Technical Justification:** Low fees enable scalable SBT minting.

### Q72: How does the contract prevent transfer of Soul-Bound tokens?
- **Ideal Answer:** We override the ERC721 `_update` transfer method, reverting transactions unless they originate from the zero address (minting).
- **Follow-up Answer:** This ensures credentials stay tied to the student's address.
- **Technical Justification:** Transfer checks prevent trading of SBT credentials.

### Q73: Why link your SBT with the Ethereum Attestation Service (EAS)?
- **Ideal Answer:** EAS provides a standard framework to create verifiable attestations.
- **Follow-up Answer:** This makes it easy for other apps to verify our credentials.
- **Technical Justification:** EAS registry schemas record on-chain attestations.

### Q74: How do you compile a zero-knowledge circuit for student scores?
- **Ideal Answer:** We compile the proof using Noir. The circuit checks if the score is $\ge 80$ without revealing the raw inputs.
- **Follow-up Answer:** The verified output is submitted to the contract.
- **Technical Justification:** Noir ZK inputs verify mathematical inequality proofs.

### Q75: How does `HikariPrivateSBT` interact with the ZkVerifier contract?
- **Ideal Answer:** The SBT contract calls `IZkVerifier(zkVerifierAddress).verifyProof(zkProof, publicInputs)`.
- **Follow-up Answer:** It only mints the token if the proof is valid.
- **Technical Justification:** Contract verification checks guard the mint function.

### Q76: What is the purpose of the `MockZkVerifier` in your deployment?
- **Ideal Answer:** It acts as a mock verifier that returns `true` for testing, helping us validate flows during development.
- **Follow-up Answer:** It makes testing contract pipelines straightforward.
- **Technical Justification:** Mock contracts bypass the need to generate heavy ZK proofs during test suites.

### Q77: How can a school verify a student's credential without access to their private wallet?
- **Ideal Answer:** The school looks up the token ID on our public verification page.
- **Follow-up Answer:** It verifies the EAS signature without exposing private keys.
- **Technical Justification:** Verification endpoints fetch logs directly from the block explorer.

### Q78: Can a student lose their Soulbound credentials if their key is compromised?
- **Ideal Answer:** If compromised, the student can request the contract owner to burn the old token and issue a new one to a new address.
- **Follow-up Answer:** This helps recover credentials securely.
- **Technical Justification:** Burn functions are restricted to authorized contract owners.

### Q79: What metadata standards do you follow for SBTs?
- **Ideal Answer:** We follow the ERC721 Metadata JSON schema, linking to IPFS metadata files.
- **Follow-up Answer:** This ensures compatibility with web3 wallets.
- **Technical Justification:** Standard JSON schemas align with public registry indexers.

### Q80: How does your backend handle Web3 transaction gas management?
- **Ideal Answer:** We use Web3.py/Web3.js client helpers to estimate gas limits and current gas prices.
- **Follow-up Answer:** This helps avoid transactions getting stuck in the mempool.
- **Technical Justification:** Dynamic gas price estimators adjust transaction parameters before dispatch.

---

## CATEGORY 9: SCALABILITY (Q81 – Q90)

### Q81: How do you handle sudden traffic spikes of 10,000 concurrent uploads?
- **Ideal Answer:** The API backend runs inside stateless Docker containers, allowing us to autoscale instances based on CPU utilization.
- **Follow-up Answer:** Common database reads are cached to reduce DB load.
- **Technical Justification:** Stateless container designs make load balancing straightforward.

### Q82: How does SQLite scale as database size grows?
- **Ideal Answer:** For early stages, SQLite handles gigabytes of data easily. If needed, we can migrate to a managed PostgreSQL cluster.
- **Follow-up Answer:** Indexing key columns keeps queries fast.
- **Technical Justification:** Indexed fields prevent query slowdowns.

### Q83: Why use Qdrant Cloud instead of running a local vector index?
- **Ideal Answer:** Qdrant Cloud handles vector indexing and distance calculations in the cloud, keeping our backend server lightweight.
- **Follow-up Answer:** Its free tier (1GB) is perfect for development.
- **Technical Justification:** Managed databases offload resource-heavy operations from our servers.

### Q84: How do you optimize Next.js build sizes?
- **Ideal Answer:** We use Next.js standalone output builds to generate optimized bundles containing only required dependencies.
- **Follow-up Answer:** This reduces container sizes and deployment times.
- **Technical Justification:** Standalone builds reduce overall Docker image size.

### Q85: How does your SSE streaming handle network drops?
- **Ideal Answer:** The client handles reconnection automatically. If a drop occurs, it retries the connection after a short delay.
- **Follow-up Answer:** This prevents sessions from breaking during minor connection drops.
- **Technical Justification:** Browser SSE handlers manage reconnections automatically.

### Q86: How do you limit token usage on Gemini API calls?
- **Ideal Answer:** We use system prompts with strict constraints, limiting responses to necessary fields.
- **Follow-up Answer:** This prevents context windows from growing too large.
- **Technical Justification:** Compact prompts reduce input token costs.

### Q87: What caching strategy do you use for curriculum metadata?
- **Ideal Answer:** Standard NCERT curriculum structures are loaded into the database once on startup.
- **Follow-up Answer:** This avoids repeating database writes.
- **Technical Justification:** SQLite caching in database memory reduces query times.

### Q88: How do you monitor API response latencies in production?
- **Ideal Answer:** We use Sentry and LangSmith to trace API latencies and LLM call durations.
- **Follow-up Answer:** This helps pinpoint performance bottlenecks.
- **Technical Justification:** Middleware loggers track execution times for endpoints.

### Q89: How do you scale WebRTC audio streaming to thousands of concurrent users?
- **Ideal Answer:** We deploy LiveKit servers to distribute audio processing across multiple media nodes.
- **Follow-up Answer:** This keeps latency low.
- **Technical Justification:** SFU architectures scale audio channels efficiently.

### Q90: How do you optimize image sizes before processing?
- **Ideal Answer:** The frontend compresses uploaded images to a maximum width of 1000px before sending them to the backend.
- **Follow-up Answer:** This reduces upload times and API processing costs.
- **Technical Justification:** Client-side image resizing minimizes data transfer.

---

## CATEGORY 10: ETHICS (Q91 – Q100)

### Q91: How do you ensure that visually impaired students have full agency over their data?
- **Ideal Answer:** We store raw session details locally, and only commit anonymous commitments on-chain.
- **Follow-up Answer:** Students can delete their profile data at any time.
- **Technical Justification:** Clear database delete commands wipe user profiles across tables.

### Q92: What safeguards prevent your AI from generating misleading educational content?
- **Ideal Answer:** Our reflection agent verifies all diagram properties using SymPy before teaching, catching errors before they reach the user.
- **Follow-up Answer:** This prevents students from learning incorrect formulas.
- **Technical Justification:** Physical check routing blocks unbalanced calculations from being read aloud.

### Q93: Why target visually impaired accessibility instead of mainstream educational tools?
- **Ideal Answer:** Sighted students have access to thousands of tools, but blind students are locked out of STEM due to visual diagrams. We want to bridge this gap.
- **Follow-up Answer:** It is about providing equal opportunities.
- **Technical Justification:** Decoupling visual components focuses the product on accessibility targets.

### Q94: How do you handle potential algorithmic bias in grading spoken quiz answers?
- **Ideal Answer:** Our grading prompts instruct the LLM to overlook accent variations or typos and grade solely on conceptual accuracy.
- **Follow-up Answer:** This ensures fair scoring for students from different regions.
- **Technical Justification:** LLM-as-a-judge prompts use relaxed formatting criteria.

### Q95: Is there a risk of students using Hikari to cheat on exams?
- **Ideal Answer:** Hikari is designed as a learning companion. Schools can disable the camera uploader during exams if needed.
- **Follow-up Answer:** It acts as a tutor, not an answer generator.
- **Technical Justification:** Workspace variables allow admins to disable ingestion features.

### Q96: How do you handle cases where the system cannot resolve a diagram's math?
- **Ideal Answer:** If verification fails after 3 retries, the system transparently informs the student and prompts them for help.
- **Follow-up Answer:** This prevents the tutor from presenting incorrect details.
- **Technical Justification:** Fallback routing outputs warning prompts.

### Q97: What is your policy on data monetization?
- **Ideal Answer:** We do not sell user data. Our revenue comes from Pro subscriptions, school licenses, and verification services.
- **Follow-up Answer:** This aligns our business with student privacy.
- **Technical Justification:** We restrict database design to target profile metrics only.

### Q98: How do you ensure your product remains affordable in developing countries?
- **Ideal Answer:** We offer a free plan that provides access to the core curriculum and standard text-to-speech tools.
- **Follow-up Answer:** This ensures cost is not a barrier to learning.
- **Technical Justification:** Client-side fallback speech synthesis avoids premium API costs.

### Q99: Who owns the intellectual property of the generated explanations?
- **Ideal Answer:** Students own their learning history, and the system templates are open-source.
- **Follow-up Answer:** This supports open education.
- **Technical Justification:** Code libraries are released under standard MIT licenses.

### Q100: How do you verify the accuracy of your curriculum dependencies?
- **Ideal Answer:** Our prerequisite roadmap follows official CBSE board guidelines.
- **Follow-up Answer:** We verify graph flows with school partners.
- **Technical Justification:** DAG structures prevent loops in our learning roadmap.
