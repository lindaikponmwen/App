
import React, { useEffect, useRef, useState, useCallback } from 'react';
import webrService from '../services/webrService';
import { RRunner } from './RRunner';
import eventBus from '../utils/eventBus';

type RunCodeSource = 'editor' | 'console' | 'ai';

const RTerminal: React.FC = () => {
  const [consoleOutput, setConsoleOutput] = useState<any[]>([]);
  const [environment, setEnvironment] = useState<any>({});
  const [packages, setPackages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editorCode, setEditorCode] = useState('');

  const updateEnvironment = useCallback(async () => {
    const webR = webrService.getWebR();
    if (!webR) return;
    try {
      const objs = await webR.evalR("ls()");
      const objNames = await objs.toArray();
      const newEnv: any = {};
      for (const name of objNames) {
         if (name.startsWith('.')) continue;
         const classRes = await webR.evalR(`class(${name})`);
         const classArr = await classRes.toArray();
         const strRes = await webR.evalR(`capture.output(str(${name}, max.level=0, give.attr=FALSE))`);
         const strLines = await strRes.toArray();
         let objectType: any = 'variable';
         if (classArr.includes('function')) objectType = 'function';
         if (classArr.includes('data.frame')) objectType = 'data';
         newEnv[name] = { class: classArr, str: strLines.join(' ').replace(name, '').trim(), objectType };
      }
      setEnvironment(newEnv);
      const pkgRes = await webR.evalR("(.packages())");
      const pkgs = await pkgRes.toArray();
      const pkgMap: Record<string, string> = {};
      for(const p of pkgs) {
         const ver = await webR.evalR(`as.character(packageVersion('${p}'))`);
         const verStr = await ver.toArray();
         pkgMap[p] = verStr[0];
      }
      setPackages(pkgMap);
    } catch (e) { console.error("Env error", e); }
  }, []);

  const handleViewObject = useCallback(async (name: string) => {
      const webR = webrService.getWebR();
      if (!webR) return;
      try {
          let result = await webR.evalR(`is.data.frame(${name})`);
          if (!await result.toBoolean()) return;
          const dataRes = await webR.evalR(`jsonlite::toJSON(head(${name}, 100))`);
          const dataJson = await dataRes.toString();
          const parsedData = JSON.parse(dataJson);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
              eventBus.dispatch('r-table-created', { name, columns: Object.keys(parsedData[0]), data: parsedData });
          }
      } catch (e: any) { setConsoleOutput(prev => [...prev, { type: 'stderr', message: `Error viewing: ${e.message}` }]); }
  }, []);

  const runCode = useCallback(async (code: string, source: RunCodeSource = 'console') => {
    const webR = webrService.getWebR();
    if (!webR || !code.trim()) return;
    
    eventBus.dispatch('r-execution-start');
    setIsLoading(true);
    setConsoleOutput(prev => [...prev, { type: 'input', message: code }]);
    
    const shelter = await new webR.Shelter();
    try {
        if (source === 'editor' || source === 'ai') await shelter.evalR('if(dev.cur() != 1) dev.off()');
        
        const result = await shelter.captureR(code, { 
          withAutoprint: true, 
          captureStreams: true, 
          captureConditions: true, 
          captureGraphics: true 
        });

        let htmlBuffer = "";
        result.output?.forEach((evt: any) => {
            if (evt.type === 'stdout' || evt.type === 'stderr') {
                 const lines = evt.data.split('\n');
                 lines.forEach((line: string) => {
                    if (line) {
                      setConsoleOutput(prev => [...prev, { type: evt.type as any, message: line }]);
                      // Detect HTML table tags (kable/table1/xtable)
                      if (line.includes('<table') || line.includes('<div class="Rtable1">')) {
                        htmlBuffer += line;
                      } else if (htmlBuffer && (line.includes('</table>') || line.includes('</div>'))) {
                        htmlBuffer += line;
                        eventBus.dispatch('r-html-created', { html: htmlBuffer });
                        htmlBuffer = ""; // Reset after dispatch
                      } else if (htmlBuffer) {
                        htmlBuffer += line;
                      }
                    }
                });
            }
        });

        // Also check result value for standalone kable objects
        if (!htmlBuffer && result.value) {
            try {
              const valStr = await result.value.toString();
              const trimmed = valStr.trim();
              if (trimmed.startsWith('<') && (trimmed.includes('table') || trimmed.includes('div'))) {
                eventBus.dispatch('r-html-created', { html: trimmed });
              }
            } catch(e) {}
        }

        if (result.images && result.images.length > 0) {
            for (const image of result.images) {
                const canvas = document.createElement('canvas');
                canvas.width = image.width; canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(image, 0, 0);
                    eventBus.dispatch('r-plot-created', { dataUrl: canvas.toDataURL() });
                }
            }
        }
        await updateEnvironment();
    } catch (err: any) { setConsoleOutput(prev => [...prev, { type: 'stderr', message: `System Error: ${err.message}` }]);
    } finally { shelter.purge(); setIsLoading(false); eventBus.dispatch('r-execution-end'); }
  }, [updateEnvironment]);
  
  useEffect(() => {
    setIsLoading(!webrService.isReady());
    
    const handleStatusUpdate = (data: { status: string, message: string }) => {
        setConsoleOutput(prev => [...prev, { type: 'system', message: data.message }]);
        if (data.status === 'ready') {
            setIsLoading(false);
            updateEnvironment();
        }
    };
    
    eventBus.on('webr-status', handleStatusUpdate);
    
    if (webrService.isReady()) {
        updateEnvironment();
    }
    
    return () => eventBus.remove('webr-status', handleStatusUpdate);
  }, [updateEnvironment]);

  useEffect(() => {
    const handleExternalRun = (data: { code: string; source?: RunCodeSource }) => {
      setEditorCode(data.code);
      runCode(data.code, data.source || 'editor');
    };
    eventBus.on('run-r-code', handleExternalRun);
    return () => eventBus.remove('run-r-code', handleExternalRun);
  }, [runCode]);

  return (
    <div className="w-full h-full relative flex flex-col">
        <RRunner 
            consoleOutput={consoleOutput} environment={environment} packages={packages}
            editorCode={editorCode} isLoading={isLoading}
            onClearConsole={() => setConsoleOutput([])}
            onViewObject={handleViewObject} runCode={runCode}
            onInstallPackage={async (name) => {
                setIsLoading(true); setConsoleOutput(prev => [...prev, { type: 'system', message: `Fetching ${name}...`}]);
                try { 
                    const webR = webrService.getWebR();
                    await webR.installPackages([name]); 
                    await updateEnvironment(); 
                } 
                catch(e: any) { setConsoleOutput(prev => [...prev, { type: 'stderr', message: `Failed: ${e.message}`}]); }
                finally { setIsLoading(false); }
            }}
        />
    </div>
  );
};

export default RTerminal;
