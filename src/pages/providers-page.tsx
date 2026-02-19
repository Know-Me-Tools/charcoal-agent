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
import type { Provider, Model } from "@/types";

export default function ProvidersPage() {
  const { data: providers, isLoading } = useProviders();
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const deleteProvider = useDeleteProvider();
  const setDefault = useSetDefaultProvider();
  const testConnection = useTestConnection();
  const [addingNew, setAddingNew] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [newProvider, setNewProvider] = useState({
    name: "",
    base_url: "",
    api_key: "",
    enabled: true,
  });

  const handleCreateProvider = () => {
    createProvider.mutate(newProvider, {
      onSuccess: () => {
        setAddingNew(false);
        setNewProvider({ name: "", base_url: "", api_key: "", enabled: true });
      },
    });
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
          onClick={() => setAddingNew(true)}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90"
        >
          <Plus size={16} />
          Add provider
        </button>
      </div>

      {addingNew && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 space-y-4">
          <SectionLabel>New Provider</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="ui-label mb-1 block text-foreground">Display name</label>
              <input
                type="text"
                value={newProvider.name}
                onChange={(e) => setNewProvider((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-ui text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="OpenAI"
              />
            </div>
            <div>
              <label className="ui-label mb-1 block text-foreground">Base URL</label>
              <input
                type="text"
                value={newProvider.base_url}
                onChange={(e) => setNewProvider((p) => ({ ...p, base_url: e.target.value }))}
                className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="https://api.openai.com/v1"
              />
            </div>
          </div>
          <div>
            <label className="ui-label mb-1 block text-foreground">API Key</label>
            <input
              type="password"
              value={newProvider.api_key}
              onChange={(e) => setNewProvider((p) => ({ ...p, api_key: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="sk-..."
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={handleCreateProvider}
              disabled={!newProvider.name || !newProvider.base_url}
              className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90 disabled:opacity-40"
            >
              Save provider
            </button>
            <button
              onClick={() => setAddingNew(false)}
              className="flex h-9 items-center rounded-md border border-border px-4 font-ui text-sm font-semibold text-muted-foreground transition-hover hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {providers?.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              isSelected={selectedProviderId === provider.id}
              onSelect={() =>
                setSelectedProviderId(
                  selectedProviderId === provider.id ? null : provider.id,
                )
              }
              onUpdate={(data) =>
                updateProvider.mutate({ id: provider.id, ...data })
              }
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
  provider: Provider;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: { name?: string; base_url?: string; api_key?: string; enabled?: boolean }) => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onTestConnection: () => void;
  testLatency: number | null;
  isTesting: boolean;
}

function ProviderCard({
  provider,
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
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={onSelect}
        className="flex w-full items-center justify-between p-4 text-left transition-hover hover:bg-muted/20"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              provider.enabled ? "bg-success" : "bg-destructive"
            }`}
          />
          <div className="min-w-0">
            <span className="font-display text-sm font-semibold text-foreground">
              {provider.name}
            </span>
            <span className="ml-3 hidden font-mono text-[10px] text-muted-foreground sm:inline">
              {provider.base_url}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {provider.is_default && (
            <span className="flex items-center gap-1 font-ui text-[11px] font-semibold text-primary">
              <Star size={12} /> Default
            </span>
          )}
          <StatusBadge status={provider.enabled ? "connected" : "disconnected"} />
        </div>
      </button>

      {isSelected && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onTestConnection}
              disabled={isTesting}
              className="flex h-8 items-center gap-1.5 rounded-md border border-border px-3 font-ui text-xs font-semibold text-muted-foreground transition-hover hover:text-foreground disabled:opacity-50"
            >
              {isTesting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              Test
            </button>
            {testLatency !== null && (
              <span className="font-mono text-xs text-success">{testLatency}ms</span>
            )}
            <button
              onClick={() => onUpdate({ enabled: !provider.enabled })}
              className="flex h-8 items-center rounded-md border border-border px-3 font-ui text-xs font-semibold text-muted-foreground transition-hover hover:text-foreground"
            >
              {provider.enabled ? "Disable" : "Enable"}
            </button>
            {!provider.is_default && (
              <button
                onClick={onSetDefault}
                className="flex h-8 items-center rounded-md border border-border px-3 font-ui text-xs font-semibold text-muted-foreground transition-hover hover:text-primary"
              >
                Set default
              </button>
            )}
            <button
              onClick={onDelete}
              className="flex h-8 items-center gap-1 rounded-md border border-border px-3 font-ui text-xs font-semibold text-muted-foreground transition-hover hover:border-destructive hover:text-destructive sm:ml-auto"
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>

          <ProviderModelsTable providerId={provider.id} />
        </div>
      )}
    </div>
  );
}

function ProviderModelsTable({ providerId }: { providerId: string }) {
  const { data: models, isLoading } = useProviderModels(providerId);

  if (isLoading) return <div className="animate-shimmer h-20 rounded-md bg-muted" />;
  if (!models?.length) {
    return (
      <p className="font-body text-sm text-muted-foreground">
        No models available for this provider.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-3 py-2 text-left ui-overline text-muted-foreground">Model ID</th>
            <th className="px-3 py-2 text-left ui-overline text-muted-foreground">Context</th>
            <th className="px-3 py-2 text-left ui-overline text-muted-foreground">Capabilities</th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => (
            <tr key={model.id} className="border-b border-border last:border-b-0">
              <td className="px-3 py-2 font-mono text-xs text-foreground">
                {model.model_id}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                {(model.context_window / 1000).toFixed(0)}k
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  {model.supports_vision && (
                    <span className="rounded-sm bg-info/10 px-1.5 py-0.5 font-mono text-[10px] text-info">
                      vision
                    </span>
                  )}
                  {model.supports_tools && (
                    <span className="rounded-sm bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success">
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
