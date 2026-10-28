/**
 * Native GFM Callouts / Admonitions & Chinese Emphasis Auto-Repair Remark Plugin
 * 
 * Supports:
 * - > [!NOTE] [Title]
 * - > [!TIP] [Title]
 * - > [!IMPORTANT] [Title]
 * - > [!WARNING] [Title]
 * - > [!CAUTION] [Title]
 * 
 * And auto-recovers unparsed Chinese emphasis delimiters like **“关键词”**
 */

const ICONS = {
  note: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  tip: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"></path></svg>`,
  important: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  caution: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
};

const DEFAULT_TITLES = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

function fixChineseEmphasis(text) {
  if (!text || typeof text !== 'string') return null;
  const regex = /\*\*([“"'])(.+?)\*\*/g;
  let lastIndex = 0;
  const nodes = [];
  let match;
  let hasMatch = false;

  while ((match = regex.exec(text)) !== null) {
    hasMatch = true;
    if (match.index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const openQuote = match[1];
    let content = match[2];

    if (content.endsWith('”') || content.endsWith('"') || content.endsWith("'")) {
      const closeQuote = content.slice(-1);
      const inner = content.slice(0, -1);
      nodes.push({ type: 'text', value: openQuote });
      nodes.push({
        type: 'strong',
        children: [{ type: 'text', value: inner }]
      });
      nodes.push({ type: 'text', value: closeQuote });
    } else if (content.includes('”') || content.includes('"') || content.includes("'")) {
      const qChar = content.includes('”') ? '”' : (content.includes('"') ? '"' : "'");
      const parts = content.split(qChar);
      const quotedPart = parts[0];
      const remainingPart = parts.slice(1).join(qChar);

      nodes.push({ type: 'text', value: openQuote });
      nodes.push({
        type: 'strong',
        children: [{ type: 'text', value: quotedPart }]
      });
      nodes.push({ type: 'text', value: qChar });
      nodes.push({
        type: 'strong',
        children: [{ type: 'text', value: remainingPart }]
      });
    } else {
      nodes.push({ type: 'text', value: openQuote });
      nodes.push({
        type: 'strong',
        children: [{ type: 'text', value: content }]
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return hasMatch ? nodes : null;
}

export default function remarkCallouts() {
  return (tree) => {
    function walk(node) {
      if (!node || typeof node !== 'object') return;

      // 1. Callout alert detection on blockquotes
      if (node.type === 'blockquote' && Array.isArray(node.children) && node.children.length > 0) {
        const firstParagraph = node.children[0];
        if (firstParagraph && firstParagraph.type === 'paragraph' && Array.isArray(firstParagraph.children) && firstParagraph.children.length > 0) {
          const firstText = firstParagraph.children[0];
          if (firstText && firstText.type === 'text') {
            const match = firstText.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]([^\n]*)?(?:\n([\s\S]*))?/i);
            if (match) {
              const alertType = match[1].toLowerCase();
              const customTitle = (match[2] || '').trim();
              const restOfText = match[3] !== undefined ? match[3] : '';

              if (restOfText.length > 0) {
                firstText.value = restOfText;
              } else {
                firstParagraph.children.shift();
                if (firstParagraph.children.length === 0) {
                  node.children.shift();
                }
              }

              // Transform blockquote to styled div container
              node.data = node.data || {};
              node.data.hName = 'div';
              node.data.hProperties = {
                className: `callout callout-${alertType}`,
                'data-callout': alertType,
              };

              const titleText = customTitle || DEFAULT_TITLES[alertType] || alertType.toUpperCase();
              const iconSvg = ICONS[alertType] || ICONS.note;

              const headerNode = {
                type: 'paragraph',
                data: {
                  hName: 'div',
                  hProperties: {
                    className: `callout-header callout-title-${alertType}`,
                  },
                },
                children: [
                  {
                    type: 'html',
                    value: `<span class="callout-icon">${iconSvg}</span>`,
                  },
                  {
                    type: 'strong',
                    children: [{ type: 'text', value: titleText }],
                  },
                ],
              };

              node.children.unshift(headerNode);
            }
          }
        }
      }

      // 2. Chinese emphasis auto-repair on children
      if (Array.isArray(node.children)) {
        const newChildren = [];
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child && child.type === 'text') {
            const repaired = fixChineseEmphasis(child.value);
            if (repaired) {
              newChildren.push(...repaired);
              continue;
            }
          }
          newChildren.push(child);
          walk(child);
        }
        node.children = newChildren;
      }
    }

    walk(tree);
  };
}
