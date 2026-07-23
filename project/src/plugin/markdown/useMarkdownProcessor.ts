import { useState, useEffect } from 'react';
import { marked } from 'marked';

declare global {
    interface Window {
        MathJax: any;
    }
}

export const useMarkdownProcessor = (markdown: string): string => {
    const [html, setHtml] = useState('');

    useEffect(() => {
        if (markdown === null || markdown === undefined) {
            setHtml('');
            return;
        }
        // Using `marked.parse` which is the recommended method in newer versions
        const parsedHtml = marked.parse(markdown, { gfm: true, breaks: true, async: false }) as string;
        setHtml(parsedHtml);
    }, [markdown]);

    useEffect(() => {
        if (html && window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise();
        }
    }, [html]);

    return html;
};
