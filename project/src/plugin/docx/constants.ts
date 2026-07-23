import { 
    Printer, Undo, Redo, Paintbrush, Bold, Italic, Underline, Palette, Highlighter,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, PanelLeft,
    RectangleHorizontal, Search, Strikethrough, Superscript, Subscript, RemoveFormatting,
    MessageSquarePlus, Image, Sigma, Pilcrow
} from 'lucide-react';
import type { ToolbarItem } from './types';

export const FONT_FAMILIES = [
  'Arial', 'Calibri', 'Comic Sans MS', 'Courier New', 'Georgia', 'Helvetica', 
  'Impact', 'Lucida Console', 'Tahoma', 'Times New Roman', 'Verdana',
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];

export const SYMBOLS = [
  '±', '×', '÷', '√', '∞', '≈', '≠', '≤', '≥', '∫', '∑', '∂', '∇', '∆', '∏', '∈', '∉', '∋', 
  '⊂', '⊃', '⊆', '⊇', '∧', '∨', '∩', '∪', '∴', '∵', 'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 
  'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω',
  'Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 
  'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω', '←', '→', '↑', '↓', '↔', '↵', '⇐', '⇒', '⇑', '⇓', 
  '⇔', '∀', '∃', '¬', '∅', '°', '‰', 'ħ', 'ı', 'ȷ', '℘', 'ℜ', 'ℑ', 'ℓ', '©', '®', '™',
];

export const TOOLBAR_CONFIG: ToolbarItem[] = [
    { type: 'button', action: 'undo', icon: Undo, tooltip: 'Undo' }, { type: 'button', action: 'redo', icon: Redo, tooltip: 'Redo' },
    { type: 'button', action: 'print', icon: Printer, tooltip: 'Print' }, { type: 'separator' },
    { type: 'button', action: 'toggleOutline', icon: PanelLeft, tooltip: 'Document Outline' },
    { type: 'button', action: 'toggleOrientation', icon: RectangleHorizontal, tooltip: 'Change Orientation' }, { type: 'separator' },
    { type: 'button', action: 'findAndReplace', icon: Search, tooltip: 'Find and Replace' }, { type: 'separator' },
    { type: 'button', action: 'formatPainter', icon: Paintbrush, tooltip: 'Format Painter' }, { type: 'separator' },
    { type: 'font-family-dropdown', action: 'fontName' }, { type: 'font-size-dropdown', action: 'fontSize' },
    { type: 'heading-dropdown', action: 'formatBlock' }, { type: 'separator' },
    { type: 'button', action: 'bold', icon: Bold, tooltip: 'Bold' }, { type: 'button', action: 'italic', icon: Italic, tooltip: 'Italic' },
    { type: 'button', action: 'underline', icon: Underline, tooltip: 'Underline' }, { type: 'button', action: 'strikethrough', icon: Strikethrough, tooltip: 'Strikethrough' },
    { type: 'button', action: 'superscript', icon: Superscript, tooltip: 'Superscript' }, { type: 'button', action: 'subscript', icon: Subscript, tooltip: 'Subscript' },
    { type: 'color-picker', action: 'foreColor', icon: Palette, tooltip: 'Text Color' }, { type: 'color-picker', action: 'backColor', icon: Highlighter, tooltip: 'Highlight Color' },
    { type: 'button', action: 'removeFormat', icon: RemoveFormatting, tooltip: 'Clear Formatting' }, { type: 'separator' },
    { type: 'button', action: 'addComment', icon: MessageSquarePlus, tooltip: 'Add Comment' }, { type: 'button', action: 'insertImage', icon: Image, tooltip: 'Insert Image' },
    { type: 'symbols-dropdown', action: 'insertText', icon: Sigma, tooltip: 'Insert Symbol' }, { type: 'separator' },
    { type: 'button', action: 'justifyLeft', icon: AlignLeft, tooltip: 'Align Left' }, { type: 'button', action: 'justifyCenter', icon: AlignCenter, tooltip: 'Align Center' },
    { type: 'button', action: 'justifyRight', icon: AlignRight, tooltip: 'Align Right' }, { type: 'button', action: 'justifyFull', icon: AlignJustify, tooltip: 'Justify' },
    { type: 'paragraph-dropdown', action: 'paragraph', icon: Pilcrow, tooltip: 'Paragraph Settings' }, { type: 'separator' },
    { type: 'button', action: 'insertUnorderedList', icon: List, tooltip: 'Bulleted List' }, { type: 'button', action: 'insertOrderedList', icon: ListOrdered, tooltip: 'Numbered List' },
];

export const SAMPLE_DOCUMENT_CONTENT: string[] = [
    `Analysis Report....`
];