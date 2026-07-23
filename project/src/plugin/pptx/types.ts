//src/plugin/pptx/types.ts
import type { CSSProperties } from 'react';

export type ShapeType = 'rectangle' | 'oval' | 'triangle';

export interface TableCellData {
  content: string;
  style?: CSSProperties;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'table';
  content: string;
  tableData?: TableCellData[][];
  position: {
    top: string;
    left: string;
  };
  size: {
    width: string;
    height: string;
  };
  style?: CSSProperties;
  shapeType?: ShapeType;
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string; // ISO 8601 format
  elementId?: string | null;
  parentId?: string | null;
  resolved: boolean;
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  notes?: string;
  background?: {
    color?: string;
    gradient?: string;
    image?: string;
  };
  comments?: Comment[];
}

export interface Presentation {
  id:string;
  title: string;
  slides: Slide[];
  themeId?: string;
}

export interface Theme {
  id: string;
  name: string;
  background: {
    color?: string;
    gradient?: string;
    image?: string;
  };
  fontFamily: string;
  colors: {
    primary: string; // For titles
    secondary: string; // For subtitles/body
    accent1: string; // For shapes
    accent2: string; // For other elements
    accent3: string; // For highlights
    accent4: string; // Extra color
  };
}
