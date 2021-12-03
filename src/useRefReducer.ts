import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

/*
 * This reducer is a combination of standard useReducer and useRef.
 * It allows you to use a reducer with a mutable ref, avoiding staleness issues on function closures.
 * The returned state does not change on each render, but its .current property does.
 * Differently from useRef, this hook re-renders when the state changes.
 */
export const useRefReducer: <R extends RefReducer<any, any>>(
  refReducer: R,
  initialState: RefReducerState<R>
) => [MutableRefObject<RefReducerState<R>>, Dispatch<RefReducerAction<R>>] = (
  refReducer,
  initialState
) => {
  const state = useRef(initialState);
  const [refresh, refreshHook] = useState(false);

  const setState: <R extends RefReducer<any, any>>(
    action: RefReducerAction<R>
  ) => void = (action) => {
    state.current = refReducer(state.current, action);
    refreshHook(!refresh);
  };

  const dispatch = useCallback(setState, [refReducer]);

  return [state, dispatch];
};
