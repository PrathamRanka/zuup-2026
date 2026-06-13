'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      const supportsSynthesizer = 'speechSynthesis' in window;
      const supportsRecognizer = !!SpeechRecognition;
      
      setIsSupported(supportsSynthesizer && supportsRecognizer);
      
      if (supportsRecognizer) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setTranscript(resultText);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const speak = useCallback((text: string, callback?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Cancel existing speech
    window.speechSynthesis.cancel();

    if (!text) return;

    // Filter out punctuation and symbols that are read awkwardly by screen readers in explanations
    const cleanText = text.replace(/Ω/g, ' ohms').replace(/=/g, ' equals ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Slightly slower pacing for pedagogical comprehension
    utterance.pitch = 1.05; // Friendly and clear pitch

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const startListening = useCallback(() => {
    // Voice Barge-In: cancel speech synthesis when student starts speaking
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    if (!recognitionRef.current) return;
    setTranscript('');
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error(e);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    isSpeaking,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
