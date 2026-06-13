'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSpeech } from '../../hooks/useSpeech';

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

  // Handle Voice Input transcription
  useEffect(() => {
    if (transcript && activeStep === 'explaining') {
      setQuestionInput(transcript);
      speak(`Received question: ${transcript}`);
      submitQuestion(transcript);
    } else if (transcript && activeStep === 'quiz') {
      setAnswerInput(transcript);
      speak(`Received answer: ${transcript}`);
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
      speak("Error getting follow-up explanation.");
    } finally {
      setIsAsking(false);
    }
  };

  // Trigger Quiz Flow
  const startQuiz = async () => {
    stopSpeaking();
    audioQueueRef.current = [];
    setStatusMessage('Loading quiz questions...');
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
        
        queueAudio(`Quiz started. Question 1: ${data.first_question.text}`);
      }
    } catch (e) {
      console.error(e);
      speak("Failed to start the quiz.");
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
            queueAudio(`Question ${currentQuestionIndex + 2}: ${data.next_question.text}`);
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

  // Load Final Summary
  const loadSummary = async () => {
    setActiveStep('summary');
    stopSpeaking();
    audioQueueRef.current = [];

    try {
      const res = await fetch(`/api/sessions/${sessionId}/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
        
        let completionSpeech = `Quiz complete. Score ${Math.round(data.quiz_score * 100)} percent. `;
        if (data.credential_issued) {
          completionSpeech += `Soul-Bound Token credential minted on Base blockchain. `;
        }
        completionSpeech += `Recommended next topic: ${data.recommended_next}.`;
        
        queueAudio(completionSpeech);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Title & Speech Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>ACTIVE WORKSPACE</span>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>STEM Classroom</h1>
        </div>
        <button 
          onClick={handleToggleVoice} 
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          aria-label={voiceEnabled ? "Mute voice readouts" : "Unmute voice readouts"}
        >
          {voiceEnabled ? "Mute voice" : "Unmute voice"}
        </button>
      </div>

      {statusMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)' }}>
          <span className="pulse-indicator" />
          <span style={{ fontSize: '1rem', fontWeight: 500 }}>{statusMessage}</span>
        </div>
      )}

      {/* STEP 1: EXPLAINING VIEW */}
      {activeStep === 'explaining' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Main Book-like Text */}
          <section aria-labelledby="explanation-title" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <h2 id="explanation-title" className="sr-only">Diagram Explanation</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {segments.map((seg, i) => (
                <div key={seg.segment_id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SEGMENT {i + 1}</span>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.25rem', lineHeight: '1.8', margin: 0 }}>{seg.text}</p>
                </div>
              ))}

              {followUpResponses.map((text, i) => (
                <div key={`f-${i}`} style={{ borderLeft: '2px solid var(--accent-amber)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--accent-amber)', fontFamily: 'monospace' }}>ANSWER DETAILS</span>
                  <p style={{ color: 'var(--text-primary)', fontSize: '1.25rem', lineHeight: '1.8', margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>

            {segments.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <button onClick={startQuiz} className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
                  Start Mastery Check (Quiz)
                </button>
              </div>
            )}
          </section>

          {/* Simple Voice query box */}
          <section aria-labelledby="query-title" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '32px' }}>
            <h2 id="query-title" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Voice Query</h2>
            <p style={{ fontSize: '1rem', marginBottom: '16px' }}>Have questions about the components, loop direction, or current formulas? Speak or type below.</p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={isListening ? stopListening : startListening}
                className="btn btn-secondary"
                style={{ padding: '12px 18px' }}
                aria-label={isListening ? "Listening... click to stop capturing." : "Speak your query aloud."}
              >
                {isListening ? "Listening..." : "Speak"}
              </button>
              <input 
                type="text" 
                placeholder="Ask about resistor loops, Ohm's law, etc." 
                value={questionInput} 
                onChange={(e) => setQuestionInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '1rem'
                }}
                onKeyDown={(e) => e.key === 'Enter' && submitQuestion()}
              />
              <button onClick={() => submitQuestion()} className="btn btn-secondary" disabled={isAsking}>
                Send
              </button>
            </div>
          </section>
        </div>
      )}

      {/* STEP 2: ACTIVE QUIZ VIEW */}
      {activeStep === 'quiz' && currentQuestion && (
        <section aria-labelledby="quiz-heading" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              QUESTION {currentQuestionIndex + 1} OF {totalQuestions}
            </span>
            <h2 id="quiz-heading" style={{ fontSize: '1.75rem', marginTop: '8px', color: '#fff', lineHeight: 1.4 }}>
              {currentQuestion.text}
            </h2>
          </div>

          {feedbackText && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              color: feedbackText.toLowerCase().includes('correct') ? 'var(--accent-green)' : 'var(--accent-red)',
              fontSize: '1.1rem'
            }}>
              <p style={{ margin: 0 }}>{feedbackText}</p>
            </div>
          )}

          {!quizComplete && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label htmlFor="answer-input" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Your Answer</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className="btn btn-secondary"
                  style={{ padding: '12px 18px' }}
                  aria-label={isListening ? "Listening... click to stop capture" : "Speak answer aloud"}
                >
                  {isListening ? "Listening..." : "Speak Answer"}
                </button>
                <input 
                  id="answer-input"
                  type="text" 
                  placeholder="Speak or type your answer here..." 
                  value={answerInput} 
                  onChange={(e) => setAnswerInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                />
                <button onClick={() => submitAnswer()} className="btn btn-primary" disabled={isAnswering}>
                  Submit
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* STEP 3: SESSION COMPLETE */}
      {activeStep === 'summary' && summaryData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <section aria-labelledby="completion-heading" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 id="completion-heading" style={{ fontSize: '2rem' }}>Session Summary</h1>
            <p>Diagram Type: {summaryData.diagram_type.replace('_', ' ')}</p>

            <div style={{ display: 'flex', gap: '48px', borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)', padding: '24px 0' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>QUIZ SCORE</span>
                <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {Math.round(summaryData.quiz_score * 100)}%
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>MINT STATUS</span>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: summaryData.credential_issued ? 'var(--accent-amber)' : 'var(--text-secondary)', marginTop: '8px', margin: 0 }}>
                  {summaryData.credential_issued ? "SBT MINTED SUCCESSFULLY" : "ADDITIONAL REVIEW RECOMMENDED"}
                </p>
              </div>
            </div>

            {summaryData.credential_issued && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0 }}>
                  <strong>Blockchain:</strong> Base Sepolia testnet ledger signature
                </p>
                <p style={{ margin: 0, wordBreak: 'break-all' }}>
                  <strong>Txn Hash:</strong> <span style={{ fontFamily: 'monospace' }}>{summaryData.transaction_hash}</span>
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Token ID:</strong> #{summaryData.token_id}
                </p>
                <a href="/achievements" className="btn btn-secondary" style={{ marginTop: '16px', display: 'flex', padding: '10px' }}>
                  View Credentials Node
                </a>
              </div>
            )}
          </section>

          <section aria-labelledby="next-path-heading" style={{ borderLeft: '4px solid var(--border-primary)', paddingLeft: '20px' }}>
            <h2 id="next-path-heading" style={{ fontSize: '1rem', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>RECOMMENDED PATH</h2>
            <p style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 600 }}>{summaryData.recommended_next}</p>
            <a href="/" className="btn btn-primary" style={{ marginTop: '16px', padding: '10px 20px' }}>
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
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading session...</p>
      </div>
    }>
      <SessionContent />
    </React.Suspense>
  );
}
