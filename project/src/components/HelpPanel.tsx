import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Book, Code, Search, Info, ChevronDown, Plus } from 'lucide-react';
// FIX: Corrected import paths for glossary, snippets, and types data.
import { glossaryData } from '../analyze/data/help/glossary';
import { snippetData } from '../analyze/data/help/snippets';
import { GlossaryItem as GlossaryItemType, Snippet } from '../analyze/data/help/types';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSnippet: (code: string) => void;
}

const GlossaryCategoryAccordion: React.FC<{
    category: string;
    items: GlossaryItemType[];
  }> = ({ category, items }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-800 capitalize">{category}</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">{items.length}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="overflow-hidden"
                        {...{
                            initial: "collapsed",
                            animate: "open",
                            exit: "collapsed",
                            variants: {
                                open: { opacity: 1, height: 'auto' },
                                collapsed: { opacity: 0, height: 0 },
                            },
                            transition: { duration: 0.2, ease: 'easeInOut' }
                        } as any}
                    >
                       <div className="border-t border-gray-200">
                            {items.map((item, index) => (
                               <div key={item.term} className={`p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                                    <h4 className="font-semibold text-gray-800 text-sm">{item.term}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{item.definition}</p>
                                </div>
                            ))}
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const GlossarySearchResultItem: React.FC<{ item: GlossaryItemType }> = ({ item }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800">{item.term}</h3>
        <p className="text-sm text-gray-600 mt-1">{item.definition}</p>
        <p className="text-xs text-gray-400 mt-2 uppercase font-medium">{item.category}</p>
    </div>
);

const LanguageAccordion: React.FC<{
    language: string;
    snippets: Snippet[];
    onInsertSnippet: (code: string) => void;
  }> = ({ language, snippets, onInsertSnippet }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const languageDisplayName = useMemo(() => {
        const langMap: { [key: string]: string } = {
            nonmem: "NONMEM",
            r: "R",
            monolix: "Monolix",
            julia: "Julia"
        };
        return langMap[language.toLowerCase()] || language;
    }, [language]);

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-800 capitalize">{languageDisplayName}</span>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">{snippets.length}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 },
                        }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                       <div className="border-t border-gray-200">
                            {snippets.map((snippet, index) => (
                                <div key={snippet.id} className={`p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                                    <h4 className="font-semibold text-gray-800 text-sm">{snippet.title}</h4>
                                    <p className="text-sm text-gray-600 mt-1">{snippet.description}</p>
                                    <div className="flex justify-end items-center mt-3">
                                        <motion.button
                                            onClick={() => onInsertSnippet(snippet.code)}
                                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span>Insert</span>
                                        </motion.button>
                                    </div>
                                </div>
                            ))}
                       </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose, onInsertSnippet }) => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'snippets'>('snippets');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGlossary = useMemo<GlossaryItemType[]>(() => {
    // FIX: Cast glossaryData to an array of GlossaryItemType to resolve 'unknown' type error. This is likely due to a TS module resolution issue.
    const items = glossaryData as GlossaryItemType[];
    if (!searchTerm) return items;
    return items.filter(item =>
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const groupedGlossary = useMemo(() => {
    // FIX: Explicitly type the accumulator in the reduce function to prevent type inference issues.
    return filteredGlossary.reduce((acc: Record<string, GlossaryItemType[]>, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {});
  }, [filteredGlossary]);

  const groupedSnippets = useMemo(() => {
    return snippetData.reduce((acc, snippet) => {
        const lang = snippet.language.toLowerCase();
        if (!acc[lang]) {
            acc[lang] = [];
        }
        acc[lang].push(snippet);
        return acc;
    }, {} as Record<string, Snippet[]>);
  }, []);

  const filteredGroupedSnippets = useMemo(() => {
    if (!searchTerm.trim()) {
        return groupedSnippets;
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered: Record<string, Snippet[]> = {};

    Object.entries(groupedSnippets).forEach(([language, snippets]: [string, Snippet[]]) => {
        const matchingSnippets = snippets.filter(snippet =>
            snippet.title.toLowerCase().includes(lowercasedFilter) ||
            snippet.description.toLowerCase().includes(lowercasedFilter) ||
            snippet.code.toLowerCase().includes(lowercasedFilter)
        );

        if (matchingSnippets.length > 0) {
            filtered[language] = matchingSnippets;
        }
    });

    return filtered;
  }, [searchTerm, groupedSnippets]);

  const languageOrder = ['nonmem', 'r', 'monolix', 'julia'];
  
  const sortedFilteredLanguages = useMemo(() => {
      return Object.keys(filteredGroupedSnippets).sort((a, b) => {
          const indexA = languageOrder.indexOf(a);
          const indexB = languageOrder.indexOf(b);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b);
      });
  }, [filteredGroupedSnippets]);


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-[450px] bg-gray-50 z-50 shadow-2xl flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Help Center</h2>
              </div>
              <motion.button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="p-2 bg-white border-b border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('snippets')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'snippets' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Code className="w-4 h-4" />
                    <span>Snippets</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('glossary')}
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'glossary' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Book className="w-4 h-4" />
                    <span>Glossary</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === 'snippets' && (
                sortedFilteredLanguages.length > 0 ? (
                    sortedFilteredLanguages.map(lang => (
                        <LanguageAccordion
                            key={lang}
                            language={lang}
                            snippets={filteredGroupedSnippets[lang]}
                            onInsertSnippet={onInsertSnippet}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>No snippets found for "{searchTerm}".</p>
                    </div>
                )
              )}
              {activeTab === 'glossary' && (
                searchTerm.trim() ? (
                    filteredGlossary.length > 0 ? (
                        <div className="space-y-2">
                            {filteredGlossary.map(item => <GlossarySearchResultItem key={item.term} item={item} />)}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>No glossary terms found for "{searchTerm}".</p>
                        </div>
                    )
                ) : (
                    groupedGlossary && Object.keys(groupedGlossary).length > 0 ? (
                        Object.entries(groupedGlossary).map(([category, items]) => (
                            <GlossaryCategoryAccordion key={category} category={category} items={items} />
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            <p>Glossary is empty.</p>
                        </div>
                    )
                )
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HelpPanel;