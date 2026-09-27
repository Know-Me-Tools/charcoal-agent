import { useState } from "react";
import { Plus, Trash2, Check, Loader2, Star } from "lucide-react";
import {
  useProviders,
  useProviderModels,
  useCreateProvider,
  useUpdateProvider,
  useDeleteProvider,
  useSetDefaultProvider,
  useTestConnection,
} from "@/hooks/use-providers";
import { SectionLabel } from "@/components/common/section-label";
import { StatusBadge } from "@/components/common/status-badge";
import { SkeletonCard } from "@/components/common/skeleton-loader";
import type { UarProvider, UarModel, UpdateProviderPayload } from "@/types";

// Filled-field treatment shared by the text inputs and the protocol select
// (docs/design/chat-surfaces.md §4.2): rest on `bg-composer`, lift to
// `bg-raised` on focus, and show the 2px ember outline. No border.
const FIELD_CLASS =
  "w-full rounded-md bg-composer px-3 py-2 font-ui text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Filled, borderless secondary action button used throughout the provider card.
const ACTION_BUTTON_CLASS =
  "flex h-8 items-center gap-1.5 rounded-md bg-muted-surface px-3 font-ui text-xs font-semibold text-muted-foreground transition-hover hover:bg-hover hover:text-foreground focus-cue disabled:opacity-50";

