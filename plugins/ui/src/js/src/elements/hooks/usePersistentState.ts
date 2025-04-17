import {
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { ReactPanelContext } from '../../layout/ReactPanelContext';

export default function usePersistentState<S>(
  initialState: S | (() => S)
): [S, Dispatch<SetStateAction<S>>] {
  const context = useContext(ReactPanelContext);
  const initialPersistedState = context?.getInitialState() as S | undefined;
  const [state, setState] = useState(initialPersistedState ?? initialState);

  console.log('usePersistentState', initialPersistedState, context?.isTracking);
  if (context && context.isTracking) {
    context?.addPanelState?.(state);
  }

  const setter = useCallback(
    (newState: SetStateAction<S>) => {
      console.log('setter');
      setState(newState);
      context?.trigger?.();
      // });
    },
    [context]
  );

  return [state, setter];
}
