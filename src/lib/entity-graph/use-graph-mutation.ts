import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  useEntityMutation,
  useGraphStoreApi,
  type EntityId,
} from "@prometheus-ags/prometheus-entity-management";
import { invalidateEntityType } from "./invalidate";
import type { EntityTypeName } from "./entities";

export interface MutateCallbacks<TInput, TRaw> {
  onSuccess?: (result: TRaw, input: TInput) => void;
  onError?: (error: Error, input: TInput) => void;
}

export interface GraphMutationOptions<TInput, TRaw, TEntity extends object>
  extends MutateCallbacks<TInput, TRaw> {
  /** Entity type written by `normalize` and patched by `optimistic`. */
  type: EntityTypeName;
  mutate: (input: TInput) => Promise<TRaw>;
  normalize?: (raw: TRaw, input: TInput) => { id: EntityId; data: TEntity };
  optimistic?: (input: TInput) => { id: EntityId; patch: Partial<TEntity> } | null;
  /** Entity types whose entities and lists become stale after success. */
  invalidateTypes?: EntityTypeName[];
  /** Specific entities to mark stale after success. */
  invalidateEntities?: (input: TInput) => Array<{ type: EntityTypeName; id: EntityId }>;
}

export interface GraphMutationResult<TInput, TRaw> {
  /** Fire-and-forget; per-call callbacks run after the hook-level ones. */
  mutate: (input: TInput, callbacks?: MutateCallbacks<TInput, TRaw>) => void;
  /** Resolves with the runtime's response or rejects with its error. */
  mutateAsync: (input: TInput) => Promise<TRaw>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: TRaw | undefined;
  /** Input of the most recent call (e.g. to show which row is pending). */
  variables: TInput | undefined;
  reset: () => void;
}

interface CallRecord<TRaw> {
  error: Error | null;
  result: TRaw | undefined;
}

/** Each call carries its own token so overlapping calls never share results. */
interface TokenedInput<TInput> {
  token: number;
  input: TInput;
}

export function useGraphMutation<TInput, TRaw, TEntity extends object = Record<string, unknown>>(
  opts: GraphMutationOptions<TInput, TRaw, TEntity>,
): GraphMutationResult<TInput, TRaw> {
  const storeApi = useGraphStoreApi();
  // Latest-options ref: callbacks always see the current render's options.
  const optsRef = useRef(opts);
  useLayoutEffect(() => {
    optsRef.current = opts;
  });
  const calls = useRef(new Map<number, CallRecord<TRaw>>());
  const nextToken = useRef(0);

  const [data, setData] = useState<TRaw | undefined>(undefined);
  const [variables, setVariables] = useState<TInput | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  const entityMutation = useEntityMutation<TokenedInput<TInput>, TRaw, TEntity>({
    type: opts.type,
    mutate: ({ input }) => optsRef.current.mutate(input),
    normalize: opts.normalize ? (raw, { input }) => optsRef.current.normalize!(raw, input) : undefined,
    optimistic: opts.optimistic ? ({ input }) => optsRef.current.optimistic!(input) : undefined,
    onSuccess: (result, { token, input }) => {
      const store = storeApi.getState();
      for (const type of optsRef.current.invalidateTypes ?? []) invalidateEntityType(storeApi, type);
      for (const { type, id } of optsRef.current.invalidateEntities?.(input) ?? []) {
        store.invalidateEntity(type, id);
      }
      const call = calls.current.get(token);
      if (call) call.result = result;
      optsRef.current.onSuccess?.(result, input);
    },
    onError: (err, { token, input }) => {
      const call = calls.current.get(token);
      if (call) call.error = err;
      optsRef.current.onError?.(err, input);
    },
  });
  const runMutation = entityMutation.mutate;
  const resetMutation = entityMutation.reset;

  const mutateAsync = useCallback(
    async (input: TInput): Promise<TRaw> => {
      const token = ++nextToken.current;
      const call: CallRecord<TRaw> = { error: null, result: undefined };
      calls.current.set(token, call);
      setVariables(input);
      setError(null);
      try {
        await runMutation({ token, input });
      } finally {
        calls.current.delete(token);
      }
      if (call.error) {
        setError(call.error);
        throw call.error;
      }
      setData(call.result);
      return call.result as TRaw;
    },
    [runMutation],
  );

  const mutate = useCallback(
    (input: TInput, callbacks?: MutateCallbacks<TInput, TRaw>) => {
      mutateAsync(input).then(
        (result) => callbacks?.onSuccess?.(result, input),
        (err: Error) => callbacks?.onError?.(err, input),
      );
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    resetMutation();
    setData(undefined);
    setVariables(undefined);
    setError(null);
  }, [resetMutation]);

  const { isPending, isSuccess, isError } = entityMutation.state;
  return { mutate, mutateAsync, isPending, isSuccess, isError, error, data, variables, reset };
}
