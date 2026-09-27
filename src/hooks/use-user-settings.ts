import { useEntity } from "@prometheus-ags/prometheus-entity-management";
import { api } from "@/lib/api-client";
import { ENTITY, USER_SETTINGS_ID } from "@/lib/entity-graph/entities";
import { toQueryResult, type QueryResult } from "@/lib/entity-graph/query-result";
import { useGraphMutation } from "@/lib/entity-graph/use-graph-mutation";
import type { UpdateUserSettingsPayload, UserSettings } from "@/types";

type UserSettingsRecord = UserSettings & { id: string };

/** Per-user runtime settings (GET /api/uar/user/settings); requires a JWT-authenticated runtime. */
export function useUserSettings(enabled: boolean): QueryResult<UserSettings> & { refetch: () => void } {
  const result = useEntity<UserSettings, UserSettingsRecord>({
    type: ENTITY.UserSettings,
    id: USER_SETTINGS_ID,
    fetch: () => api.get<UserSettings>("/api/uar/user/settings"),
    normalize: (settings) => ({ ...settings, id: USER_SETTINGS_ID }),
    enabled,
  });
  return { ...toQueryResult(result, result.data ?? undefined, !!result.data), refetch: result.refetch };
}

/** Save per-user settings; the runtime's response becomes the graph's copy. */
export function useSaveUserSettings() {
  return useGraphMutation<UpdateUserSettingsPayload, UserSettings, UserSettingsRecord>({
    type: ENTITY.UserSettings,
    mutate: (payload) => api.put<UserSettings>("/api/uar/user/settings", payload),
    normalize: (settings) => ({ id: USER_SETTINGS_ID, data: { ...settings, id: USER_SETTINGS_ID } }),
  });
}
