
import React, { createContext, useContext, useState, useEffect } from 'react';
import { currentProject } from '../data/appConfig';

interface EditorSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  tabSize: number;
  showMinimap: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  fontFamily: string;
  cursorStyle: 'line' | 'block' | 'underline';
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
  bracketPairColorization: boolean;
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoClosingQuotes: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
  autoIndent: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
  formatOnPaste: boolean;
  formatOnType: boolean;
  insertSpaces: boolean;
  detectIndentation: boolean;
  trimAutoWhitespace: boolean;
  scrollBeyondLastLine: boolean;
  smoothScrolling: boolean;
  mouseWheelZoom: boolean;
  quickSuggestions: boolean;
  suggestOnTriggerCharacters: boolean;
  acceptSuggestionOnEnter: 'on' | 'smart' | 'off';
  snippetSuggestions: 'top' | 'bottom' | 'inline' | 'none';
  folding: boolean;
  foldingStrategy: 'auto' | 'indentation';
  showFoldingControls: 'always' | 'mouseover';
  matchBrackets: 'never' | 'near' | 'always';
  renderLineHighlight: 'none' | 'gutter' | 'line' | 'all';
  highlightActiveIndentGuide: boolean;
  rulers: number[];
  colorDecorators: boolean;
  // S3 Settings
  s3FolderPrefix: string;
  autoSync: boolean;
  autoSyncInterval: number;
}

interface SettingsContextType {
  settings: EditorSettings;
  updateSetting: <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => void;
}

const defaultSettings: EditorSettings = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  showMinimap: true,
  autoSave: true,
  autoSaveDelay: 5000,
  wordWrap: true,
  lineNumbers: true,
  fontFamily: 'JetBrains Mono, Fira Code, Consolas, monospace',
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  renderWhitespace: 'selection',
  bracketPairColorization: true,
  autoClosingBrackets: 'languageDefined',
  autoClosingQuotes: 'languageDefined',
  autoIndent: 'full',
  formatOnPaste: true,
  formatOnType: false,
  insertSpaces: true,
  detectIndentation: true,
  trimAutoWhitespace: true,
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  mouseWheelZoom: false,
  quickSuggestions: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  snippetSuggestions: 'inline',
  folding: true,
  foldingStrategy: 'auto',
  showFoldingControls: 'mouseover',
  matchBrackets: 'always',
  renderLineHighlight: 'line',
  highlightActiveIndentGuide: true,
  rulers: [],
  colorDecorators: true,
  s3FolderPrefix: `prj-${currentProject.id}/`,
  autoSync: false,
  autoSyncInterval: 5,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);

  useEffect(() => {
    const savedSettings = localStorage.getItem('drleveyai-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      localStorage.setItem('drleveyai-settings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
