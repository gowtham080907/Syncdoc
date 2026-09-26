import React from 'react';
import { ListBlock, ListBlockProps } from './ListBlock';

export const BulletListBlock: React.FC<ListBlockProps> = (props) => {
  return <ListBlock {...props} />;
};
