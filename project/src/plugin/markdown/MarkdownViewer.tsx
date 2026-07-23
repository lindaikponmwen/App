
import React from 'react';
import { useMarkdownProcessor } from './useMarkdownProcessor';
import DOMPurify from 'dompurify';

interface MarkdownViewerProps {
    content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
    const processedHtml = useMarkdownProcessor(content);
    const sanitizedHtml = DOMPurify.sanitize(processedHtml);

    return (
        <div className="markdown-body h-full p-8 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
        </div>
    );
};

export default MarkdownViewer;
