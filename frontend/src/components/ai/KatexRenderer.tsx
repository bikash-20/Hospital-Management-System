import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KatexRendererProps {
  content: string;
  isStreaming?: boolean;
}

interface ContentSegment {
  type: 'text' | 'inline-math' | 'display-math';
  value: string;
}

/**
 * Splits raw content into alternating text and math segments
 * Supports:
 * - Display math: $$...$$ and \[...\]
 * - Inline math: $...$ and \(...\)
 */
function parseMathSegments(rawText: string): ContentSegment[] {
  if (!rawText) return [];

  const segments: ContentSegment[] = [];

  // Match:
  // 1. $$ ... $$
  // 2. \[ ... \]
  // 3. \( ... \)
  // 4. $ ... $ (excluding escaped \$)
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$(?:\\\$|[^\n$])+\$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(rawText)) !== null) {
    const textBefore = rawText.substring(lastIndex, match.index);
    if (textBefore) {
      segments.push({ type: 'text', value: textBefore });
    }

    const matchedStr = match[0];

    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      segments.push({
        type: 'display-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      segments.push({
        type: 'display-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      segments.push({
        type: 'inline-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      segments.push({
        type: 'inline-math',
        value: matchedStr.slice(1, -1).trim(),
      });
    } else {
      segments.push({ type: 'text', value: matchedStr });
    }

    lastIndex = mathRegex.lastIndex;
  }

  const textAfter = rawText.substring(lastIndex);
  if (textAfter) {
    segments.push({ type: 'text', value: textAfter });
  }

  return segments;
}

/**
 * Safely render KaTeX math to HTML
 */
function renderKatex(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch (err) {
    console.warn('KaTeX render error:', err);
    return `<span class="katex-error text-amber-400 font-mono text-xs">${escapeHtml(tex)}</span>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Basic markdown formatting for text portions (bold, headers, bullets, line breaks)
 */
function formatMarkdownText(text: string): React.ReactNode[] {
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Section headers e.g. ### or ##
    const headerMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headerMatch) {
      return (
        <div key={lineIdx} className="font-bold text-surface-900 dark:text-white mt-2 mb-1 text-sm sm:text-base">
          {formatInlineBold(headerMatch[2])}
        </div>
      );
    }

    // Bullet points e.g. • or * or -
    const bulletMatch = line.match(/^(\s*[•*-]|\s*\d+\.)\s+(.*)$/);
    if (bulletMatch) {
      return (
        <div key={lineIdx} className="flex items-start gap-2 my-0.5 pl-1">
          <span className="text-primary-500 font-bold shrink-0">{bulletMatch[1].trim()}</span>
          <span className="text-surface-800 dark:text-surface-100 flex-1">
            {formatInlineBold(bulletMatch[2])}
          </span>
        </div>
      );
    }

    // Empty lines
    if (!line.trim()) {
      return <div key={lineIdx} className="h-2" />;
    }

    // Standard paragraph line
    return (
      <div key={lineIdx} className="my-0.5">
        {formatInlineBold(line)}
      </div>
    );
  });
}

function formatInlineBold(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-surface-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function KatexRenderer({ content, isStreaming }: KatexRendererProps) {
  const segments = useMemo(() => parseMathSegments(content), [content]);

  return (
    <div className="katex-message-container space-y-1 break-words">
      {segments.map((seg, idx) => {
        if (seg.type === 'display-math') {
          return (
            <div
              key={idx}
              className="my-3 overflow-x-auto py-2 px-3 rounded-xl bg-surface-100 dark:bg-[#0E1520] border border-surface-200 dark:border-white/5 text-center"
              dangerouslySetInnerHTML={{ __html: renderKatex(seg.value, true) }}
            />
          );
        }

        if (seg.type === 'inline-math') {
          return (
            <span
              key={idx}
              className="inline-block px-1 align-middle"
              dangerouslySetInnerHTML={{ __html: renderKatex(seg.value, false) }}
            />
          );
        }

        return <React.Fragment key={idx}>{formatMarkdownText(seg.value)}</React.Fragment>;
      })}

      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-primary-500 dark:bg-primary-400 rounded-xs animate-pulse align-middle" />
      )}
    </div>
  );
}
