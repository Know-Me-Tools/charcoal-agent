import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgent, useCreateAgent, useUpdateAgent } from "@/hooks/use-agents";
import { useProviders, useProviderModels } from "@/hooks/use-providers";
import { useSkills } from "@/hooks/use-skills";
import { SectionLabel } from "@/components/common/section-label";
import { ArrowLeft, Save } from "lucide-react";

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { data: agent } = useAgent(isNew ? undefined : id);
  const { data: providers } = useProviders();
  const { data: skills } = useSkills();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();

  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [providerId, setProviderId] = useState("");
  const [modelId, setModelId] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data: models } = useProviderModels(providerId || undefined);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setSystemPrompt(agent.system_prompt);
      setProviderId(agent.provider_id);
      setModelId(agent.model_id);
      setSelectedSkills(agent.skills);
    }
  }, [agent]);

  const handleSave = () => {
    const payload = {
      name,
      system_prompt: systemPrompt,
      provider_id: providerId,
      model_id: modelId,
      skills: selectedSkills,
    };

    if (isNew) {
      createAgent.mutate(payload, { onSuccess: () => navigate("/agents") });
    } else if (id) {
      updateAgent.mutate({ id, ...payload }, { onSuccess: () => navigate("/agents") });
    }
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId],
    );
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate("/agents")}
          className="mb-4 flex items-center gap-1.5 font-ui text-sm text-muted-foreground transition-hover hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to agents
        </button>
        <SectionLabel>{isNew ? "New Agent" : "Edit Agent"}</SectionLabel>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
          {isNew ? "Create Agent" : name || "Agent"}
        </h1>
      </div>

      <div className="max-w-2xl space-y-6">
        <div>
          <label className="ui-label mb-1.5 block text-foreground">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Agent name"
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-ui text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="ui-label mb-1.5 block text-foreground">System Prompt</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Instruct the agent on how to behave..."
            rows={8}
            className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-body text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="ui-label mb-1.5 block text-foreground">Provider</label>
            <select
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setModelId("");
              }}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-ui text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select provider</option>
              {providers?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="ui-label mb-1.5 block text-foreground">Model</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={!providerId}
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-ui text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              <option value="">Select model</option>
              {models?.map((m) => (
                <option key={m.id} value={m.model_id}>
                  {m.name || m.model_id}
                </option>
              ))}
            </select>
          </div>
        </div>

        {skills && skills.length > 0 && (
          <div>
            <label className="ui-label mb-1.5 block text-foreground">Skills</label>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => toggleSkill(skill.id)}
                  className={`rounded-md border px-3 py-1.5 font-ui text-xs font-semibold transition-hover ${
                    selectedSkills.includes(skill.id)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!name || !providerId || !modelId}
          className="flex h-10 items-center gap-2 rounded-md bg-primary px-5 font-ui text-sm font-semibold text-primary-foreground transition-hover hover:bg-primary/90 disabled:opacity-40"
        >
          <Save size={16} />
          {isNew ? "Create agent" : "Save agent"}
        </button>
      </div>
    </div>
  );
}
