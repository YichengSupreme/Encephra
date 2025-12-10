import { useState, useEffect, useCallback } from 'react';
import { geminiService } from '../services/GeminiService';

const STORAGE_KEY = 'neuroflow_gemini_key';

export const useGemini = () => {
  const [apiKey, setApiKey] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
      geminiService.initialize(stored);
      setIsReady(true);
    }
  }, []);

  const updateApiKey = useCallback((key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
      geminiService.initialize(key);
      setIsReady(true);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setIsReady(false);
    }
  }, []);

  return { apiKey, isReady, updateApiKey };
};