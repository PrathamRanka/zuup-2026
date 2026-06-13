from typing import Dict, Any, List, Optional, TypedDict
from langgraph.graph import StateGraph, END

# Import services
from services.database import db
from services.memory import memory_service
from services.gemini import gemini_service
from services.blockchain import blockchain_service

# Define state schemas
class ExplanationSegment(TypedDict):
    order: int
    type: str
    text: str
    concept_tags: List[str]

class DiagramAnalysis(TypedDict):
    diagram_type: str
    components: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]
    key_concepts: List[str]
    educational_level: str
    diagram_complexity: str
    spatial_description: str

class MemoryContext(TypedDict):
    prior_exposure: List[str]
    mastery_scores: Dict[str, float]
    active_misconceptions: List[str]
    preferred_explanation_style: str
    memories: List[str]

class QuizQuestion(TypedDict):
    id: str
    type: str
    question: str
    expected_answer: str
    concept_tag: str
    difficulty: int

class QuizState(TypedDict):
    quiz_id: str
    questions: List[QuizQuestion]
    answers: List[Dict[str, Any]] # question_id, student_answer, is_correct, feedback, score
    final_score: float

class AchievementResult(TypedDict):
    eligible: bool
    credential_id: str
    token_id: str
    transaction_hash: str
    contract_address: str
    ipfs_uri: str
    status: str

class PlannerOutput(TypedDict):
    completed_today: List[str]
    recommended_next: List[str]
    reason: str
    curriculum_progress: float

class HikariState(TypedDict):
    student_id: str
    session_id: str
    image_base64: str # passed instead of URL for direct file uploads
    diagram_analysis: Optional[DiagramAnalysis]
    memory_context: Optional[MemoryContext]
    explanation_segments: List[ExplanationSegment]
    quiz_state: Optional[QuizState]
    achievement_result: Optional[AchievementResult]
    planner_output: Optional[PlannerOutput]
    errors: List[str]

# --- Nodes ---

async def vision_agent(state: HikariState) -> Dict[str, Any]:
    print(f"[{state['session_id']}] Vision Agent running...")
    errors = []
    analysis = None
    try:
        analysis_raw = await gemini_service.analyze_diagram(state["image_base64"])
        # Format checks
        analysis = DiagramAnalysis(
            diagram_type=analysis_raw.get("diagram_type", "circuit_diagram"),
            components=analysis_raw.get("components", []),
            relationships=analysis_raw.get("relationships", []),
            key_concepts=analysis_raw.get("key_concepts", []),
            educational_level=analysis_raw.get("educational_level", "Class 10 Physics"),
            diagram_complexity=analysis_raw.get("diagram_complexity", "easy"),
            spatial_description=analysis_raw.get("spatial_description", "")
        )
        # Save to database
        db.update_session(
            session_id=state["session_id"],
            diagram_type=analysis["diagram_type"],
            key_concepts=analysis["key_concepts"]
        )
    except Exception as e:
        errors.append(f"Vision Agent failed: {str(e)}")
        print(f"Error in vision_agent: {e}")
        
    return {
        "diagram_analysis": analysis,
        "errors": errors
    }

async def memory_read_agent(state: HikariState) -> Dict[str, Any]:
    print(f"[{state['session_id']}] Memory Read Agent running...")
    errors = []
    mem_context = None
    try:
        concepts = state["diagram_analysis"]["key_concepts"] if state["diagram_analysis"] else ["ohms_law"]
        mem_raw = await memory_service.read_memory(state["student_id"], concepts)
        mem_context = MemoryContext(
            prior_exposure=mem_raw.get("prior_exposure", []),
            mastery_scores=mem_raw.get("mastery_scores", {}),
            active_misconceptions=mem_raw.get("active_misconceptions", []),
            preferred_explanation_style=mem_raw.get("preferred_explanation_style", "step_by_step_with_analogies"),
            memories=mem_raw.get("memories", [])
        )
    except Exception as e:
        errors.append(f"Memory Read Agent failed: {str(e)}")
        print(f"Error in memory_read_agent: {e}")
        
    return {
        "memory_context": mem_context,
        "errors": errors
    }

async def educational_agent(state: HikariState) -> Dict[str, Any]:
    print(f"[{state['session_id']}] Educational Agent running...")
    errors = []
    segments = []
    try:
        analysis = state["diagram_analysis"] or {}
        memory = state["memory_context"] or {}
        explanation_raw = await gemini_service.generate_explanation(analysis, memory)
        segments = explanation_raw.get("explanation_segments", [])
        
        # Save each explanation segment as a database event
        for seg in segments:
            db.add_session_event(
                event_id=f"seg_{state['session_id']}_{seg.get('order')}",
                session_id=state["session_id"],
                event_type="explanation",
                agent_source="educational_agent",
                content=seg.get("text", ""),
                metadata={"order": seg.get("order"), "concept_tags": seg.get("concept_tags")}
            )
    except Exception as e:
        errors.append(f"Educational Agent failed: {str(e)}")
        print(f"Error in educational_agent: {e}")
        
    return {
        "explanation_segments": segments,
        "errors": errors
    }

