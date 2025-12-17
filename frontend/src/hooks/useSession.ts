import { useState, useEffect } from 'react';

export interface SessionData {
  sessionId: string;
  username: string;
  isGuest: boolean;
}

export const useSession = () => {
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    // Try to restore session from sessionStorage
    const storedSessionId = sessionStorage.getItem('sessionId');
    const storedUsername = localStorage.getItem('username');
    const token = localStorage.getItem('token');

    if (storedSessionId && storedUsername) {
      setSession({
        sessionId: storedSessionId,
        username: storedUsername,
        isGuest: !token,
      });
    }
  }, []);

  const createSession = (username: string, isGuest: boolean = true) => {
    // Generate a unique session ID
    const sessionId = generateSessionId();
    
    sessionStorage.setItem('sessionId', sessionId);
    localStorage.setItem('username', username);
    
    const newSession: SessionData = {
      sessionId,
      username,
      isGuest,
    };
    
    setSession(newSession);
    return newSession;
  };

  const clearSession = () => {
    sessionStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    localStorage.removeItem('token');
    setSession(null);
  };

  const updateUsername = (newUsername: string) => {
    if (session) {
      localStorage.setItem('username', newUsername);
      setSession({ ...session, username: newUsername });
    }
  };

  return {
    session,
    createSession,
    clearSession,
    updateUsername,
  };
};

// Generate a unique session ID
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
