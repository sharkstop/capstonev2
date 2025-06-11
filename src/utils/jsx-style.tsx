
import React from 'react';

export const StyleJSX: React.FC<{children: string}> = ({ children }) => {
  return (
    <style dangerouslySetInnerHTML={{ __html: children }} />
  );
};
