import { useState } from 'react';
import {
  Key, Cpu, Eye, EyeOff, Database, CheckCircle,
  AlertCircle, Loader, Copy, ExternalLink, Unlink, RefreshCw, Zap,
} from 'lucide-react';
import { MODELS } from '../lib/config';
import { setApiKey, setModel, getApiKey } from '../lib/openrouter';
import {
  SUPABASE_CREDS_KEY,
  testCredentials,
  MIGRATION_SQL,
  isUsingCustomCredentials,
  getActiveUrl,
  extractProjectRef,
  runMigrationSQL,
} from '../lib/supabase';

interface SettingsPanelProps {
  currentModelId: string;
  onModelChange: (id: string) => void;
}

type DbStatus = 'idle' | 'testing' | 'migrating' | 'needs_migration' | 'connected' | 'error';

export default function SettingsPanel({ currentModelId, onModelChange }: SettingsPanelProps) {
  // ── OpenRouter ──────────────────────────────────────────────────────────
  const [apiKey, setLocalApiKey] = useState(getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  const handleSaveKey = () => {
    setApiKey(apiKey);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const handleModelChange = (id: string) => {
    setModel(id);
    onModelChange(id);
  };

  // ── Supabase Connection ──────────────────────────────────────────────────
  const usingCustom = isUsingCustomCredentials();
  const activeUrl = getActiveUrl();

  const storedRaw = localStorage.getItem(SUPABASE_CREDS_KEY);
  const stored = storedRaw ? JSON.parse(storedRaw) as { url: string; anonKey: string } : null;

  const [dbUrl, setDbUrl] = useState(stored?.url ?? '');
  const [dbAnonKey, setDbAnonKey] = useState(stored?.anonKey ?? '');
  const [mgmtToken, setMgmtToken] = useState('');
  const [showAnonKey, setShowAnonKey] = useState(false);
  const [showMgmtToken, setShowMgmtToken] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatus>('idle');
  const [dbError, setDbError] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  const projectRef = extractProjectRef(dbUrl);
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard';

  const saveAndReload = (url: string, anonKey: string) => {
    localStorage.setItem(SUPABASE_CREDS_KEY, JSON.stringify({ url, anonKey }));
    setDbStatus('connected');
    setTimeout(() => window.location.reload(), 1200);
  };

  const handleTestAndSave = async () => {
    if (!dbUrl.trim() || !dbAnonKey.trim()) {
      setDbError('Both URL and Anon Key are required.');
      setDbStatus('error');
      return;
    }
    setDbStatus('testing');
    setDbError('');
    try {
      const result = await testCredentials(dbUrl.trim(), dbAnonKey.trim());
      if (!result.valid) {
        setDbStatus('error');
        setDbError(result.error || 'Connection failed.');
        return;
      }
      if (!result.tablesExist) {
        // Auto-migrate if management token is provided
        if (mgmtToken.trim() && projectRef) {
          setDbStatus('migrating');
          const migResult = await runMigrationSQL(projectRef, mgmtToken.trim());
          if (migResult.success) {
            saveAndReload(dbUrl.trim(), dbAnonKey.trim());
          } else {
            setDbStatus('needs_migration');
            setDbError(`Auto-migration failed: ${migResult.error}`);
          }
          return;
        }
        setDbStatus('needs_migration');
        return;
      }
      saveAndReload(dbUrl.trim(), dbAnonKey.trim());
    } catch (err) {
      setDbStatus('error');
      setDbError(String(err));
    }
  };

  const handleVerifyAfterMigration = async () => {
    setDbStatus('testing');
    setDbError('');
    try {
      const result = await testCredentials(dbUrl.trim(), dbAnonKey.trim());
      if (result.valid && result.tablesExist) {
        saveAndReload(dbUrl.trim(), dbAnonKey.trim());
      } else if (result.valid && !result.tablesExist) {
        setDbStatus('needs_migration');
        setDbError('Tables not found yet — have you run the SQL above?');
      } else {
        setDbStatus('error');
        setDbError(result.error || 'Connection failed.');
      }
    } catch (err) {
      setDbStatus('error');
      setDbError(String(err));
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem(SUPABASE_CREDS_KEY);
    window.location.reload();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(MIGRATION_SQL).then(() => {
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2000);
    });
  };

  const isBusy = dbStatus === 'testing' || dbStatus === 'migrating';

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">

      {/* ── Database Connection ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database size={13} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Database Connection</span>
        </div>

        {/* Current status badge */}
        <div className={`flex items-center justify-between px-3 py-2 border mb-3 ${
          usingCustom ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${usingCustom ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-600">{usingCustom ? 'Custom project' : 'Built-in project'}</span>
            {usingCustom && (
              <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]">
                {activeUrl.replace('https://', '').replace('.supabase.co', '')}
              </span>
            )}
          </div>
          {usingCustom && (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              <Unlink size={11} /> Disconnect
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {/* URL */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Supabase URL</label>
            <input
              type="text"
              className="w-full bg-white border border-gray-300 px-3 py-2 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={dbUrl}
              onChange={e => { setDbUrl(e.target.value); setDbStatus('idle'); setDbError(''); }}
            />
          </div>

          {/* Anon key */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block">Anon Key</label>
            <div className="relative">
              <input
                type={showAnonKey ? 'text' : 'password'}
                className="w-full bg-white border border-gray-300 px-3 py-2 pr-9 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                value={dbAnonKey}
                onChange={e => { setDbAnonKey(e.target.value); setDbStatus('idle'); setDbError(''); }}
              />
              <button onClick={() => setShowAnonKey(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                {showAnonKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Found in your Supabase project under Settings → API</p>
          </div>

          {/* Management API Token (optional — enables auto-migration) */}
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wider mb-1 block flex items-center gap-1.5">
              <Zap size={10} className="text-amber-500" />
              Management API Token
              <span className="normal-case text-gray-300 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type={showMgmtToken ? 'text' : 'password'}
                className="w-full bg-white border border-gray-300 px-3 py-2 pr-9 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="sbp_xxxxxxxxxxxxxxxx"
                value={mgmtToken}
                onChange={e => setMgmtToken(e.target.value)}
              />
              <button onClick={() => setShowMgmtToken(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                {showMgmtToken ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              If tables don't exist, they'll be created automatically.{' '}
              <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                Get token →
              </a>
            </p>
          </div>

          {/* Status feedback */}
          {dbStatus === 'error' && dbError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2">
              <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-red-700">{dbError}</span>
            </div>
          )}
          {dbStatus === 'migrating' && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2">
              <Loader size={12} className="text-amber-600 animate-spin" />
              <span className="text-xs text-amber-700 font-medium">Creating tables automatically...</span>
            </div>
          )}
          {dbStatus === 'connected' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2">
              <CheckCircle size={12} className="text-emerald-600" />
              <span className="text-xs text-emerald-700 font-medium">Connected! Reloading app...</span>
            </div>
          )}

          {/* Main action button */}
          {dbStatus !== 'needs_migration' && dbStatus !== 'connected' && dbStatus !== 'migrating' && (
            <button
              onClick={handleTestAndSave}
              disabled={isBusy || !dbUrl.trim() || !dbAnonKey.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {dbStatus === 'testing' ? (
                <><Loader size={12} className="animate-spin" /> Testing connection...</>
              ) : (
                <><Database size={12} /> Test & Save</>
              )}
            </button>
          )}
        </div>

        {/* Migration fallback — when no mgmt token or auto-migration failed */}
        {dbStatus === 'needs_migration' && (
          <div className="mt-3 space-y-3">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 px-3 py-2.5">
              <AlertCircle size={12} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-medium">Database tables not found</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Add a Management API Token above for auto-creation, or run the SQL manually below.
                </p>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 text-xs p-3 overflow-auto max-h-40 font-mono leading-relaxed border border-gray-700">
                {MIGRATION_SQL.trim()}
              </pre>
              <button
                onClick={handleCopySql}
                className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs transition-colors ${
                  sqlCopied ? 'bg-emerald-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                }`}
              >
                {sqlCopied ? <><CheckCircle size={10} /> Copied!</> : <><Copy size={10} /> Copy</>}
              </button>
            </div>

            {dbError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2">
                <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-red-700">{dbError}</span>
              </div>
            )}

            <div className="flex gap-2">
              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <ExternalLink size={11} /> Open SQL Editor
              </a>
              <button
                onClick={handleVerifyAfterMigration}
                disabled={dbStatus === 'testing'}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-700 text-white transition-colors disabled:opacity-50"
              >
                {dbStatus === 'testing' ? (
                  <><Loader size={11} className="animate-spin" /> Verifying...</>
                ) : (
                  <><RefreshCw size={11} /> Verify & Save</>
                )}
              </button>
            </div>

            <button
              onClick={() => { setDbStatus('idle'); setDbError(''); }}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              ← Back to edit credentials
            </button>
          </div>
        )}
      </div>

      {/* ── OpenRouter API Key ──────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 mb-2">
          <Key size={13} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">OpenRouter API Key</span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              className="w-full bg-white border border-gray-300 px-3 py-2 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 transition-colors"
              value={apiKey}
              placeholder="sk-or-v1-..."
              onChange={e => setLocalApiKey(e.target.value)}
            />
            <button onClick={() => setShowKey(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <button
            onClick={handleSaveKey}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              apiKeySaved ? 'bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            }`}
          >
            {apiKeySaved ? 'Saved!' : 'Save'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Default key pre-loaded. Get your own at openrouter.ai</p>
      </div>

      {/* ── LLM Model ─────────────────────────────────────────────── */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-center gap-2 mb-2">
          <Cpu size={13} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">LLM Model</span>
        </div>
        <div className="space-y-1.5">
          {MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => handleModelChange(m.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors border ${
                currentModelId === m.id
                  ? 'bg-cyan-50 border-cyan-400 text-cyan-700'
                  : 'bg-white border-gray-200 hover:border-gray-400 text-gray-600'
              }`}
            >
              <span className="font-medium">{m.label}</span>
              <span className="text-gray-400">{m.provider}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
