import { PivotBuilderPlugin } from './PivotBuilderPlugin';
import styles from './PivotBuilder.scss?inline';

// Inject the plugin styles into the document once when the bundle loads so the
// plugin ships as a single JS asset (no separate CSS file).
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

export { CREATE_PIVOT_ITEM_TYPE } from './createPivotItemType';
export { CreatePivotPage } from './CreatePivotPage';
export {
  augmentPivotBuilderModel,
  isPivotBuilderIrisGridModel,
  makeDefaultPivotConfig,
  type PivotBuilderProxyModel,
  type PivotConfig,
} from './pivotBuilderModel';
export { makePivotModelTransform } from './makePivotModelTransform';
export { PivotBuilderMiddleware } from './PivotBuilderMiddleware';
export { PivotBuilderPanelMiddleware } from './PivotBuilderPanelMiddleware';
export { PivotBuilderPlugin } from './PivotBuilderPlugin';
export { makeCreatePivotTransform } from './makeCreatePivotTransform';
export type {
  IrisGridModelTransform,
  IrisGridModelWidgetProps,
  IrisGridTableOptionsWidgetProps,
  OptionItem,
  TableOptionsTransform,
} from '@deephaven/iris-grid';

export default PivotBuilderPlugin;
