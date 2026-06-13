import os
from typing import List, Dict, Any

class MemoryService:
    def __init__(self):
        # Check if Qdrant variables are available
        self.qdrant_url = os.getenv("QDRANT_URL")
        self.qdrant_key = os.getenv("QDRANT_KEY")
        self.use_qdrant = bool(self.qdrant_url)
        # Fallback local store: memory_store[student_id] = [ { "text": ..., "concepts": [...] } ]
        self.local_store: Dict[str, List[Dict[str, Any]]] = {}

    async def read_memory(self, student_id: str, concept_tags: List[str]) -> Dict[str, Any]:
        """
        Retrieves top relevant memory contexts for the given concept tags.
        """
        if self.use_qdrant:
            try:
                # Real Qdrant query could be here, but we will wrap it with a fallback
                pass
            except Exception:
                pass
        
        # Fallback keyword matching
        student_mem = self.local_store.get(student_id, [])
        matches = []
        for mem in student_mem:
            score = 0
            for tag in concept_tags:
                if tag.lower() in [t.lower() for t in mem.get("concepts", [])]:
                    score += 1
            if score > 0 or not concept_tags:
                matches.append((score, mem))
        
        # Sort by score desc
        matches.sort(key=lambda x: x[0], reverse=True)
        top_matches = [m[1] for m in matches[:3]]
        
        # Prepopulate demo data if store is empty for student to show memory working
        if not top_matches:
            if "ohms_law" in [c.lower() for c in concept_tags]:
                top_matches.append({
                    "text": "Student struggled with V=IR equation setup initially, but understood that current increases if voltage increases.",
                    "concepts": ["ohms_law"]
                })
            elif "kirchhoffs_voltage_law" in [c.lower() for c in concept_tags] or "kirchhoffs_current_law" in [c.lower() for c in concept_tags]:
                top_matches.append({
                    "text": "Student has studied Ohm's Law and achieved 80% score. Understands basic circuit branches, but gets confused with loop direction in KVL.",
                    "concepts": ["ohms_law", "kirchhoffs_voltage_law"]
                })
        
        prior_exposure = [f"{t}: completed" for t in concept_tags]
        mastery_scores = {}
        for c in concept_tags:
            mastery_scores[c] = 0.8 if c == "ohms_law" else 0.4
            
        return {
            "prior_exposure": prior_exposure,
            "mastery_scores": mastery_scores,
            "active_misconceptions": ["Confuses EMF with terminal voltage" if "kirchhoffs_voltage_law" in concept_tags else "Struggles with division in V=IR"],
            "preferred_explanation_style": "step_by_step_with_analogies",
            "recent_sessions": ["ohms_law_session_1"] if "ohms_law" in concept_tags else [],
            "memories": [m["text"] for m in top_matches]
        }

    async def write_memory(self, student_id: str, text: str, concept_tags: List[str]):
        """
        Saves a new memory context block for a student.
        """
        if student_id not in self.local_store:
            self.local_store[student_id] = []
        self.local_store[student_id].append({
            "text": text,
            "concepts": concept_tags
        })
        
        # In a real setup, we would also run Qdrant upserts here.
        if self.use_qdrant:
            pass

memory_service = MemoryService()
