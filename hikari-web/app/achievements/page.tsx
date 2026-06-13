'use client';

import React, { useState, useEffect } from 'react';
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
      speak("No credentials earned yet. Master curriculum topics to mint SBTs.");
    } else {
      speak(`You have earned ${credentials.length} credentials. Verified topics are: ${credentials.map(c => c.topic).join(', ')}.`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Retrieving credentials registry...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Header section */}
      <section aria-labelledby="achievements-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 id="achievements-heading">Mastery Credentials</h1>
          <p style={{ marginTop: '8px' }}>Verifiable, non-transferable learning achievements verified on the Base L2 blockchain.</p>
        </div>
        <button onClick={speakSummary} className="btn btn-secondary" aria-label="Announce credentials summary aloud">
          Speak Summary
        </button>
      </section>

      {/* Checklist / Cards */}
      {credentials.length === 0 ? (
        <section style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border-primary)', borderRadius: '8px' }}>
          <h2 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '1.25rem' }}>Registry Empty</h2>
          <p style={{ maxWidth: '360px', margin: '0 auto 24px auto', fontSize: '1rem' }}>
            Complete a circuit learning session and score 80% or higher on the quiz to mint a Soul-Bound Token.
          </p>
          <a href="/learn/upload" className="btn btn-primary">Start Learning</a>
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} aria-label="Credentials Node Gallery">
          {credentials.map((c) => (
            <article 
              key={c.id} 
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{c.topic}</h2>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontFamily: 'monospace', display: 'block', marginTop: '6px' }}>
                    SBT VERIFIED MINTED
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>SCORE</span>
                  <strong style={{ fontSize: '1.25rem', color: '#fff' }}>{Math.round(c.mastery_score * 100)}%</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', borderTop: '1px solid var(--border-primary)', paddingTop: '16px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Mint Timestamp</span>
                  <span>{c.issued_at.slice(0, 10)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ledger Network</span>
                  <span style={{ textTransform: 'capitalize' }}>{c.blockchain}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Token Identifier</span>
                  <span style={{ fontFamily: 'monospace' }}>#{c.token_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', wordBreak: 'break-all' }}>
                  <span>Transaction Hash</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{c.transaction_hash}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <a 
                  href={c.verify_url} 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  Verify Certificate
                </a>
                <a 
                  href={`https://sepolia.basescan.org/tx/${c.transaction_hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                >
                  Explorer
                </a>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