export default function ProvidersPage() {
  const { data, isLoading } = useProviders();
  const providers = data?.providers ?? [];
  const defaultId = data?.defaultId;

  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const deleteProvider = useDeleteProvider();
  const setDefault = useSetDefaultProvider();
  const testConnection = useTestConnection();
  const [addingNew, setAddingNew] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState({
    id: "",
    display_name: "",
    protocol: "openai",
    base_url: "",
    api_key: "",
    enabled: true,
  });

  const handleCreateProvider = () => {
    createProvider.mutate(
      {
        id: newProvider.id || newProvider.display_name.toLowerCase().replace(/\s+/g, "-"),
        display_name: newProvider.display_name,
        protocol: newProvider.protocol,
        base_url: newProvider.base_url || undefined,
        api_key: newProvider.api_key || undefined,
        enabled: newProvider.enabled,
      },
      {
        onSuccess: () => {
          setAddingNew(false);
          setNewProvider({
            id: "",
            display_name: "",
            protocol: "openai",
            base_url: "",
            api_key: "",
            enabled: true,
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SectionLabel>Provider Settings</SectionLabel>
          <h1 className="mt-1 font-display text-xl font-bold text-foreground md:text-2xl">
            Providers
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setAddingNew(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Plus size={16} />
          Add provider
        </button>
      </div>

      {addingNew && (
        <div className="mb-6 rounded-lg bg-band p-4 space-y-4">
          <SectionLabel>New Provider</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="np-display-name" className="ui-label mb-1 block text-foreground">
                Display name
              </label>
              <input
                id="np-display-name"
                type="text"
                value={newProvider.display_name}
                onChange={(e) =>
                  setNewProvider((p) => ({ ...p, display_name: e.target.value }))
                }
                className={FIELD_CLASS}
                placeholder="OpenAI"
              />
            </div>
            <div>
              <label htmlFor="np-protocol" className="ui-label mb-1 block text-foreground">
                Protocol
              </label>
              <select
                id="np-protocol"
                title="Protocol"
                value={newProvider.protocol}
                onChange={(e) =>
                  setNewProvider((p) => ({ ...p, protocol: e.target.value }))
                }
                className={FIELD_CLASS}
              >
                <option value="openai">openai</option>
                <option value="anthropic">anthropic</option>
                <option value="azure">azure</option>
                <option value="ollama">ollama</option>
                <option value="openai-compatible">openai-compatible</option>
              </select>
            </div>
            <div>
              <label htmlFor="np-base-url" className="ui-label mb-1 block text-foreground">
                Base URL{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="np-base-url"
                type="text"
                value={newProvider.base_url}
                onChange={(e) =>
                  setNewProvider((p) => ({ ...p, base_url: e.target.value }))
                }
                className={`font-mono ${FIELD_CLASS}`}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label htmlFor="np-api-key" className="ui-label mb-1 block text-foreground">
                API Key{" "}
                <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="np-api-key"
                type="password"
                value={newProvider.api_key}
                onChange={(e) =>
                  setNewProvider((p) => ({ ...p, api_key: e.target.value }))
                }
                className={`font-mono ${FIELD_CLASS}`}
                placeholder="sk-..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleCreateProvider}
              disabled={!newProvider.display_name}
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
            >
              Save provider
            </button>
            <button
              type="button"
              onClick={() => setAddingNew(false)}
              className="flex h-9 items-center rounded-md bg-muted-surface px-4 font-ui text-sm font-semibold text-muted-foreground transition-hover hover:bg-hover hover:text-foreground focus-cue"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {(["skeleton-1", "skeleton-2"] as const).map((id) => (
            <SkeletonCard key={id} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isDefault={provider.id === defaultId}
              isSelected={selectedProviderId === provider.id}
              onSelect={() =>
                setSelectedProviderId(
                  selectedProviderId === provider.id ? null : provider.id,
                )
              }
              onUpdate={(data) => updateProvider.mutate({ id: provider.id, ...data })}
              onDelete={() => deleteProvider.mutate(provider.id)}
              onSetDefault={() => setDefault.mutate(provider.id)}
              onTestConnection={() => testConnection.mutate(provider.id)}
              testLatency={
                testConnection.isSuccess && testConnection.variables === provider.id
                  ? testConnection.data
                  : null
              }
              isTesting={
                testConnection.isPending && testConnection.variables === provider.id
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProviderCardProps {
  provider: UarProvider;
  isDefault: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: Omit<UpdateProviderPayload, "id">) => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onTestConnection: () => void;
  testLatency: number | null;
  isTesting: boolean;
}

function ProviderCard({
  provider,
  isDefault,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onSetDefault,
  onTestConnection,
  testLatency,
  isTesting,
}: ProviderCardProps) {
  return (
    <div className="rounded-lg bg-band">
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={isSelected}
        className="flex w-full flex-col gap-2 rounded-lg p-4 text-left transition-hover hover:bg-hover focus-cue sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              provider.enabled ? "bg-success" : "bg-destructive"
            }`}
          />
          <div className="min-w-0">
            <span className="font-display text-sm font-semibold text-foreground">
              {provider.display_name ?? provider.id}
            </span>
            <span className="ml-2 rounded-sm bg-raised px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {provider.protocol}
            </span>
            {provider.base_url && (
              <span className="ml-2 hidden font-mono text-xs text-muted-foreground sm:inline">
                {provider.base_url}
              </span>
            )}
          </div>
        </div>
        {/* Below `sm` this metadata row wraps onto its own line under the name,
            instead of the badges overlapping the chips above. */}
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isDefault && (
            <span className="flex items-center gap-1 font-ui text-xs font-semibold text-ember-text">
              <Star size={12} /> Default
            </span>
          )}
          <StatusBadge status={provider.enabled ? "connected" : "disconnected"} />
        </div>
      </button>

      {isSelected && (
        <div className="p-4 pt-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onTestConnection}
              disabled={isTesting}
              className={ACTION_BUTTON_CLASS}
            >
              {isTesting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              Test
            </button>
            {testLatency !== null && (
              <span className="font-mono text-xs text-success-text">{testLatency}ms</span>
            )}
            <button
              type="button"
              onClick={() => onUpdate({ enabled: !provider.enabled })}
              className={ACTION_BUTTON_CLASS}
            >
              {provider.enabled ? "Disable" : "Enable"}
            </button>
            {!isDefault && (
              <button
                type="button"
                onClick={onSetDefault}
                className={`${ACTION_BUTTON_CLASS} hover:text-ember-text`}
              >
                Set default
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              className={`${ACTION_BUTTON_CLASS} hover:bg-danger-soft hover:text-danger-text sm:ml-auto`}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>

          <ProviderModelsTable models={provider.models} providerId={provider.id} />
        </div>
      )}
    </div>
  );
}

function ProviderModelsTable({
  providerId,
  models: embeddedModels,
}: {
  providerId: string;
  models?: UarModel[];
}) {
  // Only fetch from the API when the provider object didn't embed models.
  const skip = Array.isArray(embeddedModels);
  const { data: fetchedModels, isLoading } = useProviderModels(skip ? undefined : providerId);

  if (!skip && isLoading) return <div className="animate-shimmer h-20 rounded-md bg-muted" />;

  const models = embeddedModels ?? fetchedModels ?? [];
  if (!models.length) return null;

  return (
    <div className="overflow-x-auto rounded-md bg-band">
      <table className="w-full">
        <thead>
          <tr>
            <th className="px-3 py-2 text-left ui-overline text-muted-foreground">
              Model ID
            </th>
            <th className="px-3 py-2 text-left ui-overline text-muted-foreground">
              Display Name
            </th>
            <th className="px-3 py-2 text-left ui-overline text-muted-foreground">
              Context
            </th>
            <th className="px-3 py-2 text-left ui-overline text-muted-foreground">
              Capabilities
            </th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.id} className="transition-hover hover:bg-hover focus-within:bg-hover">
              <td className="px-3 py-2 font-mono text-xs break-all text-foreground">
                {model.id}
              </td>
              <td className="px-3 py-2 font-mono text-xs break-words text-muted-foreground">
                {model.display_name ?? "—"}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                {model.context_window != null
                  ? `${(model.context_window / 1000).toFixed(0)}k`
                  : "—"}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {model.supports_vision && (
                    <span className="rounded-sm bg-info/10 px-1.5 py-0.5 font-mono text-xs text-cyan-text">
                      vision
                    </span>
                  )}
                  {model.supports_tools && (
                    <span className="rounded-sm bg-success/10 px-1.5 py-0.5 font-mono text-xs text-success-text">
                      tools
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