async def quiz_agent(state: HikariState) -> Dict[str, Any]:
    # This runs when a quiz is explicitly generated/started
    print(f"[{state['session_id']}] Quiz Agent running...")
    errors = []
    quiz_state = None
    try:
        analysis = state["diagram_analysis"] or {}
        explanation = {"explanation_segments": state["explanation_segments"]}
        quiz_raw = await gemini_service.generate_quiz(analysis, explanation)
        
        questions = []
        for q in quiz_raw.get("questions", []):
            questions.append(QuizQuestion(
                id=q.get("id"),
                type=q.get("type"),
                question=q.get("question"),
                expected_answer=q.get("expected_answer"),
                concept_tag=q.get("concept_tag"),
                difficulty=q.get("difficulty")
            ))
            
            # Save question event to DB
            db.add_session_event(
                event_id=f"q_{state['session_id']}_{q.get('id')}",
                session_id=state["session_id"],
                event_type="quiz_q",
                agent_source="quiz_agent",
                content=q.get("question"),
                metadata=q
            )
            
        quiz_state = QuizState(
            quiz_id=f"quiz_{state['session_id']}",
            questions=questions,
            answers=[],
            final_score=0.0
        )
    except Exception as e:
        errors.append(f"Quiz Agent failed: {str(e)}")
        print(f"Error in quiz_agent: {e}")
        
    return {
        "quiz_state": quiz_state,
        "errors": errors
    }

async def achievement_agent(state: HikariState) -> Dict[str, Any]:
    print(f"[{state['session_id']}] Achievement Agent running...")
    errors = []
    achievement_result = None
    try:
        quiz = state["quiz_state"]
        student_id = state["student_id"]
        
        # Calculate final score
        correct_count = sum(1 for a in quiz["answers"] if a.get("is_correct", False))
        total_qs = len(quiz["questions"])
        final_score = correct_count / total_qs if total_qs > 0 else 0.0
        
        # Pull student details
        user = db.get_user(student_id)
        wallet = user.get("wallet_address") if user else None
        
        # Determine topic
        topic_id = "ohms_law"
        topic_name = "Ohm's Law"
        if state["diagram_analysis"] and state["diagram_analysis"]["key_concepts"]:
            # Match top concept to curriculum topics
            concept_candidate = state["diagram_analysis"]["key_concepts"][0].lower()
            if "kirchhoff" in concept_candidate and "volt" in concept_candidate:
                topic_id = "kirchhoffs_voltage_law"
                topic_name = "Kirchhoff's Voltage Law"
            elif "kirchhoff" in concept_candidate and "current" in concept_candidate:
                topic_id = "kirchhoffs_current_law"
                topic_name = "Kirchhoff's Current Law"
        
        # If score >= 0.8, eligible for SBT
        eligible = final_score >= 0.8
        
        credential_id = f"cred_{state['session_id']}"
        token_id = ""
        tx_hash = ""
        contract_address = ""
        ipfs_uri = f"ipfs://QmHikariSBTMetadata{state['session_id']}/metadata.json"
        status = "none"
        
        if eligible:
            # Create pending credential in DB
            db.create_credential(
                credential_id=credential_id,
                student_id=student_id,
                topic_id=topic_id,
                mastery_score=final_score
            )
            
            # Issue credential via Web3 (real or simulated)
            print(f"Issuing on-chain SBT for {student_id} on topic {topic_id}...")
            tx_res = await blockchain_service.issue_credential(
                student_wallet=wallet or "",
                student_id=student_id,
                topic_id=topic_id,
                topic_name=topic_name,
                subject="physics",
                curriculum="ncert",
                mastery_score=final_score,
                ipfs_uri=ipfs_uri
            )
            
            if tx_res.get("success"):
                tx_hash = tx_res.get("transaction_hash", "")
                token_id = tx_res.get("token_id", "")
                contract_address = tx_res.get("contract_address", "")
                status = "issued"
                
                db.update_credential_blockchain(
                    credential_id=credential_id,
                    contract_address=contract_address,
                    token_id=token_id,
                    tx_hash=tx_hash,
                    ipfs_uri=ipfs_uri,
                    status="issued"
                )
            else:
                status = "failed"
                db.update_credential_blockchain(
                    credential_id=credential_id,
                    contract_address="",
                    token_id="",
                    tx_hash="",
                    ipfs_uri=ipfs_uri,
                    status="failed"
                )
        
        # Update student mastery in DB
        db.update_topic_mastery(
            student_id=student_id,
            topic_id=topic_id,
            score=final_score,
            is_quiz=True,
            quiz_score=final_score
        )
        
        achievement_result = AchievementResult(
            eligible=eligible,
            credential_id=credential_id,
            token_id=token_id,
            transaction_hash=tx_hash,
            contract_address=contract_address,
            ipfs_uri=ipfs_uri,
            status=status
        )
    except Exception as e:
        errors.append(f"Achievement Agent failed: {str(e)}")
        print(f"Error in achievement_agent: {e}")
        
    return {
        "achievement_result": achievement_result,
        "errors": errors
    }

