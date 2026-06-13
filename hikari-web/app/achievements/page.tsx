'use client';

import React, { useState, useEffect } from 'react';
import { Award, Calendar, Shield, ExternalLink, RefreshCw } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

interface Credential {
  id: string;
  topic: string;
  mastery_score: number;
  issued_at: string;
  blockchain: string;
  token_id: string;
  transaction_hash: string;
  ipfs_uri: string;
  verify_url: string;
}

export default function Achievements() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { speak } = useSpeech();

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/credentials');
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const speakSummary = () => {
    if (credentials.length === 0) {
      speak("You have not earned any verifiable credentials yet. Complete diagram quizzes with a score of 80 percent or higher to earn credentials.");
    } else {
      speak(`You have earned ${credentials.length} verifiable soul-bound tokens. Your topics include: ${credentials.map(c => c.topic).join(', ')}.`);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Loading your credentials...</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Hero Header */}
      <section className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }} aria-labelledby="achievements-heading">
        <div>
          <h1 id="achievements-heading" style={{ margin: 0 }}>On-Chain Credentials</h1>
          <p style={{ margin: '8px 0 0 0' }}>Tamper-proof Soul-Bound Tokens (SBTs) representing your verified STEM diagram masteries.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={speakSummary} className="btn btn-secondary" aria-label="Speak credentials count summary aloud">
            Speak Gallery Summary
          </button>
        </div>
      </section>

      {/* Grid of Credentials */}
      {credentials.length === 0 ? (
        <section className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
          <Award size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h2 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>No Credentials Yet</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto 20px auto' }}>
            Earn Soul-Bound Token credentials by demonstrating 80% or higher comprehension scores on topic quizzes.
          </p>
          <a href="/learn/upload" className="btn btn-primary">Start Your First Lesson</a>
        </section>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }} aria-label="Verifiable Credentials List">
          {credentials.map((c) => (
            <article key={c.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid var(--accent-cyan)' }}>
              
              {/* Badge Heading */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: '0 0 4px 0', color: '#fff' }}>{c.topic}</h2>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    MASTERED
                  </span>
                </div>
                <div style={{
                  background: 'rgba(6,182,212,0.05)',
                  border: '1px solid var(--border-glass)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>SCORE</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>{Math.round(c.mastery_score * 100)}%</strong>
                </div>
              </div>

              {/* Metadata Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Issued
                  </span>
                  <span style={{ color: '#fff' }}>{c.issued_at.slice(0, 10)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={14} /> Network
                  </span>
                  <span style={{ color: '#fff', textTransform: 'capitalize' }}>{c.blockchain.replace('_', ' ')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Token ID</span>
                  <span style={{ color: '#fff', fontFamily: 'monospace' }}>#{c.token_id}</span>
                </div>
              </div>

              {/* Link items */}
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
                <a 
                  href={c.verify_url} 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem' }}
                >
                  Verify SBT
                </a>
                
                {/* Verify on blockchain explorer */}
                <a 
                  href={`https://sepolia.basescan.org/tx/${c.transaction_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px' }}
                  aria-label="Verify transaction on Basescan blockchain explorer"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
