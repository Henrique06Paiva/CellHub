import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const GlobalContext = createContext();

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal deve ser usado dentro de um GlobalProvider');
  }
  return context;
}

export function GlobalProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');
  const [isNavigating, setIsNavigating] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Loading Overlay
  const showLoader = useCallback((message = 'Carregando...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Navigation Progress Bar (YouTube Style)
  const startNavigation = useCallback(() => setIsNavigating(true), []);
  const stopNavigation = useCallback(() => setIsNavigating(false), []);

  // Toast Notifications
  const notify = useCallback((type, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, message };
    
    setToasts((prev) => [...prev, newToast]);

    // Autoclose after 10 seconds (as requested by user)
    setTimeout(() => {
      removeToast(id);
    }, 10000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    isLoading,
    loadingMessage,
    isNavigating,
    toasts,
    showLoader,
    hideLoader,
    startNavigation,
    stopNavigation,
    notify,
    removeToast
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
}
