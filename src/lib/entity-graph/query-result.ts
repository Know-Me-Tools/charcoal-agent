/** The query result shape app hooks expose to pages. */
export interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

interface GraphReadState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Convert an entity-graph hook result into `QueryResult`. `data` stays
 * undefined until the first load settles, matching what pages already expect.
 */
export function toQueryResult<T>(state: GraphReadState, value: T, hasValue: boolean): QueryResult<T> {
  return {
    data: hasValue || !state.isLoading ? value : undefined,
    isLoading: state.isLoading,
    isError: state.error !== null,
    error: state.error !== null ? new Error(state.error) : null,
  };
}
