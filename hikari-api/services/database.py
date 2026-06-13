import os
import json
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime

# Simple database wrapper that supports SQLite (default for easy testing) and can interface with Supabase if configured.
DB_FILE = "hikari.db"

class DatabaseManager:
    def __init__(self):
        self.use_supabase = bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"))
        if not self.use_supabase:
            self._init_sqlite()

    def _get_connection(self):
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Create users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            supabase_auth_id TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            grade_level TEXT,
            curriculum TEXT DEFAULT 'ncert',
            language TEXT DEFAULT 'en',
            visual_impairment_type TEXT,
            wallet_address TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create sessions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            image_url TEXT,
            diagram_type TEXT,
            subject TEXT,
            key_concepts TEXT, -- JSON array string
            status TEXT DEFAULT 'active',
            duration_seconds INTEGER DEFAULT 0,
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            ended_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create session events
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS session_events (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            event_type TEXT NOT NULL,
            agent_source TEXT,
            content TEXT NOT NULL,
            metadata TEXT DEFAULT '{}', -- JSON string
            sequence_order INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Create topic mastery
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS topic_mastery (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            topic_id TEXT NOT NULL,
            subject TEXT NOT NULL,
            curriculum TEXT NOT NULL,
            mastery_score REAL DEFAULT 0.0,
            session_count INTEGER DEFAULT 0,
            quiz_attempts INTEGER DEFAULT 0,
            quiz_avg_score REAL DEFAULT 0.0,
            last_retention_score REAL DEFAULT 0.0,
            first_encountered_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_reviewed_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, topic_id)
        )
        """)
        
        # Create misconceptions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS misconceptions (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            topic_id TEXT NOT NULL,
            description TEXT NOT NULL,
            detected_at TEXT DEFAULT CURRENT_TIMESTAMP,
            resolved_at TEXT,
            resolution_session_id TEXT,
            is_active INTEGER DEFAULT 1
        )
        """)
        
        # Create curriculum topics
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS curriculum_topics (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            subject TEXT NOT NULL,
            curriculum TEXT NOT NULL,
            grade_level TEXT,
            description TEXT
        )
        """)
        
        # Create topic prerequisites
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS topic_prerequisites (
            topic_id TEXT NOT NULL REFERENCES curriculum_topics(id),
            prerequisite_id TEXT NOT NULL REFERENCES curriculum_topics(id),
            PRIMARY KEY (topic_id, prerequisite_id)
        )
        """)
        
        # Create credentials
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS credentials (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            topic_id TEXT NOT NULL,
            credential_type TEXT NOT NULL,
            mastery_score_at_issue REAL,
            blockchain TEXT DEFAULT 'base',
            contract_address TEXT,
            token_id TEXT,
            transaction_hash TEXT,
            ipfs_metadata_uri TEXT,
            attestation_uid TEXT UNIQUE,
            zk_proof_payload BLOB,
            issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            UNIQUE(student_id, topic_id, credential_type)
        )
        """)
        
        # Migrations for existing local databases
        try:
            cursor.execute("ALTER TABLE credentials ADD COLUMN attestation_uid TEXT")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE credentials ADD COLUMN zk_proof_payload BLOB")
        except Exception:
            pass
        
        # Create planner state
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS planner_state (
            student_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            curriculum TEXT NOT NULL,
            current_topic_id TEXT,
            completed_topics TEXT DEFAULT '[]', -- JSON array string
            recommended_next TEXT DEFAULT '[]', -- JSON array string
            progress_percent REAL DEFAULT 0.0,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        conn.commit()
        self._seed_curriculum(conn)
        conn.close()

    def _seed_curriculum(self, conn):
        cursor = conn.cursor()
        
        # Seed topics
        topics = [
            ("ohms_law", "Ohm's Law", "physics", "ncert", "class_10", "Relationship between current, voltage and resistance"),
            ("kirchhoffs_voltage_law", "Kirchhoff's Voltage Law", "physics", "ncert", "class_10", "Sum of voltages around any closed loop is zero"),
            ("kirchhoffs_current_law", "Kirchhoff's Current Law", "physics", "ncert", "class_10", "Total current entering a junction equals total current leaving it")
        ]
        for topic in topics:
            cursor.execute("""
            INSERT OR IGNORE INTO curriculum_topics (id, display_name, subject, curriculum, grade_level, description)
            VALUES (?, ?, ?, ?, ?, ?)
            """, topic)
            
        # Seed prerequisites
        prereqs = [
            ("kirchhoffs_voltage_law", "ohms_law"),
            ("kirchhoffs_current_law", "kirchhoffs_voltage_law")
        ]
        for prereq in prereqs:
            cursor.execute("""
            INSERT OR IGNORE INTO topic_prerequisites (topic_id, prerequisite_id)
            VALUES (?, ?)
            """, prereq)
            
        conn.commit()

    # --- API Helper methods ---
    
    def create_user_if_not_exists(self, auth_id: str, email: str, name: str) -> Dict[str, Any]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE supabase_auth_id = ?", (auth_id,))
        user = cursor.fetchone()
        if not user:
            user_id = auth_id  # Use same ID or gen new
            cursor.execute("""
            INSERT INTO users (id, supabase_auth_id, email, display_name, grade_level)
            VALUES (?, ?, ?, ?, 'class_10')
            """, (user_id, auth_id, email, name))
            conn.commit()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
        
        res = dict(user)
        conn.close()
        return res

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        res = dict(user) if user else None
        conn.close()
        return res

    def update_user_wallet(self, user_id: str, wallet: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET wallet_address = ? WHERE id = ?", (wallet, user_id))
        conn.commit()
        conn.close()

    def get_planner_state(self, user_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM planner_state WHERE student_id = ?", (user_id,))
        row = cursor.fetchone()
        res = None
        if row:
            res = dict(row)
            res["completed_topics"] = json.loads(res["completed_topics"])
            res["recommended_next"] = json.loads(res["recommended_next"])
        else:
            # Create default state
            cursor.execute("""
            INSERT INTO planner_state (student_id, curriculum, current_topic_id, completed_topics, recommended_next, progress_percent)
            VALUES (?, 'ncert', 'ohms_law', '[]', '["ohms_law"]', 0.0)
            """, (user_id,))
            conn.commit()
            res = {
                "student_id": user_id,
                "curriculum": "ncert",
                "current_topic_id": "ohms_law",
                "completed_topics": [],
                "recommended_next": ["ohms_law"],
                "progress_percent": 0.0
            }
        conn.close()
        return res

    def update_planner_state(self, user_id: str, current_topic: str, completed: List[str], recommended: List[str], progress: float):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO planner_state (student_id, curriculum, current_topic_id, completed_topics, recommended_next, progress_percent)
        VALUES (?, 'ncert', ?, ?, ?, ?)
        ON CONFLICT(student_id) DO UPDATE SET
            current_topic_id = excluded.current_topic_id,
            completed_topics = excluded.completed_topics,
            recommended_next = excluded.recommended_next,
            progress_percent = excluded.progress_percent,
            updated_at = datetime('now')
        """, (user_id, current_topic, json.dumps(completed), json.dumps(recommended), progress))
        conn.commit()
        conn.close()

    def create_session(self, session_id: str, student_id: str, image_url: str, subject: str = "physics", grade_level: str = "class_10") -> Dict[str, Any]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO sessions (id, student_id, image_url, subject, status)
        VALUES (?, ?, ?, ?, 'active')
        """, (session_id, student_id, image_url, subject))
        conn.commit()
        conn.close()
        return {"session_id": session_id, "status": "active"}

    def update_session(self, session_id: str, diagram_type: str, key_concepts: List[str], status: str = "active"):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE sessions 
        SET diagram_type = ?, key_concepts = ?
        WHERE id = ?
        """, (diagram_type, json.dumps(key_concepts), session_id))
        conn.commit()
        conn.close()

    def close_session(self, session_id: str, status: str = "completed"):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE sessions 
        SET status = ?, ended_at = datetime('now')
        WHERE id = ?
        """, (status, session_id))
        conn.commit()
        conn.close()

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        row = cursor.fetchone()
        res = None
        if row:
            res = dict(row)
            res["key_concepts"] = json.loads(res["key_concepts"]) if res["key_concepts"] else []
        conn.close()
        return res

    def get_sessions_history(self, student_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions WHERE student_id = ? ORDER BY started_at DESC", (student_id,))
        rows = cursor.fetchall()
        res = []
        for r in rows:
            d = dict(r)
            d["key_concepts"] = json.loads(d["key_concepts"]) if d["key_concepts"] else []
            res.append(d)
        conn.close()
        return res

    def add_session_event(self, event_id: str, session_id: str, event_type: str, agent_source: str, content: str, metadata: Dict[str, Any] = None):
        conn = self._get_connection()
        cursor = conn.cursor()
        # Find next order
        cursor.execute("SELECT COALESCE(MAX(sequence_order), 0) + 1 FROM session_events WHERE session_id = ?", (session_id,))
        next_order = cursor.fetchone()[0]
        
        cursor.execute("""
        INSERT INTO session_events (id, session_id, event_type, agent_source, content, metadata, sequence_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (event_id, session_id, event_type, agent_source, content, json.dumps(metadata or {}), next_order))
        conn.commit()
        conn.close()

    def get_session_events(self, session_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM session_events WHERE session_id = ? ORDER BY sequence_order ASC", (session_id,))
        rows = cursor.fetchall()
        res = []
        for r in rows:
            d = dict(r)
            d["metadata"] = json.loads(d["metadata"])
            res.append(d)
        conn.close()
        return res

    def get_topic_mastery(self, student_id: str, topic_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM topic_mastery WHERE student_id = ? AND topic_id = ?", (student_id, topic_id))
        row = cursor.fetchone()
        res = dict(row) if row else None
        conn.close()
        return res

    def get_all_mastery(self, student_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM topic_mastery WHERE student_id = ?", (student_id,))
        rows = cursor.fetchall()
        res = [dict(r) for r in rows]
        conn.close()
        return res

    def update_topic_mastery(self, student_id: str, topic_id: str, score: float, is_quiz: bool = False, quiz_score: float = 0.0):
        conn = self._get_connection()
        cursor = conn.cursor()
        
        existing = self.get_topic_mastery(student_id, topic_id)
        if not existing:
            cursor.execute("""
            INSERT INTO topic_mastery (id, student_id, topic_id, subject, curriculum, mastery_score, session_count, quiz_attempts, quiz_avg_score, last_reviewed_at)
            VALUES (lower(hex(randomblob(16))), ?, ?, 'physics', 'ncert', ?, 1, ?, ?, datetime('now'))
            """, (student_id, topic_id, score, 1 if is_quiz else 0, quiz_score if is_quiz else 0.0))
        else:
            session_count = existing["session_count"] + 1
            quiz_attempts = existing["quiz_attempts"] + (1 if is_quiz else 0)
            if is_quiz:
                new_avg = ((float(existing["quiz_avg_score"] or 0) * existing["quiz_attempts"]) + quiz_score) / quiz_attempts
            else:
                new_avg = existing["quiz_avg_score"]
                
            cursor.execute("""
            UPDATE topic_mastery
            SET mastery_score = ?, session_count = ?, quiz_attempts = ?, quiz_avg_score = ?, last_reviewed_at = datetime('now')
            WHERE student_id = ? AND topic_id = ?
            """, (score, session_count, quiz_attempts, new_avg, student_id, topic_id))
            
        conn.commit()
        conn.close()

    def get_misconceptions(self, student_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM misconceptions WHERE student_id = ? AND is_active = 1", (student_id,))
        rows = cursor.fetchall()
        res = [dict(r) for r in rows]
        conn.close()
        return res

    def add_misconception(self, student_id: str, topic_id: str, description: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO misconceptions (id, student_id, topic_id, description, is_active)
        VALUES (lower(hex(randomblob(16))), ?, ?, ?, 1)
        """, (student_id, topic_id, description))
        conn.commit()
        conn.close()

    def resolve_misconception(self, student_id: str, topic_id: str, session_id: str):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE misconceptions
        SET is_active = 0, resolved_at = datetime('now'), resolution_session_id = ?
        WHERE student_id = ? AND topic_id = ? AND is_active = 1
        """, (session_id, student_id, topic_id))
        conn.commit()
        conn.close()

    def get_credentials(self, student_id: str) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM credentials WHERE student_id = ?", (student_id,))
        rows = cursor.fetchall()
        res = [dict(r) for r in rows]
        conn.close()
        return res

    def create_credential(self, credential_id: str, student_id: str, topic_id: str, mastery_score: float) -> Dict[str, Any]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO credentials (id, student_id, topic_id, credential_type, mastery_score_at_issue, status)
        VALUES (?, ?, ?, 'topic_mastery', ?, 'pending')
        ON CONFLICT(student_id, topic_id, credential_type) DO UPDATE SET
            status = 'pending'
        """, (credential_id, student_id, topic_id, mastery_score))
        conn.commit()
        conn.close()
        return {"id": credential_id, "status": "pending"}

    def update_credential_blockchain(self, credential_id: str, contract_address: str, token_id: str, tx_hash: str, ipfs_uri: str, status: str = "issued", attestation_uid: str = None, zk_proof: bytes = None):
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE credentials
        SET contract_address = ?, token_id = ?, transaction_hash = ?, ipfs_metadata_uri = ?, status = ?, attestation_uid = ?, zk_proof_payload = ?, issued_at = datetime('now')
        WHERE id = ?
        """, (contract_address, token_id, tx_hash, ipfs_uri, status, attestation_uid, zk_proof, credential_id))
        conn.commit()
        conn.close()

    def get_credential(self, credential_id: str) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM credentials WHERE id = ?", (credential_id,))
        row = cursor.fetchone()
        res = dict(row) if row else None
        conn.close()
        return res

db = DatabaseManager()