async def planner_agent(state: HikariState) -> Dict[str, Any]:
    print(f"[{state['session_id']}] Planner Agent running...")
    errors = []
    planner_output = None
    try:
        student_id = state["student_id"]
        
        # Get current state
        curr_state = db.get_planner_state(student_id)
        completed = curr_state.get("completed_topics", [])
        
        # Determine current topic
        topic_id = "ohms_law"
        if state["diagram_analysis"] and state["diagram_analysis"]["key_concepts"]:
            concept_candidate = state["diagram_analysis"]["key_concepts"][0].lower()
            if "kirchhoff" in concept_candidate and "volt" in concept_candidate:
                topic_id = "kirchhoffs_voltage_law"
            elif "kirchhoff" in concept_candidate and "current" in concept_candidate:
                topic_id = "kirchhoffs_current_law"
                
        # If student passed quiz (achievement was issued successfully), mark completed
        passed_quiz = state["achievement_result"] and state["achievement_result"]["status"] == "issued"
        if passed_quiz and topic_id not in completed:
            completed.append(topic_id)
            
        # Graph logic: NCERT Physics Ohm's Law -> KVL -> KCL
        all_topics = ["ohms_law", "kirchhoffs_voltage_law", "kirchhoffs_current_law"]
        
        # Determine recommended next
        recommended = []
        for t in all_topics:
            if t not in completed:
                recommended.append(t)
                break
        if not recommended:
            recommended = ["completed_curriculum"]
            
        progress = len(completed) / len(all_topics) * 100.0
        
        db.update_planner_state(
            user_id=student_id,
            current_topic=recommended[0] if recommended else "ohms_law",
            completed=completed,
            recommended_next=recommended,
            progress=progress
        )
        
        planner_output = PlannerOutput(
            completed_today=[topic_id] if passed_quiz else [],
            recommended_next=recommended,
            reason=f"Student has completed {len(completed)} out of 3 topics. Next topic: {recommended[0]}.",
            curriculum_progress=progress
        )
    except Exception as e:
        errors.append(f"Planner Agent failed: {str(e)}")
        print(f"Error in planner_agent: {e}")
        
    return {
        "planner_output": planner_output,
        "errors": errors
    }

async def memory_write_agent(state: HikariState) -> Dict[str, Any]:
    print(f"[{state['session_id']}] Memory Write Agent running...")
    errors = []
    try:
        # Build text description of student performance to store in vector store
        concept_tags = state["diagram_analysis"]["key_concepts"] if state["diagram_analysis"] else ["ohms_law"]
        correct_answers = sum(1 for a in state["quiz_state"]["answers"] if a.get("is_correct")) if state["quiz_state"] else 0
        total_qs = len(state["quiz_state"]["questions"]) if state["quiz_state"] else 0
        
        summary_text = f"Student studied {', '.join(concept_tags)} diagram."
        if total_qs > 0:
            summary_text += f" Completed quiz scoring {correct_answers}/{total_qs}."
            
        await memory_service.write_memory(state["student_id"], summary_text, concept_tags)
    except Exception as e:
        errors.append(f"Memory Write Agent failed: {str(e)}")
        print(f"Error in memory_write_agent: {e}")
        
    return {
        "errors": errors
    }

# --- Build LangGraph ---

def build_hikari_graph():
    graph = StateGraph(HikariState)
    
    # Add nodes
    graph.add_node("vision", vision_agent)
    graph.add_node("memory_read", memory_read_agent)
    graph.add_node("educational", educational_agent)
    graph.add_node("quiz", quiz_agent)
    graph.add_node("achievement", achievement_agent)
    graph.add_node("planner", planner_agent)
    graph.add_node("memory_write", memory_write_agent)
    
    # Configure flows
    graph.set_entry_point("vision")
    graph.add_edge("vision", "memory_read")
    graph.add_edge("memory_read", "educational")
    
    # Note: In normal chat interaction, we stop here to stream explanations.
    # The quiz runs interactively. Once complete, we run the achievement-planner-memory_write chain.
    # To represent the full deterministic graph:
    graph.add_edge("educational", "quiz")
    graph.add_edge("quiz", "achievement")
    graph.add_edge("achievement", "planner")
    graph.add_edge("planner", "memory_write")
    graph.add_edge("memory_write", END)
    
    return graph.compile()

hikari_compiled_graph = build_hikari_graph()
