//src/plugin/pptx/pptxGenerator.ts
import PptxGenJS from 'pptxgenjs';
import type { Presentation, Comment, TableCellData } from './types';

// Helper to convert '48px' to 36
const pxToPt = (pxStr?: string): number | undefined => {
  if (!pxStr || typeof pxStr !== 'string' || !pxStr.endsWith('px')) return undefined;
  return Math.round(parseFloat(pxStr) * 0.75);
};

// Helper to convert '#1E293B' to '1E293B'
const formatColor = (color?: string): string | undefined => {
    if (!color || typeof color !== 'string') return undefined;
    return color.replace('#', '');
};

const formatComments = (comments: Comment[]): string => {
  const threads: { [key: string]: Comment[] } = {};
  const rootComments: Comment[] = [];

  // Group comments by thread
  comments.forEach(comment => {
    if (comment.parentId) {
      if (!threads[comment.parentId]) {
        threads[comment.parentId] = [];
      }
      threads[comment.parentId].push(comment);
    } else {
      rootComments.push(comment);
    }
  });

  // Sort replies by creation date
  Object.values(threads).forEach(replies => replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  
  // Sort root comments by creation date
  rootComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const formatSingleComment = (comment: Comment, indent = '') => {
    const date = new Date(comment.createdAt).toLocaleString();
    const author = comment.author || 'User';
    const resolvedStatus = comment.resolved ? ' (Resolved)' : '';
    return `${indent}[${author} at ${date}]${resolvedStatus}: ${comment.text}`;
  };

  let formattedString = '';
  rootComments.forEach(root => {
    if (formattedString) formattedString += '\n---\n';
    formattedString += formatSingleComment(root) + '\n';
    const replies = threads[root.id] || [];
    replies.forEach(reply => {
      formattedString += formatSingleComment(reply, '  -> ') + '\n';
    });
  });

  return formattedString;
};

function htmlToPptxTextProps(html: string, baseOptions: PptxGenJS.TextPropsOptions): PptxGenJS.TextProps[] {
    const parts: PptxGenJS.TextProps[] = [];
    if (!html) return parts;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html.replace(/\n/g, '<br>');

    function processNode(node: Node, options: PptxGenJS.TextPropsOptions) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent) {
                parts.push({ text: node.textContent, options });
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const newOptions = { ...options };
            const tagName = el.tagName.toLowerCase();

            switch (tagName) {
                case 'b': case 'strong': newOptions.bold = true; break;
                case 'i': case 'em': newOptions.italic = true; break;
                case 'u': newOptions.underline = true; break;
                case 'span':
                    if (el.style.color) newOptions.color = formatColor(el.style.color);
                    if (el.style.backgroundColor) newOptions.highlight = formatColor(el.style.backgroundColor);
                    break;
            }
            
            if (tagName === 'br') {
                parts.push({ text: '\n', options: baseOptions });
            }

            el.childNodes.forEach(child => processNode(child, newOptions));
        }
    }

    tempDiv.childNodes.forEach(child => processNode(child, baseOptions));
    return parts;
}

