import React from 'react';
import { type CodeComponent } from 'react-markdown/lib/ast-to-react';
import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import ReactMarkdown from 'react-markdown';
import { View, ViewProps } from '@deephaven/components';
import { Code } from '@deephaven/console';

type MarkdownProps = Omit<ViewProps, 'children'> & {
  children: string;
};

const renderMarkdown: CodeComponent = props => {
  const { children, className, inline } = props;
  if (inline === true) {
    return (
      <code>
        {React.Children.map(children, child =>
          typeof child === 'string' ? child.trim() : child
        )}
      </code>
    );
  }
  const language =
    className !== undefined && className?.startsWith('language-')
      ? className.substring(9)
      : 'plaintext';
  return (
    <pre>
      <code>
        <Code language={language}>
          {React.Children.map(children, child =>
            typeof child === 'string' ? child.trim() : child
          )}
        </Code>
      </code>
    </pre>
  );
};

export function Markdown({ children, ...props }: MarkdownProps): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <View {...props} UNSAFE_className="ui-markdown markdown-editor-container">
      <ReactMarkdown
        components={{ code: renderMarkdown }}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeMathjax]}
      >
        {children}
      </ReactMarkdown>
    </View>
  );
}

Markdown.displayName = 'Markdown';

export default Markdown;
