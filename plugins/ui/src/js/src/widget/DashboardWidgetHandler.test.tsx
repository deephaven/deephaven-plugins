import React from 'react';
import { render } from '@testing-library/react';
import DashboardWidgetHandler from './DashboardWidgetHandler';
import { type WidgetHandlerProps } from './WidgetHandler';
import { WIDGET_ELEMENT } from './WidgetUtils';
import { makeWidgetDescriptor } from './WidgetTestUtils';

const mockWidgetHandler = jest.fn((props: WidgetHandlerProps) => (
  <div>WidgetHandler</div>
));
jest.mock(
  './WidgetHandler',
  () => (props: WidgetHandlerProps) => mockWidgetHandler(props)
);

jest.mock('../layout/ReactPanel', () => ({
  __esModule: true,
  default: function MockReactPanel(): React.ReactNode {
    return <div className="mock-react-panel">ReactPanel</div>;
  },
}));

beforeEach(() => {
  mockWidgetHandler.mockClear();
});

function getRenderProps(): WidgetHandlerProps {
  expect(mockWidgetHandler).toHaveBeenCalledTimes(1);
  return mockWidgetHandler.mock.calls[0][0];
}

it('passes renderErrorDocument to WidgetHandler', () => {
  render(
    <DashboardWidgetHandler
      id="test-id"
      widgetDescriptor={makeWidgetDescriptor()}
    />
  );

  const props = getRenderProps();
  expect(props.renderErrorDocument).toBeInstanceOf(Function);
});

it('renders panels from renderErrorDocument for a rehydrated element widget', () => {
  const widgetDescriptor = makeWidgetDescriptor({ type: WIDGET_ELEMENT });
  render(
    <DashboardWidgetHandler
      id="test-id"
      widgetDescriptor={widgetDescriptor}
      initialData={{ panelIds: ['panel-1', 'panel-2'] }}
    />
  );

  const props = getRenderProps();
  const errorResult = props.renderErrorDocument?.(new Error('Test error'));

  // The error document should match the empty document (the panels), not an error view
  const emptyResult = props.renderEmptyDocument?.();
  expect(errorResult).toStrictEqual(emptyResult);

  // It should render one ReactPanel per panelId
  const { container } = render(
    <div>{React.Children.toArray(errorResult)}</div>
  );
  expect(container.querySelectorAll('.mock-react-panel')).toHaveLength(2);
});

it('renders a single panel from renderErrorDocument when there are no panelIds', () => {
  const widgetDescriptor = makeWidgetDescriptor({ type: WIDGET_ELEMENT });
  render(
    <DashboardWidgetHandler id="test-id" widgetDescriptor={widgetDescriptor} />
  );

  const props = getRenderProps();
  const errorResult = props.renderErrorDocument?.(new Error('Test error'));

  const { container } = render(
    <div>{React.Children.toArray(errorResult)}</div>
  );
  expect(container.querySelectorAll('.mock-react-panel')).toHaveLength(1);
});

it('renders nothing from renderErrorDocument for a non-element widget', () => {
  const widgetDescriptor = makeWidgetDescriptor({ type: 'widget-type' });
  render(
    <DashboardWidgetHandler id="test-id" widgetDescriptor={widgetDescriptor} />
  );

  const props = getRenderProps();
  const errorResult = props.renderErrorDocument?.(new Error('Test error'));

  expect(errorResult).toBeNull();
});
