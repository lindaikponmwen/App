//src/plugin/pptx/PptxEditor.tsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useHistory } from './useHistory';
import { samplePresentation } from './sampleData';
import { THEMES } from './themes';
import { createNewSlide, duplicateSlide, applySlideLayout } from './slideTemplates';
import { downloadPresentation } from './pptxGenerator';
import { Editor, Slideshow, HelpModal } from './Editor';
import type { Presentation, Slide, SlideElement, ShapeType, Comment, TableCellData } from './types';
import { FileNode } from '../../contexts/FileContext';

interface PptxEditorProps {
  isFilePanelVisible: boolean;
  onToggleFilePanel: () => void;
  file: FileNode;
  onContentChange: (content: string) => void;
}

const getInitialPresentation = (file: FileNode): Presentation => {
    if (file.content && !file.content.includes('cannot be displayed in the editor')) {
        try {
            const parsed = JSON.parse(file.content);
            if (parsed && typeof parsed === 'object' && Array.isArray(parsed.slides)) {
                return { ...parsed, title: file.name };
            }
        } catch (e) {
            console.error("Failed to parse presentation content, falling back to sample.", e);
        }
    }
    return { ...samplePresentation, title: file.name };
};

const PptxEditor: React.FC<PptxEditorProps> = ({ isFilePanelVisible, onToggleFilePanel, file, onContentChange }) => {
  const {
    state: presentation,
    setState: setPresentation,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<Presentation>(getInitialPresentation(file));

  const [activeSlideId, setActiveSlideId] = useState<string>(presentation.slides[0]?.id || '');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [isSlideshowActive, setIsSlideshowActive] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  const [lastEdited, setLastEdited] = useState(new Date());
  const [isThemesSidebarOpen, setIsThemesSidebarOpen] = useState(false);
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false);
  const [clipboard, setClipboard] = useState<SlideElement | null>(null);
  const [activeCommentThreadId, setActiveCommentThreadId] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // One-time effect to ensure all elements in the initial presentation have a z-index.
    setPresentation(p => {
        const needsNormalization = p.slides.some(s => s.elements.some(e => e.style?.zIndex === undefined));
        if (!needsNormalization) return p;

        return {
            ...p,
            slides: p.slides.map(slide => ({
                ...slide,
                elements: slide.elements.map((el, index) => ({
                    ...el,
                    style: {
                        ...el.style,
                        zIndex: el.style?.zIndex ?? index,
                    }
                }))
            }))
        };
    }, true); // Using skipHistory = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    setLastEdited(new Date());

    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    const timer = setTimeout(() => {
        onContentChange(JSON.stringify(presentation));
    }, 500);

    return () => clearTimeout(timer);
  }, [presentation, onContentChange]);

  const fileSize = useMemo(() => {
    const sizeInBytes = new Blob([JSON.stringify(presentation)]).size;
    if (sizeInBytes === 0) return '0 B';
    const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
    return `${parseFloat((sizeInBytes / Math.pow(1024, i)).toFixed(2))} ${['B', 'KB', 'MB', 'GB'][i]}`;
  }, [presentation]);


  const handleNextSlide = useCallback(() => {
    const currentIndex = presentation.slides.findIndex(s => s.id === activeSlideId);
    if (currentIndex < presentation.slides.length - 1) {
      setActiveSlideId(presentation.slides[currentIndex + 1].id);
      setFocusedElementId(null);
    }
  }, [presentation.slides, activeSlideId]);
  
  const handlePrevSlide = useCallback(() => {
    const currentIndex = presentation.slides.findIndex(s => s.id === activeSlideId);
    if (currentIndex > 0) {
      setActiveSlideId(presentation.slides[currentIndex - 1].id);
      setFocusedElementId(null);
    }
  }, [presentation.slides, activeSlideId]);

  const handleDeleteElement = useCallback((elementId: string) => {
    setPresentation(current => {
        const newSlides = current.slides.map(slide => ({
            ...slide,
            elements: slide.elements.filter(el => el.id !== elementId)
        }));
        setSelectedElementId(null);
        setEditingElementId(null);
        return { ...current, slides: newSlides };
    });
  }, [setPresentation]);

  const handleCopyElement = useCallback((elementId: string) => {
    const slide = presentation.slides.find(s => s.elements.some(e => e.id === elementId));
    if (!slide) return;
    const element = slide.elements.find(e => e.id === elementId);
    if (element) {
        setClipboard(JSON.parse(JSON.stringify(element)));
    }
  }, [presentation.slides]);

  const handleCutElement = useCallback((elementId: string) => {
    handleCopyElement(elementId);
    handleDeleteElement(elementId);
  }, [handleCopyElement, handleDeleteElement]);

  const handlePasteElement = useCallback(() => {
    if (!clipboard) return;

    setPresentation(current => {
        const activeSlide = current.slides.find(s => s.id === activeSlideId);
        if (!activeSlide) return current;

        const existingZIndexes = activeSlide.elements.map(e => typeof e.style?.zIndex === 'number' ? e.style.zIndex : 0);
        const maxZIndex = existingZIndexes.length > 0 ? Math.max(...existingZIndexes) : -1;

        const newElement: SlideElement = {
            ...clipboard,
            id: `elem-${crypto.randomUUID()}`,
            position: {
                top: `${parseFloat(clipboard.position.top) + 2}%`,
                left: `${parseFloat(clipboard.position.left) + 2}%`,
            },
            style: {
                ...clipboard.style,
                zIndex: maxZIndex + 1,
            }
        };
        
        const newSlides = current.slides.map(s => {
            if (s.id === activeSlideId) {
                return { ...s, elements: [...s.elements, newElement] };
            }
            return s;
        });
        
        setSelectedElementId(newElement.id);
        return { ...current, slides: newSlides };
    });
  }, [clipboard, activeSlideId, setPresentation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const metaKey = isMac ? e.metaKey : e.ctrlKey;
        const target = e.target as HTMLElement;

        // Don't trigger element-level shortcuts if user is editing text
        if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            // Still allow undo/redo
             if (metaKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    if (canRedo) redo();
                } else {
                    if (canUndo) undo();
                }
            }
            return;
        }
        
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedElementId) {
                e.preventDefault();
                handleDeleteElement(selectedElementId);
            }
        } else if (metaKey && e.key.toLowerCase() === 'c') {
            if (selectedElementId) {
                e.preventDefault();
                handleCopyElement(selectedElementId);
            }
        } else if (metaKey && e.key.toLowerCase() === 'x') {
            if (selectedElementId) {
                e.preventDefault();
                handleCutElement(selectedElementId);
            }
        } else if (metaKey && e.key.toLowerCase() === 'v') {
            e.preventDefault();
            handlePasteElement();
        } else if (metaKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                if (canRedo) redo();
            } else {
                if (canUndo) undo();
            }
        } else if (metaKey && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            if (canRedo) redo();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleNextSlide();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            handlePrevSlide();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo, canUndo, canRedo, handleNextSlide, handlePrevSlide, selectedElementId, handleDeleteElement, handleCopyElement, handleCutElement, handlePasteElement]);

  const handleSelectSlide = useCallback((slideId: string, elementIdToFocus: string | null = null) => {
    setActiveSlideId(slideId);
    setSelectedElementId(null); // Deselect element when changing slides
    setEditingElementId(null);
    setFocusedElementId(elementIdToFocus);
    setActiveCommentThreadId(null);
  }, []);

  const handleSelectElement = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
    setEditingElementId(null); // Always exit edit mode when selecting an element
    setFocusedElementId(null);
  }, []);
  
  const handleEnterEditMode = useCallback((elementId: string) => {
    setSelectedElementId(elementId);
    setEditingElementId(elementId);
  }, []);

  const handleUpdateElement = useCallback((updatedElement: SlideElement) => {
    setPresentation(currentPresentation => ({
      ...currentPresentation,
      slides: currentPresentation.slides.map(s => {
        if (s.id !== activeSlideId && s.id !== updatedElement.id.split('-')[1]) {
             const slideOfElement = currentPresentation.slides.find(slide => slide.elements.some(el => el.id === updatedElement.id));
             if (slideOfElement?.id !== s.id) return s;
        }
        const slideToUpdate = currentPresentation.slides.find(slide => slide.elements.some(el => el.id === updatedElement.id));
        if (slideToUpdate?.id !== s.id) return s;
        
        return {
          ...s,
          elements: s.elements.map(el => el.id === updatedElement.id ? updatedElement : el)
        }
      })
    }));
  }, [activeSlideId, setPresentation]);
  
  const handleUpdateElementStyle = useCallback((elementId: string, newStyle: React.CSSProperties) => {
    setPresentation(currentPresentation => ({
      ...currentPresentation,
      slides: currentPresentation.slides.map(slide => ({
        ...slide,
        elements: slide.elements.map(el => {
          if (el.id === elementId) {
            return {
              ...el,
              style: { ...el.style, ...newStyle }
            };
          }
          return el;
        })
      }))
    }));
  }, [setPresentation]);
  
  const handleUpdateSlideNotes = useCallback((notes: string) => {
    setPresentation(currentPresentation => ({
      ...currentPresentation,
      slides: currentPresentation.slides.map(s => {
          if (s.id !== activeSlideId) return s;
          return { ...s, notes };
      })
    }));
  }, [activeSlideId, setPresentation]);

  const handleDownload = useCallback(async () => {
    try {
        await downloadPresentation(presentation);
    } catch(err) {
        console.error("Failed to download presentation:", err);
    }
  }, [presentation]);

  const handleStartSlideshow = () => {
    if (presentation && activeSlideId) {
      setIsSlideshowActive(true);
    }
  };

  const handleExitSlideshow = () => {
    setIsSlideshowActive(false);
  };
  
  const handleAddSlide = useCallback((targetSlideId: string) => {
    setPresentation(currentPresentation => {
      const currentTheme = THEMES.find(t => t.id === currentPresentation.themeId) || THEMES[0];
      const newSlide = createNewSlide('title_and_content', currentTheme);

      const targetIndex = currentPresentation.slides.findIndex(s => s.id === targetSlideId);
      const newSlides = [...currentPresentation.slides];
      newSlides.splice(targetIndex + 1, 0, newSlide);
      setActiveSlideId(newSlide.id);
      setFocusedElementId(null);
      return { ...currentPresentation, slides: newSlides };
    });
  }, [setPresentation]);

  const handleAddShape = useCallback((shapeType: ShapeType) => {
    setPresentation(current => {
        const activeSlide = current.slides.find(s => s.id === activeSlideId);
        if (!activeSlide) return current;
        
        const existingZIndexes = activeSlide.elements.map(e => typeof e.style?.zIndex === 'number' ? e.style.zIndex : 0);
        const maxZIndex = existingZIndexes.length > 0 ? Math.max(...existingZIndexes) : -1;
        const currentTheme = THEMES.find(t => t.id === current.themeId) || THEMES[0];

        const newShape: SlideElement = {
            id: `elem-${crypto.randomUUID()}`,
            type: 'shape',
            shapeType: shapeType,
            content: '',
            position: { top: '35%', left: '40%' },
            size: { width: '20%', height: '30%' },
            style: { backgroundColor: currentTheme.colors.accent1, zIndex: maxZIndex + 1 },
        };
        const newSlides = current.slides.map(s => {
            if (s.id === activeSlideId) {
                return { ...s, elements: [...s.elements, newShape] };
            }
            return s;
        });
        setSelectedElementId(newShape.id);
        return { ...current, slides: newSlides };
    });
  }, [activeSlideId, setPresentation]);

  const handleAddTextElement = useCallback(() => {
    setPresentation(current => {
      const activeSlide = current.slides.find(s => s.id === activeSlideId);
      if (!activeSlide) return current;
        
      const existingZIndexes = activeSlide.elements.map(e => typeof e.style?.zIndex === 'number' ? e.style.zIndex : 0);
      const maxZIndex = existingZIndexes.length > 0 ? Math.max(...existingZIndexes) : -1;
      const currentTheme = THEMES.find(t => t.id === current.themeId) || THEMES[0];

      const newTextElement: SlideElement = {
        id: `elem-${crypto.randomUUID()}`,
        type: 'text',
        content: 'New Text Box',
        position: { top: '40%', left: '30%' },
        size: { width: '40%', height: 'auto' },
        style: { 
            fontSize: '24px', 
            color: currentTheme.colors.secondary, 
            fontFamily: currentTheme.fontFamily,
            zIndex: maxZIndex + 1 
        },
      };
    
      const newSlides = current.slides.map(s => {
        if (s.id === activeSlideId) {
          return { ...s, elements: [...s.elements, newTextElement] };
        }
        return s;
      });

      setSelectedElementId(newTextElement.id);
      setFocusedElementId(newTextElement.id);
      return { ...current, slides: newSlides };
    });
  }, [activeSlideId, setPresentation]);

  const handleAddImageElement = useCallback((imageData: string) => {
    setPresentation(current => {
      const activeSlide = current.slides.find(s => s.id === activeSlideId);
      if (!activeSlide) return current;
        
      const existingZIndexes = activeSlide.elements.map(e => typeof e.style?.zIndex === 'number' ? e.style.zIndex : 0);
      const maxZIndex = existingZIndexes.length > 0 ? Math.max(...existingZIndexes) : -1;

      const newImage: SlideElement = {
        id: `elem-${crypto.randomUUID()}`,
        type: 'image',
        content: imageData,
        position: { top: '25%', left: '30%' },
        size: { width: '40%', height: '40%' },
        style: { objectFit: 'contain', zIndex: maxZIndex + 1 },
      };
      
      const newSlides = current.slides.map(s => {
          if (s.id === activeSlideId) {
              return { ...s, elements: [...s.elements, newImage] };
          }
          return s;
      });

      setSelectedElementId(newImage.id);
      return { ...current, slides: newSlides };
    });
  }, [activeSlideId, setPresentation]);

  const handleAddTable = useCallback((rows: number, cols: number) => {
    setPresentation(current => {
      const activeSlide = current.slides.find(s => s.id === activeSlideId);
      if (!activeSlide) return current;
        
      const existingZIndexes = activeSlide.elements.map(e => typeof e.style?.zIndex === 'number' ? e.style.zIndex : 0);
      const maxZIndex = existingZIndexes.length > 0 ? Math.max(...existingZIndexes) : -1;
      const currentTheme = THEMES.find(t => t.id === current.themeId) || THEMES[0];

      const headerStyle: React.CSSProperties = {
        fontWeight: 'bold',
        color: '#FFFFFF',
        backgroundColor: currentTheme.colors.accent1,
        padding: '0.25rem 0.5rem',
      };

      const cellStyle: React.CSSProperties = {
        padding: '0.5rem',
      };

      const defaultTableData: TableCellData[][] = Array(rows).fill(null).map((_, rowIndex) => 
        Array(cols).fill(null).map(() => ({ 
            content: rowIndex === 0 ? 'Header' : 'Cell',
            style: rowIndex === 0 ? headerStyle : cellStyle,
        }))
      );

      const newTableElement: SlideElement = {
        id: `elem-${crypto.randomUUID()}`,
        type: 'table',
        content: '',
        tableData: defaultTableData,
        position: { top: '30%', left: '20%' },
        size: { width: '60%', height: '40%' },
        style: { backgroundColor: '#FFFFFF', zIndex: maxZIndex + 1 },
      };
    
      const newSlides = current.slides.map(s => {
        if (s.id === activeSlideId) {
          return { ...s, elements: [...s.elements, newTableElement] };
        }
        return s;
      });

      setSelectedElementId(newTableElement.id);
      setFocusedElementId(newTableElement.id);
      return { ...current, slides: newSlides };
    });
  }, [activeSlideId, setPresentation]);
  
  const handleAddTableRow = useCallback((elementId: string) => {
    setPresentation(current => {
      const slideWithTable = current.slides.find(s => s.elements.some(e => e.id === elementId));
      if (!slideWithTable) return current;

      const newSlides = current.slides.map(slide => {
        if (slide.id !== slideWithTable.id) return slide;
        
        return {
          ...slide,
          elements: slide.elements.map(el => {
            if (el.id !== elementId || el.type !== 'table' || !el.tableData || el.tableData.length === 0) return el;
            
            const columnCount = el.tableData[0].length;
            
            // New rows should always be body rows
            const bodyCellStyle: React.CSSProperties = {
              padding: '0.5rem',
            };

            const newRow: TableCellData[] = Array(columnCount).fill(null).map(() => ({
              content: 'Cell',
              style: bodyCellStyle,
            }));

            return {
              ...el,
              tableData: [...el.tableData, newRow],
            };
          })
        };
      });

      return { ...current, slides: newSlides };
    });
  }, [setPresentation]);

  const handleAddTableColumn = useCallback((elementId: string) => {
    setPresentation(current => {
      const slideWithTable = current.slides.find(s => s.elements.some(e => e.id === elementId));
      if (!slideWithTable) return current;

      const newSlides = current.slides.map(slide => {
        if (slide.id !== slideWithTable.id) return slide;

        return {
          ...slide,
          elements: slide.elements.map(el => {
            if (el.id !== elementId || el.type !== 'table' || !el.tableData) return el;

            const newTableData = el.tableData.map((row, rowIndex) => {
              if (row.length === 0) return row;
              const styleToCopy = row[row.length - 1].style;
              const newCell: TableCellData = {
                content: rowIndex === 0 ? 'Header' : 'Cell',
                style: styleToCopy,
              };
              return [...row, newCell];
            });

            return {
              ...el,
              tableData: newTableData,
            };
          })
        };
      });
      return { ...current, slides: newSlides };
    });
  }, [setPresentation]);

  const handleArrangeElement = useCallback((elementId: string, arrangement: 'forward' | 'backward' | 'front' | 'back') => {
    setPresentation(currentPresentation => {
        const slideIndex = currentPresentation.slides.findIndex(s => s.elements.some(e => e.id === elementId));
        if (slideIndex === -1) return currentPresentation;

        const slide = currentPresentation.slides[slideIndex];
        const elements = [...slide.elements];
        const sortedElementsByZ = elements.sort((a, b) => (Number(a.style?.zIndex) || 0) - (Number(b.style?.zIndex) || 0));
        
        const targetElZIndex = sortedElementsByZ.findIndex(e => e.id === elementId);
        if (targetElZIndex === -1) return currentPresentation;

        const targetEl = sortedElementsByZ[targetElZIndex];
        let newElements = [...slide.elements];

        switch (arrangement) {
            case 'forward': {
                if (targetElZIndex < sortedElementsByZ.length - 1) {
                    const nextEl = sortedElementsByZ[targetElZIndex + 1];
                    const targetZ = targetEl.style?.zIndex ?? 0;
                    const nextZ = nextEl.style?.zIndex ?? 0;
                    newElements = newElements.map(el => {
                        if (el.id === targetEl.id) return { ...el, style: { ...el.style, zIndex: nextZ }};
                        if (el.id === nextEl.id) return { ...el, style: { ...el.style, zIndex: targetZ }};
                        return el;
                    });
                }
                break;
            }
            case 'backward': {
                if (targetElZIndex > 0) {
                    const prevEl = sortedElementsByZ[targetElZIndex - 1];
                    const targetZ = targetEl.style?.zIndex ?? 0;
                    const prevZ = prevEl.style?.zIndex ?? 0;
                     newElements = newElements.map(el => {
                        if (el.id === targetEl.id) return { ...el, style: { ...el.style, zIndex: prevZ }};
                        if (el.id === prevEl.id) return { ...el, style: { ...el.style, zIndex: targetZ }};
                        return el;
                    });
                }
                break;
            }
            case 'front': {
                const maxZ = Math.max(...sortedElementsByZ.map(e => Number(e.style?.zIndex) || 0));
                newElements = newElements.map(el => {
                    if (el.id === targetEl.id) return { ...el, style: { ...el.style, zIndex: maxZ + 1 }};
                    return el;
                });
                break;
            }
            case 'back': {
                const minZ = Math.min(...sortedElementsByZ.map(e => Number(e.style?.zIndex) || 0));
                 newElements = newElements.map(el => {
                    if (el.id === targetEl.id) return { ...el, style: { ...el.style, zIndex: minZ - 1 }};
                    return el;
                });
                break;
            }
        }
        
        const newSlides = [...currentPresentation.slides];
        newSlides[slideIndex] = { ...slide, elements: newElements };
        
        return { ...currentPresentation, slides: newSlides };
    });
}, [setPresentation]);

  const handleDuplicateSlide = useCallback((targetSlideId: string) => {
    setPresentation(currentPresentation => {
        const targetIndex = currentPresentation.slides.findIndex(s => s.id === targetSlideId);
        const slideToDuplicate = currentPresentation.slides[targetIndex];
        const newSlide = duplicateSlide(slideToDuplicate);
        const newSlides = [...currentPresentation.slides];
        newSlides.splice(targetIndex + 1, 0, newSlide);
        setActiveSlideId(newSlide.id);
        setFocusedElementId(null);
        return { ...currentPresentation, slides: newSlides };
    });
  }, [setPresentation]);

  const handleDeleteSlide = useCallback((targetSlideId: string) => {
    setPresentation(currentPresentation => {
      if (currentPresentation.slides.length <= 1) return currentPresentation; // Don't delete the last slide
      
      const targetIndex = currentPresentation.slides.findIndex(s => s.id === targetSlideId);
      const newSlides = currentPresentation.slides.filter(s => s.id !== targetSlideId);
      
      let newActiveSlideId = activeSlideId;
      if (activeSlideId === targetSlideId) {
        newActiveSlideId = newSlides[Math.max(0, targetIndex - 1)].id;
      }
      setActiveSlideId(newActiveSlideId);
      setFocusedElementId(null);
      return { ...currentPresentation, slides: newSlides };
    });
  }, [activeSlideId, setPresentation]);

  const handleReorderSlides = useCallback((draggedId: string, dropTargetId: string) => {
    setPresentation(currentPresentation => {
      const slides = [...currentPresentation.slides];
      const draggedIndex = slides.findIndex(s => s.id === draggedId);
      const dropTargetIndex = slides.findIndex(s => s.id === dropTargetId);
      
      if (draggedIndex === -1 || dropTargetIndex === -1) return currentPresentation;

      const [draggedItem] = slides.splice(draggedIndex, 1);
      slides.splice(dropTargetIndex, 0, draggedItem);

      return { ...currentPresentation, slides };
    });
  }, [setPresentation]);

  const handleChangeLayout = useCallback((targetSlideId: string, layout: 'title' | 'title_and_content' | 'blank') => {
    setPresentation(currentPresentation => {
      const currentTheme = THEMES.find(t => t.id === currentPresentation.themeId) || THEMES[0];
      const newSlides = currentPresentation.slides.map(s => {
        if (s.id === targetSlideId) {
          return applySlideLayout(s, layout, currentTheme);
        }
        return s;
      });
      return { ...currentPresentation, slides: newSlides };
    });
  }, [setPresentation]);

  const handleToggleSearchModal = useCallback((open: boolean) => {
    setIsSearchModalOpen(open);
    if (!open) {
      setFocusedElementId(null);
    }
  }, []);

  const handleToggleHelpModal = useCallback((open: boolean) => {
    setIsHelpModalOpen(open);
  }, []);
  
  const handleReplaceAll = useCallback((findTerm: string, replaceTerm: string) => {
    if (!findTerm) return;
  
    const regex = new RegExp(findTerm, 'gi');
  
    const newSlides = presentation.slides.map(slide => ({
      ...slide,
      elements: slide.elements.map(el => {
        if (el.type === 'text' && el.content.match(regex)) {
          return { ...el, content: el.content.replace(regex, replaceTerm) };
        }
        return el;
      })
    }));
    
    setPresentation(current => ({ ...current, slides: newSlides }));
  }, [presentation, setPresentation]);

  const handleToggleThemesSidebar = useCallback(() => {
    setIsThemesSidebarOpen(prev => !prev);
  }, []);
  
  const handleToggleCommentsSidebar = useCallback((open?: boolean) => {
    setIsCommentsSidebarOpen(prev => open ?? !prev);
  }, []);
  
  const handleSetActiveCommentThread = useCallback((threadId: string | null) => {
    setActiveCommentThreadId(threadId);
    if (threadId) {
      const activeSlide = presentation.slides.find(s => s.id === activeSlideId);
      const comment = activeSlide?.comments?.find(c => c.id === threadId);
      if (comment?.elementId) {
        setSelectedElementId(comment.elementId);
      } else {
        setSelectedElementId(null);
      }
      setIsCommentsSidebarOpen(true);
    }
  }, [presentation.slides, activeSlideId]);
  
  const handleAddComment = useCallback((text: string, parentId: string | null = null) => {
    if (!text.trim()) return;

    setPresentation(current => {
        const activeSlide = current.slides.find(s => s.id === activeSlideId);
        if (!activeSlide) return current;

        const newComment: Comment = {
            id: `comment-${crypto.randomUUID()}`,
            text,
            author: 'User', // Placeholder
            createdAt: new Date().toISOString(),
            elementId: parentId ? null : selectedElementId,
            parentId,
            resolved: false,
        };

        const newSlides = current.slides.map(s => {
            if (s.id === activeSlideId) {
                const existingComments = s.comments || [];
                return { ...s, comments: [...existingComments, newComment] };
            }
            return s;
        });

        const newPresentation = { ...current, slides: newSlides };
        // If it's a new thread, make it active
        if (!parentId) {
          setActiveCommentThreadId(newComment.id);
        }
        return newPresentation;
    });
  }, [activeSlideId, selectedElementId, setPresentation]);

  const handleResolveCommentThread = useCallback((threadId: string) => {
    setPresentation(current => {
      const activeSlide = current.slides.find(s => s.id === activeSlideId);
      if (!activeSlide?.comments) return current;
      
      const thread = activeSlide.comments.find(c => c.id === threadId);
      if (!thread) return current;

      const newResolvedState = !thread.resolved;

      const newSlides = current.slides.map(s => {
        if (s.id === activeSlideId) {
          return {
            ...s,
            comments: s.comments?.map(c => {
              if (c.id === threadId || c.parentId === threadId) {
                return { ...c, resolved: newResolvedState };
              }
              return c;
            })
          }
        }
        return s;
      });

      return { ...current, slides: newSlides };
    });
  }, [activeSlideId, setPresentation]);
  
  const handleDeleteCommentThread = useCallback((threadId: string) => {
     setPresentation(current => {
      const activeSlide = current.slides.find(s => s.id === activeSlideId);
      if (!activeSlide?.comments) return current;

      const newSlides = current.slides.map(s => {
        if (s.id === activeSlideId) {
          const commentsToKeep = s.comments?.filter(c => c.id !== threadId && c.parentId !== threadId) || [];
          return { ...s, comments: commentsToKeep };
        }
        return s;
      });
      
      setActiveCommentThreadId(null);
      return { ...current, slides: newSlides };
    });
  }, [activeSlideId, setPresentation]);


  const handleApplyTheme = useCallback((themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) return;

    setPresentation(current => ({
      ...current,
      themeId,
      slides: current.slides.map(slide => ({
        ...slide,
        background: theme.background,
        elements: slide.elements.map(el => {
          const newStyle = { ...el.style };
          if (el.type === 'text') {
            newStyle.fontFamily = theme.fontFamily;
            // A simple heuristic to differentiate titles from body text
            const fontSize = parseInt(String(el.style?.fontSize || '0'));
            newStyle.color = fontSize >= 36 ? theme.colors.primary : theme.colors.secondary;
          } else if (el.type === 'shape') {
            newStyle.backgroundColor = theme.colors.accent1;
          }
          return { ...el, style: newStyle };
        })
      }))
    }));
  }, [setPresentation]);


  return (
    <>
      <div className="flex h-full font-sans text-gray-800">
        <main className="flex-grow flex flex-col bg-gray-200">
            <Editor
              presentation={presentation}
              activeSlideId={activeSlideId}
              selectedElementId={selectedElementId}
              editingElementId={editingElementId}
              onSelectSlide={handleSelectSlide}
              onSelectElement={handleSelectElement}
              onEnterEditMode={handleEnterEditMode}
              onUpdateElement={handleUpdateElement}
              onUpdateElementStyle={handleUpdateElementStyle}
              onUpdateSlideNotes={handleUpdateSlideNotes}
              onStartSlideshow={handleStartSlideshow}
              onDownload={handleDownload}
              onAddSlide={handleAddSlide}
              onAddShape={handleAddShape}
              onAddTextElement={handleAddTextElement}
              onAddImageElement={handleAddImageElement}
              onAddTable={handleAddTable}
              onDuplicateSlide={handleDuplicateSlide}
              onDeleteSlide={handleDeleteSlide}
              onReorderSlides={handleReorderSlides}
              onChangeLayout={handleChangeLayout}
              isSearchModalOpen={isSearchModalOpen}
              onToggleSearch={handleToggleSearchModal}
              onToggleHelp={handleToggleHelpModal}
              onReplaceAll={handleReplaceAll}
              focusedElementId={focusedElementId}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onArrangeElement={handleArrangeElement}
              lastEdited={lastEdited}
              fileSize={fileSize}
              onApplyTheme={handleApplyTheme}
              isThemesSidebarOpen={isThemesSidebarOpen}
              onToggleThemes={handleToggleThemesSidebar}
              isCommentsSidebarOpen={isCommentsSidebarOpen}
              onToggleCommentsSidebar={handleToggleCommentsSidebar}
              onAddComment={handleAddComment}
              onAddTableRow={handleAddTableRow}
              onAddTableColumn={handleAddTableColumn}
              onDeleteElement={handleDeleteElement}
              onCutElement={handleCutElement}
              onCopyElement={handleCopyElement}
              onPasteElement={handlePasteElement}
              clipboard={clipboard}
              activeCommentThreadId={activeCommentThreadId}
              onSetActiveCommentThread={handleSetActiveCommentThread}
              onResolveCommentThread={handleResolveCommentThread}
              onDeleteCommentThread={handleDeleteCommentThread}
              isFilePanelVisible={isFilePanelVisible}
              onToggleFilePanel={onToggleFilePanel}
            />
        </main>
      </div>
      {isSlideshowActive && presentation && activeSlideId && (
        <Slideshow
          presentation={presentation}
          activeSlideId={activeSlideId}
          onExit={handleExitSlideshow}
          onNext={handleNextSlide}
          onPrev={handlePrevSlide}
        />
      )}
      {isHelpModalOpen && <HelpModal isOpen={isHelpModalOpen} onClose={() => handleToggleHelpModal(false)} />}
    </>
  );
};

export default PptxEditor;