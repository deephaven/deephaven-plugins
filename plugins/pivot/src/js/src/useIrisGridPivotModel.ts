import { type dh } from '@deephaven-enterprise/jsapi-coreplus-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useCallback, useEffect, useState } from 'react';
import { type IrisGridModel } from '@deephaven/iris-grid';
import IrisGridPivotModel from './IrisGridPivotModel';

export type PivotWidgetFetch = () => Promise<dh.coreplus.pivot.PivotTable>;

export type IrisGridModelFetchErrorResult = {
  error: NonNullable<unknown>;
  status: 'error';
};

export type IrisGridModelFetchLoadingResult = {
  status: 'loading';
};

export type IrisGridModelFetchSuccessResult = {
  status: 'success';
  model: IrisGridModel;
};

export type IrisGridModelFetchResult = (
  | IrisGridModelFetchErrorResult
  | IrisGridModelFetchLoadingResult
  | IrisGridModelFetchSuccessResult
) & {
  reload: () => void;
};

/** Pass in a table `fetch` function, will load the model and handle any errors */
export function useIrisGridPivotModel(
  fetch: PivotWidgetFetch
): IrisGridModelFetchResult {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();
  const [error, setError] = useState<unknown>();
  const [isLoading, setIsLoading] = useState(true);

  // Close the model when component is unmounted
  useEffect(
    () => () => {
      if (model) {
        model.close();
      }
    },
    [model]
  );

  const makeModel = useCallback(async () => {
    const pivotWidget = await fetch();
    return new IrisGridPivotModel(dh, pivotWidget);
  }, [dh, fetch]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const newModel = await makeModel();
      setModel(newModel);
      setIsLoading(false);
    } catch (e) {
      setError(e);
      setIsLoading(false);
    }
  }, [makeModel]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setIsLoading(true);
      setError(undefined);
      try {
        const newModel = await makeModel();
        if (!cancelled) {
          setModel(newModel);
          setIsLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [makeModel]);

  if (isLoading) {
    return { reload, status: 'loading' };
  }
  if (error != null) {
    return { error, reload, status: 'error' };
  }
  if (model != null) {
    return { model, reload, status: 'success' };
  }
  throw new Error('Invalid state');
}
