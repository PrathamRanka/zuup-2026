'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpeech } from '../../hooks/useSpeech';

export default function UploadDiagram() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subject, setSubject] = useState('physics');
  const [grade, setGrade] = useState('class_10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { speak } = useSpeech();
  const router = useRouter();

  const speakInstructions = () => {
    speak(
      "Upload Page. Select your diagram file, configure the subject, then click the Start Session button."
    );
  };

  useEffect(() => {
    speakInstructions();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      speak(`Selected file: ${selected.name}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      speak(`Dropped file: ${selected.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      speak("Please select a diagram image to upload first.");
      return;
    }
    
    setIsSubmitting(true);
    speak("Uploading diagram. Please wait.");

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('subject', subject);
      formData.append('grade_level', grade);

      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/learn/session?id=${data.session_id}`);
      } else {
        speak("An error occurred starting the session. Please try a different image.");
      }
    } catch (err) {
      console.error(err);
      speak("Failed to connect to the backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 id="upload-title">Upload Diagram</h1>
        <p style={{ marginTop: '8px' }}>Select an image of a physics circuit or mathematics geometry figure to begin.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Accessible minimal drop area */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            border: '2px dashed var(--border-primary)',
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
          onClick={() => document.getElementById('file-input')?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              document.getElementById('file-input')?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload Diagram File. Click or press enter to select from your files."
        >
          <input 
            id="file-input"
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {previewUrl ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src={previewUrl} 
                alt="Selected diagram preview" 
                style={{ maxHeight: '160px', borderRadius: '4px', border: '1px solid var(--border-primary)' }}
              />
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Select File</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Click or drag image file here</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Subject */}
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="subject-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Subject</label>
            <select 
              id="subject-select"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                fontSize: '1rem'
              }}
            >
              <option value="physics">Physics (Circuits & Electricity)</option>
              <option value="mathematics">Mathematics (Geometry & Graphs)</option>
            </select>
          </div>

          {/* Grade level */}
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="grade-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Grade Level</label>
            <select 
              id="grade-select"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                fontSize: '1rem'
              }}
            >
              <option value="class_10">Class 10 (Secondary)</option>
              <option value="class_11">Class 11 & 12 (High School)</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          disabled={isSubmitting || !file}
        >
          {isSubmitting ? "Initializing..." : "Start Learning Session"}
        </button>
      </form>
    </div>
  );
}
