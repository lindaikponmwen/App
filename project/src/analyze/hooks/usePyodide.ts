import { useState, useEffect, useCallback } from 'react';
import type { ConsoleOutput, PythonEnvironment, TableData, PlotData } from '../types';
import { useFiles, FileNode } from '../../contexts/FileContext';

// FIX: Add a global declaration for window.loadPyodide to inform TypeScript of its existence.
declare global {
  interface Window {
    loadPyodide: (config: any) => Promise<any>;
  }
}

// Global state for Pyodide instance and initialization tracking
let pyodide: any;
let pyodidePromise: Promise<any> | null = null;
let isFsMounted = false; // Flag to ensure FS is mounted only once
let plotIdCounter = 0;

// Initializes Pyodide, ensuring it only runs once.
async function initializePyodide(setConsoleOutput: (fn: (prev: ConsoleOutput[]) => ConsoleOutput[]) => void) {
  if (pyodide) return pyodide;
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = (async () => {
    try {
      setConsoleOutput(prev => [...prev, { type: 'system', message: 'Initializing Pyodide...', id: Date.now() }]);
      
      const loadedPyodide = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
      });
      
      loadedPyodide.setStdout({
          batched: (msg: string) => {
              if(msg) setConsoleOutput(prev => [...prev, { type: 'stdout', message: msg, id: Date.now() + Math.random() }]);
          }
      });
      loadedPyodide.setStderr({
          batched: (msg: string) => {
              if(msg) setConsoleOutput(prev => [...prev, { type: 'stderr', message: msg, id: Date.now() + Math.random() }]);
          }
      });

      setConsoleOutput(prev => [...prev, { type: 'system', message: 'Loading packages...', id: Date.now() }]);
      await loadedPyodide.loadPackage(['pandas', 'matplotlib', 'numpy']);

      pyodide = loadedPyodide;
      return pyodide;
    } catch (error) {
      console.error('Error initializing Pyodide:', error);
      setConsoleOutput(prev => [...prev, { type: 'stderr', message: `Failed to initialize Pyodide: ${(error as Error).message}`, id: Date.now() }]);
      pyodidePromise = null;
      throw error;
    }
  })();
  
  return pyodidePromise;
}

// Mounts the project file system into Pyodide's virtual FS, ensuring it only runs once.
async function mountProjectFilesOnce(
  pyodideInstance: any,
  rootNode: FileNode,
  setConsoleOutput: (fn: (prev: ConsoleOutput[]) => ConsoleOutput[]) => void
) {
    if (isFsMounted || !pyodideInstance) {
        return;
    }
    
    const foldersToMount = ['Data', 'Models', 'Results', 'Scripts'];
    const projectRoot = `/project`;

    setConsoleOutput(prev => [...prev, { type: 'system', message: `Mounting folders: ${foldersToMount.join(', ')}...`, id: Date.now() }]);

    const writeNode = (node: FileNode, currentPath: string) => {
        const path = `${currentPath}/${node.name}`;
        if (node.type === 'folder') {
            pyodideInstance.FS.mkdir(path);
            if (node.children) {
                for (const child of node.children) {
                    writeNode(child, path);
                }
            }
        } else if (node.type === 'file' && node.content !== undefined) {
            pyodideInstance.FS.writeFile(path, node.content);
        }
    };
    
    try {
        pyodideInstance.FS.mkdir(projectRoot);
        
        const childrenToMount = rootNode.children?.filter(child => foldersToMount.includes(child.name)) || [];

        if (childrenToMount.length > 0) {
            for (const child of childrenToMount) {
                writeNode(child, projectRoot);
            }
        } else {
             setConsoleOutput(prev => [...prev, { type: 'system', message: `Warning: No mountable folders (${foldersToMount.join(', ')}) found.`, id: Date.now() }]);
        }

        const protectScript = `
import os
import shutil
from pathlib import Path

PROTECTED_PATH = os.path.abspath("${projectRoot}")

def create_protected_function(original_func):
    def protected_function(path, *args, **kwargs):
        abs_path = os.path.abspath(path)
        if abs_path.startswith(PROTECTED_PATH):
            raise PermissionError(f"Deletion of project files is not allowed: {path}")
        return original_func(path, *args, **kwargs)
    return protected_function

# Store original functions
_original_os_remove = os.remove
_original_os_unlink = os.unlink
_original_os_rmdir = os.rmdir
_original_shutil_rmtree = shutil.rmtree
_original_path_unlink = Path.unlink
_original_path_rmdir = Path.rmdir

# Monkey-patch with protected versions
os.remove = create_protected_function(_original_os_remove)
os.unlink = create_protected_function(_original_os_unlink)
os.rmdir = create_protected_function(_original_os_rmdir)
shutil.rmtree = create_protected_function(_original_shutil_rmtree)

# For Path.unlink and Path.rmdir, the first arg is 'self'
def protected_path_op(original_method):
    def method(self, *args, **kwargs):
        abs_path = os.path.abspath(str(self))
        if abs_path.startswith(PROTECTED_PATH):
            raise PermissionError(f"Deletion of project files is not allowed: {self}")
        return original_method(self, *args, **kwargs)
    return method

Path.unlink = protected_path_op(_original_path_unlink)
Path.rmdir = protected_path_op(_original_path_rmdir)

# Change to project directory
os.chdir(PROTECTED_PATH)
        `;

        await pyodideInstance.runPythonAsync(protectScript);
        setConsoleOutput(prev => [...prev, { type: 'system', message: `Working directory set to '${projectRoot}'. This directory is write-protected.`, id: Date.now() }]);
        isFsMounted = true;
    } catch(e) {
        isFsMounted = false; // Allow retry on failure
        const errorMsg = `Failed to mount project files in Python environment: ${(e as Error).message}`;
        console.error(errorMsg);
        setConsoleOutput(prev => [...prev, { type: 'stderr', message: errorMsg, id: Date.now() }]);
    }
}


