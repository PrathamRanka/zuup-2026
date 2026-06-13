'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, ShieldAlert, FileText, Calendar, ShieldCheck, Award } from 'lucide-react';

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
          setError("This credential identifier is invalid or has not been issued yet.");
        }
      } catch (e) {
        setError("Error connecting to the verification node.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerification();
  }, [id]);

  if (isLoading) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', maxWidth: '600px', margin: '40px auto' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Querying blockchain verify state...</h2>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', maxWidth: '600px', margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <ShieldAlert size={48} style={{ color: '#ef4444' }} />
        <h2 style={{ color: '#ef4444', margin: 0 }}>Verification Failed</h2>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{error || "Unknown validation error"}</p>
        <a href="/" className="btn btn-secondary" style={{ marginTop: '16px' }}>Back to Dashboard</a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', overflow: 'hidden' }} aria-labelledby="certificate-heading">
        
        {/* Glow backdrop ribbon */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(to right, var(--accent-cyan), var(--accent-purple))'
        }} />

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <CheckCircle2 size={48} style={{ color: 'var(--accent-green)' }} />
          <h1 id="certificate-heading" style={{ fontSize: '1.75rem', color: '#fff', margin: 0 }}>Credential Verified</h1>
          <p style={{ color: 'var(--accent-cyan)', fontSize: '0.875rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} /> SECURED BY BASE L2 SMART CONTRACT
          </p>
        </div>

        {/* Certificate Display Area */}
        <div style={{
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '24px',
          background: 'rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recipient Student</span>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: '4px 0 0 0' }}>{result.student_name}</p>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STEM Topic Mastery</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 500, color: '#fff', margin: '4px 0 0 0' }}>{result.topic}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Score Achieved</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-cyan)', margin: '4px 0 0 0', textAlign: 'right' }}>
                {Math.round(result.mastery_score * 100)}%
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', fontSize: '0.875rem' }}>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Calendar size={14} /> Verification Date
              </span>
              <p style={{ color: '#fff', margin: 0 }}>{result.issued_at}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <Award size={14} /> Token ID
              </span>
              <p style={{ color: '#fff', margin: 0, textAlign: 'right', fontFamily: 'monospace' }}>#{result.token_id}</p>
            </div>
          </div>
        </div>

        {/* Technical Validation Details */}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0, wordBreak: 'break-all' }}>
            <strong>Contract Address:</strong> <span style={{ fontFamily: 'monospace' }}>{result.contract_address}</span>
          </p>
          <p style={{ margin: 0 }}>
            <strong>Issuer Node:</strong> Hikari Verification Authority
          </p>
          <p style={{ margin: 0 }}>
            <strong>Status:</strong> Active & non-transferable SBT credential
          </p>
        </div>

        <a href="/" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>
          Go to Dashboard
        </a>
      </section>
    </div>
  );
}
