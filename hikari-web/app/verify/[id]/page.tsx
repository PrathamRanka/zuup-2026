'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface VerificationResult {
  valid: boolean;
  student_name: string;
  topic: string;
  mastery_score: number;
  issued_at: string;
  blockchain_verified: boolean;
  contract_address: string;
  token_id: string;
}

export default function VerifyCredential() {
  const { id } = useParams();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchVerification = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/credentials/verify/${id}`);
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          setError("Invalid or unissued credential identifier.");
        }
      } catch (e) {
        setError("Error connecting to validation authority.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerification();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Querying blockchain verify state...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{
        maxWidth: '500px',
        margin: '40px auto',
        border: '1px solid var(--border-primary)',
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <h2 style={{ color: 'var(--accent-red)', margin: 0 }}>Verification Failed</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{error || "Unknown validation error"}</p>
        <a href="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>Dashboard</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto' }}>
      <section 
        style={{
          border: '1px solid var(--border-primary)',
          borderRadius: '8px',
          padding: '32px',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
        aria-labelledby="certificate-heading"
      >
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.1em' }}>
            VERIFIABLE CREDENTIAL RECEIPT
          </span>
          <h1 id="certificate-heading" style={{ fontSize: '1.5rem', color: '#fff', marginTop: '8px', marginBottom: 0 }}>
            Mastery Verified
          </h1>
        </div>

        {/* Monospace receipt grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'monospace', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>RECIPIENT:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{result.student_name.toUpperCase()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>TOPIC:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{result.topic.toUpperCase()}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>MASTERY SCORE:</span>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{Math.round(result.mastery_score * 100)}%</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>VERIFY DATE:</span>
            <span style={{ color: '#fff' }}>{result.issued_at}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-primary)', paddingBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>TOKEN ID:</span>
            <span style={{ color: '#fff' }}>#{result.token_id}</span>
          </div>
        </div>

        {/* Contract specs */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
          <p style={{ margin: 0, wordBreak: 'break-all' }}>
            <strong>Contract:</strong> {result.contract_address}
          </p>
          <p style={{ margin: 0 }}>
            <strong>Ledger:</strong> Base L2 (Sepolia Attestation)
          </p>
          <p style={{ margin: 0 }}>
            <strong>State:</strong> Non-transferable SBT, Active
          </p>
        </div>

        <a href="/" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>
          Return to Dashboard
        </a>
      </section>
    </div>
  );
}
