'use client';

import React, { useState, useEffect } from 'react';
import { useSpeech } from './hooks/useSpeech';

interface StudentProfile {
  id: string;
  display_name: string;
  email: string;
  curriculum: string;
  wallet_address: string | null;
  progress_percent: number;
  total_sessions: number;
  credentials_earned: number;
  current_topic: string;
}

interface TopicMastery {
  topic_id: string;
  display_name: string;
  mastery_score: number;
  sessions: number;
  credential_issued: boolean;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [topics, setTopics] = useState<TopicMastery[]>([]);
  const [walletInput, setWalletInput] = useState('');
  const [isSavingWallet, setIsSavingWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  
  const { speak } = useSpeech();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, masteryRes] = await Promise.all([
        fetch('/api/student/profile'),
        fetch('/api/student/mastery')
      ]);
      if (profileRes.ok && masteryRes.ok) {
        const profileData = await profileRes.json();
        const masteryData = await masteryRes.json();
        setProfile(profileData);
        setTopics(masteryData.topics || []);
        if (profileData.wallet_address) {
          setWalletInput(profileData.wallet_address);
        }
      }
    } catch (e) {
      console.error("Error loading dashboard data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAnnounceDashboard = () => {
    if (!profile) return;
    const announcement = `Classroom dashboard. Student name ${profile.display_name}. Completion is ${Math.round(profile.progress_percent)} percent. Credentials earned ${profile.credentials_earned}. Current recommended topic is ${profile.current_topic}.`;
    speak(announcement);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWallet(true);
    try {
      const res = await fetch('/api/student/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletInput }),
      });
      if (res.ok) {
        speak("Wallet address updated.");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingWallet(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset your curriculum progress for testing?")) return;
    setResetting(true);
    try {
      const res = await fetch('/api/student/reset', { method: 'POST' });
      if (res.ok) {
        speak("Student learning progress has been reset.");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Retrieving classroom records...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      
      {/* Student Overview Header */}
      <section aria-labelledby="profile-heading" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h1 id="profile-heading">{profile?.display_name}</h1>
          <p style={{ marginTop: '8px' }}>
            Classroom Node: {profile?.curriculum.toUpperCase()} Curriculum. Overall completion is {Math.round(profile?.progress_percent || 0)}%.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            className="btn btn-secondary"
            onClick={handleAnnounceDashboard}
            aria-label="Announce status summary aloud"
          >
            Speak Status
          </button>
          <a href="/learn/upload" className="btn btn-primary">
            Upload Diagram
          </a>
        </div>
      </section>

      {/* Target Recommendation */}
      <section aria-labelledby="recommendation-heading" style={{ borderLeft: '4px solid var(--accent-amber)', paddingLeft: '24px' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--accent-amber)', fontWeight: 600, display: 'block', letterSpacing: '0.05em', marginBottom: '4px' }}>
          RECOMMENDED TOPIC
        </span>
        <h2 id="recommendation-heading" style={{ margin: 0, fontSize: '1.75rem' }}>{profile?.current_topic}</h2>
        <p style={{ marginTop: '8px', fontSize: '1.05rem' }}>Next logical prerequisite based on topic mastery scores.</p>
      </section>

      {/* Curriculum Mastery List */}
      <section aria-labelledby="curriculum-heading" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 id="curriculum-heading" style={{ margin: 0 }}>Curriculum Roadmap</h2>
          <button 
            onClick={handleReset} 
            className="btn btn-secondary" 
            disabled={resetting} 
            style={{ fontSize: '0.875rem', padding: '8px 16px' }}
            aria-label="Reset curriculum progress for testing"
          >
            Reset Progress
          </button>
        </div>
        
        <div className="list-group">
          {topics.map((t) => (
            <div key={t.topic_id} className="list-item">
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.display_name}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Completed sessions: {t.sessions}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Mastery</span>
                  <strong style={{ fontSize: '1.1rem', color: t.mastery_score >= 0.8 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                    {Math.round(t.mastery_score * 100)}%
                  </strong>
                </div>
                {t.credential_issued ? (
                  <span style={{
                    border: '1px solid var(--border-primary)',
                    color: 'var(--accent-amber)',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace'
                  }}>
                    SBT MINTED
                  </span>
                ) : (
                  <span style={{
                    color: 'var(--text-muted)',
                    padding: '4px 10px',
                    fontSize: '0.75rem'
                  }}>
                    UNLOCKED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wallet configuration */}
      <section aria-labelledby="wallet-heading" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '32px' }}>
        <h2 id="wallet-heading" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Blockchain Settlement</h2>
        <p style={{ fontSize: '0.95rem', marginBottom: '20px' }}>Provide a Base L2 wallet address to receive non-transferable Soul-Bound Token credentials upon course mastery.</p>
        
        <form onSubmit={handleSaveWallet} style={{ display: 'flex', gap: '12px' }}>
          <input 
            id="wallet-input"
            type="text" 
            placeholder="0x..." 
            value={walletInput} 
            onChange={(e) => setWalletInput(e.target.value)}
            aria-label="Base wallet address"
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              padding: '12px',
              color: '#fff',
              fontFamily: 'monospace',
              fontSize: '1rem'
            }}
          />
          <button type="submit" className="btn btn-secondary" disabled={isSavingWallet} style={{ padding: '12px 24px' }}>
            Save Address
          </button>
        </form>
      </section>
    </div>
  );
}
