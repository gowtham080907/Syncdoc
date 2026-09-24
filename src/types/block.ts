export type BlockType = 
  | 'heading'
  | 'paragraph'
  | 'code'
  | 'bullet-list'
  | 'numbered-list'
  | 'quote'
  | 'list'; // backward compatibility

export type HeadingLevel = 1 | 2 | 3;
export type ListType = 'bullet' | 'number';

export interface BlockMetadata {
  headingLevel?: HeadingLevel;
  language?: string;
  listType?: ListType;
  checked?: boolean;
  authorId?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  [key: string]: unknown;
}

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content: string;
  order: number;
  metadata?: BlockMetadata;
  children?: DocumentBlock[];
}

export type BlockVisualState = 
  | 'normal'
  | 'editing_me'
  | 'editing_remote'
  | 'recently_changed'
  | 'conflict_detected'
  | 'synchronized';

export interface BlockStateInfo {
  state: BlockVisualState;
  editingUser?: {
    id: string;
    name: string;
    color: string;
    avatar?: string;
  };
  conflictData?: {
    localContent: string;
    remoteContent: string;
    remoteAuthor: string;
    timestamp: string;
  };
}
