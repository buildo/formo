import { MutableRefObject, useCallback, useEffect, useRef } from "react";

type Dispatch<A> = (value: A) => void;

type RefReducer<S, A> = (prevState: S, action: A) => S;

type RefReducerState<R extends RefReducer<any, any>> = R extends RefReducer<
  infer S,
  any
>
  ? S
  : never;

type RefReducerAction<R extends RefReducer<any, any>> = R extends RefReducer<
  any,
  infer A
>
  ? A
  : never;

export const useRefReducer: <R extends RefReducer<any, any>>(
  refReducer: R,
  initialState: RefReducerState<R>
) => [MutableRefObject<RefReducerState<R>>, Dispatch<RefReducerAction<R>>] = (
  refReducer,
  initialState
) => {
  const state = useRef(initialState);

  const setState: <R extends RefReducer<any, any>>(
    action: RefReducerAction<R>
  ) => void = (action) => {
    state.current = refReducer(state.current, action);
  };

  const dispatch = useCallback(setState, [refReducer]);

  return [state, dispatch];
};
