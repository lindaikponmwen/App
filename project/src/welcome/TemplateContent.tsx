
import React, { useState, useMemo, useEffect } from 'react';
import { PlusCircle, XCircle, Search, FileCode, Check, Workflow } from 'lucide-react';
import { analysisTemplates, AnalysisTemplate, CustomTemplateFile } from './analysisTemplates';
import { useFiles } from '../contexts/FileContext';

interface TemplateContentProps {
    onComplete: () => void;
}

export const TemplateContent: React.FC<TemplateContentProps> = ({ onComplete }) => {
    const { fileTree, addNode, updateFileContentById } = useFiles();
    const [added, setAdded] = useState<AnalysisTemplate[]>([]);
    const [available, setAvailable] = useState<AnalysisTemplate[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);

    useEffect(() => {
        // Load custom templates from the file tree (My Workflows folder)
        const customNodes = fileTree.children?.find(node => node.name === 'My Workflows')?.children || [];
        const customTemplates = customNodes.map((node): AnalysisTemplate => {
            let files: CustomTemplateFile[] = [];
            try {
                if (node.content) files = JSON.parse(node.content);
            } catch (e) { 
                console.error("Could not parse workflow file", e); 
            }

            return {
                id: node.id,
                title: node.name.replace('.workflow', ''),
                description: `Custom workflow with ${files.length} file(s).`,
                plots: [],
                tables: [],
                customFiles: files,
                isCustom: true,
            };
        });

        // Combine custom templates (first) with default templates
        const allTemplates = [...customTemplates, ...analysisTemplates];
        setAvailable(allTemplates);
    }, [fileTree]);

    const filteredAvailable = useMemo(() => {
        const pool = available.filter(t => !added.some(a => a.id === t.id));
        if (!searchTerm) {
            return pool;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return pool.filter(template => 
            template.title.toLowerCase().includes(lowercasedTerm) ||
            template.description.toLowerCase().includes(lowercasedTerm)
        );
    }, [searchTerm, available, added]);

    const handleAdd = (template: AnalysisTemplate) => {
        setAdded(prev => [...prev, template]);
    };
    
    const handleRemove = (template: AnalysisTemplate) => {
        setAdded(prev => prev.filter(t => t.id !== template.id));
    };

    const getFolderId = async (name: string): Promise<string> => {
        const found = fileTree.children?.find(n => n.name === name && n.type === 'folder');
        if (found) return found.id;
        const newNode = await addNode('root', name, 'folder');
        return newNode.id;
    }

    const determineTargetFolder = (filename: string): string => {
        const lowerName = filename.toLowerCase();
        const ext = lowerName.split('.').pop() || '';

        if (lowerName.includes('dap') && (ext === 'docx' || ext === 'md')) {
            return 'Initial Plan';
        }
        if (lowerName.includes('report') && (ext === 'docx' || ext === 'md')) {
            return 'Initial Reports';
        }

        switch (ext) {
            case 'r':
            case 'py':
            case 'jl':
            case 'm':
                return 'Scripts';
            case 'csv':
            case 'xls':
            case 'xlsx':
            case 'xpt':
            case 'txt':
                return 'Data';
            case 'mod':
            case 'ctl':
            case 'mlxtran':
                return 'Models';
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'svg':
                return 'Results';
            case 'pptx':
                return 'Talks';
            default:
                return 'Scripts';
        }
    };

    const handleExecute = async () => {
        setIsExecuting(true);
        
        for (const template of added) {
            const filesToProcess = template.customFiles || template.files;

            if (filesToProcess && filesToProcess.length > 0) {
                for (const file of filesToProcess) {
                    const targetFolderName = determineTargetFolder(file.name);
                    const targetFolderId = await getFolderId(targetFolderName);
                    
                    const newFile = await addNode(targetFolderId, file.name, 'file');
                    await updateFileContentById(newFile.id, file.content);
                }
            } else {
                const scriptsId = await getFolderId('Scripts');
                const scriptName = `${template.id}_analysis.R`;
                
                let scriptContent = `# Analysis: ${template.title}\n`;
                scriptContent += `# Description: ${template.description}\n\n`;
                scriptContent += `library(ggplot2)\nlibrary(dplyr)\n\n`;
                scriptContent += `# 1. Load Data\n# data <- read.csv("../Data/dataset.csv")\n\n`;
                
                if (template.plots.length > 0) {
                    scriptContent += `# --- PLOTS ---\n`;
                    template.plots.forEach(plot => {
                        scriptContent += `\n# ${plot.name}\n# ${plot.description}\n# ggplot(data, aes(x=TIME, y=DV)) + geom_point()\n`;
                    });
                }
                
                if (template.tables.length > 0) {
                    scriptContent += `\n# --- TABLES ---\n`;
                    template.tables.forEach(table => {
                        scriptContent += `\n# ${table.name}\n# ${table.description}\n# data %>% group_by(ID) %>% summarize(mean_conc = mean(DV))\n`;
                    });
                }

                const newFile = await addNode(scriptsId, scriptName, 'file');
                await updateFileContentById(newFile.id, scriptContent);
            }
        }

        await new Promise(resolve => setTimeout(resolve, 800));
        setIsExecuting(false);
        onComplete();
    };

    return (
        <div className="flex flex-col h-full relative">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">Workflows to execute</h3>
                    {added.length > 0 && (
                        <button
                            onClick={handleExecute}
                            disabled={isExecuting}
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:bg-blue-400"
                        >
                            {isExecuting ? (
                                <span>Generating...</span>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Execute Now</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
                <div className="bg-white p-3 border border-gray-200 min-h-[80px] flex items-center rounded-lg">
                    {added.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center w-full">No workflows added yet. Select from the options below.</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {added.map(template => (
                                <div
                                    key={template.id}
                                    className="bg-blue-100 border border-blue-200 text-blue-800 text-sm font-medium px-3 py-1.5 flex items-center gap-2 rounded-full"
                                >
                                    <span>{template.title}</span>
                                    <button onClick={() => handleRemove(template)} className="text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-200 p-0.5">
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 relative mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Select workflow</h3>
                    <div className="flex space-x-2 relative">
                        <a 
                            href="#/workflows"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center space-x-1"
                        >
                            <Workflow className="w-4 h-4" />
                            <span>Manage Custom Workflows</span>
                        </a>
                    </div>
                </div>
                
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="search"
                        placeholder="Search templates (e.g., EDA, NCA)..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-2">
                    {filteredAvailable.map(template => (
                        <div
                            key={template.id}
                            className="bg-white p-4 border border-gray-200 rounded-lg flex items-start justify-between hover:border-blue-400 hover:shadow-sm transition-all group relative"
                        >
                            <div className="flex-1 mr-4">
                                <div className="flex items-center mb-1">
                                    <FileCode className={`w-4 h-4 mr-2 ${template.isCustom ? 'text-purple-600' : 'text-gray-400'}`} />
                                    <p className="font-semibold text-gray-900">{template.title}</p>
                                    {template.isCustom && (
                                        <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Custom</span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{template.description}</p>
                                <div className="flex gap-2">
                                    {(template.customFiles || template.files) ? (
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{(template.customFiles || template.files)?.length || 0} Files</span>
                                    ) : (
                                        <>
                                            {template.plots.length > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{template.plots.length} Plots</span>}
                                            {template.tables.length > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{template.tables.length} Tables</span>}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button 
                                    onClick={() => handleAdd(template)} 
                                    className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    Add
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredAvailable.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No matching workflows found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
