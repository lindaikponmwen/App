//src/plugin/pptx/Icon.ts
import React from 'react';

interface IconProps {
  type: 'plus' | 'download' | 'slideshow' | 'notes' | 'minus' | 'newSlide' | 'layout' | 'search' | 'chevron-down' | 'text-b' | 'text-i' | 'text-u' | 'text-color' | 'shape' | 'shape-rect' | 'shape-oval' | 'shape-tri' | 'text-box' | 'chevron-left' | 'chevron-right' | 'undo' | 'redo' | 'image' | 'move' | 'text-highlight' | 'font-family' | 'strikethrough' | 'align-left' | 'align-center' | 'align-right' | 'align-justify' | 'list-bullet' | 'list-number' | 'bring-forward' | 'send-backward' | 'bring-to-front' | 'send-to-back' | 'table' | 'themes' | 'close' | 'cut' | 'copy' | 'delete' | 'paste' | 'comment' | 'reply' | 'check' | 'help' | 'symbols' | 'panel-left-close' | 'panel-left-open' | 'save';
  className?: string;
}

const ICONS = {
  plus: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" })
  ),
  download: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" })
  ),
  slideshow: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-1.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" })
  ),
  notes: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" })
  ),
  minus: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.5 12h-15" })
  ),
  newSlide: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" })
  ),
  layout: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" })
  ),
  search: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" })
  ),
  'chevron-down': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m19.5 8.25-7.5 7.5-7.5-7.5" })
  ),
  'chevron-left': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 19.5L8.25 12l7.5-7.5" })
  ),
  'chevron-right': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.25 4.5l7.5 7.5-7.5 7.5" })
  ),
  'text-b': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" })
  ),
  'text-i': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" })
  ),
  'text-u': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" })
  ),
  'text-color': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M11 3L5.5 17h2.25l1.12-3h6.25l1.12 3h2.25L13 3h-2zm-1.38 9L12 5.67 14.38 12H9.62z" }),
    React.createElement('path', { d: "M3 19c0-.55.45-1 1-1h16c.55 0 1 .45 1 1s-.45 1-1 1H4c-.55 0-1-.45-1-1z" })
  ),
  shape: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M22 14.75h-5.5V9.25H22v5.5zM14.75 9.25V16.5a1.75 1.75 0 0 1-1.75 1.75h-7.5A1.75 1.75 0 0 1 3.75 16.5V9.25c0-.966.784-1.75 1.75-1.75h7.5c.966 0 1.75.784 1.75 1.75zm-1.75-5.5a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5z" })
  ),
  'shape-rect': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor" },
    React.createElement('rect', { x: "4", y: "6", width: "16", height: "12", rx: "1" })
  ),
  'shape-oval': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor" },
    React.createElement('ellipse', { cx: "12", cy: "12", rx: "8", ry: "6" })
  ),
  'shape-tri': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor" },
    React.createElement('path', { d: "M12 4 L4 20 H20 Z" })
  ),
  'text-box': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5 },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 6A2.25 2.25 0 0 1 6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6Z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.25 9.75h7.5M12 9.75v8.25" })
  ),
  undo: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" })
  ),
  redo: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" })
  ),
  image: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" })
  ),
  move: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 19.5v-15m0 0l-3.75 3.75M12 4.5l3.75 3.75M19.5 12h-15m0 0l3.75-3.75M4.5 12l3.75 3.75" })
  ),
  'text-highlight': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "m16.88 3.12-1.76 1.77 2.75 2.75 1.77-1.76c.39-.39.39-1.02 0-1.41l-1.34-1.34c-.39-.39-1.02-.39-1.42 0zM13 6.01 4.01 15H4v3h3v-1.01l8.99-9zm-2 9h-2v2h2v-2z" })
  ),
  'font-family': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M10.25 5.5h-4.5L3.5 18.5h2.125l.875-3.5h3.25l.875 3.5h2.125L10.25 5.5zm-2.625 8.25L9 8.375 10.375 13.75h-2.75zm8.125-5.625c0-1.031.844-1.875 1.875-1.875s1.875.844 1.875 1.875-1.078 2.047-1.875 2.047c-.797 0-1.875-.797-1.875-2.047zM20 18.5h-2v-7.25l-2.25 1V10.5l4-1.75v9.75z" })
  ),
  'strikethrough': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M2 11.5v1h20v-1z M12.5 4h-1v3.259c-1.339.299-2.5 1-2.5 2.241 0 .801.444 1.5 1.5 1.5.826 0 1.5-.699 1.5-1.5 0-.482-.249-1-1-1.259V7h1v2h2V7h1V4h-1V2h-2v2zm-1.5 4c0-.276.673-1 1.5-1s1.5.724 1.5 1c0 .552-1.119 1-1.5 1s-1.5-.448-1.5-1zM4 5v3h2.64C7.403 6.471 9.043 5.5 10.5 5.5V4H4zm16 11v3h-2.64c-1.157 1.529-2.797 2.5-4.36 2.5v1.5h7v-3h-1V9h-2v7z M12.5 17c-1.381 0-2.5 1.119-2.5 2.5 0 .801.444 1.5 1.5 1.5.826 0 1.5-.699 1.5-1.5 0-1.026-.822-1.821-1.5-2.259V17h1zm0 2c-.276 0-.5.224-.5.5s.224.5.5.5.5-.224.5-.5-.224-.5-.5-.5z" })
  ),
  'align-left': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" })
  ),
  'align-center': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" })
  ),
  'align-right': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" })
  ),
  'align-justify': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" })
  ),
  'list-bullet': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M7 5h14v2H7z M7 11h14v2H7z M7 17h14v2H7z M4 6a2 2 0 1 0 0-2 2 2 0 0 0 0 2z m0 6a2 2 0 1 0 0-2 2 2 0 0 0 0 2z m0 6a2 2 0 1 0 0-2 2 2 0 0 0 0 2z" })
  ),
  'list-number': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement('path', { d: "M7 5h14v2H7z M7 11h14v2H7z M7 17h14v2H7z M2 16h1v-6H2V8h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2v-2zm0-12v-2h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H2V4z" })
  ),
  'bring-forward': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { d: "M3 15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8z" }),
    React.createElement('path', { d: "M21 9h-2a2 2 0 0 0-2 2v8a2 2 0 0 1-2 2H7" })
  ),
  'send-backward': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { d: "M15 17h2a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2" }),
    React.createElement('path', { d: "M3 15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8z" })
  ),
  'bring-to-front': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M2 12C2 7.02944 6.02944 3 11 3C15.9706 3 20 7.02944 20 12C20 16.9706 15.9706 21 11 21C6.02944 21 2 16.9706 2 12Z" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.5 16.5H19.5C20.8807 16.5 22 15.3807 22 14V6C22 4.61929 20.8807 3.5 19.5 3.5H11.5" })
  ),
  'send-to-back': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M13.5 7.5H4.5C3.11929 7.5 2 8.61929 2 10V18C2 19.3807 3.11929 20.5 4.5 20.5H12.5C13.8807 20.5 15 19.3807 15 18V12" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M22 12C22 7.02944 17.9706 3 13 3C8.02944 3 4 7.02944 4 12" })
  ),
  table: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25v13.5A2.25 2.25 0 0 1 18.75 21H5.25A2.25 2.25 0 0 1 3 18.75V5.25zM9 3v18M3 10.5h18" })
  ),
  themes: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.402-6.402a3.75 3.75 0 0 0-5.304-5.304L4.098 14.6z M19.902 4.098a3.75 3.75 0 0 0-5.304 0l-1.5 1.5" })
  ),
  close: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" })
  ),
  cut: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M9 12l6-6M9 6l6 6" })
  ),
  copy: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.75 3.75H18a2.25 2.25 0 0 1 2.25 2.25v11.25a2.25 2.25 0 0 1-2.25 2.25h-9.75a2.25 2.25 0 0 1-2.25-2.25V6c0-1.242 1.008-2.25 2.25-2.25h.375" })
  ),
  paste: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.082A48.424 48.424 0 0 0 12 3.75c-2.392 0-4.744.175-7.043.513C3.845 4.21 3 5.145 3 6.274v11.452c0 1.135.845 2.098 1.976 2.192l.173.015a48.417 48.417 0 0 0 5.869.513c2.392 0 4.744-.175 7.043-.513" }),
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12.75 3.75h3.375a2.25 2.25 0 0 1 2.25 2.25v3.375" })
  ),
  delete: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" })
  ),
  comment: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.53-.405m-1.09-3.924c-.317.312-.652.593-1.01.834-3.218 2.28-8.287 2.28-11.505 0A9.76 9.76 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" })
  ),
  reply: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 15 3 9m0 0 6-6M3 9h.01" })
  ),
  check: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 12.75l6 6 9-13.5" })
  ),
  help: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 5.25h.008v.008H12v-.008z" })
  ),
  symbols: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
  ),
  'panel-left-close': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
  ),
  'panel-left-open': React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
  ),
  save: React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
  ),
};

export const Icon: React.FC<IconProps> = ({ type, className }) => {
  const iconElement = ICONS[type];
  if (!iconElement) return null;
  return React.cloneElement(iconElement, { className });
};