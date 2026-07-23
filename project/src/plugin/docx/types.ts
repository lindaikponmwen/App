import type { LucideIcon } from 'lucide-react';

export interface Command {
  name: string;
  action: string;
  icon: LucideIcon;
}

interface BaseToolbarItem {
  type: string;
}

export interface ToolbarButtonType extends BaseToolbarItem {
  type: 'button';
  action: string;
  icon: LucideIcon;
  tooltip: string;
}

export interface ToolbarSeparatorType extends BaseToolbarItem {
  type: 'separator';
}

export interface ToolbarFontFamilyDropdownType extends BaseToolbarItem {
  type: 'font-family-dropdown';
  action: string;
}

export interface ToolbarFontSizeDropdownType extends BaseToolbarItem {
  type: 'font-size-dropdown';
  action: string;
}

export interface ToolbarHeadingDropdownType extends BaseToolbarItem {
  type: 'heading-dropdown';
  action: string;
}

export interface ToolbarColorPickerType extends BaseToolbarItem {
  type: 'color-picker';
  action: string;
  icon: LucideIcon;
  tooltip: string;
}

export interface ToolbarSymbolsDropdownType extends BaseToolbarItem {
  type: 'symbols-dropdown';
  action: string;
  icon: LucideIcon;
  tooltip: string;
}

export interface ToolbarParagraphDropdownType extends BaseToolbarItem {
    type: 'paragraph-dropdown';
    action: string;
    icon: LucideIcon;
    tooltip: string;
}

export type ToolbarItem = 
  | ToolbarButtonType 
  | ToolbarSeparatorType 
  | ToolbarFontFamilyDropdownType
  | ToolbarFontSizeDropdownType
  | ToolbarHeadingDropdownType
  | ToolbarColorPickerType
  | ToolbarSymbolsDropdownType
  | ToolbarParagraphDropdownType;

export interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

export interface ReplyType {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface CommentType {
  id: string;
  pageIndex: number;
  author: string;
  text: string;
  timestamp: string;
  replies: ReplyType[];
  resolved: boolean;
}
