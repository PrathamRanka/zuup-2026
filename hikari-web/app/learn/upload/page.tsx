'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSpeech } from '../../hooks/useSpeech';
import { Upload, Image as ImageIcon, Volume2 } from 'lucide-react';

export default function UploadDiagram() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subject, setSubject] = useState('physics');
  const [grade, setGrade] = useState('class_10');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { speak } = useSpeech();
  const router = useRouter();

  // Read upload instructions when user visits or clicks instruction guide
  const speakInstructions = () => {
    speak(
      "Upload Diagram Page. Use the file upload control to choose an image of a physics circuit or mathematics geometry drawing. After selecting the file, choose your subject, then press the green Start Session button."
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
    speak("Uploading diagram and starting analysis session. Please wait.");

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
        speak("An error occurred starting the learning session. Please try a different image.");
      }
    } catch (err) {
      console.error(err);
      speak("Failed to connect to the backend server. Please check if your connection is active.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <section className="glass-panel" aria-labelledby="upload-heading" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 id="upload-heading" style={{ margin: 0, fontSize: '1.75rem' }}>Upload Diagram</h1>
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={speakInstructions}
            style={{ padding: '8px 12px', borderRadius: '8px' }}
            aria-label="Listen to page upload instructions aloud"
          >
            <Volume2 size={16} />
            Hear Guide
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Custom accessible drag & drop area */}
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--border-glass)',
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.1)',
              transition: 'var(--transition-smooth)',
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
            aria-label="Upload Diagram File. Drag and drop file here, or click to choose from system files."
          >
            <input 
              id="file-input"
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {previewUrl ? (
              <div style={{ position: 'relative', width: '100%', maxHeight: '200px', display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={previewUrl} 
                  alt="Preview of the selected diagram" 
                  style={{ maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}
                />
              </div>
            ) : (
              <>
                <Upload size={36} style={{ color: 'var(--accent-cyan)' }} />
                <div>
                  <p style={{ fontWeight: 500, color: '#fff', margin: '0 0 4px 0' }}>Drag & Drop Diagram Image</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>Supports PNG, JPG, or JPEG formats</p>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* Subject Selector */}
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="subject-select" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Subject Area</label>
              <select 
                id="subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#fff'
                }}
              >
                <option value="physics">Physics (Circuits & Electricity)</option>
                <option value="mathematics">Mathematics (Geometry & Graphs)</option>
                <option value="biology">Biology (Cells & Anatomies)</option>
              </select>
            </div>

            {/* Grade level Selector */}
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="grade-select" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Target Grade Level</label>
              <select 
                id="grade-select"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '10px',
                  color: '#fff'
                }}
              >
                <option value="class_10">Class 10 (Secondary School)</option>
                <option value="class_11">Class 11 & 12 (High School)</option>
                <option value="undergraduate">Undergraduate (University Degree)</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '10px' }}
            disabled={isSubmitting || !file}
          >
            {isSubmitting ? "Processing Diagram..." : "Start Learning Session"}
          </button>
        </form>
      </section>
    </div>
  );
}
