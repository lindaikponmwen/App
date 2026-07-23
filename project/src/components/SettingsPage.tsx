
import React, { useState, ReactNode, ChangeEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Palette, Code, Type, MousePointerClick, Folder, Sun, Moon, Plus, Database, AlertTriangle, Cloud } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useFiles } from '../contexts/FileContext';
import { currentProject } from '../data/appConfig';
import Switch from './ui/Switch';
import Select from './ui/Select';
import Input from './ui/Input';
import Slider from './ui/Slider';
import S3SyncPanel from './S3SyncButton'; // Importing from file named S3SyncButton but exporting panel
import { useProject } from '../contexts/ProjectContext';

const MockProjectWarning: React.FC = () => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
      <div className="flex items-start space-x-4">
        <div className="bg-yellow-100 p-2 mt-0.5 flex-shrink-0 rounded-full">
          <CloudOff className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800 tracking-wide uppercase">Mock Project Mode</h3>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
            You are currently viewing a sample project. Cloud synchronization features, including S3 backup, are disabled. To use cloud features, please load a valid project via the URL.
          </p>
        </div>
      </div>
    </div>
  );
};


const Accordion: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  children: ReactNode;
}> = ({ title, description, icon: Icon, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <Icon className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900 text-left">{title}</h3>
            <p className="text-sm text-gray-500 text-left">{description}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            className="overflow-hidden"
            {...{
              initial: "collapsed",
              animate: "open",
              exit: "collapsed",
              variants: {
                open: { opacity: 1, height: 'auto' },
                collapsed: { opacity: 0, height: 0 },
              },
              transition: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }
            } as any}
          >
            <div className="p-6 bg-gray-50/50 border-t border-gray-200">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToggleCard: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ label, description, checked, onChange }) => (
  <div className="bg-white p-4 border border-gray-200 flex justify-between items-center">
    <div>
      <h4 className="font-medium text-gray-800">{label}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <Switch checked={checked} onChange={onChange} />
  </div>
);

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
        {...{
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 }
        } as any}
      >
        <div className="flex items-center space-x-3 text-red-600 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-bold">Delete Version History</h3>
        </div>
        <p className="text-gray-600 mb-6">
            Are you sure you want to delete <strong>{count}</strong> historical versions across all files?
            This action cannot be undone and will permanently remove all past file states.
        </p>
        <div className="flex justify-end space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
            <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Delete All History</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();
  const { clearAllHistory, totalVersions } = useFiles();
  const [rulerInput, setRulerInput] = useState('');
    const { isMock } = useProject();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleAddRuler = () => {
    const newValue = parseInt(rulerInput, 10);
    if (!isNaN(newValue) && !settings.rulers.includes(newValue)) {
      updateSetting('rulers', [...settings.rulers, newValue].sort((a, b) => a - b));
      setRulerInput('');
    }
  };
  
  const handleRulerInputKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddRuler();
    }
  };
  
  const handleRemoveRuler = (ruler: number) => {
    updateSetting('rulers', settings.rulers.filter(r => r !== ruler));
  };

  const handleDeleteHistory = () => {
    clearAllHistory();
    setIsDeleteModalOpen(false);
  };
  

  return (
    <div className="flex-1 flex flex-col bg-gray-50 xrelative overflow-hidden min-h-0">
      <div className="p-6 bg-white border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-1">Customize your editor and application preferences.</p>
      </div>
      <div className="flex-1 h-full p-6 overflow-y-auto space-y-4">
        
         <Accordion title="Cloud Backup" description="Configure S3 backup settings and sync status" icon={Cloud}>
            {isMock ? (
              <MockProjectWarning />
            ) : (
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">S3 Folder Prefix</label>
                      <p className="text-xs text-gray-500 mb-2">
                          Files will be uploaded to this folder in the S3 bucket. Ensure it ends with a slash (/).
                      </p>
                      <Input 
                          value={settings.s3FolderPrefix} 
                          onChange={(e) => updateSetting('s3FolderPrefix', e.target.value)} 
                          type="hidden"
                          placeholder={`e.g., prj-${currentProject.id}/`}
                      />
                  </div>
                  <ToggleCard 
                      label="Auto-Sync" 
                      description="Automatically upload changed files to S3 periodically" 
                      checked={settings.autoSync} 
                      onChange={(val) => updateSetting('autoSync', val)} 
                  />
                  {settings.autoSync && (
                      <div className="pl-4 border-l-2 border-blue-100">
                           <Slider 
                              label="Sync Interval" 
                              min={1} 
                              max={60} 
                              step={1} 
                              value={settings.autoSyncInterval} 
                              onChange={(val) => updateSetting('autoSyncInterval', val)} 
                              unit=" min" 
                          />
                      </div>
                  )}
                  
                  {/* Visible Sync Panel */}
                  <S3SyncPanel />
              </div>
            )}
        </Accordion>

        <Accordion title="Editor Theme & Appearance" description="Visual appearance and color scheme settings" icon={Palette}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                  <div className="flex items-center p-1 bg-gray-200">
                    <button onClick={() => updateSetting('theme', 'light')} className={`w-1/2 py-2 text-sm font-semibold rounded-md flex items-center justify-center space-x-2 transition-colors ${settings.theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <Sun className="w-4 h-4" />
                      <span>Light</span>
                    </button>
                    <button onClick={() => updateSetting('theme', 'dark')} className={`w-1/2 py-2 text-sm font-semibold rounded-md flex items-center justify-center space-x-2 transition-colors ${settings.theme === 'dark' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <Moon className="w-4 h-4" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
                <Select label="Font Family" value={settings.fontFamily} onChange={(e) => updateSetting('fontFamily', e.target.value)}>
                  <option>JetBrains Mono, Fira Code, Consolas, monospace</option>
                  <option>Source Code Pro, monospace</option>
                  <option>IBM Plex Mono, monospace</option>
                  <option>Ubuntu Mono, monospace</option>
                  <option>Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace</option>
                  <option>Courier New, Courier, monospace</option>
                  <option>SF Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace</option>
                  <option>Droid Sans Mono, monospace</option>
                </Select>
              </div>
              <Slider label="Font Size" min={8} max={24} step={1} value={settings.fontSize} onChange={(val) => updateSetting('fontSize', val)} unit="px" />
              <div className="grid grid-cols-2 gap-6">
                <Select label="Cursor Style" value={settings.cursorStyle} onChange={(e) => updateSetting('cursorStyle', e.target.value as any)}>
                  <option value="line">Line</option>
                  <option value="block">Block</option>
                  <option value="underline">Underline</option>
                </Select>
                <Select label="Cursor Animation" value={settings.cursorBlinking} onChange={(e) => updateSetting('cursorBlinking', e.target.value as any)}>
                  <option value="blink">Blink</option>
                  <option value="smooth">Smooth</option>
                  <option value="phase">Phase</option>
                  <option value="expand">Expand</option>
                  <option value="solid">Solid</option>
                </Select>
              </div>
                <div className="grid grid-cols-1 gap-6">
                  <Select label="Line Highlighting" value={settings.renderLineHighlight} onChange={(e) => updateSetting('renderLineHighlight', e.target.value as any)}>
                    <option value="none">None</option>
                    <option value="gutter">Gutter</option>
                    <option value="line">Full Line</option>
                    <option value="all">Line & Gutter</option>
                  </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ToggleCard label="Show Minimap" description="Display code overview" checked={settings.showMinimap} onChange={(val) => updateSetting('showMinimap', val)} />
                <ToggleCard label="Line Numbers" description="Show line numbers" checked={settings.lineNumbers} onChange={(val) => updateSetting('lineNumbers', val)} />
                <ToggleCard label="Bracket Pair Colorization" description="Color matching brackets" checked={settings.bracketPairColorization} onChange={(val) => updateSetting('bracketPairColorization', val)} />
                <ToggleCard label="Highlight Active Indent Guide" description="Highlight current indent" checked={settings.highlightActiveIndentGuide} onChange={(val) => updateSetting('highlightActiveIndentGuide', val)} />
                <ToggleCard label="Color Decorators" description="Show color previews" checked={settings.colorDecorators} onChange={(val) => updateSetting('colorDecorators', val)} />
              </div>
            </div>
          </Accordion>

          <Accordion title="Editor Behavior" description="Code editing behavior and formatting options" icon={Code}>
              <div className="space-y-6">
                <Slider label="Tab Size" min={2} max={8} step={2} value={settings.tabSize} onChange={(val) => updateSetting('tabSize', val)} unit="spaces" />
                <div className="grid grid-cols-2 gap-6">
                  <Select label="Auto Indent" value={settings.autoIndent} onChange={(e) => updateSetting('autoIndent', e.target.value as any)}>
                    <option value="full">Full</option>
                    <option value="advanced">Advanced</option>
                    <option value="brackets">Brackets</option>
                    <option value="keep">Keep</option>
                    <option value="none">None</option>
                  </Select>
                  <Select label="Whitespace Rendering" value={settings.renderWhitespace} onChange={(e) => updateSetting('renderWhitespace', e.target.value as any)}>
                    <option value="none">None</option>
                    <option value="boundary">Boundary</option>
                    <option value="selection">Selection</option>
                    <option value="all">All</option>
                  </Select>
                </div>
                <Select label="Bracket Matching" value={settings.matchBrackets} onChange={(e) => updateSetting('matchBrackets', e.target.value as any)}>
                  <option value="always">Always</option>
                  <option value="near">Near</option>
                  <option value="never">Never</option>
                </Select>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Column Rulers</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Add column number..." value={rulerInput} onChange={(e) => setRulerInput(e.target.value)} onKeyDown={handleRulerInputKeydown} />
                    <button onClick={handleAddRuler} className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Add Ruler</span>
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                  {settings.rulers.map(ruler => (
                    <div key={ruler} className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm">
                      <span>{ruler}</span>
                      <button onClick={() => handleRemoveRuler(ruler)} className="ml-2 text-gray-500 hover:text-gray-800">
                        <X className="w-3 h-3"/>
                      </button>
                    </div>
                  ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ToggleCard label="Word Wrap" description="Wrap long lines" checked={settings.wordWrap} onChange={(val) => updateSetting('wordWrap', val)} />
                  <ToggleCard label="Insert Spaces" description="Use spaces for indentation" checked={settings.insertSpaces} onChange={(val) => updateSetting('insertSpaces', val)} />
                  <ToggleCard label="Auto-Detect Indentation" description="Detect tab preferences" checked={settings.detectIndentation} onChange={(val) => updateSetting('detectIndentation', val)} />
                  <ToggleCard label="Trim Auto Whitespace" description="Remove trailing whitespace" checked={settings.trimAutoWhitespace} onChange={(val) => updateSetting('trimAutoWhitespace', val)} />
                  <ToggleCard label="Code Folding" description="Enable collapsing code blocks" checked={settings.folding} onChange={(val) => updateSetting('folding', val)} />
                </div>
              </div>
            </Accordion>

          <Accordion title="Formatting & Validation" description="Code formatting and automatic corrections" icon={Type}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ToggleCard label="Format on Paste" description="Format pasted code" checked={settings.formatOnPaste} onChange={(val) => updateSetting('formatOnPaste', val)} />
              <ToggleCard label="Format on Type" description="Format as you type" checked={settings.formatOnType} onChange={(val) => updateSetting('formatOnType', val)} />
            </div>
          </Accordion>

          <Accordion title="Mouse & Scrolling" description="Mouse interaction and scrolling behavior" icon={MousePointerClick}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ToggleCard label="Smooth Scrolling" description="Enable smooth scrolling" checked={settings.smoothScrolling} onChange={(val) => updateSetting('smoothScrolling', val)} />
              <ToggleCard label="Mouse Wheel Zoom" description="Zoom with Ctrl + Scroll" checked={settings.mouseWheelZoom} onChange={(val) => updateSetting('mouseWheelZoom', val)} />
            </div>
          </Accordion>

          <Accordion title="File Management" description="Auto-save and file handling preferences" icon={Folder}>
            <div className="space-y-6">
              <Slider label="Auto-Save Delay" min={500} max={5000} step={500} value={settings.autoSaveDelay} onChange={(val) => updateSetting('autoSaveDelay', val)} unit="ms" />
              <ToggleCard label="Auto-Save Changes" description="Automatically save files after a period of inactivity" checked={settings.autoSave} onChange={(val) => updateSetting('autoSave', val)} />
              <div className="bg-white p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${settings.autoSave ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <h4 className="font-medium text-gray-800">Auto-Save Status</h4>
                    <p className="text-sm text-gray-500">
                      {settings.autoSave ? `Enabled - files save after ${settings.autoSaveDelay / 1000}s of inactivity` : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Accordion>

          <Accordion title="Data Management" description="Manage project data and storage" icon={Database}>
            <div className="space-y-4">
              <div className="bg-white p-4 border border-gray-200 flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-800">Clear Version History</h4>
                  <p className="text-sm text-gray-500">
                    Permanently remove all past file versions. Current Total: <span className="font-semibold">{totalVersions}</span> historical versions.
                  </p>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  disabled={totalVersions === 0}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${totalVersions === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                >
                  Delete History
                </button>
              </div>
            </div>
          </Accordion>

      </div>
      <AnimatePresence>
        {isDeleteModalOpen && (
            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={handleDeleteHistory}
                count={totalVersions} 
            />
        )}
      </AnimatePresence>
    </div>
  );
}