export function usePyodide() {
  const { fileTree } = useFiles();
  const [isLoading, setIsLoading] = useState(true);
  const [isEnvLoading, setIsEnvLoading] = useState(true);
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput[]>([]);
  const [environment, setEnvironment] = useState<PythonEnvironment>({});
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [plots, setPlots] = useState<PlotData[]>([]);

  const updateEnvironment = useCallback(async () => {
    if (!pyodide) return;
    setIsEnvLoading(true);
    try {
      const code = `
import json
import pandas as pd
import sys
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
import numpy as np

def _is_table_like(obj):
    if isinstance(obj, (pd.DataFrame, pd.Series)):
        return True
    if isinstance(obj, np.ndarray) and obj.ndim in [1, 2]:
        return True
    if isinstance(obj, list) and obj and all(isinstance(i, dict) for i in obj):
        return True
    if isinstance(obj, dict) and obj:
        if all(isinstance(v, list) for v in obj.values()):
            it = iter(obj.values())
            try:
                first_len = len(next(it))
                if all(len(l) == first_len for l in it):
                    return True
            except StopIteration:
                pass
    return False

_vars = {}
_builtins = set(dir(__builtins__))
_scope = globals()

# Filter out modules and built-ins
_vars_to_ignore = {
    '__name__', '__doc__', '__package__', '__loader__', '__spec__', '__annotations__',
    '__builtins__', '_vars', '_builtins', '_scope', '_vars_to_ignore', 'json', 'pd', 
    'sys', 'pyodide', 'plt', 'Figure', 'np', '_is_table_like'
}
_vars_to_ignore.update(_builtins)

for name, value in list(_scope.items()):
    if name not in _vars_to_ignore and not name.startswith('_') and type(value).__name__ != 'module':
        try:
            repr_val = repr(value)
        except Exception:
            repr_val = f"<{type(value).__name__}>"

        if len(repr_val) > 100:
            repr_val = repr_val[:100] + '...'

        _vars[name] = {
            'type': type(value).__name__,
            'repr': repr_val,
            'is_dataframe': _is_table_like(value),
            'is_figure': isinstance(value, Figure),
        }
json.dumps(_vars)
      `;
      const envJson = await pyodide.runPythonAsync(code);
      setEnvironment(JSON.parse(envJson));
    } catch (error) {
        console.error('Error updating Python environment:', error);
    } finally {
        setIsEnvLoading(false);
    }
  }, []);

  useEffect(() => {
    async function initAndMount() {
      try {
        const pyodideInstance = await initializePyodide(setConsoleOutput);
        setIsLoading(false);
        setConsoleOutput(prev => {
            if (prev.some(p => p.message.includes('Pyodide Initialized'))) return prev;
            return [...prev, { type: 'system', message: 'Pyodide Initialized. Ready to execute Python code.', id: Date.now() }];
        });
        
        if (fileTree.name) {
            await mountProjectFilesOnce(pyodideInstance, fileTree, setConsoleOutput);
            await updateEnvironment();
        }

      } catch (error) {
        setIsLoading(false);
      }
    }
    
    initAndMount();
  }, [fileTree, updateEnvironment]);

  const runCode = async (code: string, options?: { isInteractive?: boolean }) => {
    if (!pyodide || isLoading) return;
    setConsoleOutput(prev => [...prev, { type: 'input', message: code, id: Date.now() }]);
    
    const isInteractive = options?.isInteractive ?? false;

    try {
        if (!isInteractive) {
            await pyodide.runPythonAsync(`
import matplotlib.pyplot as plt
# Reset plot state for new script execution
plt.close('all')
`);
        }
        await pyodide.runPythonAsync(code);

        const plotsCode = `
import io
import base64
import matplotlib.pyplot as plt
import json

plots = []
for i in plt.get_fignums():
    fig = plt.figure(i)
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    plots.append(base64.b64encode(buf.read()).decode('utf-8'))

json.dumps(plots)
`;
        const plotsJson = await pyodide.runPythonAsync(plotsCode);
        const newPlots = JSON.parse(plotsJson);
        
        const plotObjects = newPlots.map((p: string) => ({
            id: `plot-${plotIdCounter++}`,
            dataUrl: `data:image/png;base64,${p}`
        }));

        if (isInteractive) {
            // For interactive console, replace plots with the current state of all figures
            setPlots(plotObjects);
        } else {
            // For editor script runs, append new plots
            if (plotObjects.length > 0) {
                setPlots(prev => [...prev, ...plotObjects]);
            }
        }
    } catch (e: any) {
      // The error will be printed by the pyodide.setStderr handler
    } finally {
      await updateEnvironment();
    }
  };

  const viewObjectByName = async (name: string) => {
    if (!pyodide || !/^[a-zA-Z0-9_]+$/.test(name)) {
      const errorMsg = `Error: Invalid object name for viewer: ${name}`;
      console.error(errorMsg);
      setConsoleOutput(prev => [...prev, { type: 'stderr', message: errorMsg, id: Date.now() }]);
      return;
    }
    
    try {
        const pythonCode = `
import json
import pandas as pd
import numpy as np

name = "${name}"
json_output = None

if name in globals():
    target_obj = globals()[name]
    df_to_serialize = None

    if isinstance(target_obj, pd.DataFrame):
        df_to_serialize = target_obj
    elif isinstance(target_obj, pd.Series):
        df_to_serialize = target_obj.to_frame(name=name)
    elif isinstance(target_obj, np.ndarray) and target_obj.ndim in [1, 2]:
        df_to_serialize = pd.DataFrame(target_obj)
    elif isinstance(target_obj, list) and len(target_obj) > 0 and all(isinstance(i, dict) for i in target_obj):
        df_to_serialize = pd.DataFrame(target_obj)
    elif isinstance(target_obj, dict):
        try:
            df_to_serialize = pd.DataFrame(target_obj)
        except Exception:
            df_to_serialize = None

    if df_to_serialize is not None:
        # Move index to a column
        df_to_serialize = df_to_serialize.reset_index()
        json_output = df_to_serialize.to_json(orient='split', index=False, default_handler=str)

json_output
`;
        const tableJson = await pyodide.runPythonAsync(pythonCode);

        if (tableJson) {
            const parsed = JSON.parse(tableJson);
            const tableDataObj = {
                name,
                columns: parsed.columns,
                data: parsed.data.map((row: any[]) => {
                    const rowObj: Record<string, any> = {};
                    parsed.columns.forEach((col: string, j: number) => {
                        rowObj[col] = row[j];
                    });
                    return rowObj;
                })
            };
            setTableData(tableDataObj);
        } else {
            throw new Error(`Object '${name}' is not a table-like structure or does not exist.`);
        }
    } catch (error) {
        const errorMsg = `Could not view object '${name}': ${(error as Error).message}`;
        console.error(errorMsg);
        setConsoleOutput(prev => [...prev, { type: 'stderr', message: errorMsg, id: Date.now() }]);
    }
  };

  const viewPlotByName = async (name: string) => {
    if (!pyodide || !/^[a-zA-Z0-9_]+$/.test(name)) {
      const errorMsg = `Error: Invalid object name for viewer: ${name}`;
      console.error(errorMsg);
      setConsoleOutput(prev => [...prev, { type: 'stderr', message: errorMsg, id: Date.now() }]);
      return;
    }

    try {
        const pythonCode = `
import io
import base64
from matplotlib.figure import Figure

plot_b64 = None
if "${name}" in globals() and isinstance(globals()["${name}"], Figure):
    fig = globals()["${name}"]
    buf = io.BytesIO()
    fig.savefig(buf, format='png', bbox_inches='tight')
    buf.seek(0)
    plot_b64 = base64.b64encode(buf.read()).decode('utf-8')
plot_b64
`;
        const b64string = await pyodide.runPythonAsync(pythonCode);
        if (b64string) {
            const newPlot = {
                id: `plot-${plotIdCounter++}`,
                dataUrl: `data:image/png;base64,${b64string}`
            };
            setPlots(prev => [...prev, newPlot]);
        } else {
             throw new Error(`Object '${name}' is not a Figure or does not exist.`);
        }
    } catch (error) {
        const errorMsg = `Could not view plot object '${name}': ${(error as Error).message}`;
        console.error(errorMsg);
        setConsoleOutput(prev => [...prev, { type: 'stderr', message: errorMsg, id: Date.now() }]);
    }
  };

  const clearPlots = () => setPlots([]);
  const clearTable = () => setTableData(null);
  const clearConsole = () => setConsoleOutput([]);

  return { isLoading, isEnvLoading, consoleOutput, environment, tableData, plots, runCode, clearPlots, clearTable, clearConsole, viewObjectByName, viewPlotByName };
}