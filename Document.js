const mongoose = require('mongoose');
const Y = require('yjs');

const nodeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['paragraph', 'heading', 'codeBlock', 'list'],
      required: true,
    },
    text: {
      type: String,
      default: '',
    },
    level: {
      type: Number,
    },
    language: {
      type: String,
    },
  },
  { _id: false }
);

// Enable recursive sub-documents
nodeSchema.add({
  children: [nodeSchema],
});

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: 'Untitled Document',
      trim: true,
    },
    root: {
      children: {
        type: [nodeSchema],
        default: () => [{ type: 'paragraph', text: '' }],
      },
    },
    yjsState: {
      type: Buffer,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Recursive AST Node Validator
function validateASTNode(node, path = 'root') {
  if (!node || typeof node !== 'object') {
    throw new Error(`Invalid node structure at ${path}`);
  }

  const validTypes = ['paragraph', 'heading', 'codeBlock', 'list'];
  if (!node.type || !validTypes.includes(node.type)) {
    throw new Error(`Invalid node type '${node.type}' at ${path}. Allowed types: ${validTypes.join(', ')}`);
  }

  if (node.type === 'heading') {
    const lvl = Number(node.level);
    if (!Number.isInteger(lvl) || lvl < 1 || lvl > 6) {
      throw new Error(`Heading node at ${path} must have a level between 1 and 6 (got ${node.level})`);
    }
  }

  if (node.type === 'codeBlock') {
    if (typeof node.language !== 'string' || !node.language.trim()) {
      throw new Error(`codeBlock node at ${path} must have a non-empty language string`);
    }
  }

  if (node.type === 'paragraph' || node.type === 'list') {
    if (node.text === undefined || node.text === null) {
      throw new Error(`${node.type} node at ${path} must have a defined text property`);
    }
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child, index) => {
      validateASTNode(child, `${path}.children[${index}]`);
    });
  }
}

// Pre-save validation hook
documentSchema.pre('save', function (next) {
  try {
    if (!this.root || !Array.isArray(this.root.children)) {
      this.root = { children: [{ type: 'paragraph', text: '' }] };
    }
    this.root.children.forEach((node, index) => {
      validateASTNode(node, `root.children[${index}]`);
    });
    next();
  } catch (err) {
    next(err);
  }
});

// Utility function to flatten AST tree to plain text preview
function flattenTreeToPlainText(root) {
  if (!root || !Array.isArray(root.children)) return '';
  const textParts = [];

  function collectText(node) {
    if (node.text && typeof node.text === 'string' && node.text.trim()) {
      textParts.push(node.text.trim());
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(collectText);
    }
  }

  root.children.forEach(collectText);
  return textParts.join(' ');
}

// Convert Mongoose AST root object into Y.Doc structure
function astToYDoc(root, ydoc) {
  const yArray = ydoc.getArray('blocks');
  yArray.delete(0, yArray.length);

  function convertNodes(nodes, targetYArray) {
    nodes.forEach((node) => {
      const yMap = new Y.Map();
      yMap.set('type', node.type || 'paragraph');
      yMap.set('text', node.text || '');
      if (node.level !== undefined && node.level !== null) yMap.set('level', Number(node.level));
      if (node.language !== undefined && node.language !== null) yMap.set('language', node.language);

      if (Array.isArray(node.children) && node.children.length > 0) {
        const childYArray = new Y.Array();
        convertNodes(node.children, childYArray);
        yMap.set('children', childYArray);
      }
      targetYArray.push([yMap]);
    });
  }

  if (root && Array.isArray(root.children)) {
    convertNodes(root.children, yArray);
  }
}

// Convert Y.Doc structure back into Mongoose AST root object
function yDocToAST(ydoc) {
  const yArray = ydoc.getArray('blocks');
  const rawArray = yArray.toJSON();

  function convertRawNode(item) {
    if (!item || typeof item !== 'object') {
      return { type: 'paragraph', text: String(item || '') };
    }
    const node = {
      type: item.type || 'paragraph',
      text: item.text || '',
    };
    if (item.level !== undefined && item.level !== null) node.level = Number(item.level);
    if (item.language !== undefined && item.language !== null) node.language = String(item.language);

    if (Array.isArray(item.children)) {
      node.children = item.children.map(convertRawNode);
    } else {
      node.children = [];
    }
    return node;
  }

  const children = rawArray.map(convertRawNode);
  return { children };
}

const Document = mongoose.model('Document', documentSchema);

module.exports = {
  Document,
  flattenTreeToPlainText,
  validateASTNode,
  astToYDoc,
  yDocToAST,
};
