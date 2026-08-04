// @ts-nocheck
import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  // Initial state is ALWAYS 'light' so SSR and first client paint match.
  // We then sync from localStorage in an effect — this avoids hydration mismatch.
  const [theme, setTheme] = useState('light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const temaSalvo = window.localStorage.getItem('web_app_tema');
    if (temaSalvo && temaSalvo !== 'light') {
      setTheme(temaSalvo);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('web_app_tema', theme);
    const classeAlvo = theme === 'light' ? 'tema-claro' : 'tema-escuro';
    document.body.classList.remove('tema-claro', 'tema-escuro');
    document.body.classList.add(classeAlvo);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((temaAnterior) => (temaAnterior === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser utilizado obrigatoriamente dentro de um ThemeProvider');
  }
  return context;
};
