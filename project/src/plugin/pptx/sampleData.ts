//src/plugin/pptx/sampleData.ts
import type { CSSProperties } from 'react';
import type { Presentation, TableCellData } from './types';

export const samplePresentation: Presentation = {
  id: 'pres-1',
  title: 'presentation.pptx',
  themeId: 'office',
  slides: [
    {
      id: 'slide-1',
      background: { gradient: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' },
      elements: [
        {
          id: 's1-elem-1',
          type: 'text',
          content: 'PK/PD Presentation',
          position: { top: '30%', left: '10%' },
          size: { width: '80%', height: 'auto' },
          style: { fontSize: '48px', fontWeight: 'bold', color: '#E0E0E0', fontFamily: '"Century Gothic", sans-serif', textAlign: 'center', zIndex: 2 },
        },
        
      ],
      notes: 'This title slide sets a modern, data-driven tone. The subtitle emphasizes the core purpose of pharmacometrics.',
    },
  ],
};
