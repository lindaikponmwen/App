import React from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Image as ImageIcon, Table, Code } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { FileNode } from '../../contexts/FileContext';
import CsvEditor from '../../plugin/csv/CsvEditor';
import Editor from '@monaco-editor/react';
import { getLanguageForExtension, getEditorTheme } from '../../editor/utils';

const MOCK_PLOT_SVG_DATA_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' width='400' height='300' style='background-color:%23f0f0f0; font-family: sans-serif;'%3E%3Ctext x='200' y='30' text-anchor='middle' font-size='18' font-weight='bold'%3EGoodness-of-Fit Plot%3C/text%3E%3Ctext x='200' y='280' text-anchor='middle' font-size='14'%3EPredicted Concentration%3C/text%3E%3Ctext x='20' y='150' text-anchor='middle' font-size='14' transform='rotate(-90 20 150)'%3EObserved Concentration%3C/text%3E%3Cg transform='translate(50, 40)'%3E%3Cpath d='M0 220 L320 220' stroke='%23333' stroke-width='1'/%3E%3Cpath d='M0 0 L0 220' stroke='%23333' stroke-width='1'/%3E%3Cpath d='M0 220 L320 0' stroke='%23f00' stroke-width='2' stroke-dasharray='5,5'/%3E%3Ccircle cx='40' cy='180' r='4' fill='%2300f'/%3E%3Ccircle cx='80' cy='150' r='4' fill='%2300f'/%3E%3Ccircle cx='120' cy='130' r='4' fill='%2300f'/%3E%3Ccircle cx='160' cy='100' r='4' fill='%2300f'/%3E%3Ccircle cx='200' cy='80' r='4' fill='%2300f'/%3E%3Ccircle cx='240' cy='60' r='4' fill='%2300f'/%3E%3Ccircle cx='280' cy='30' r='4' fill='%2300f'/%3E%3C/g%3E%3C/svg%3E";

interface ResultsViewerPanelProps {
  onClose: () => void;
  activeFile: FileNode | null;
}

const ResultsViewerPanel: React.FC<ResultsViewerPanelProps> = ({ onClose, activeFile }) => {
    const { settings } = useSettings();

    const renderContent = () => {
        if (!activeFile) {
            return (
                <div className="flex items-center justify-center h-full text-center text-gray-500">
                    <p>No file selected.</p>
                </div>
            );
        }

        const ext = activeFile.extension?.toLowerCase();
        const language = getLanguageForExtension(ext);
        const theme = getEditorTheme(language, settings.theme);

        switch (ext) {
            case 'csv':
                return (
                    <CsvEditor
                        content={activeFile.content || ''}
                        onContentChange={() => {}} // No-op as it's read-only
                        theme={settings.theme}
                        readOnly
                    />
                );
            case 'pdf':
                return (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-200 p-4">
                        <ImageIcon className="w-16 h-16 text-gray-500 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">PDF Preview</h3>
                        <p className="text-sm text-gray-600 mb-4">{activeFile.name}</p>
                        <img src={MOCK_PLOT_SVG_DATA_URL} alt="PDF Preview" className="max-w-full max-h-[70%] object-contain shadow-lg bg-white border" />
                    </div>
                );
            case 'txt':
                return (
                    <Editor
                        height="100%"
                        language={language}
                        value={activeFile.content || ''}
                        theme={theme}
                        options={{
                            ...settings,
                            readOnly: true,
                            // FIX: Convert boolean settings to the string/object format Monaco Editor expects.
                            wordWrap: settings.wordWrap ? 'on' : 'off',
                            lineNumbers: settings.lineNumbers ? 'on' : 'off',
                            minimap: { enabled: settings.showMinimap },
                            bracketPairColorization: { enabled: settings.bracketPairColorization },
                        }}
                    />
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-100">
                        <FileText className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-semibold text-lg">Preview not available</p>
                        <p>Cannot display a preview for "{activeFile.name}".</p>
                    </div>
                );
        }
    };

    return (
        <>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <h2 className="text-lg font-semibold text-gray-900 truncate">Results Viewer: {activeFile?.name}</h2>
                {/* FIX: Add close button to panel */}
                <motion.button
                    onClick={onClose}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <X className="w-5 h-5" />
                </motion.button>
            </div>
            <div className="flex-1 overflow-hidden">
                {renderContent()}
            </div>
        </>
    );
};

export default ResultsViewerPanel;