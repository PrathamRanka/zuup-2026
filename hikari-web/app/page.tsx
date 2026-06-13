'use client';

import React, { useState, useEffect } from 'react';
import { useSpeech } from './hooks/useSpeech';
import { BookOpen, Award, Compass, RefreshCw, Plus, Wallet } from 'lucide-react';

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
    const completionText = `Welcome back, ${profile.display_name}. Your overall curriculum progress is ${Math.round(profile.progress_percent)} percent. You have earned ${profile.credentials_earned} blockchain credentials. The current recommended topic is ${profile.current_topic}.`;
    speak(completionText);
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
        speak("Wallet address updated successfully");
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
        speak("Student learning progress has been reset successfully");
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
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Loading your learning profile...</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Intro Hero with Screen Reader Announcements */}
      <section className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }} aria-labelledby="welcome-heading">
        <div>
          <h1 id="welcome-heading" style={{ margin: 0 }}>Hello, {profile?.display_name}!</h1>
          <p style={{ margin: '8px 0 0 0' }}>Your autonomous STEM companion is ready. Learn, query, and verify your masteries.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={handleAnnounceDashboard}
          aria-label="Speak dashboard summary details aloud"
        >
          Speak Summary
        </button>
      </section>

      {/* Stats Grid */}
      <section className="grid-2" aria-label="Curriculum Progress Statistics">
        {/* Progress Card */}
        <article className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Compass style={{ color: 'var(--accent-cyan)' }} aria-hidden="true" />
            <h2 style={{ margin: 0 }}>Recommended Path</h2>
          </div>
          <div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CURRENT RECOMMENDED TOPIC</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>{profile?.current_topic}</p>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
              <span>Curriculum Completion</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{Math.round(profile?.progress_percent || 0)}%</span>
            </div>
            {/* Custom high-contrast progress bar */}
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${profile?.progress_percent}%`, 
                  background: 'linear-gradient(to right, var(--accent-cyan), var(--accent-purple))',
                  borderRadius: '4px'
                }} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            <a href="/learn/upload" className="btn btn-primary" style={{ flex: 1 }}>
              <Plus size={18} />
              Start New Topic
            </a>
          </div>
        </article>

        {/* Credentials / Wallet Info */}
        <article className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award style={{ color: 'var(--accent-purple)' }} aria-hidden="true" />
            <h2 style={{ margin: 0 }}>Verifiable SBTs</h2>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>{profile?.credentials_earned}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Earned Credentials</p>
            </div>
            <div>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#fff', margin: 0 }}>{profile?.total_sessions}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Completed Sessions</p>
            </div>
          </div>
          
          {/* Wallet address update for visual credentials */}
          <form onSubmit={handleSaveWallet} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label htmlFor="wallet-address-input" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              Base L2 Wallet Address (for SBT credentials)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                id="wallet-address-input"
                type="text" 
                placeholder="0x..." 
                value={walletInput} 
                onChange={(e) => setWalletInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  fontFamily: 'monospace'
                }}
              />
              <button type="submit" className="btn btn-secondary" disabled={isSavingWallet} style={{ padding: '8px 16px' }}>
                <Wallet size={16} />
                Save
              </button>
            </div>
          </form>
        </article>
      </section>

      {/* Curriculum Mastery List */}
      <section className="glass-panel" aria-labelledby="topics-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 id="topics-heading" style={{ margin: 0 }}>Curriculum Mastery Checklist</h2>
          <button 
            onClick={handleReset} 
            className="btn btn-secondary" 
            disabled={resetting} 
            style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
            aria-label="Reset all learning curriculum stats"
          >
            <RefreshCw size={14} />
            Reset Progress
          </button>
        </div>
        <div className="list-group">
          {topics.map((t) => (
            <div key={t.topic_id} className="list-item">
              <div>
                <p style={{ fontWeight: 600, color: '#fff', margin: 0 }}>{t.display_name}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Sessions completed: {t.sessions}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Mastery</span>
                  <p style={{ fontWeight: 700, color: t.mastery_score >= 0.8 ? 'var(--accent-green)' : 'var(--accent-cyan)', margin: 0, textAlign: 'right' }}>
                    {Math.round(t.mastery_score * 100)}%
                  </p>
                </div>
                {t.credential_issued ? (
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--accent-green)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    SBT MINTED
                  </span>
                ) : (
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-muted)',
                    padding: '4px 8px',
                    borderRadius: '4px',
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
    </div>
  );
}
