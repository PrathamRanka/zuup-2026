'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSpeech } from '../../hooks/useSpeech';
import { Volume2, VolumeX, Mic, Send, HelpCircle, CheckCircle, AlertCircle, ArrowRight, Award, Compass, MessageSquare } from 'lucide-react';

interface Segment {
  segment_id: string;
  text: string;
  concept_tags: string[];
  order: number;
}

interface Question {
  id: string;
  text: string;
  difficulty: number;
}

function SessionContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  const router = useRouter();

  const [statusMessage, setStatusMessage] = useState('Starting session...');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [followUpResponses, setFollowUpResponses] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<'explaining' | 'quiz' | 'summary'>('explaining');
  
  // Follow up state
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Quiz state
  const [quizId, setQuizId] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  // Summary state
  const [summaryData, setSummaryData] = useState<any>(null);

  // Audio queue ref & control state
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const audioQueueRef = useRef<string[]>([]);
  const isCurrentlySpeakingRef = useRef<boolean>(false);

  const {
    isListening,
    transcript,
    speak,
    stopSpeaking,
    startListening,
    stopListening
  } = useSpeech();

  // Voice Queue Executor
  const processAudioQueue = () => {
    if (!voiceEnabled || isCurrentlySpeakingRef.current || audioQueueRef.current.length === 0) return;

    isCurrentlySpeakingRef.current = true;
    const nextText = audioQueueRef.current.shift();
    
    if (nextText) {
      speak(nextText, () => {
        isCurrentlySpeakingRef.current = false;
        // Small pause between paragraphs
        setTimeout(() => {
          processAudioQueue();
        }, 800);
      });
    } else {
      isCurrentlySpeakingRef.current = false;
    }
  };

  const queueAudio = (text: string) => {
    audioQueueRef.current.push(text);
    processAudioQueue();
  };

  // SSE Stream for Initial Explanation
  useEffect(() => {
    if (!sessionId) return;

    const eventSource = new EventSource(`/api/sessions/${sessionId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'status') {
          setStatusMessage(data.message);
        } else if (data.type === 'explanation') {
          const newSeg: Segment = {
            segment_id: data.segment_id,
            text: data.text,
            concept_tags: data.concept_tags || [],
            order: data.order
          };
          setSegments(prev => {
            if (prev.some(s => s.segment_id === newSeg.segment_id)) return prev;
            const updated = [...prev, newSeg].sort((a, b) => a.order - b.order);
            // Queue text for TTS readout
            queueAudio(newSeg.text);
            return updated;
          });
        } else if (data.type === 'session_ready_for_quiz') {
          setStatusMessage('');
          queueAudio(data.message);
        } else if (data.type === 'done') {
          eventSource.close();
        } else if (data.type === 'error') {
          setStatusMessage(`Error: ${data.message}`);
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE packet:", err);
      }
    };

    eventSource.onerror = (e) => {
      console.error("SSE Connection Error:", e);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      stopSpeaking();
    };
  }, [sessionId]);

  // Handle Voice Input transcription for question input
  useEffect(() => {
    if (transcript && activeStep === 'explaining') {
      setQuestionInput(transcript);
      speak(`I heard: ${transcript}. Sending question now.`);
      submitQuestion(transcript);
    } else if (transcript && activeStep === 'quiz') {
      setAnswerInput(transcript);
      speak(`I heard: ${transcript}. Submitting your answer.`);
      submitAnswer(transcript);
    }
  }, [transcript]);

  // Toggle Voice Output
  const handleToggleVoice = () => {
    if (voiceEnabled) {
      stopSpeaking();
      audioQueueRef.current = [];
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
      // Read latest segment
      if (segments.length > 0) {
        queueAudio(segments[segments.length - 1].text);
      }
    }
  };

  // Submit follow-up question
  const submitQuestion = async (textToSend?: string) => {
    const qText = textToSend || questionInput;
    if (!qText.trim()) return;

    setIsAsking(true);
    setQuestionInput('');
    stopSpeaking();
    audioQueueRef.current = [];

    try {
      const res = await fetch(`/api/sessions/${sessionId}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: qText }),
      });

      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'explanation') {
                    setFollowUpResponses(prev => [...prev, data.text]);
                    queueAudio(data.text);
                  }
                } catch (e) {
                  // status packet or parse error
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      speak("Sorry, I could not answer that right now.");
    } finally {
      setIsAsking(false);
    }
  };

  // Trigger Quiz Flow
  const startQuiz = async () => {
    stopSpeaking();
    audioQueueRef.current = [];
    setStatusMessage('Preparing your quiz questions...');
    setActiveStep('quiz');

    try {
      const res = await fetch(`/api/sessions/${sessionId}/quiz/start`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setQuizId(data.quiz_id);
        setTotalQuestions(data.question_count);
        setCurrentQuestionIndex(0);
        setCurrentQuestion(data.first_question);
        setStatusMessage('');
        
        queueAudio(`Quiz started. Question 1 of 3: ${data.first_question.text}`);
      }
    } catch (e) {
      console.error(e);
      speak("Failed to start the quiz loop.");
    }
  };

  // Submit Quiz Answer
  const submitAnswer = async (answerTextToSend?: string) => {
    const ans = answerTextToSend || answerInput;
    if (!ans.trim() || !currentQuestion) return;

    setIsAnswering(true);
    setAnswerInput('');
    setFeedbackText('');
    stopSpeaking();
    audioQueueRef.current = [];

    try {
      const res = await fetch(`/api/sessions/${sessionId}/quiz/${quizId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQuestion.id,
          answer_text: ans
        })
      });

      if (res.ok) {
        const data = await res.json();
        setFeedbackText(data.feedback);
        queueAudio(data.feedback);

        if (data.next_question) {
          setCurrentQuestionIndex(prev => prev + 1);
          setCurrentQuestion(data.next_question);
          setTimeout(() => {
            queueAudio(`Next question. Question ${currentQuestionIndex + 2}: ${data.next_question.text}`);
          }, 1500);
        } else {
          setQuizComplete(true);
          setTimeout(loadSummary, 3000);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnswering(false);
    }
  };

  // Load Final Summary & SBT Credential
  const loadSummary = async () => {
    setActiveStep('summary');
    stopSpeaking();
    audioQueueRef.current = [];

    try {
      const res = await fetch(`/api/sessions/${sessionId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
        
        let completionSpeech = `Quiz completed. You scored ${Math.round(data.quiz_score * 100)} percent. `;
        if (data.credential_issued) {
          completionSpeech += `Congratulations! You have mastered this concept, and a verifiable Soul-Bound Token has been minted on the Base blockchain network. `;
        } else {
          completionSpeech += `Good effort. We recommend reviewing this concept and completing another learning session. `;
        }
        completionSpeech += `Your recommended next topic is: ${data.recommended_next}.`;
        
        queueAudio(completionSpeech);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Session Header Controls */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>ACTIVE SESSION</span>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>STEM Diagram Tutor</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleToggleVoice} 
            className={`btn ${voiceEnabled ? 'btn-secondary' : 'btn-primary'}`}
            style={{ padding: '8px 16px', borderRadius: '8px' }}
            aria-label={voiceEnabled ? "Mute audio tutor readout" : "Unmute audio tutor readout"}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {voiceEnabled ? "Mute" : "Unmute"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '30px' }}>
          <div className="pulse-indicator" style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '24px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            {statusMessage}
          </div>
        </div>
      )}

      {/* STEP 1: EXPLAINING VIEW */}
      {activeStep === 'explaining' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="glass-panel" aria-labelledby="lecture-heading" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 id="lecture-heading" style={{ margin: 0, borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>Diagram Explanation</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {segments.map((seg, i) => (
                <div key={seg.segment_id} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{
                    minWidth: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--accent-cyan)',
                    color: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.875rem'
                  }} aria-hidden="true">
                    {i + 1}
                  </div>
                  <div>
                    <p style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '1.05rem', lineHeight: 1.6 }}>{seg.text}</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {seg.concept_tags.map(t => (
                        <span key={t} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {followUpResponses.map((text, i) => (
                <div key={`f-${i}`} style={{ display: 'flex', gap: '12px', background: 'rgba(6, 182, 212, 0.04)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.1)' }}>
                  <MessageSquare size={20} style={{ color: 'var(--accent-cyan)', marginTop: '4px' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>FOLLOW-UP EXPLANATION</span>
                    <p style={{ color: '#fff', margin: 0, fontSize: '1.05rem', lineHeight: 1.6 }}>{text}</p>
                  </div>
                </div>
              ))}
            </div>

            {segments.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <button onClick={startQuiz} className="btn btn-primary" style={{ padding: '12px 30px' }} aria-label="Explanation understood. Move forward and start the mastery check quiz.">
                  Test My Mastery
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </section>

          <section className="glass-panel" aria-labelledby="query-heading">
            <h2 id="query-heading" style={{ margin: 0, fontSize: '1.25rem', marginBottom: '12px' }}>Ask a Question</h2>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>Have questions about the resistors, battery connections, or Kirchhoff's laws? Speak or type below.</p>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={isListening ? stopListening : startListening}
                className={`btn ${isListening ? 'btn-primary pulse-indicator' : 'btn-secondary'}`}
                style={{ padding: '12px', borderRadius: '8px' }}
                aria-label={isListening ? "Listening... click to stop capturing voice query." : "Click to speak follow-up question aloud."}
              >
                <Mic size={20} style={{ color: isListening ? '#fff' : 'var(--accent-cyan)' }} />
              </button>
              <input 
                type="text" 
                placeholder="Ask about components, resistance formula..." 
                value={questionInput} 
                onChange={(e) => setQuestionInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
                onKeyDown={(e) => e.key === 'Enter' && submitQuestion()}
              />
              <button onClick={() => submitQuestion()} className="btn btn-secondary" disabled={isAsking} aria-label="Send text query">
                <Send size={18} />
              </button>
            </div>
            {isListening && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', color: 'var(--accent-cyan)' }}>
                <div className="voice-wave-container">
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Capturing your voice...</span>
              </div>
            )}
          </section>
        </div>
      )}

      {/* STEP 2: ACTIVE QUIZ VIEW */}
      {activeStep === 'quiz' && currentQuestion && (
        <section className="glass-panel" aria-labelledby="quiz-heading" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <h2 id="quiz-heading" style={{ margin: 0 }}>Active Mastery Check</h2>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', display: 'flex', gap: '16px' }}>
            <HelpCircle size={24} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '1.2rem', fontWeight: 500, color: '#fff', margin: 0, lineHeight: 1.5 }}>
                {currentQuestion.text}
              </p>
            </div>
          </div>

          {feedbackText && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: feedbackText.toLowerCase().includes('correct') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: feedbackText.toLowerCase().includes('correct') ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
              color: feedbackText.toLowerCase().includes('correct') ? 'var(--accent-green)' : '#f87171',
              display: 'flex',
              gap: '12px'
            }}>
              {feedbackText.toLowerCase().includes('correct') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{feedbackText}</p>
            </div>
          )}

          {!quizComplete && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label htmlFor="quiz-answer-input" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Your Spoken or Typed Answer</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`btn ${isListening ? 'btn-primary pulse-indicator' : 'btn-secondary'}`}
                  style={{ padding: '12px', borderRadius: '8px' }}
                  aria-label={isListening ? "Listening... click to submit answer" : "Speak your answer aloud"}
                >
                  <Mic size={20} style={{ color: isListening ? '#fff' : 'var(--accent-cyan)' }} />
                </button>
                <input 
                  id="quiz-answer-input"
                  type="text" 
                  placeholder="Speak your answer or type it here..." 
                  value={answerInput} 
                  onChange={(e) => setAnswerInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                />
                <button onClick={() => submitAnswer()} className="btn btn-primary" disabled={isAnswering} aria-label="Submit answer">
                  Submit
                </button>
              </div>
              
              {isListening && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', color: 'var(--accent-cyan)' }}>
                  <div className="voice-wave-container">
                    <div className="voice-bar"></div>
                    <div className="voice-bar"></div>
                    <div className="voice-bar"></div>
                    <div className="voice-bar"></div>
                    <div className="voice-bar"></div>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Listening to your answer...</span>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* STEP 3: SESSION COMPLETE / CREDENTIAL SUMMARY VIEW */}
      {activeStep === 'summary' && summaryData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <section className="glass-panel" aria-labelledby="completion-heading" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '40px 24px' }}>
            <Award size={64} style={{ color: summaryData.credential_issued ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
            <div>
              <h1 id="completion-heading" style={{ fontSize: '2rem', marginBottom: '8px' }}>Session Summary</h1>
              <p style={{ margin: 0 }}>Concept: {summaryData.key_concepts.join(', ')}</p>
            </div>

            <div style={{ display: 'flex', gap: '40px', margin: '16px 0' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>QUIZ SCORE</span>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {Math.round(summaryData.quiz_score * 100)}%
                </p>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: '40px' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>MASTERY VERIFIED</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: summaryData.credential_issued ? 'var(--accent-green)' : 'var(--accent-cyan)', marginTop: '8px', margin: 0 }}>
                  {summaryData.credential_issued ? "SUCCESS (SBT ISSUED)" : "IN PROGRESS"}
                </p>
              </div>
            </div>

            {summaryData.credential_issued && (
              <div style={{
                background: 'rgba(6,182,212,0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                padding: '20px',
                width: '100%',
                maxWidth: '550px',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.75rem', background: 'var(--accent-cyan)', color: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginBottom: '10px' }}>
                  SOUL-BOUND TOKEN MINT RECEIPT
                </span>
                <p style={{ fontSize: '0.9rem', color: '#fff', margin: '0 0 8px 0', wordBreak: 'break-all' }}>
                  <strong>Contract:</strong> {summaryData.verify_url ? 'HikariSBT (Base Sepolia)' : 'Simulated Client'}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#fff', margin: '0 0 8px 0', wordBreak: 'break-all' }}>
                  <strong>Transaction:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{summaryData.transaction_hash}</span>
                </p>
                <a href="/achievements" className="btn btn-secondary" style={{ width: '100%', display: 'inline-flex', padding: '10px', marginTop: '10px' }}>
                  View Credentials Gallery
                </a>
              </div>
            )}
          </section>

          <section className="glass-panel" aria-labelledby="next-heading" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Compass size={32} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
            <div>
              <h2 id="next-heading" style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 4px 0' }}>Your Next Study Topic</h2>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 500 }}>{summaryData.recommended_next}</p>
            </div>
            <a href="/" className="btn btn-primary" style={{ marginLeft: 'auto', padding: '10px 20px' }}>
              Dashboard
            </a>
          </section>
        </div>
      )}
    </div>
  );
}

export default function SessionPage() {
  return (
    <React.Suspense fallback={
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Loading session details...</h2>
      </div>
    }>
      <SessionContent />
    </React.Suspense>
  );
}
