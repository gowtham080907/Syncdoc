import { ASTNode, ASTDocument } from '../types/ast';
import { DocumentBlock } from '../types/block';

export const astNodeToBlock = (node: ASTNode, order: number): DocumentBlock => {
  return {
    id: node.id,
    type: node.type,
    content: node.content,
    order,
    metadata: {
      language: node.language,
      ...(node.metadata || {}),
    },
    children: node.children ? node.children.map((child, idx) => astNodeToBlock(child, idx)) : undefined,
  };
};

export const blockToASTNode = (block: DocumentBlock): ASTNode => {
  return {
    id: block.id,
    type: block.type,
    content: block.content,
    language: block.metadata?.language,
    metadata: block.metadata,
    children: block.children ? block.children.map(blockToASTNode) : undefined,
  };
};

export const convertASTDocToBlocks = (astDoc: ASTDocument): DocumentBlock[] => {
  return astDoc.root.map((node, index) => astNodeToBlock(node, index));
};

export const convertBlocksToASTDoc = (blocks: DocumentBlock[], version = 1): ASTDocument => {
  return {
    version,
    root: blocks.map(blockToASTNode),
  };
};
