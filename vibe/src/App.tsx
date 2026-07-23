import { useState, useEffect, lazy, Suspense } from 'react';
import type { Session } from './lib/types';
import {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  duplicateSession,
  addArtifact,
} from './services/sessionService';

const SessionList = lazy(() => import('./components/SessionList'));
const AnalysisWorkspace = lazy(() => import('./components/AnalysisWorkspace'));

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isNewSession, setIsNewSession] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreateSession = async (params: {
    name: string;
    compound?: string;
    software_stack?: string;
    analysis_type?: string;
    hitl_enabled: boolean;
    datasetFile?: File;
  }) => {
    setLoading(true);
    try {
      const { datasetFile, ...sessionParams } = params;
      const session = await createSession(sessionParams);

      if (datasetFile) {
        const content = await datasetFile.text();
        await addArtifact(session.id, {
          path: `Data/${datasetFile.name}`,
          artifact_type: 'dataset',
          content,
          metadata: { originalName: datasetFile.name, size: datasetFile.size, uploadedAt: new Date().toISOString() },
        });
      }

      setSessions(prev => [session, ...prev]);
      setIsNewSession(true);
      setActiveSession(session);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = (session: Session) => {
    setIsNewSession(false);
    setActiveSession(session);
  };

  const handleRenameSession = async (id: string, name: string) => {
    await updateSession(id, { name });
    setSessions(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleDuplicateSession = async (session: Session) => {
    const copy = await duplicateSession(session);
    setSessions(prev => [copy, ...prev]);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const handleBack = async () => {
    setIsNewSession(false);
    setActiveSession(null);
    const updated = await getSessions();
    setSessions(updated);
  };

  if (activeSession) {
    return (
      <Suspense fallback={null}>
        <AnalysisWorkspace session={activeSession} isNewSession={isNewSession} onBack={handleBack} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={null}>
      <SessionList
        sessions={sessions}
        onSelect={handleSelectSession}
        onCreate={handleCreateSession}
        onRename={handleRenameSession}
        onDuplicate={handleDuplicateSession}
        onDelete={handleDeleteSession}
        loading={loading}
      />
    </Suspense>
  );
}
