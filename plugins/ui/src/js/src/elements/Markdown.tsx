import remarkMath from 'remark-math';
import rehypeMathjax from 'rehype-mathjax';
import ReactMarkdown from 'react-markdown';
import { View, ViewProps } from '@deephaven/components';

type MarkdownProps = Omit<ViewProps, 'children'> & {
  children: string;
};

export function Markdown({ children, ...props }: MarkdownProps): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <View {...props}>
      <ReactMarkdown
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
