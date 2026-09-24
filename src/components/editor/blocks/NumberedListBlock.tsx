import React from 'react';
import { ListBlock, ListBlockProps } from './ListBlock';

export const NumberedListBlock: React.FC<ListBlockProps> = (props) => {
  return <ListBlock {...props} />;
};
