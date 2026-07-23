//src/plugin/pptx/slideTemplates.ts
import React from 'react';
import { Slide, SlideElement, Theme } from './types';

const createTextElement = (
  content: string,
  position: { top: string, left: string },
  size: { width: string, height: string },
  style: React.CSSProperties,
  theme: Theme
): SlideElement => ({
    id: `elem-${crypto.randomUUID()}`,
    type: 'text',
    content,
    position,
    size,
    style: { ...style, fontFamily: theme.fontFamily }
});

const getLayouts = (theme: Theme) => ({
    title: [
        createTextElement('Click to Add Title', { top: '20%', left: '10%' }, { width: '80%', height: 'auto' }, { fontSize: '48px', fontWeight: 'bold', textAlign: 'center', color: theme.colors.primary }, theme),
        createTextElement('Click to add subtitle', { top: '45%', left: '10%' }, { width: '80%', height: 'auto' }, { fontSize: '28px', textAlign: 'center', color: theme.colors.secondary }, theme),
    ],
    title_and_content: [
        createTextElement('Click to Add Title', { top: '5%', left: '5%' }, { width: '90%', height: 'auto' }, { fontSize: '36px', fontWeight: 'bold', color: theme.colors.primary }, theme),
        createTextElement('Click to add text', { top: '25%', left: '5%' }, { width: '90%', height: '65%' }, { fontSize: '18px', color: theme.colors.secondary }, theme),
    ],
    blank: []
});


export const createNewSlide = (layout: 'title' | 'title_and_content' | 'blank' = 'title_and_content', theme: Theme): Slide => {
    const layouts = getLayouts(theme);
    return {
        id: `slide-${crypto.randomUUID()}`,
        elements: layouts[layout].map(el => ({ ...el, id: `elem-${crypto.randomUUID()}`})),
        notes: '',
        background: theme.background,
        comments: [],
    };
};

export const duplicateSlide = (slide: Slide): Slide => {
    return {
        ...slide,
        id: `slide-${crypto.randomUUID()}`,
        elements: slide.elements.map(el => ({ ...el, id: `elem-${crypto.randomUUID()}`})),
    }
};

export const applySlideLayout = (slide: Slide, layout: 'title' | 'title_and_content' | 'blank', theme: Theme): Slide => {
    const layouts = getLayouts(theme);
    return {
        ...slide,
        elements: layouts[layout].map(el => ({...el, id: `elem-${crypto.randomUUID()}`}))
    }
};
