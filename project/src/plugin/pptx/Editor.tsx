//src/plugin/pptx/Editor.tsx
import React, { useState, useCallback, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Icon } from './Icon';
import type { Slide, SlideElement, ShapeType, Presentation, Theme, Comment, TableCellData } from './types';
import { THEMES } from './themes';
import { applySlideLayout } from './slideTemplates';
import { 
  X, ChevronLeft, ChevronRight, HelpCircle, FileText, FileDigit, FileCode,
  Scissors, Copy, Clipboard, Layers, MessageSquareText, LayoutTemplate, 
  BringToFront, SendToBack, ArrowUp, ArrowDown, Strikethrough, Sigma,
  Trash2, CheckCircle2, Reply, Check, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { HelpModal } from './components';

interface SlidePreviewProps {
  slide: Slide | null;
  onUpdateElement: (element: SlideElement) => void;
  isEditable?: boolean;
  focusedElementId?: string | null;
  selectedElementId?: string | null;
  editingElementId?: string | null;
  onSelectElement?: (elementId: string | null) => void;
  onEnterEditMode?: (elementId: string) => void;
  onElementContextMenu?: (event: React.MouseEvent, element: SlideElement) => void;
  activeCommentThreadId?: string | null;
  onSetActiveCommentThread?: (threadId: string | null) => void;
  onSelectionChange?: (range: Range | null) => void;
}

const MoveHandles: React.FC<{ onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void }> = ({ onMouseDown }) => (
    <div className="pointer-events-none">
        <div onMouseDown={onMouseDown} className="absolute -top-3 left-1/2 -translate-x-1/2 p-0.5 bg-white rounded-full shadow cursor-move pointer-events-auto"><Icon type="move" className="w-4 h-4 text-gray-600" /></div>
        <div onMouseDown={onMouseDown} className="absolute -bottom-3 left-1/2 -translate-x-1/2 p-0.5 bg-white rounded-full shadow cursor-move pointer-events-auto"><Icon type="move" className="w-4 h-4 text-gray-600" /></div>
        <div onMouseDown={onMouseDown} className="absolute top-1/2 -translate-y-1/2 -left-3 p-0.5 bg-white rounded-full shadow cursor-move pointer-events-auto"><Icon type="move" className="w-4 h-4 text-gray-600" /></div>
        <div onMouseDown={onMouseDown} className="absolute top-1/2 -translate-y-1/2 -right-3 p-0.5 bg-white rounded-full shadow cursor-move pointer-events-auto"><Icon type="move" className="w-4 h-4 text-gray-600" /></div>
    </div>
);

export const SlidePreview: React.FC<SlidePreviewProps> = ({ 
    slide, 
    onUpdateElement, 
    isEditable = true, 
    focusedElementId = null, 
    selectedElementId = null, 
    editingElementId = null,
    onSelectElement = () => {},
    onEnterEditMode = () => {},
    onElementContextMenu = () => {},
    activeCommentThreadId = null,
    onSetActiveCommentThread = () => {},
    onSelectionChange = () => {},
}) => {
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef<{
    elementId: string;
    element: HTMLDivElement;
    slideRect: DOMRect;
    initialMouseX: number;
    initialMouseY: number;
    initialTop: number;
    initialLeft: number;
  } | null>(null);

  useEffect(() => {
    const elementIdToFocus = editingElementId || focusedElementId;
    if (elementIdToFocus && slideContainerRef.current) {
        const elementToFocus = slideContainerRef.current.querySelector(`[id='${elementIdToFocus}'] [contenteditable]`) as HTMLElement;
        if (elementToFocus) {
            elementToFocus.focus();
            // Move cursor to end of text
            const range = document.createRange();
            const sel = window.getSelection();
            if (sel) {
                range.selectNodeContents(elementToFocus);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
  }, [editingElementId, focusedElementId, slide]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current) return;
    const { slideRect, initialMouseX, initialMouseY, initialLeft, initialTop, element } = dragInfo.current;
    
    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;
    
    const newLeftPx = initialLeft + deltaX;
    const newTopPx = initialTop + deltaY;

    // Boundary checks
    const boundedLeft = Math.max(0, Math.min(newLeftPx, slideRect.width - element.offsetWidth));
    const boundedTop = Math.max(0, Math.min(newTopPx, slideRect.height - element.offsetHeight));

    element.style.left = `${(boundedLeft / slideRect.width) * 100}%`;
    element.style.top = `${(boundedTop / slideRect.height) * 100}%`;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragInfo.current) return;
    
    const { elementId, element, initialLeft, initialTop } = dragInfo.current;
    
    // Only update if the position has changed
    if (element.offsetLeft !== initialLeft || element.offsetTop !== initialTop) {
        const newPosition = {
            left: element.style.left,
            top: element.style.top,
        };

        const currentSlideElement = slide?.elements.find(el => el.id === elementId);
        if (currentSlideElement) {
            onUpdateElement({ ...currentSlideElement, position: newPosition });
        }
    }
    
    dragInfo.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [slide, onUpdateElement, handleMouseMove]);

  useEffect(() => {
    // Cleanup function in case component unmounts during a drag
    return () => {
        if (dragInfo.current) {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            dragInfo.current = null;
        }
    };
  }, [handleMouseMove, handleMouseUp]);


  if (!slide) {
    return (
        <div className="aspect-video w-full max-w-5xl bg-white shadow-lg rounded-lg flex items-center justify-center text-slate-400">
            No slide to display.
        </div>
    );
  }
  
  const handleElementMouseDown = (e: React.MouseEvent<HTMLDivElement>, element: SlideElement) => {
      if (!isEditable || !slideContainerRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      onSelectElement(element.id);

      const targetElement = e.currentTarget.parentElement?.closest<HTMLDivElement>(`[id='${element.id}']`) || e.currentTarget;
      const slideRect = slideContainerRef.current.getBoundingClientRect();
      
      dragInfo.current = {
          elementId: element.id,
          element: targetElement,
          slideRect,
          initialMouseX: e.clientX,
          initialMouseY: e.clientY,
          initialLeft: targetElement.offsetLeft,
          initialTop: targetElement.offsetTop,
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleTextClick = useCallback((element: SlideElement) => {
    if (isEditable && editingElementId !== element.id) {
        onEnterEditMode(element.id);
    }
  }, [isEditable, editingElementId, onEnterEditMode]);
  
  const backgroundStyle: React.CSSProperties = {
    background: slide.background?.gradient || slide.background?.color || `url(${slide.background?.image})` || '#FFFFFF',
  };

  return (
    <div ref={slideContainerRef} className="aspect-video w-full h-full shadow-md border relative overflow-hidden" style={backgroundStyle} onClick={() => onSelectElement(null)}>
      {slide.elements.map((element) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          top: element.position.top,
          left: element.position.left,
          width: element.size.width,
          height: element.size.height,
          ...element.style,
        };
        const isSelected = selectedElementId === element.id;
        const isEditing = isEditable && editingElementId === element.id;
        const isSelectedForMove = isEditable && isSelected && !isEditing;
        
        const elementCommentThreads = slide.comments?.filter(c => c.elementId === element.id && !c.parentId) || [];
        const hasComments = elementCommentThreads.length > 0;
        const isCommentActive = activeCommentThreadId && elementCommentThreads.some(c => c.id === activeCommentThreadId);


        const handleMouseDownWithStopPropagation = (e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
            handleElementMouseDown(e, element);
        };

        let ringClass = '';
        if (isCommentActive) {
          ringClass = 'ring-4 ring-yellow-400 ring-offset-2';
        } else if (isSelected) {
          ringClass = 'ring-2 ring-blue-500 ring-offset-2';
        }

        switch (element.type) {
          case 'text':
            return (
              <div
                key={element.id}
                id={element.id}
                style={style}
                className={`p-2 box-border group relative ${isSelectedForMove ? 'cursor-move' : ''} ${ringClass}`}
                onClick={(e) => { e.stopPropagation(); handleTextClick(element); }}
                onContextMenu={(e) => isEditable && onElementContextMenu(e, element)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (isSelectedForMove) {
                    handleElementMouseDown(e, element);
                  } else if (isEditable) {
                    onSelectElement(element.id);
                  }
                }}
              >
                  {hasComments && isEditable && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSetActiveCommentThread(elementCommentThreads[0].id); }}
                      className="absolute -top-3 -right-3 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-yellow-500 z-10"
                      title="View comments"
                    >
                      <MessageSquareText className="w-3 h-3" />
                    </button>
                  )}
                  <div 
                    className={`w-full h-full whitespace-pre-wrap outline-none transition-colors duration-150 ease-in-out ${isEditing ? 'cursor-text' : 'cursor-default'}`}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={{ __html: element.content }}
                    onMouseDown={(e) => {
                        if (isEditing) e.stopPropagation();
                    }}
                    onSelect={() => {
                        const selection = window.getSelection();
                        if (isEditing && selection && selection.rangeCount > 0) {
                            onSelectionChange(selection.getRangeAt(0).cloneRange());
                        }
                    }}
                    onKeyUp={() => {
                        const selection = window.getSelection();
                        if (isEditing && selection && selection.rangeCount > 0) {
                            onSelectionChange(selection.getRangeAt(0).cloneRange());
                        }
                    }}
                    onBlur={(e) => {
                        if (!isEditable) return;
                        const newContent = e.currentTarget.innerHTML || '';
                        if (newContent !== element.content) {
                            onUpdateElement({ ...element, content: newContent });
                        }
                        onSelectionChange(null);
                    }}
                  />
                  {isSelectedForMove && <MoveHandles onMouseDown={handleMouseDownWithStopPropagation} />}
              </div>
            );
          case 'image':
            return (
              <div 
                key={element.id} 
                id={element.id} 
                style={style} 
                className={`group relative ${isEditable ? 'cursor-move' : ''} ${ringClass}`} 
                onMouseDown={(e) => handleElementMouseDown(e, element)}
                onContextMenu={(e) => isEditable && onElementContextMenu(e, element)}
              >
                {hasComments && isEditable && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSetActiveCommentThread(elementCommentThreads[0].id); }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-yellow-500 z-10"
                    title="View comments"
                  >
                    <MessageSquareText className="w-3 h-3" />
                  </button>
                )}
                <img
                    src={element.content}
                    alt=""
                    style={{width: '100%', height: '100%', objectFit: (element.style?.objectFit as 'cover' | 'contain' | 'fill' | 'none' | 'scale-down') || 'cover'}}
                    className="pointer-events-none"
                />
                {isEditable && isSelected && <MoveHandles onMouseDown={handleMouseDownWithStopPropagation} />}
              </div>
            );
          case 'shape':
              const shapeStyle: React.CSSProperties = {};
              if (element.shapeType === 'oval') {
                  shapeStyle.borderRadius = '50%';
              }
              if (element.shapeType === 'triangle') {
                  shapeStyle.backgroundColor = 'transparent';
                  shapeStyle.width = '0';
                  shapeStyle.height = '0';
                  shapeStyle.borderLeft = `calc(50% * ${element.size.width}) solid transparent`;
                  shapeStyle.borderRight = `calc(50% * ${element.size.width}) solid transparent`;
                  shapeStyle.borderBottom = `${element.size.height} solid ${element.style?.backgroundColor || '#000'}`;
              }
            return (
                <div 
                  key={element.id} 
                  id={element.id} 
                  style={{...style, ...shapeStyle}} 
                  className={`group relative ${isEditable ? 'cursor-move' : ''} ${ringClass}`} 
                  onMouseDown={(e) => handleElementMouseDown(e, element)}
                  onContextMenu={(e) => isEditable && onElementContextMenu(e, element)}
                >
                    {hasComments && isEditable && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onSetActiveCommentThread(elementCommentThreads[0].id); }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-yellow-500 z-10"
                            title="View comments"
                        >
                            <MessageSquareText className="w-3 h-3" />
                        </button>
                    )}
                    {isEditable && isSelected && <MoveHandles onMouseDown={handleMouseDownWithStopPropagation} />}
                </div>
            );
          case 'table':
            return (
              <div
                key={element.id}
                id={element.id}
                style={style}
                className={`box-border group relative ${isSelectedForMove ? 'cursor-move' : ''} ${ringClass}`}
                onClick={(e) => { e.stopPropagation(); onSelectElement(element.id); }}
                onDoubleClick={(e) => { e.stopPropagation(); onEnterEditMode(element.id); }}
                onContextMenu={(e) => isEditable && onElementContextMenu(e, element)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (isSelectedForMove) {
                    handleElementMouseDown(e, element);
                  } else if (isEditable) {
                    onSelectElement(element.id);
                  }
                }}
              >
                  {hasComments && isEditable && (
                      <button 
                          onClick={(e) => { e.stopPropagation(); onSetActiveCommentThread(elementCommentThreads[0].id); }}
                          className="absolute -top-3 -right-3 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-yellow-500 z-10"
                          title="View comments"
                      >
                          <MessageSquareText className="w-3 h-3" />
                      </button>
                  )}
                  <table className="w-full h-full border-collapse">
                    <tbody>
                      {element.tableData?.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, colIndex) => (
                            <td
                              key={colIndex}
                              className="border border-gray-400"
                              style={cell.style}
                            >
                              <div
                                className={`w-full h-full outline-none ${isEditing ? 'cursor-text' : 'cursor-default'}`}
                                contentEditable={isEditing}
                                suppressContentEditableWarning={true}
                                dangerouslySetInnerHTML={{ __html: cell.content }}
                                onMouseDown={(e) => {
                                    if (isEditing) e.stopPropagation();
                                }}
                                onBlur={(e) => {
                                    if (!isEditable || !element.tableData) return;
                                    const newContent = e.currentTarget.innerHTML || '';
                                    if (newContent !== cell.content) {
                                        const newTableData = element.tableData.map(r => r.map(c => ({...c})));
                                        newTableData[rowIndex][colIndex].content = newContent;
                                        onUpdateElement({ ...element, tableData: newTableData });
                                    }
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {isSelectedForMove && <MoveHandles onMouseDown={handleMouseDownWithStopPropagation} />}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};


interface ThumbnailProps {
  slide: Slide;
}

const BASE_WIDTH = 1024;
const BASE_HEIGHT = 576; // 1024 * 9 / 16

const Thumbnail: React.FC<ThumbnailProps> = ({ slide }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use ResizeObserver to get the container's actual width and calculate the scale.
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width } = entry.contentRect;
        if (width > 0) {
            setScale(width / BASE_WIDTH);
        }
      }
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  return (
    // This container is sized by its parent and observed for its width.
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-white">
      {/* Only render the scaled preview when we have a valid scale factor */}
      {scale > 0 && (
        <div
          className="absolute top-0 left-0"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <SlidePreview
            slide={slide}
            onUpdateElement={() => {}} // no-op for thumbnails
            isEditable={false}
            onSelectElement={() => {}} // no-op for thumbnails
          />
        </div>
      )}
    </div>
  );
};


interface ContextMenuProps {
  x: number;
  y: number;
  slideId: string;
  onClose: () => void;
  onAddSlide: (targetSlideId: string) => void;
  onDuplicateSlide: (targetSlideId: string) => void;
  onDeleteSlide: (targetSlideId: string) => void;
  onChangeLayout: (targetSlideId: string, layout: 'title' | 'title_and_content' | 'blank') => void;
  canDelete: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, slideId, onClose, onAddSlide, onDuplicateSlide, onDeleteSlide, onChangeLayout, canDelete }) => {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      style={{ top: y, left: x }}
      className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg py-1 w-48 animate-fade-in-fast"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
    >
      <ul>
        <li>
          <button onClick={() => handleAction(() => onAddSlide(slideId))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            New Slide
          </button>
        </li>
        <li>
          <button onClick={() => handleAction(() => onDuplicateSlide(slideId))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Duplicate Slide
          </button>
        </li>
        <li>
          <button 
            onClick={() => handleAction(() => onDeleteSlide(slideId))} 
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:bg-transparent"
            disabled={!canDelete}
          >
            Delete Slide
          </button>
        </li>
        <li className="my-1 border-t border-gray-200" />
        <li className="px-4 pt-2 pb-1 text-xs text-gray-500">Change Layout</li>
        <li>
          <button onClick={() => handleAction(() => onChangeLayout(slideId, 'title'))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Title Slide
          </button>
        </li>
        <li>
          <button onClick={() => handleAction(() => onChangeLayout(slideId, 'title_and_content'))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Title and Content
          </button>
        </li>
         <li>
          <button onClick={() => handleAction(() => onChangeLayout(slideId, 'blank'))} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Blank
          </button>
        </li>
      </ul>
    </div>
  );
};


interface ThumbnailStripProps {
  slides: Slide[];
  activeSlideId: string;
  onSelectSlide: (slideId: string) => void;
  style: React.CSSProperties;
  onAddSlide: (targetSlideId: string) => void;
  onDuplicateSlide: (targetSlideId: string) => void;
  onDeleteSlide: (targetSlideId: string) => void;
  onReorderSlides: (draggedId: string, dropTargetId: string) => void;
  onChangeLayout: (targetSlideId: string, layout: 'title' | 'title_and_content' | 'blank') => void;
}

const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({ slides, activeSlideId, onSelectSlide, style, ...slideActions }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [menuState, setMenuState] = useState<{ x: number, y: number, slideId: string } | null>(null);
  
  useEffect(() => {
    const handleGlobalClick = () => setMenuState(null);
    if (menuState) {
        window.addEventListener('click', handleGlobalClick);
    }
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [menuState]);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, slideId: string) => {
    e.dataTransfer.setData('text/plain', slideId);
    setDraggedId(slideId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>, slideId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== slideId) {
        setDropTargetId(slideId);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLIElement>, slideId: string) => {
    e.preventDefault();
    const draggedSlideId = e.dataTransfer.getData('text/plain');
    if (draggedSlideId && draggedSlideId !== slideId) {
        slideActions.onReorderSlides(draggedSlideId, slideId);
    }
    setDraggedId(null);
    setDropTargetId(null);
  };
  
  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLLIElement>, slideId: string) => {
    e.preventDefault();
    setMenuState({ x: e.clientX, y: e.clientY, slideId });
  };


  return (
    <div style={style} className="flex-shrink-0 bg-gray-100 border-r border-gray-300 p-2 overflow-y-auto">
      <ul className="space-y-2">
        {slides.map((slide, index) => {
            const isDropTarget = dropTargetId === slide.id;
            const isDragged = draggedId === slide.id;
            const hasComments = slide.comments && slide.comments.length > 0;
            return (
              <li 
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, slide.id)}
                onDragOver={(e) => handleDragOver(e, slide.id)}
                onDrop={(e) => handleDrop(e, slide.id)}
                onDragEnd={handleDragEnd}
                onDragLeave={() => setDropTargetId(null)}
                onContextMenu={(e) => handleContextMenu(e, slide.id)}
                className={`transition-all duration-150 ${isDragged ? 'opacity-50' : 'opacity-100'} ${isDropTarget ? 'outline-dashed outline-2 outline-offset-2 outline-blue-500 rounded-md' : ''}`}
              >
                <button
                  onClick={() => onSelectSlide(slide.id)}
                  className={`w-full flex items-start gap-2 p-1 rounded-md transition-colors duration-150 ${
                    activeSlideId === slide.id ? '' : 'hover:bg-gray-200'
                  }`}
                >
                  <span className={`text-xs font-semibold mt-1 ${
                      activeSlideId === slide.id ? 'text-orange-600' : 'text-gray-500'
                    }`}>{index + 1}</span>
                  <div
                    className={`relative w-full aspect-video border-2 rounded overflow-hidden ${
                      activeSlideId === slide.id ? 'border-orange-500' : 'border-gray-400'
                    }`}
                  >
                    <Thumbnail slide={slide} />
                    {hasComments && (
                      <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5 text-white shadow" title="This slide has comments">
                        <MessageSquareText className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </button>
              </li>
            )
        })}
      </ul>
      {menuState && (
        <ContextMenu
          x={menuState.x}
          y={menuState.y}
          slideId={menuState.slideId}
          onClose={() => setMenuState(null)}
          onAddSlide={slideActions.onAddSlide}
          onDuplicateSlide={slideActions.onDuplicateSlide}
          onDeleteSlide={slideActions.onDeleteSlide}
          onChangeLayout={slideActions.onChangeLayout}
          canDelete={slides.length > 1}
        />
      )}
    </div>
  );
};


interface ColorPickerProps {
  children: React.ReactElement;
  onSelect: (color: string) => void;
  disabled?: boolean;
}

const COLORS = [
  '#000000', '#4A4A4A', '#9B9B9B', '#FFFFFF',
  '#D0021B', '#F5A623', '#F8E71C', '#7ED321',
  '#4A90E2', '#BD10E0', '#9013FE', '#417505',
  '#B8E986', '#50E3C2', '#00BFFF', '#546E7A'
];

const ColorPicker: React.FC<ColorPickerProps> = ({ children, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (color: string) => {
    onSelect(color);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div onClick={() => !disabled && setIsOpen(prev => !prev)}>
        {children}
      </div>
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-md shadow-lg p-2 w-40 z-20 animate-fade-in-fast">
            <div className="grid grid-cols-4 gap-2">
                {COLORS.map(color => (
                    <button
                        key={color}
                        onClick={() => handleSelect(color)}
                        className="w-8 h-8 rounded-full border border-gray-200 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        aria-label={color}
                    />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};


interface TableGridSelectorProps {
  onSelect: (rows: number, cols: number) => void;
}

const MAX_ROWS = 8;
const MAX_COLS = 10;

const TableGridSelector: React.FC<TableGridSelectorProps> = ({ onSelect }) => {
  const [hovered, setHovered] = useState({ rows: 0, cols: 0 });

  const handleSelect = (rows: number, cols: number) => {
    if (rows > 0 && cols > 0) {
      onSelect(rows, cols);
    }
  };

  return (
    <div className="p-2 table-grid-selector">
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${MAX_COLS}, 1fr)`,
        }}
        onMouseLeave={() => setHovered({ rows: 0, cols: 0 })}
      >
        {Array.from({ length: MAX_ROWS }).map((_, rowIndex) =>
          Array.from({ length: MAX_COLS }).map((_, colIndex) => {
            const isHovered =
              rowIndex < hovered.rows && colIndex < hovered.cols;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`w-5 h-5 border border-gray-300 transition-colors ${
                  isHovered ? 'bg-blue-400 border-blue-500' : 'bg-gray-100 hover:bg-blue-200'
                }`}
                onMouseEnter={() =>
                  setHovered({ rows: rowIndex + 1, cols: colIndex + 1 })
                }
                onClick={() => handleSelect(hovered.rows, hovered.cols)}
              />
            );
          })
        )}
      </div>
      <p className="text-center text-sm text-gray-600 mt-2 h-5">
        {hovered.rows > 0 && hovered.cols > 0
          ? `${hovered.cols} × ${hovered.rows} Table`
          : 'Insert Table'}
      </p>
    </div>
  );
};


interface SymbolsDropdownProps {
  onSelect: (symbol: string) => void;
}

const SYMBOLS = [
  // Math
  '±', '∞', '≈', '≠', '≤', '≥', '÷', '×', '√', '∫', '∑', '∂', 'ƒ', 'π',
  // Greek
  'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
  // Currency & Legal
  '€', '£', '¥', '©', '®', '™', '°', '•', '·',
];

const SymbolsDropdown: React.FC<SymbolsDropdownProps> = ({ onSelect }) => {
  return (
    <div className="p-2 w-64">
      <div className="grid grid-cols-8 gap-1">
        {SYMBOLS.map(symbol => (
          <button
            key={symbol}
            onMouseDown={(e) => e.preventDefault()} // Prevents the text editor from losing focus
            onClick={() => onSelect(symbol)}
            className="w-7 h-7 flex items-center justify-center rounded text-base text-gray-700 hover:bg-gray-200 transition-colors"
            title={symbol}
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
};


interface ToolbarProps {
  selectedElement: SlideElement | null;
  editingElementId: string | null;
  onUpdateStyle: (elementId: string, newStyle: React.CSSProperties) => void;
  onUpdateElement: (element: SlideElement) => void;
  onAddShape: (shapeType: ShapeType) => void;
  onAddTextElement: () => void;
  onAddImageElement: (imageData: string) => void;
  onAddTable: (rows: number, cols: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onArrangeElement: (elementId: string, arrangement: 'forward' | 'backward' | 'front' | 'back') => void;
  onToggleThemes: () => void;
  onToggleCommentsSidebar: () => void;
  onCutElement: (elementId: string) => void;
  onCopyElement: (elementId: string) => void;
  onPasteElement: () => void;
  clipboard: SlideElement | null;
  onInsertSymbol: (symbol: string) => void;
}

const ToolbarButton: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
    isActive?: boolean;
}> = ({ onClick, children, title, disabled = false, isActive = false}) => {
    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`p-1.5 rounded-md transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-200'
            } disabled:text-gray-300 disabled:bg-transparent disabled:cursor-not-allowed`}
        >
            {children}
        </button>
    )
}

const Dropdown: React.FC<{
    buttonContent: React.ReactNode;
    buttonTitle: string;
    children: React.ReactNode;
    disabled?: boolean;
    wide?: boolean;
}> = ({ buttonContent, buttonTitle, children, disabled, wide = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                title={buttonTitle}
                disabled={disabled}
                className={`flex items-center gap-1 p-1.5 rounded-md text-gray-600 hover:bg-gray-200 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed ${wide ? 'w-36 justify-between' : ''}`}
            >
                {buttonContent}
                <Icon type="chevron-down" className="w-3 h-3" />
            </button>
            {isOpen && (
                <div 
                    className={`absolute top-full mt-2 left-0 bg-white border border-gray-300 rounded-md shadow-lg py-1 z-20 animate-fade-in-fast ${wide ? 'w-48' : 'w-auto'}`}
                    onClick={(e) => {
                      // Only close if it's not the table grid selector itself
                      const target = e.target as HTMLElement;
                      if (!target.closest('.table-grid-selector')) {
                        setIsOpen(false);
                      }
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

const FONT_SIZES = ['12px', '16px', '24px', '36px', '48px'];
const FONT_FAMILIES = ['Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Georgia', 'Times New Roman', 'Garamond', 'Courier New', 'Brush Script MT', 'Comic Sans MS', 'Impact', 'Lucida Console'];


const Toolbar: React.FC<ToolbarProps> = ({ selectedElement, editingElementId, onUpdateStyle, onUpdateElement, onAddShape, onAddTextElement, onAddImageElement, onAddTable, onUndo, onRedo, canUndo, canRedo, onArrangeElement, onToggleThemes, onToggleCommentsSidebar, onCutElement, onCopyElement, onPasteElement, clipboard, onInsertSymbol }) => {
    const isText = selectedElement?.type === 'text';
    const isTextEditing = isText && selectedElement.id === editingElementId;
    const isShape = selectedElement?.type === 'shape';
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleStyleToggle = (property: keyof React.CSSProperties, value: any, offValue: any) => {
        if (!selectedElement) return;
        const currentStyle = selectedElement.style || {};

        if (property === 'textDecoration') {
            const currentDecorations = String(currentStyle.textDecoration || '').split(' ').filter(d => d && d !== 'none');
            const decorationSet = new Set(currentDecorations);
            if (decorationSet.has(value)) {
                decorationSet.delete(value);
            } else {
                decorationSet.add(value);
            }
            const newDecoration = Array.from(decorationSet).join(' ');
            onUpdateStyle(selectedElement.id, { textDecoration: newDecoration || offValue });
        } else {
            // For properties like fontWeight, fontStyle
            const currentStyleValue = currentStyle[property];
            const newStyleValue = currentStyleValue === value ? offValue : value;
            onUpdateStyle(selectedElement.id, { [property]: newStyleValue });
        }
    };

    const handleColorChange = (color: string) => {
        if (selectedElement) {
            onUpdateStyle(selectedElement.id, { color: color });
        }
    }
    
    const handleHighlightChange = (color: string) => {
        if (selectedElement) {
            onUpdateStyle(selectedElement.id, { backgroundColor: color });
        }
    }
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                onAddImageElement(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
        
        e.target.value = '';
    };

    const handleAddImageClick = () => {
        imageInputRef.current?.click();
    };

    const handleAlignChange = (align: 'left' | 'center' | 'right' | 'justify') => {
        if (selectedElement) {
            onUpdateStyle(selectedElement.id, { textAlign: align });
        }
    };
    
    const handleToggleList = (listType: 'bullet' | 'number') => {
        if (!selectedElement || selectedElement.type !== 'text') return;
    
        const bulletMarker = '• ';
        const numberRegex = /^\s*\d+\.\s+/;
        const bulletRegex = /^\s*•\s+/;
    
        const lines = selectedElement.content.split('\n');
        let isCurrentlyList = false;
    
        if (lines.length > 0) {
            if (listType === 'bullet') {
                isCurrentlyList = lines.some(line => line.trim().length > 0 && bulletRegex.test(line));
            } else {
                isCurrentlyList = lines.some(line => line.trim().length > 0 && numberRegex.test(line));
            }
        }
    
        let newContent = '';
        if (isCurrentlyList) {
            // Remove list formatting
            newContent = lines.map(line => line.replace(bulletRegex, '').replace(numberRegex, '')).join('\n');
        } else {
            // Add list formatting, removing any other list type
            let counter = 1;
            newContent = lines.map(line => {
                const trimmedLine = line.replace(bulletRegex, '').replace(numberRegex, '');
                if (trimmedLine.trim().length === 0) return '';
                if (listType === 'bullet') {
                    return `${bulletMarker}${trimmedLine}`;
                } else {
                    return `${counter++}. ${trimmedLine}`;
                }
            }).join('\n');
        }
    
        onUpdateElement({ ...selectedElement, content: newContent });
    };

    const handleArrange = (arrangement: 'forward' | 'backward' | 'front' | 'back') => {
        if (selectedElement) {
            onArrangeElement(selectedElement.id, arrangement);
        }
    };
    
    const currentFontSize = isText && selectedElement.style?.fontSize
      ? String(selectedElement.style.fontSize).replace('px', '')
      : undefined;

    const currentFontFamily = isText ? selectedElement.style?.fontFamily : undefined;

    return (
        <div className="h-11 bg-gray-100 border-b border-gray-300 flex items-center px-3 gap-2">
            <ToolbarButton title="Undo (Cmd+Z)" onClick={onUndo} disabled={!canUndo}>
                <Icon type="undo" className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Redo (Cmd+Y)" onClick={onRedo} disabled={!canRedo}>
                <Icon type="redo" className="w-5 h-5" />
            </ToolbarButton>
            
            <div className="w-px h-5 bg-gray-300" />

            <ToolbarButton title="Cut (Ctrl+X)" onClick={() => selectedElement && onCutElement(selectedElement.id)} disabled={!selectedElement}>
                <Scissors className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Copy (Ctrl+C)" onClick={() => selectedElement && onCopyElement(selectedElement.id)} disabled={!selectedElement}>
                <Copy className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Paste (Ctrl+V)" onClick={onPasteElement} disabled={!clipboard}>
                <Clipboard className="w-5 h-5" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-300" />
            
            <Dropdown
                buttonContent={<span className="text-sm truncate" style={{fontFamily: currentFontFamily}}>{currentFontFamily || 'Font Family'}</span>}
                buttonTitle="Font Family"
                disabled={!isText}
                wide={true}
            >
                <ul className="space-y-1 max-h-60 overflow-y-auto">
                    {FONT_FAMILIES.map(font => (
                        <li key={font}>
                            <button 
                                onClick={() => selectedElement && onUpdateStyle(selectedElement.id, { fontFamily: font })} 
                                className="w-full text-left px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                                style={{fontFamily: font}}
                            >
                                {font}
                            </button>
                        </li>
                    ))}
                </ul>
            </Dropdown>

            <Dropdown
                buttonContent={<span className="text-sm w-8 text-center">{currentFontSize || 'Size'}</span>}
                buttonTitle="Font Size"
                disabled={!isText}
            >
                <ul className="space-y-1">
                    {FONT_SIZES.map(size => (
                        <li key={size}>
                            <button 
                                onClick={() => selectedElement && onUpdateStyle(selectedElement.id, { fontSize: size })} 
                                className="w-full text-left px-4 py-1 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                {size.replace('px', '')}
                            </button>
                        </li>
                    ))}
                </ul>
            </Dropdown>

            <div className="w-px h-5 bg-gray-300" />

            <ToolbarButton title="Bold" disabled={!isText} isActive={isText && selectedElement.style?.fontWeight === 'bold'} onClick={() => handleStyleToggle('fontWeight', 'bold', 'normal')}>
                <Icon type="text-b" className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Italic" disabled={!isText} isActive={isText && selectedElement.style?.fontStyle === 'italic'} onClick={() => handleStyleToggle('fontStyle', 'italic', 'normal')}>
                <Icon type="text-i" className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Underline" disabled={!isText} isActive={isText && String(selectedElement.style?.textDecoration || '').includes('underline')} onClick={() => handleStyleToggle('textDecoration', 'underline', 'none')}>
                <Icon type="text-u" className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Strikethrough" disabled={!isText} isActive={isText && String(selectedElement.style?.textDecoration || '').includes('line-through')} onClick={() => handleStyleToggle('textDecoration', 'line-through', 'none')}>
                <Strikethrough className="w-5 h-5" />
            </ToolbarButton>

            <ColorPicker onSelect={handleColorChange} disabled={!isText}>
                <ToolbarButton title="Text Color" disabled={!isText}>
                    <Icon type="text-color" className="w-5 h-5" />
                </ToolbarButton>
            </ColorPicker>

            <ColorPicker onSelect={handleHighlightChange} disabled={!isText}>
                 <ToolbarButton title="Highlight Color" disabled={!isText}>
                    <Icon type="text-highlight" className="w-5 h-5" />
                </ToolbarButton>
            </ColorPicker>

            <Dropdown
                buttonContent={<Sigma className="w-5 h-5" />}
                buttonTitle="Insert Symbol"
                disabled={!isTextEditing}
            >
                <SymbolsDropdown onSelect={onInsertSymbol} />
            </Dropdown>

            <div className="w-px h-5 bg-gray-300" />
            
            <ToolbarButton title="Align Left" disabled={!isText} isActive={!isText || !selectedElement.style?.textAlign || selectedElement.style?.textAlign === 'left'} onClick={() => handleAlignChange('left')}>
                <Icon type="align-left" className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Align Center" disabled={!isText} isActive={isText && selectedElement.style?.textAlign === 'center'} onClick={() => handleAlignChange('center')}>
                <Icon type="align-center" className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Align Right" disabled={!isText} isActive={isText && selectedElement.style?.textAlign === 'right'} onClick={() => handleAlignChange('right')}>
                <Icon type="align-right" className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Align Justify" disabled={!isText} isActive={isText && selectedElement.style?.textAlign === 'justify'} onClick={() => handleAlignChange('justify')}>
                <Icon type="align-justify" className="w-5 h-5" />
            </ToolbarButton>

            <div className="w-px h-5 bg-gray-300" />
            
            <ToolbarButton title="Bulleted List" disabled={!isText} onClick={() => handleToggleList('bullet')}>
                <Icon type="list-bullet" className="w-5 h-5" />
            </ToolbarButton>
            <ToolbarButton title="Numbered List" disabled={!isText} onClick={() => handleToggleList('number')}>
                <Icon type="list-number" className="w-5 h-5" />
            </ToolbarButton>
            
            <div className="w-px h-5 bg-gray-300" />

            <ToolbarButton title="Add Text Box" onClick={onAddTextElement}>
                <Icon type="text-box" className="w-5 h-5" />
            </ToolbarButton>
            
            <ToolbarButton title="Add Image" onClick={handleAddImageClick}>
                <Icon type="image" className="w-5 h-5" />
            </ToolbarButton>
            <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
            />

            <Dropdown buttonContent={<Icon type="table" className="w-5 h-5" />} buttonTitle="Add Table">
                <TableGridSelector onSelect={onAddTable} />
            </Dropdown>

            <Dropdown buttonContent={<Icon type="shape" className="w-5 h-5" />} buttonTitle="Add Shape">
                <ul className="space-y-1">
                    <li>
                        <button onClick={() => onAddShape('rectangle')} className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Icon type="shape-rect" className="w-5 h-5" /> Rectangle
                        </button>
                    </li>
                    <li>
                        <button onClick={() => onAddShape('oval')} className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Icon type="shape-oval" className="w-5 h-5" /> Oval
                        </button>
                    </li>
                    <li>
                        <button onClick={() => onAddShape('triangle')} className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <Icon type="shape-tri" className="w-5 h-5" /> Triangle
                        </button>
                    </li>
                </ul>
            </Dropdown>

            <div className="w-px h-5 bg-gray-300" />
            
            <Dropdown 
              buttonContent={<><Layers className="w-5 h-5" /> <span className="text-sm">Arrange</span></>} 
              buttonTitle="Arrange" 
              disabled={!selectedElement}
              wide
            >
              <ul className="space-y-1 text-sm text-gray-700">
                  <li className='px-3 py-1 text-xs text-gray-500'>Order Objects</li>
                  <li>
                      <button onClick={() => handleArrange('front')} className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-gray-100">
                          <BringToFront className="w-4 h-4" /> Bring to Front
                      </button>
                  </li>
                  <li>
                      <button onClick={() => handleArrange('forward')} className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-gray-100">
                          <ArrowUp className="w-4 h-4" /> Bring Forward
                      </button>
                  </li>
                  <li>
                      <button onClick={() => handleArrange('backward')} className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-gray-100">
                          <ArrowDown className="w-4 h-4" /> Send Backward
                      </button>
                  </li>
                  <li>
                      <button onClick={() => handleArrange('back')} className="w-full flex items-center gap-2 text-left px-3 py-1.5 hover:bg-gray-100">
                          <SendToBack className="w-4 h-4" /> Send to Back
                      </button>
                  </li>
              </ul>
            </Dropdown>

            <div className="w-px h-5 bg-gray-300" />
            
            <ToolbarButton title="Design Themes" onClick={onToggleThemes}>
                <LayoutTemplate className="w-5 h-5" />
            </ToolbarButton>
            
            <ToolbarButton title="Comments" onClick={onToggleCommentsSidebar}>
                <MessageSquareText className="w-5 h-5" />
            </ToolbarButton>

        </div>
    );
};


interface PptxHeaderProps {
  presentation: Presentation;
  activeSlideId: string;
  selectedElementId: string | null;
  editingElementId: string | null;
  onUpdateElement: (element: SlideElement) => void;
  onUpdateElementStyle: (elementId: string, newStyle: React.CSSProperties) => void;
  onAddShape: (shapeType: ShapeType) => void;
  onAddTextElement: () => void;
  onAddImageElement: (imageData: string) => void;
  onAddTable: (rows: number, cols: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onArrangeElement: (elementId: string, arrangement: 'forward' | 'backward' | 'front' | 'back') => void;
  lastEdited: Date;
  fileSize: string;
  onToggleThemes: () => void;
  onToggleCommentsSidebar: () => void;
  onToggleHelp: (open: boolean) => void;
  onCutElement: (elementId: string) => void;
  onCopyElement: (elementId: string) => void;
  onPasteElement: () => void;
  clipboard: SlideElement | null;
  onInsertSymbol: (symbol: string) => void;
  isFilePanelVisible: boolean;
  onToggleFilePanel: () => void;
}

const PptxHeader: React.FC<PptxHeaderProps> = (props) => {
  const { presentation, activeSlideId, selectedElementId, lastEdited, fileSize, isFilePanelVisible, onToggleFilePanel } = props;
  const activeSlide = presentation.slides.find(s => s.id === activeSlideId);
  const selectedElement = activeSlide?.elements.find(e => e.id === selectedElementId);
  
  const activeSlideIndex = presentation.slides.findIndex(s => s.id === activeSlideId);
  const currentSlideNumber = activeSlideIndex >= 0 ? activeSlideIndex + 1 : 0;
  const totalSlides = presentation.slides.length;

  return (
    <header className="bg-gray-50 border-b border-gray-300 flex-shrink-0 ">
        <div className="h-10 flex items-center justify-between px-4 bg-[#C73C1D] text-white">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleFilePanel}
                    className="p-1.5 rounded-full text-gray-200 hover:bg-white/20 transition-colors"
                    title={isFilePanelVisible ? 'Hide File Explorer' : 'Show File Explorer'}
                >
                    {isFilePanelVisible ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                </button>
                <h1 className="text-sm font-medium text-gray-100 truncate" title={presentation.title}>
                    {presentation.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="w-px h-3 bg-gray-200"></span>
                    <span>{fileSize}</span>
                    <span className="w-px h-3 bg-gray-200"></span>
                    <span title={lastEdited.toLocaleString()}>Last edited: {lastEdited.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {totalSlides > 0 && (
                    <span className="text-sm text-gray-300">
                        Slide {currentSlideNumber} of {totalSlides}
                    </span>
                )}
                 <button onClick={() => props.onToggleHelp(true)} className="p-1 rounded-full text-gray-200 hover:bg-white/20 transition-colors" title="Help">
                    <HelpCircle className="w-5 h-5" />
                </button>
            </div>
        </div>
        <Toolbar 
            selectedElement={selectedElement || null}
            editingElementId={props.editingElementId}
            onUpdateStyle={props.onUpdateElementStyle}
            onUpdateElement={props.onUpdateElement}
            onAddShape={props.onAddShape}
            onAddTextElement={props.onAddTextElement}
            onAddImageElement={props.onAddImageElement}
            onAddTable={props.onAddTable}
            onUndo={props.onUndo}
            onRedo={props.onRedo}
            canUndo={props.canUndo}
            canRedo={props.canRedo}
            onArrangeElement={props.onArrangeElement}
            onToggleThemes={props.onToggleThemes}
            onToggleCommentsSidebar={props.onToggleCommentsSidebar}
            onCutElement={props.onCutElement}
            onCopyElement={props.onCopyElement}
            onPasteElement={props.onPasteElement}
            clipboard={props.clipboard}
            onInsertSymbol={props.onInsertSymbol}
        />
    </header>
  );
};


interface NotesPanelProps {
  notes: string;
  onUpdateNotes: (notes: string) => void;
  height: number;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ notes, onUpdateNotes, height }) => {
  const [currentNotes, setCurrentNotes] = useState(notes);

  useEffect(() => {
    setCurrentNotes(notes);
  }, [notes]);
  
  const handleBlur = () => {
    if (currentNotes !== notes) {
        onUpdateNotes(currentNotes);
    }
  };

  return (
    <div 
        className="bg-white border-t border-gray-300 flex-shrink-0 flex flex-col"
        style={{ height: `${height}px` }}
    >
        <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-4 text-xs font-bold text-gray-500 uppercase tracking-wider select-none">
            Notes
        </div>
        <textarea
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
            onBlur={handleBlur}
            placeholder="Click to add speaker notes"
            className="w-full h-full p-4 text-sm text-gray-700 resize-none border-none focus:ring-0 bg-transparent leading-relaxed"
            aria-label="Speaker notes"
        />
    </div>
  );
};


interface StatusBarProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onStartSlideshow: () => void;
  isNotesOpen: boolean;
  onToggleNotes: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onAddNewSlide: () => void;
  onChangeLayout: (layout: 'title' | 'title_and_content' | 'blank') => void;
  onSearch: () => void;
  onDownload: () => void;
}

type Layout = 'title' | 'title_and_content' | 'blank';

const LayoutMenu: React.FC<{
  onSelect: (layout: Layout) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="absolute bottom-11 left-0 bg-white border border-gray-300 rounded-md shadow-lg py-1 w-48 z-10 animate-fade-in-fast"
    >
      <ul>
        <li className="px-4 pt-2 pb-1 text-xs text-gray-500">Change Layout</li>
        <li>
          <button onClick={() => onSelect('title')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Title Slide
          </button>
        </li>
        <li>
          <button onClick={() => onSelect('title_and_content')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Title and Content
          </button>
        </li>
        <li>
          <button onClick={() => onSelect('blank')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Blank
          </button>
        </li>
      </ul>
    </div>
  );
};


const StatusBar: React.FC<StatusBarProps> = ({ zoom, onZoomChange, onStartSlideshow, isNotesOpen, onToggleNotes, isSidebarOpen, onToggleSidebar, onAddNewSlide, onChangeLayout, onSearch, onDownload }) => {
  const handleZoomIn = () => onZoomChange(Math.min(200, zoom + 10));
  const handleZoomOut = () => onZoomChange(Math.max(10, zoom - 10));
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);

  const handleLayoutSelect = (layout: Layout) => {
    onChangeLayout(layout);
    setIsLayoutMenuOpen(false);
  };

  return (
    <footer className="h-10 bg-gray-100 border-t border-gray-300 flex items-center justify-between px-4 gap-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 transition-colors"
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
            <Icon type={isSidebarOpen ? 'chevron-left' : 'chevron-right'} className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button 
          onClick={onToggleNotes}
          className={`flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors ${
            isNotesOpen ? 'bg-gray-300 text-gray-800' : 'text-gray-600 hover:bg-gray-200'
          }`}
          title={isNotesOpen ? 'Hide notes' : 'Show notes'}
        >
          <Icon type="notes" className="w-4 h-4" />
          Notes
        </button>
        <div className="w-px h-5 bg-gray-300" />
        <button 
            onClick={onAddNewSlide} 
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 transition-colors" 
            title="Add new slide"
            aria-label="Add new slide"
        >
            <Icon type="newSlide" className="w-5 h-5" />
        </button>
        <div className="relative">
            <button 
                onClick={() => setIsLayoutMenuOpen(prev => !prev)} 
                className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 transition-colors" 
                title="Change layout"
                aria-label="Change layout"
            >
                <Icon type="layout" className="w-5 h-5" />
            </button>
            {isLayoutMenuOpen && <LayoutMenu onSelect={handleLayoutSelect} onClose={() => setIsLayoutMenuOpen(false)} />}
        </div>
        <button 
            onClick={onSearch} 
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 transition-colors" 
            title="Search"
            aria-label="Search"
        >
            <Icon type="search" className="w-5 h-5" />
        </button>
        <button 
            onClick={onDownload} 
            className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 transition-colors" 
            title="Download presentation"
            aria-label="Download presentation"
        >
            <Icon type="download" className="w-5 h-5" />
        </button>
      </div>
      <div className='flex items-center gap-4'>
        <div className="flex items-center gap-2">
          <button onClick={handleZoomOut} className="p-1 rounded-full text-gray-600 hover:bg-gray-200" title="Zoom out" aria-label="Zoom out">
            <Icon type="minus" className="w-4 h-4" />
          </button>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={zoom}
            onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
            className="w-32"
            aria-label="Zoom slider"
          />
          <button onClick={handleZoomIn} className="p-1 rounded-full text-gray-600 hover:bg-gray-200" title="Zoom in" aria-label="Zoom in">
            <Icon type="plus" className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-600 w-10 text-center">{zoom}%</span>
        </div>
        <div className="w-px h-5 bg-gray-300" />
        <button 
          onClick={onStartSlideshow} 
          className="text-gray-600 hover:text-blue-600 transition-colors"
          title="Start slideshow"
          aria-label="Start slideshow"
        >
          <Icon type="slideshow" className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
};


interface SearchResult {
  slideId: string;
  elementId: string;
}

interface SearchModalProps {
  presentation: Presentation;
  activeSlideId: string;
  onClose: () => void;
  onSelectSlide: (slideId: string, elementIdToFocus: string | null) => void;
  onUpdateElement: (element: SlideElement) => void;
  onReplaceAll: (find: string, replace: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ presentation, activeSlideId, onClose, onSelectSlide, onUpdateElement, onReplaceAll }) => {
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Center the modal on initial render
    if (modalRef.current) {
      const { offsetWidth, offsetHeight } = modalRef.current;
      const x = (window.innerWidth - offsetWidth) / 2;
      const y = (window.innerHeight - offsetHeight) / 3; // A bit higher than center
      setPosition({ x, y });
    }
  }, []);

  const flatTextElements = useMemo(() => {
    return presentation.slides.flatMap(slide => 
      slide.elements
        .filter(el => el.type === 'text')
        .map(el => ({ slideId: slide.id, elementId: el.id, content: el.content }))
    );
  }, [presentation]);
  
  const performSearch = useCallback(() => {
    if (!findTerm) {
      setSearchResults([]);
      setCurrentIndex(-1);
      return;
    }
    const results = flatTextElements
      .filter(el => el.content.toLowerCase().includes(findTerm.toLowerCase()))
      .map(({slideId, elementId}) => ({slideId, elementId}));

    setSearchResults(results);
    
    const currentSlideIndex = results.findIndex(r => r.slideId === activeSlideId);
    setCurrentIndex(currentSlideIndex !== -1 ? currentSlideIndex -1 : -1);

  }, [findTerm, flatTextElements, activeSlideId]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleFindNext = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentIndex + 1) % searchResults.length;
    setCurrentIndex(nextIndex);
    const { slideId, elementId } = searchResults[nextIndex];
    onSelectSlide(slideId, elementId);
  }, [currentIndex, searchResults, onSelectSlide]);

  const handleReplace = () => {
    if (currentIndex < 0 || searchResults.length === 0) {
      handleFindNext();
      return;
    }
    
    const currentResult = searchResults[currentIndex];
    const elementToUpdate = flatTextElements.find(el => el.elementId === currentResult.elementId);

    if (elementToUpdate) {
        const regex = new RegExp(findTerm, 'i'); // Replace first case-insensitive match
        const newContent = elementToUpdate.content.replace(regex, replaceTerm);
        const originalElement = presentation.slides.find(s => s.id === currentResult.slideId)
            ?.elements.find(e => e.id === currentResult.elementId);
        
        if(originalElement) {
            onUpdateElement({ ...originalElement, content: newContent });
        }
    }
    setTimeout(handleFindNext, 50);
  };
  
  const handleReplaceAllClick = () => {
    onReplaceAll(findTerm, replaceTerm);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
        setIsDragging(true);
        const { left, top } = modalRef.current.getBoundingClientRect();
        setDragOffset({ x: e.clientX - left, y: e.clientY - top });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (isDragging) {
          setPosition({
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y,
          });
      }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
      setIsDragging(false);
  }, []);

  useEffect(() => {
      if (isDragging) {
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
      } else {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      }
      return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  return (
    <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}>
      <div 
        ref={modalRef}
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
        className="fixed bg-white rounded-lg shadow-2xl w-full max-w-sm animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div 
            onMouseDown={handleMouseDown}
            className="flex justify-between items-center py-3 px-4 border-b border-gray-200 cursor-move rounded-t-lg bg-gray-50"
        >
          <h2 className="text-base font-semibold text-gray-800">Find and Replace</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-light leading-none p-1">&times;</button>
        </div>
        <div className="p-6">
            <div className="space-y-4">
            <div>
                <label htmlFor="find-input" className="text-sm font-medium text-gray-700">Find what:</label>
                <input
                type="text"
                id="find-input"
                value={findTerm}
                onChange={e => setFindTerm(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                autoFocus
                />
                {findTerm && <p className="text-xs text-gray-500 mt-1">{searchResults.length} matches found.</p>}
            </div>
            <div>
                <label htmlFor="replace-input" className="text-sm font-medium text-gray-700">Replace with:</label>
                <input
                type="text"
                id="replace-input"
                value={replaceTerm}
                onChange={e => setReplaceTerm(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
            </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
            <button 
                onClick={handleFindNext}
                disabled={!findTerm || searchResults.length === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Find Next
            </button>
            <button 
                onClick={handleReplace}
                disabled={!findTerm || searchResults.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Replace
            </button>
            <button 
                onClick={handleReplaceAllClick}
                disabled={!findTerm || searchResults.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Replace All
            </button>
            </div>
        </div>
      </div>
    </div>
  );
};


interface ThemesSidebarProps {
  themes: Theme[];
  onSelectTheme: (themeId: string) => void;
  onClose: () => void;
  currentThemeId?: string;
}

const ThemePreview: React.FC<{ theme: Theme, isSelected: boolean, onSelect: () => void }> = ({ theme, isSelected, onSelect }) => {
  const backgroundStyle: React.CSSProperties = {
    background: theme.background.gradient || theme.background.color || `url(${theme.background.image})`,
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full p-2 rounded-lg border-2 transition-all duration-150 ${isSelected ? 'border-blue-500' : 'border-transparent hover:border-gray-300'}`}
      aria-label={`Select ${theme.name} theme`}
    >
      <div className="aspect-video w-full rounded-md overflow-hidden shadow-md flex flex-col justify-center items-center p-2" style={backgroundStyle}>
        <span className="text-xl font-bold" style={{ color: theme.colors.primary, fontFamily: theme.fontFamily }}>Aa</span>
        <div className="flex gap-1 mt-2">
          {Object.values(theme.colors).slice(0, 5).map((color, i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
      <p className="text-xs text-center mt-1 text-gray-600">{theme.name}</p>
    </button>
  );
};

const ThemesSidebar: React.FC<ThemesSidebarProps> = ({ themes, onSelectTheme, onClose, currentThemeId }) => {
  return (
    <aside className="w-72 bg-gray-100 border-l border-gray-300 flex-shrink-0 flex flex-col animate-fade-in">
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-300 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700">Themes</h2>
        <button onClick={onClose} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200" aria-label="Close themes sidebar">
          <Icon type="close" className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {themes.map(theme => (
            <ThemePreview
              key={theme.id}
              theme={theme}
              isSelected={currentThemeId === theme.id}
              onSelect={() => onSelectTheme(theme.id)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
};


interface CommentsSidebarProps {
  comments: Comment[];
  onAddComment: (text: string, parentId?: string | null) => void;
  onClose: () => void;
  selectedElementId: string | null;
  activeCommentThreadId: string | null;
  onSetActiveCommentThread: (threadId: string | null) => void;
  onResolveCommentThread: (threadId: string) => void;
  onDeleteCommentThread: (threadId: string) => void;
}

const formatTimeAgo = (isoDate: string) => {
    const date = new Date(isoDate);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return "Just now";
};

const AuthorAvatar: React.FC<{ author: string }> = ({ author }) => (
    <div className="w-7 h-7 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
        {author.substring(0, 1).toUpperCase()}
    </div>
);

const ReplyForm: React.FC<{ parentId: string, onAddComment: CommentsSidebarProps['onAddComment'], onCancel: () => void }> = ({ parentId, onAddComment, onCancel }) => {
    const [replyText, setReplyText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleSubmit = () => {
        if (replyText.trim()) {
            onAddComment(replyText, parentId);
            setReplyText('');
            onCancel();
        }
    };

    return (
        <div className="mt-2 ml-10">
            <textarea
                ref={textareaRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Reply..."
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none transition"
                rows={2}
            />
            <div className="flex justify-end items-center mt-2 gap-2">
                <button onClick={onCancel} className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md">Cancel</button>
                <button 
                    onClick={handleSubmit}
                    disabled={!replyText.trim()}
                    className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                    Reply
                </button>
            </div>
        </div>
    );
};

const CommentItem: React.FC<{ comment: Comment; children?: React.ReactNode; isThreadActive: boolean; onSelect: () => void; onResolve: () => void; onDelete: () => void; onStartReply: () => void; }> = ({ comment, children, isThreadActive, onSelect, onResolve, onDelete, onStartReply }) => {
    return (
        <div 
            className={`p-3 rounded-lg cursor-pointer transition-all duration-150 ${isThreadActive ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-white hover:bg-gray-100'} ${comment.resolved ? 'opacity-60' : ''}`}
            onClick={onSelect}
        >
            <div className="flex items-start gap-3">
                <AuthorAvatar author={comment.author} />
                <div className="flex-grow">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">{comment.author}</span>
                        <span className="text-xs text-gray-500">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    <p className={`text-sm text-gray-700 whitespace-pre-wrap ${comment.resolved ? 'line-through' : ''}`}>{comment.text}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title={comment.resolved ? "Reopen thread" : "Resolve thread"} onClick={(e) => { e.stopPropagation(); onResolve(); }} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><CheckCircle2 className={`w-4 h-4 ${comment.resolved ? 'text-green-600' : ''}`}/></button>
                    <button title="Reply" onClick={(e) => { e.stopPropagation(); onStartReply(); }} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><Reply className="w-4 h-4"/></button>
                    <button title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded-full text-gray-500 hover:bg-gray-200"><Trash2 className="w-4 h-4"/></button>
                </div>
            </div>
            {children}
        </div>
    );
};

const CommentThread: React.FC<CommentsSidebarProps & { thread: Comment; replies: Comment[] }> = ({ thread, replies, ...props }) => {
    const [isReplying, setIsReplying] = useState(false);
    
    return (
        <div className="group">
            <CommentItem 
                comment={thread}
                isThreadActive={props.activeCommentThreadId === thread.id}
                onSelect={() => props.onSetActiveCommentThread(props.activeCommentThreadId === thread.id ? null : thread.id)}
                onResolve={() => props.onResolveCommentThread(thread.id)}
                onDelete={() => props.onDeleteCommentThread(thread.id)}
                onStartReply={() => setIsReplying(true)}
            >
                {replies.length > 0 && (
                    <div className="mt-3 ml-5 pl-5 border-l-2 border-gray-200 space-y-3">
                        {replies.map(reply => (
                             <div key={reply.id} className="flex items-start gap-3">
                                <AuthorAvatar author={reply.author} />
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-800">{reply.author}</span>
                                        <span className="text-xs text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p className={`text-sm text-gray-700 whitespace-pre-wrap ${reply.resolved ? 'line-through' : ''}`}>{reply.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CommentItem>
            {isReplying && <ReplyForm parentId={thread.id} onAddComment={props.onAddComment} onCancel={() => setIsReplying(false)} />}
        </div>
    );
};


const CommentsSidebar: React.FC<CommentsSidebarProps> = (props) => {
    const { comments, onAddComment, onClose, selectedElementId } = props;
    const [newCommentText, setNewCommentText] = useState('');

    const handleSubmitNewThread = () => {
        if (newCommentText.trim()) {
            onAddComment(newCommentText, null);
            setNewCommentText('');
        }
    };
    
    const threads = useMemo(() => {
        const rootComments = (comments as Comment[])
            .filter(c => !c.parentId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return rootComments;
    }, [comments]);
    
    const repliesByParentId = useMemo(() => {
        return (comments as Comment[]).reduce((acc, comment) => {
            if (comment.parentId) {
                if (!acc[comment.parentId]) {
                    acc[comment.parentId] = [];
                }
                acc[comment.parentId].push(comment);
            }
            return acc;
        }, {} as Record<string, Comment[]>);
    }, [comments]);

    Object.values(repliesByParentId).forEach(replies => {
        replies.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    return (
        <aside className="w-80 bg-gray-100 border-l border-gray-300 flex-shrink-0 flex flex-col animate-fade-in">
            <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0 bg-white">
                <h2 className="text-base font-semibold text-gray-700">Comments</h2>
                <button onClick={onClose} className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200" aria-label="Close comments sidebar">
                    <Icon type="close" className="w-5 h-5" />
                </button>
            </div>
             <div className="p-4 border-b border-gray-200 bg-white">
                 <div className="flex items-start gap-3">
                    <AuthorAvatar author="User" />
                    <div className="flex-grow">
                        <textarea
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder={selectedElementId ? "Add a comment about the selected item..." : "Add a comment..."}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none transition"
                            rows={2}
                        />
                        <div className="flex justify-end items-center mt-2">
                            <button 
                                onClick={handleSubmitNewThread}
                                disabled={!newCommentText.trim()}
                                className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                            >
                                Comment
                            </button>
                        </div>
                    </div>
                 </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                {threads.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 mt-8">
                        No comments on this slide yet.
                    </div>
                ) : (
                    threads.map(thread => (
                        <CommentThread 
                            key={thread.id} 
                            thread={thread}
                            replies={repliesByParentId[thread.id] || []}
                            {...props}
                        />
                    ))
                )}
            </div>
        </aside>
    );
};


interface ElementContextMenuProps {
  x: number;
  y: number;
  element: SlideElement;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onAddRow?: () => void;
  onAddColumn?: () => void;
}

const ElementContextMenu: React.FC<ElementContextMenuProps> = ({ x, y, element, onClose, onCut, onCopy, onDelete, onAddRow, onAddColumn }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [onClose]);

  const handleAction = (action?: () => void) => {
    if (action) action();
    onClose();
  };

  const isTable = element.type === 'table';

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg py-1 w-52 animate-fade-in-fast"
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="text-sm text-gray-800">
        <li>
          <button onClick={() => handleAction(onCut)} className="w-full flex items-center gap-3 text-left px-3 py-1.5 hover:bg-gray-100">
            <Scissors className="w-4 h-4 text-gray-600" />
            <span>Cut</span>
            <span className="ml-auto text-xs text-gray-400">Ctrl+X</span>
          </button>
        </li>
        <li>
          <button onClick={() => handleAction(onCopy)} className="w-full flex items-center gap-3 text-left px-3 py-1.5 hover:bg-gray-100">
            <Copy className="w-4 h-4 text-gray-600" />
            <span>Copy</span>
            <span className="ml-auto text-xs text-gray-400">Ctrl+C</span>
          </button>
        </li>
        <li>
          <button onClick={() => handleAction(onDelete)} className="w-full flex items-center gap-3 text-left px-3 py-1.5 hover:bg-gray-100">
            <Trash2 className="w-4 h-4 text-gray-600" />
            <span>Delete</span>
            <span className="ml-auto text-xs text-gray-400">Del</span>
          </button>
        </li>
        {isTable && (
          <>
            <li className="my-1 border-t border-gray-200" />
            <li>
              <button onClick={() => handleAction(onAddRow)} className="w-full text-left px-3 py-1.5 hover:bg-gray-100">
                Add Row Below
              </button>
            </li>
            <li>
              <button onClick={() => handleAction(onAddColumn)} className="w-full text-left px-3 py-1.5 hover:bg-gray-100">
                Add Column to Right
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  );
};


interface TableContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAddRow: () => void;
  onAddColumn: () => void;
}

const TableContextMenu: React.FC<TableContextMenuProps> = ({ x, y, onClose, onAddRow, onAddColumn }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Use capture phase to catch clicks on the slide preview and close the menu
    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => window.removeEventListener('click', handleGlobalClick, { capture: true });
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{ top: y, left: x }}
      className="absolute z-50 bg-white border border-gray-300 rounded-md shadow-lg py-1 w-48 animate-fade-in-fast"
      onClick={(e) => e.stopPropagation()}
    >
      <ul>
        <li>
          <button onClick={() => handleAction(onAddRow)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Add Row Below
          </button>
        </li>
        <li>
          <button onClick={() => handleAction(onAddColumn)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Add Column to Right
          </button>
        </li>
      </ul>
    </div>
  );
};


interface EditorProps {
  presentation: Presentation;
  activeSlideId: string;
  selectedElementId: string | null;
  editingElementId: string | null;
  onSelectSlide: (slideId: string, elementIdToFocus?: string | null) => void;
  onSelectElement: (elementId: string | null) => void;
  onEnterEditMode: (elementId: string) => void;
  onUpdateElement: (element: SlideElement) => void;
  onUpdateElementStyle: (elementId: string, newStyle: React.CSSProperties) => void;
  onUpdateSlideNotes: (notes: string) => void;
  onStartSlideshow: () => void;
  onDownload: () => void;
  onAddSlide: (targetSlideId: string) => void;
  onAddShape: (shapeType: ShapeType) => void;
  onAddTextElement: () => void;
  onAddImageElement: (imageData: string) => void;
  onAddTable: (rows: number, cols: number) => void;
  onDuplicateSlide: (targetSlideId: string) => void;
  onDeleteSlide: (targetSlideId: string) => void;
  onReorderSlides: (draggedId: string, dropTargetId: string) => void;
  onChangeLayout: (targetSlideId: string, layout: 'title' | 'title_and_content' | 'blank') => void;
  isSearchModalOpen: boolean;
  onToggleSearch: (open: boolean) => void;
  onToggleHelp: (open: boolean) => void;
  onReplaceAll: (find: string, replace: string) => void;
  focusedElementId: string | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onArrangeElement: (elementId: string, arrangement: 'forward' | 'backward' | 'front' | 'back') => void;
  lastEdited: Date;
  fileSize: string;
  onApplyTheme: (themeId: string) => void;
  isThemesSidebarOpen: boolean;
  onToggleThemes: () => void;
  isCommentsSidebarOpen: boolean;
  onToggleCommentsSidebar: (open?: boolean) => void;
  onAddComment: (text: string, parentId?: string | null) => void;
  onAddTableRow: (elementId: string) => void;
  onAddTableColumn: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onCutElement: (elementId: string) => void;
  onCopyElement: (elementId: string) => void;
  onPasteElement: () => void;
  clipboard: SlideElement | null;
  activeCommentThreadId: string | null;
  onSetActiveCommentThread: (threadId: string | null) => void;
  onResolveCommentThread: (threadId: string) => void;
  onDeleteCommentThread: (threadId: string) => void;
  isFilePanelVisible: boolean;
  onToggleFilePanel: () => void;
}

export const Slideshow: React.FC<{
  presentation: Presentation;
  activeSlideId: string;
  onExit: () => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ presentation, activeSlideId, onExit, onNext, onPrev }) => {
  const activeSlide = presentation.slides.find(s => s.id === activeSlideId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onExit();
        if (e.key === 'ArrowRight' || e.key === ' ') onNext();
        if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="absolute top-4 right-4 z-10">
            <button onClick={onExit} className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
                <X className="w-6 h-6" />
            </button>
        </div>
        <div className="w-full h-full flex items-center justify-center">
             {activeSlide && (
                 <div className="w-full h-full" style={{ maxWidth: '100vw', maxHeight: '100vh', aspectRatio: '16/9' }}>
                     <SlidePreview slide={activeSlide} onUpdateElement={() => {}} isEditable={false} />
                 </div>
             )}
        </div>
    </div>
  );
};

export const Editor: React.FC<EditorProps> = (props) => {
  const { presentation, activeSlideId, onSelectSlide, onUpdateElement, onUpdateSlideNotes, onStartSlideshow, onDownload, isSearchModalOpen, focusedElementId, lastEdited, fileSize, onApplyTheme, isThemesSidebarOpen, onToggleThemes, isCommentsSidebarOpen, onToggleCommentsSidebar, onAddComment, onAddTableRow, onAddTableColumn, onDeleteElement, activeCommentThreadId, onSetActiveCommentThread, onResolveCommentThread, onDeleteCommentThread, ...slideActions } = props;
  
  const activeSlide = presentation.slides.find((s) => s.id === activeSlideId);
  const [zoom, setZoom] = useState(100);
  
  const [notesHeight, setNotesHeight] = useState(128);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const isResizingNotes = useRef(false);

  const [thumbWidth, setThumbWidth] = useState(208); // Corresponds to w-52
  const isResizingThumbs = useRef(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [elementMenuState, setElementMenuState] = useState<{ x: number, y: number, element: SlideElement } | null>(null);

  const [lastSelection, setLastSelection] = useState<Range | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);


  const handleNotesResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingNotes.current = true;
    document.addEventListener('mousemove', handleNotesMouseMove);
    document.addEventListener('mouseup', handleNotesMouseUp);
  };

  const handleNotesMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingNotes.current) return;
    const newHeight = window.innerHeight - e.clientY - 40; // 40px for status bar height
    if (newHeight >= 50 && newHeight <= 400) {
      setNotesHeight(newHeight);
    }
  }, []);

  const handleNotesMouseUp = useCallback(() => {
    isResizingNotes.current = false;
    document.removeEventListener('mousemove', handleNotesMouseMove);
    document.removeEventListener('mouseup', handleNotesMouseUp);
  }, [handleNotesMouseMove]);
  
  const handleThumbsResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingThumbs.current = true;
    document.addEventListener('mousemove', handleThumbsMouseMove);
    document.addEventListener('mouseup', handleThumbsMouseUp);
  };

  const handleThumbsMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingThumbs.current) return;
    const newWidth = e.clientX;
    if (newWidth >= 160 && newWidth <= 400) {
        setThumbWidth(newWidth);
    }
  }, []);

  const handleThumbsMouseUp = useCallback(() => {
    isResizingThumbs.current = false;
    document.removeEventListener('mousemove', handleThumbsMouseMove);
    document.removeEventListener('mouseup', handleThumbsMouseUp);
  }, [handleThumbsMouseMove]);

  const handleInsertSymbol = (symbol: string) => {
    if (props.editingElementId) {
        if (lastSelection) {
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(lastSelection);
                document.execCommand('insertText', false, symbol);
                sel.removeAllRanges();
            }
        } else {
            // Fallback: append to end
            const el = editorRef.current?.querySelector(`[id='${props.editingElementId}'] [contenteditable]`);
            if (el) {
                el.innerHTML += symbol;
            }
        }
    }
  };
  
  return (
    <div className="h-full flex flex-col" ref={editorRef}>
      <PptxHeader {...props} onInsertSymbol={handleInsertSymbol} />
      <div className="flex-grow flex overflow-hidden">
        {isSidebarOpen && (
          <>
            <ThumbnailStrip
              slides={presentation.slides}
              activeSlideId={activeSlideId}
              onSelectSlide={onSelectSlide}
              style={{ width: `${thumbWidth}px` }}
              onAddSlide={props.onAddSlide}
              onDuplicateSlide={props.onDuplicateSlide}
              onDeleteSlide={props.onDeleteSlide}
              onReorderSlides={props.onReorderSlides}
              onChangeLayout={props.onChangeLayout}
            />
             <div 
                className="w-1.5 h-full cursor-col-resize bg-gray-200 hover:bg-blue-300 transition-colors flex-shrink-0 z-20"
                onMouseDown={handleThumbsResizeMouseDown}
            />
          </>
        )}
        
        {/* Center Column: Slide Workspace + Notes */}
        <div className="flex-grow flex flex-col min-w-0 relative">
            <div className="flex-grow flex flex-col bg-gray-300 p-4 overflow-auto">
                <div className="flex-grow flex items-center justify-center">
                    <div
                    className="relative shadow-lg"
                    style={{
                        width: `${zoom}%`,
                        paddingBottom: `${(9 / 16) * zoom}%`,
                    }}
                    >
                    <div className="absolute top-0 left-0 w-full h-full">
                        <SlidePreview 
                        slide={activeSlide || null} 
                        onUpdateElement={onUpdateElement} 
                        selectedElementId={props.selectedElementId}
                        editingElementId={props.editingElementId}
                        onSelectElement={props.onSelectElement}
                        onEnterEditMode={props.onEnterEditMode}
                        onElementContextMenu={(e, element) => setElementMenuState({ x: e.clientX, y: e.clientY, element })}
                        activeCommentThreadId={activeCommentThreadId}
                        onSetActiveCommentThread={onSetActiveCommentThread}
                        focusedElementId={focusedElementId}
                        onSelectionChange={setLastSelection}
                        />
                    </div>
                    </div>
                </div>
            </div>
            
            {/* Notes Panel */}
            {isNotesOpen && (
                <>
                <div 
                    className="h-1.5 w-full cursor-row-resize bg-gray-300 hover:bg-blue-400 transition-colors z-10 flex-shrink-0 border-t border-b border-gray-300"
                    onMouseDown={handleNotesResizeMouseDown}
                />
                <NotesPanel 
                    notes={activeSlide?.notes || ''} 
                    onUpdateNotes={onUpdateSlideNotes}
                    height={notesHeight}
                />
                </>
            )}
        </div>

        {isThemesSidebarOpen && (
          <ThemesSidebar
            themes={THEMES}
            currentThemeId={presentation.themeId}
            onSelectTheme={onApplyTheme}
            onClose={onToggleThemes}
          />
        )}
        {isCommentsSidebarOpen && (
          <CommentsSidebar
            comments={activeSlide?.comments || []}
            onAddComment={onAddComment}
            onClose={() => onToggleCommentsSidebar(false)}
            selectedElementId={props.selectedElementId}
            activeCommentThreadId={activeCommentThreadId}
            onSetActiveCommentThread={onSetActiveCommentThread}
            onResolveCommentThread={onResolveCommentThread}
            onDeleteCommentThread={onDeleteCommentThread}
          />
        )}
      </div>
      
      <StatusBar
        zoom={zoom}
        onZoomChange={setZoom}
        onStartSlideshow={onStartSlideshow}
        isNotesOpen={isNotesOpen}
        onToggleNotes={() => setIsNotesOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onAddNewSlide={() => props.onAddSlide(activeSlideId)}
        onChangeLayout={(layout) => props.onChangeLayout(activeSlideId, layout)}
        onSearch={() => props.onToggleSearch(true)}
        onDownload={onDownload}
      />
      {isSearchModalOpen && (
        <SearchModal 
          presentation={presentation}
          activeSlideId={activeSlideId}
          onClose={() => props.onToggleSearch(false)}
          onSelectSlide={onSelectSlide}
          onUpdateElement={onUpdateElement}
          onReplaceAll={props.onReplaceAll}
        />
      )}
      {elementMenuState && (
        <ElementContextMenu 
          x={elementMenuState.x}
          y={elementMenuState.y}
          element={elementMenuState.element}
          onClose={() => setElementMenuState(null)}
          onCut={() => props.onCutElement(elementMenuState.element.id)}
          onCopy={() => props.onCopyElement(elementMenuState.element.id)}
          onDelete={() => onDeleteElement(elementMenuState.element.id)}
          onAddRow={elementMenuState.element.type === 'table' ? () => props.onAddTableRow(elementMenuState.element.id) : undefined}
          onAddColumn={elementMenuState.element.type === 'table' ? () => props.onAddTableColumn(elementMenuState.element.id) : undefined}
        />
      )}
    </div>
  );
};

export default Editor;
export { HelpModal };
