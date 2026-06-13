import os
import json
import base64
from typing import Dict, Any, List, Optional
import google.generativeai as genai

# Configure Gemini if key is provided
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)

class GeminiService:
    def __init__(self):
        self.api_key = GEMINI_KEY
        self.has_key = bool(GEMINI_KEY)

    async def analyze_diagram(self, image_base64: str) -> Dict[str, Any]:
        """
        Vision Agent: Uses Gemini 2.5 Pro to parse diagrams.
        """
        if not self.has_key:
            return self._mock_diagram_analysis()

        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64.split(",")[-1] if "," in image_base64 else image_base64)
            
            prompt = """
            Analyze this STEM diagram for a visually impaired student.
            Provide a JSON output containing:
            1. diagram_type (e.g. "circuit_diagram", "geometry", "graph", "illustration")
            2. components (list of objects with id, type, value, position)
            3. relationships (list of connections with from, to, type)
            4. key_concepts (list of topics, e.g. ["Ohm's Law", "Kirchhoff's Voltage Law"])
            5. educational_level (e.g. "Class 10 Physics")
            6. diagram_complexity (e.g. "easy", "intermediate", "hard")
            7. spatial_description (detailed layout description of components and wires/lines so a blind student can build a mental map)
            
            Respond only in raw JSON format. Do not use markdown blocks.
            """
            
            model = genai.GenerativeModel("gemini-2.5-pro")
            response = model.generate_content([
                prompt,
                {"mime_type": "image/png", "data": image_data}
            ])
            
            # Clean JSON block formatting
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            
            return json.loads(text.strip())
        except Exception as e:
            print(f"Error in Gemini Vision analyze: {e}. Falling back to mock...")
            return self._mock_diagram_analysis()

    async def generate_explanation(self, analysis: Dict[str, Any], memory: Dict[str, Any]) -> Dict[str, Any]:
        """
        Educational Agent: Generates pedagogical ordered segments.
        """
        if not self.has_key:
            return self._mock_explanation(analysis)

        try:
            prompt = f"""
            You are the Educational Reasoning Agent for Hikari, an AI learning tutor for visually impaired students.
            Given the diagram analysis and the student's prior learning context, generate a structured, spoken explanation.
            
            DIAGRAM ANALYSIS:
            {json.dumps(analysis, indent=2)}
            
            STUDENT MEMORY CONTEXT:
            {json.dumps(memory, indent=2)}
            
            Your explanation must be broken into segments (minimum 3) that flow in a logical order:
            1. Context / Introduction (What is the overall diagram and what is it teaching?)
            2. Component Walkthrough (Describe the components in detail from left-to-right or top-to-bottom)
            3. Relationships & Concepts (Explain how they connect, loop currents, or geometric angles, incorporating any formulas)
            4. Application / Real-world context (How does this apply, or a walkthrough of a basic calculation)
            
            CRITICAL ACCESSIBILITY RULES:
            - Avoid visual-only references like "as you can see", "look at the blue circle", "on the left hand side in red".
            - Instead, use descriptive language: "on the leftmost branch", "connected in parallel below".
            - Address any student misconceptions identified in the memory context (e.g., if they confuse EMF with terminal voltage).
            - Keep explanations clear and concise, optimized for Text-to-Speech (TTS). Each segment should take about 20-30 seconds to read.
            
            Provide a JSON output containing:
            1. explanation_segments (list of objects with order, type, text, concept_tags)
            2. estimated_duration_seconds (integer)
            3. difficulty_calibration (string, e.g. "calibrated_to_grade_level")
            
            Respond only in raw JSON.
            """
            
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text.strip())
        except Exception as e:
            print(f"Error in Gemini generate_explanation: {e}. Falling back to mock...")
            return self._mock_explanation(analysis)

    async def generate_quiz(self, analysis: Dict[str, Any], explanation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Quiz Agent: Generates diagram-aware questions.
        """
        if not self.has_key:
            return self._mock_quiz(analysis)

        try:
            prompt = f"""
            You are the Quiz Generation Agent for Hikari.
            Generate 3 diagram-aware, short quiz questions for a visually impaired student who has just studied this diagram.
            
            DIAGRAM:
            {json.dumps(analysis, indent=2)}
            
            EXPLANATION GIVEN:
            {json.dumps(explanation, indent=2)}
            
            QUESTIONS MUST:
            - Be answerable in short spoken audio answers. No multiple choice.
            - Progress in difficulty: Question 1 (recall/identification), Question 2 (calculation/relation), Question 3 (application/deep logic).
            - Focus on the content of the diagram.
            
            Provide a JSON output containing:
            1. questions (list of objects with id, type, question, expected_answer, concept_tag, difficulty)
            
            Respond only in raw JSON.
            """
            
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text.strip())
        except Exception as e:
            print(f"Error in Gemini generate_quiz: {e}. Falling back to mock...")
            return self._mock_quiz(analysis)

    async def evaluate_answer(self, question: Dict[str, Any], answer_text: str) -> Dict[str, Any]:
        """
        Answer Judge Agent: Evaluates student's voice response.
        """
        if not self.has_key:
            return self._mock_answer_evaluation(question, answer_text)

        try:
            prompt = f"""
            You are the Answer Evaluation Judge for Hikari.
            Grade the student's spoken answer against the expected answer for this question.
            
            QUESTION:
            {json.dumps(question, indent=2)}
            
            STUDENT'S ANSWER:
            {answer_text}
            
            Determine if the answer is correct or partially correct. Since it is voice-transcribed, allow slight typos or variations in phrasing as long as the core scientific concept is correct.
            
            Provide a JSON output containing:
            1. is_correct (boolean)
            2. feedback (helpful spoken encouragement and a brief correction if wrong)
            3. partial_credit (float, 0.0 to 1.0)
            
            Respond only in raw JSON.
            """
            
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
                
            return json.loads(text.strip())
        except Exception as e:
            print(f"Error in Gemini evaluate_answer: {e}. Falling back to mock...")
            return self._mock_answer_evaluation(question, answer_text)

    # --- MOCK DEFINITIONS FOR OFFLINE / KEY-FREE RUNNING ---
    
    def _mock_diagram_analysis(self) -> Dict[str, Any]:
        return {
            "diagram_type": "circuit_diagram",
            "components": [
                {"id": "V1", "type": "voltage_source", "value": "12V", "position": "left_branch"},
                {"id": "R1", "type": "resistor", "value": "10Ω", "position": "top_branch"},
                {"id": "R2", "type": "resistor", "value": "20Ω", "position": "right_branch"}
            ],
            "relationships": [
                {"from": "V1", "to": "R1", "type": "series"},
                {"from": "R1", "to": "R2", "type": "series"}
            ],
            "key_concepts": ["Ohm's Law", "Kirchhoff's Voltage Law"],
            "educational_level": "Class 10 Physics",
            "diagram_complexity": "easy",
            "spatial_description": "A single loop rectangular circuit. On the vertical left branch, we have a 12 volt battery with its positive terminal facing upwards. The current flows clockwise. On the horizontal top branch, there is a resistor labeled R1 with a resistance of 10 ohms. On the vertical right branch, there is another resistor labeled R2 with a resistance of 20 ohms. The bottom branch is a straight connecting wire returning to the battery."
        }

    def _mock_explanation(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "explanation_segments": [
                {
                    "order": 1,
                    "type": "context",
                    "text": "This diagram shows a basic single-loop series circuit. The topic we are learning here is Ohm's Law and Series Circuits, which is standard for Class 10 Physics.",
                    "concept_tags": ["circuit_basics"]
                },
                {
                    "order": 2,
                    "type": "component_walkthrough",
                    "text": "Let us walk through the components. Starting on the left vertical branch, there is a 12 volt battery acting as our voltage source. Moving clockwise to the top horizontal branch, we find a 10 ohm resistor labeled R1. Continuing clockwise to the right vertical branch, there is a 20 ohm resistor labeled R2. The loop is closed at the bottom by a solid copper wire.",
                    "concept_tags": ["components"]
                },
                {
                    "order": 3,
                    "type": "relationship",
                    "text": "Because these two resistors are connected end-to-end, they are in series. This means the same current flows through both R1 and R2. According to Kirchhoff's Voltage Law, the 12 volts supplied by the battery must be shared between the two resistors.",
                    "concept_tags": ["Kirchhoffs_Voltage_Law"]
                },
                {
                    "order": 4,
                    "type": "application",
                    "text": "Let us calculate the total resistance. We add R1 and R2 together, which is 10 plus 20, giving us 30 ohms. Using Ohm's Law, V equals I times R, we can find the total current by dividing the battery's 12 volts by our 30 ohms of total resistance. This gives us a current of 0.4 amperes flowing clockwise.",
                    "concept_tags": ["Ohm_Law"]
                }
            ],
            "estimated_duration_seconds": 90,
            "difficulty_calibration": "simplified_for_first_encounter"
        }

    def _mock_quiz(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "questions": [
                {
                    "id": "q1",
                    "type": "recall",
                    "question": "What is the total voltage supplied by the battery in this series circuit?",
                    "expected_answer": "12 volts",
                    "concept_tag": "voltage_source",
                    "difficulty": 1
                },
                {
                    "id": "q2",
                    "type": "reasoning",
                    "question": "What is the equivalent resistance of R1 and R2 connected in series, where R1 is 10 ohms and R2 is 20 ohms?",
                    "expected_answer": "30 ohms",
                    "concept_tag": "series_resistance",
                    "difficulty": 2
                },
                {
                    "id": "q3",
                    "type": "application",
                    "question": "If we replace R1 with a 30 ohm resistor, what will happen to the total current in the circuit? Will it increase or decrease?",
                    "expected_answer": "It will decrease because total resistance increases.",
                    "concept_tag": "Ohm_Law",
                    "difficulty": 3
                }
            ]
        }

    def _mock_answer_evaluation(self, question: Dict[str, Any], answer_text: str) -> Dict[str, Any]:
        ans_clean = answer_text.strip().lower()
        expected = question["expected_answer"].lower()
        
        # Simple match rules
        is_correct = False
        feedback = ""
        credit = 0.0
        
        if question["id"] == "q1":
            if "12" in ans_clean or "twelve" in ans_clean:
                is_correct = True
                credit = 1.0
                feedback = "Correct! The battery supplies 12 volts."
            else:
                feedback = "Not quite. The voltage source on the left is a 12 volt battery."
        elif question["id"] == "q2":
            if "30" in ans_clean or "thirty" in ans_clean:
                is_correct = True
                credit = 1.0
                feedback = "Excellent! In series, we add the resistances: 10 ohms plus 20 ohms equals 30 ohms."
            else:
                feedback = "Let's review. Since the resistors are in series, we add their values together. 10 ohms plus 20 ohms is 30 ohms."
        elif question["id"] == "q3":
            if "decrease" in ans_clean or "less" in ans_clean or "down" in ans_clean:
                is_correct = True
                credit = 1.0
                feedback = "Spot on! By Ohm's Law, current is inversely proportional to resistance. Increasing resistance decreases current."
            else:
                feedback = "Think about it: higher resistance makes it harder for electric current to flow, so the current will decrease."
        else:
            is_correct = True
            credit = 1.0
            feedback = f"Good job answering: {answer_text}."
            
        return {
            "is_correct": is_correct,
            "feedback": feedback,
            "partial_credit": credit
        }

gemini_service = GeminiService()
