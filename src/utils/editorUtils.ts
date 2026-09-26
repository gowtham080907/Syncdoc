/**
  * Editor utilities for cursor caret tracking and DOM selection math.
  */

export const getCaretCharacterOffsetWithin = (element: HTMLElement): number => {
  let caretOffset = 0;
  const doc = element.ownerDocument || document;
  const win = doc.defaultView || window;
  const sel = win.getSelection();

  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    caretOffset = preCaretRange.toString().length;
  }
  return caretOffset;
};

export const setCaretPosition = (element: HTMLElement, offset: number): void => {
  const doc = element.ownerDocument || document;
  const win = doc.defaultView || window;
  const sel = win.getSelection();
  if (!sel) return;

  const range = doc.createRange();
  let currentOffset = 0;
  let found = false;

  const traverseNodes = (node: Node) => {
    if (found) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      if (currentOffset + textLength >= offset) {
        range.setStart(node, Math.min(offset - currentOffset, textLength));
        range.collapse(true);
        found = true;
      } else {
        currentOffset += textLength;
      }
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverseNodes(node.childNodes[i]);
        if (found) break;
      }
    }
  };

  traverseNodes(element);

  if (found) {
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    // Default fallback to end of node content
    range.selectNodeContents(element);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }
};
