import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAgent, useCompileAgent } from "@/hooks/use-agents";
import { useProviders, useProviderModels } from "@/hooks/use-providers";
import { useSkills } from "@/hooks/use-skills";
import { SectionLabel } from "@/components/common/section-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import type { Agent } from "@/types";

// Filled-field treatment shared by the text inputs and the markdown editor
// (docs/design/chat-surfaces.md §4.2): rest on `bg-composer`, lift to
// `bg-raised` on focus, and show the 2px ember outline. No border.
const FIELD_CLASS =
  "w-full rounded-md bg-composer px-3 py-2 font-ui text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:bg-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// ── Markdown editor ───────────────────────────────────────────────────────────

interface MarkdownEditorFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
}

function MarkdownEditorField({
  id,
  label,
  value,
  placeholder,
  rows = 10,
  onChange,
}: MarkdownEditorFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="ui-label block text-foreground">
        {label}
      </label>
      <Tabs defaultValue="write" className="w-full">
        <TabsList className="mb-1 h-7">
          <TabsTrigger value="write" className="h-6 px-3 font-ui text-xs">
            Write
          </TabsTrigger>
          <TabsTrigger value="preview" className="h-6 px-3 font-ui text-xs">
            Preview
          </TabsTrigger>
        </TabsList>
        <TabsContent value="write" className="mt-0">
          <textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={`resize-y font-mono text-xs leading-relaxed ${FIELD_CLASS}`}
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-0">
          <div className="min-h-40 rounded-md bg-band px-4 py-3">
            {value.trim() ? (
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {value}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="font-body text-xs text-muted-foreground">
                Nothing to preview yet.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  systemPrompt: string;
  providerId: string;
  modelId: string;
  selectedSkills: string[];
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  systemPrompt: "",
  providerId: "",
  modelId: "",
  selectedSkills: [],
};

function formFromAgent(agent: Agent): FormState {
  return {
    name: agent.name,
    description: agent.metadata?.description ?? "",
    systemPrompt: agent.system_prompt,
    providerId: agent.provider_id,
    modelId: agent.model_id,
    selectedSkills: agent.skills,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === undefined || id === "new";
  const navigate = useNavigate();

  const { data: agent } = useAgent(isNew ? undefined : id);
  const { data: providersData } = useProviders();
  const providers = providersData?.providers ?? [];
  const { data: skills } = useSkills();
  const compileAgent = useCompileAgent();

  // Sync form when agent data arrives (avoids setState-in-effect lint).
  const [prevAgent, setPrevAgent] = useState<Agent | undefined>(undefined);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  if (agent !== prevAgent) {
    setPrevAgent(agent);
    if (agent) setForm(formFromAgent(agent));
  }

  const { data: models } = useProviderModels(form.providerId || undefined);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    compileAgent.mutate(
      {
        name: form.name,
        description: form.description,
        systemPrompt: form.systemPrompt,
        providerId: form.providerId,
        modelId: form.modelId,
        skills: form.selectedSkills,
      },
      { onSuccess: () => navigate("/agents") },
    );
  };

  const toggleSkill = (skillId: string) => {
    setField(
      "selectedSkills",
      form.selectedSkills.includes(skillId)
        ? form.selectedSkills.filter((s) => s !== skillId)
        : [...form.selectedSkills, skillId],
    );
  };

  const isSaving = compileAgent.isPending;
  const saveDisabled = !form.name || !form.providerId || !form.modelId || isSaving;

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/agents")}
          className="mb-4 flex items-center gap-1.5 rounded-md font-ui text-sm text-muted-foreground transition-hover hover:text-foreground focus-cue"
        >
          <ArrowLeft size={14} />
          Back to agents
        </button>
        <SectionLabel>{isNew ? "New Agent" : "Edit Agent"}</SectionLabel>
        <h1 className="mt-1 font-display text-xl font-bold text-foreground md:text-2xl">
          {isNew ? "Create Agent" : form.name || "Agent"}
        </h1>
        {!isNew && id && (
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            {id}
          </p>
        )}
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="agent-name"
            className="ui-label mb-1.5 block text-foreground"
          >
            Name
          </label>
          <input
            id="agent-name"
            type="text"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Agent name"
            className={FIELD_CLASS}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="agent-description"
            className="ui-label mb-1.5 block text-foreground"
          >
            Description
          </label>
          <input
            id="agent-description"
            type="text"
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="What does this agent do?"
            className={FIELD_CLASS}
          />
        </div>

        {/* System prompt — markdown editor */}
        <MarkdownEditorField
          id="agent-system-prompt"
          label="System Prompt"
          value={form.systemPrompt}
          placeholder="Instruct the agent on how to behave..."
          rows={10}
          onChange={(v) => setField("systemPrompt", v)}
        />

        {/* Provider + Model */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="agent-provider"
              className="ui-label mb-1.5 block text-foreground"
            >
              Provider
            </label>
            <Select
              value={form.providerId}
              items={providers.map((p) => ({ value: p.id, label: p.display_name ?? p.id }))}
              onValueChange={(v) => {
                if (v === null) return;
                setForm((f) => ({ ...f, providerId: v, modelId: "" }));
              }}
            >
              <SelectTrigger id="agent-provider" className="w-full font-ui text-sm">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="font-ui text-sm">
                    {p.display_name ?? p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label
              htmlFor="agent-model"
              className="ui-label mb-1.5 block text-foreground"
            >
              Model
            </label>
            <Select
              value={form.modelId}
              items={(models ?? []).map((m) => ({ value: m.id, label: m.display_name || m.id }))}
              onValueChange={(v) => {
                if (v !== null) setField("modelId", v);
              }}
              disabled={!form.providerId}
            >
              <SelectTrigger id="agent-model" className="w-full font-ui text-sm">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models?.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="font-ui text-sm">
                    {m.display_name || m.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div>
            <label
              htmlFor="agent-skills"
              className="ui-label mb-1.5 block text-foreground"
            >
              Skills
            </label>
            <div id="agent-skills" className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  aria-pressed={form.selectedSkills.includes(skill.id)}
                  className={`rounded-md px-3 py-1.5 font-ui text-xs font-semibold transition-hover focus-cue ${
                    form.selectedSkills.includes(skill.id)
                      ? "bg-ember-soft text-ember-text"
                      : "bg-muted-surface text-muted-foreground hover:bg-hover"
                  }`}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save */}
        {compileAgent.isError && (
          <p className="font-mono text-xs text-danger-text">
            {(compileAgent.error as Error).message}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saveDisabled}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40 sm:w-auto"
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isNew ? "Create agent" : "Save agent"}
        </button>
      </div>
    </div>
  );
}