// Main function to generate and download the presentation
export async function downloadPresentation(presentation: Presentation): Promise<void> {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';

  for (const slideData of presentation.slides) {
    const slide = pres.addSlide();

    // Combine speaker notes and comments to be exported in the notes section
    let combinedNotes = slideData.notes || '';
    if (slideData.comments && slideData.comments.length > 0) {
      const commentsHeader = '\n\n---\nCOMMENTS\n';
      const formattedComments = formatComments(slideData.comments);
      
      if (combinedNotes.trim()) {
        combinedNotes += commentsHeader + formattedComments;
      } else {
        combinedNotes = 'COMMENTS\n' + formattedComments;
      }
    }

    if (combinedNotes) {
      slide.addNotes(combinedNotes);
    }
    
    if (slideData.background?.color) {
        slide.background = { color: formatColor(slideData.background.color) };
    }
    // Note: PptxGenJS does not directly support CSS gradients.
    // As a fallback, we could parse the gradient and use the first color.
    else if (slideData.background?.gradient) {
        const firstColor = slideData.background.gradient.match(/#[0-9a-fA-F]{6}/);
        if (firstColor) {
            slide.background = { color: formatColor(firstColor[0]) };
        }
    } else if (slideData.background?.image) {
        slide.background = { path: slideData.background.image };
    }

    const sortedElements = [...slideData.elements].sort((a, b) => {
        const zIndexA = typeof a.style?.zIndex === 'number' ? a.style.zIndex : 0;
        const zIndexB = typeof b.style?.zIndex === 'number' ? b.style.zIndex : 0;
        return zIndexA - zIndexB;
    });

    for (const element of sortedElements) {
        const options: any = {
            x: element.position.left,
            y: element.position.top,
            w: element.size.width,
            h: element.size.height,
        };

        switch (element.type) {
            case 'text': {
                const style = element.style || {};
                const textOptions: PptxGenJS.TextPropsOptions = {
                    ...options,
                    fontSize: pxToPt(style.fontSize as string),
                    color: formatColor(style.color as string),
                    bold: style.fontWeight === 'bold',
                    italic: style.fontStyle === 'italic',
                    underline: typeof style.textDecoration === 'string' && style.textDecoration.includes('underline'),
                    strike: typeof style.textDecoration === 'string' && style.textDecoration.includes('line-through'),
                    align: (style.textAlign as 'left' | 'center' | 'right' | 'justify') || 'left',
                    fontFace: style.fontFamily as string,
                    lineSpacing: style.lineHeight ? parseFloat(String(style.lineHeight)) * (pxToPt(style.fontSize as string) || 12) : undefined
                };
                if (style.backgroundColor) {
                    textOptions.fill = { color: formatColor(style.backgroundColor as string) };
                }
                
                const content = element.content;
                const bulletRegex = /^\s*•\s+/;
                const numberRegex = /^\s*\d+\.\s+/;

                const lines = content.split('\n');
                const finalRichText: PptxGenJS.TextProps[] = [];
                
                lines.forEach((line, idx) => {
                    const isBullet = bulletRegex.test(line);
                    const isNumber = numberRegex.test(line);
                    const cleanLine = line.replace(bulletRegex, '').replace(numberRegex, '');
                    
                    const richLine = htmlToPptxTextProps(cleanLine, textOptions);
                    
                    if (richLine.length > 0) {
                        const firstPartOptions = {...richLine[0].options};
                         if (isBullet) firstPartOptions.bullet = true;
                         if (isNumber) firstPartOptions.bullet = { type: 'number' };
                        richLine[0].options = firstPartOptions;

                        finalRichText.push(...richLine);
                    } else if (line === '' && idx < lines.length - 1) { // Handle empty lines between list items
                        finalRichText.push({ text: '\n', options: textOptions });
                    }
                    
                    if (idx < lines.length - 1 && richLine.length > 0) {
                         finalRichText.push({ text: '\n', options: textOptions });
                    }
                });

                if (finalRichText.length > 0) {
                    slide.addText(finalRichText, options);
                } else if (content) { 
                    slide.addText(content, {...options, ...textOptions});
                }
                break;
            }
            case 'image': {
                if (element.content.startsWith('http')) {
                    try {
                        // Fetch the image and convert it to base64 to handle potential CORS issues.
                        const response = await fetch(element.content);
                        if (!response.ok) {
                            throw new Error(`Network response was not ok for ${element.content}`);
                        }
                        const blob = await response.blob();
                        const base64Image = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                        slide.addImage({ ...options, path: base64Image });
                    } catch (error) {
                        console.error(`Failed to load image from URL: ${element.content}. This might be a CORS issue. A placeholder will be used.`, error);
                        // Add a placeholder shape with an error message to avoid crashing the download.
                        slide.addShape('rect' as PptxGenJS.ShapeType, {
                            ...options,
                            fill: { color: 'F1F5F9' }, // Light gray
                            line: { color: 'CBD5E1', width: 1 },
                        });
                        slide.addText('Image could not be loaded.', {
                            ...options,
                            align: 'center',
                            valign: 'middle',
                            color: '64748B', // Medium gray
                            fontSize: 10,
                        });
                    }
                } else {
                    // Assumes content is already a data URL (base64)
                    slide.addImage({ ...options, path: element.content });
                }
                break;
            }
            case 'shape': {
                const style = element.style || {};
                let shapeType: any;

                switch (element.shapeType) {
                    case 'oval':
                        shapeType = pres.shapes.OVAL;
                        break;
                    case 'triangle':
                        shapeType = pres.shapes.ISOSCELES_TRIANGLE;
                        break;
                    case 'rectangle':
                    default:
                        shapeType = pres.shapes.RECTANGLE;
                        break;
                }

                slide.addShape(shapeType, {
                    ...options,
                    fill: { color: formatColor(style.backgroundColor as string) },
                });
                break;
            }
            case 'table': {
                const tableRows = element.tableData?.map(row => 
                    row.map(cell => {
                        const cellOptions: PptxGenJS.TextPropsOptions = {};
                        if (cell.style) {
                            if (cell.style.fontWeight === 'bold') cellOptions.bold = true;
                            if (cell.style.color) cellOptions.color = formatColor(cell.style.color as string);
                            if (cell.style.backgroundColor) cellOptions.fill = { color: formatColor(cell.style.backgroundColor as string) };
                            if (cell.style.textAlign) cellOptions.align = cell.style.textAlign as any;
                        }
                        return { text: cell.content, options: cellOptions };
                    })
                );

                if (tableRows) {
                    // PptxGenJS uses inches for row heights. A 16:9 slide is 10" x 5.625".
                    const SLIDE_HEIGHT_INCHES = 5.625;
                    const tableHeightInches = (parseFloat(element.size.height) / 100) * SLIDE_HEIGHT_INCHES;

                    const numRows = tableRows.length;
                    
                    const rowHeights = Array(numRows).fill(tableHeightInches / numRows);

                    const tableOptions: PptxGenJS.TableProps = {
                        ...options,
                        fill: { color: formatColor(element.style?.backgroundColor as string) || 'FFFFFF' },
                        border: { type: 'solid', pt: 1, color: '666666' },
                        align: 'center',
                        valign: 'middle',
                        rowH: rowHeights,
                    };
                    slide.addTable(tableRows, tableOptions);
                }
                break;
            }
        }
    }
  }

  await pres.writeFile({ fileName: presentation.title });
}
