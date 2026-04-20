// Type declaration for react-syntax-highlighter
declare module 'react-syntax-highlighter' {
  import { ReactNode } from 'react';
  
  export interface SyntaxHighlighterProps {
    children: string;
    language?: string;
    style?: any;
    showLineNumbers?: boolean;
    wrapLongLines?: boolean;
    lineProps?: any;
    codeTagProps?: any;
    customStyle?: React.CSSProperties;
    lineNumberStyle?: React.CSSProperties | ((lineNumber: number) => React.CSSProperties);
    className?: string;
    [key: string]: any;
  }
  
  export const Prism: React.ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  const vscDarkPlus: any;
  export { vscDarkPlus };
}
