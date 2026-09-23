import { useState } from "react";
import { RefreshCw, Wrench, CheckCircle2, AlertCircle, Loader2, Settings, X, ChevronRight, Tag } from "lucide-react";
import { useSkills, useToggleSkill, useRefreshSkills } from "@/hooks/use-skills";
import { useSkillsSync } from "@/hooks/use-skills-sync";
import { KNOWME_SKILLS } from "@/lib/skills/knowme-skills";
import { SectionLabel } from "@/components/common/section-label";
import { SkeletonCard } from "@/components/common/skeleton-loader";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import type { Skill } from "@/types";
interface SkillDetailPanelProps {
  skill: Skill | null;
  onClose: () => void;
}

function SkillDetailPanel({ skill, onClose }: SkillDetailPanelProps) {
  if (!skill) return null;

  const isBuiltin = skill.provider_id === "api" || KNOWME_SKILLS.some(s => s.skill_id === skill.id);
  const isFilesystem = skill.provider_id === "filesystem" || skill.provider_id?.includes("fs");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border bg-card shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-muted/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Wrench size={20} className={isBuiltin ? "text-primary" : "text-muted-foreground"} />
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                {skill.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">{skill.id}</span>
                {skill.version && (
                  <span className="rounded bg-muted px-1.5 py-0.5">v{skill.version}</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto p-6">
          {/* Status & Provider */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                skill.enabled
                  ? "bg-green-500/10 text-green-600"
                  : "bg-amber-500/10 text-amber-600"
              }`}>
                {skill.enabled ? (
                  <><CheckCircle2 size={12} /> Enabled</>
                ) : (
                  <><AlertCircle size={12} /> Disabled</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Source:</span>
              <span className="rounded bg-muted px-2 py-1 text-xs font-mono">
                {skill.provider_id || "unknown"}
              </span>
            </div>
          </div>

          {/* Description */}
          {skill.description && (
            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-2 font-ui text-sm font-semibold text-foreground">
                <ChevronRight size={14} />
                Description
              </h3>
              <p className="rounded-lg border bg-muted/30 p-3 font-body text-sm text-muted-foreground">
                {skill.description}
              </p>
            </div>
          )}

          {/* Triggers */}
          {skill.triggers && (skill.triggers.keywords?.length || skill.triggers.semantic) && (
            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-2 font-ui text-sm font-semibold text-foreground">
                <Tag size={14} />
                Triggers
              </h3>
              {skill.triggers.keywords && skill.triggers.keywords.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-muted-foreground">Keywords:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {skill.triggers.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skill.triggers.semantic && (
                <div>
                  <span className="text-xs text-muted-foreground">Semantic:</span>
                  <p className="mt-1 rounded bg-muted/30 p-2 text-xs text-muted-foreground">
                    {skill.triggers.semantic}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preferred Tools */}
          {skill.preferred_tools && skill.preferred_tools.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-2 font-ui text-sm font-semibold text-foreground">
                <Wrench size={14} />
                Preferred Tools
              </h3>
              <div className="flex flex-wrap gap-1">
                {skill.preferred_tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prompt Overlay */}
          {skill.prompt_overlay && (
            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-2 font-ui text-sm font-semibold text-foreground">
                <Settings size={14} />
                Prompt Overlay
              </h3>
              <div className="relative">
                <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs text-muted-foreground">
                  {skill.prompt_overlay}
                </pre>
                <div className="absolute right-2 top-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    Markdown
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/50 px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Skills are loaded from the Universal Agent Runtime API. 
            {isFilesystem && " This skill is loaded from the filesystem provider."}
            {isBuiltin && " This is a built-in skill synced from the Charcoal Agent."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const { data: skills, isLoading } = useSkills();
  const toggleSkill = useToggleSkill();
  const refreshSkills = useRefreshSkills();
  const { syncing, synced, syncedCount, missingCount, error: syncError, triggerSync } =
    useSkillsSync();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const handleToggle = (id: string, enabled: boolean) => {
    toggleSkill.mutate({ id, enabled: !enabled });
  };

  const handleSync = () => {
    void triggerSync();
  };

  const handleRefresh = () => {
    refreshSkills.mutate();
  };

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill);
  };

  const handleCloseDetail = () => {
    setSelectedSkill(null);
  };

  // Categorize skills by their actual provider
  const categorizeSkill = (skill: Skill) => {
    const isKnowMe = KNOWME_SKILLS.some(s => s.skill_id === skill.id);
    const isPlatform = skill.id === "artifact-refiner";
    const isApi = skill.provider_id === "api";
    const isFilesystem = skill.provider_id === "filesystem" || skill.provider_id?.includes("fs");
    
    if (isKnowMe) return { type: "knowme", label: "Built-in", color: "text-primary" };
    if (isPlatform || isApi) return { type: "platform", label: "Platform", color: "text-purple-400" };
    if (isFilesystem) return { type: "filesystem", label: "Filesystem", color: "text-blue-400" };
    return { type: "external", label: "External", color: "text-muted-foreground" };
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Skills Library</SectionLabel>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground">Skills</h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Skills loaded from the Universal Agent Runtime API. Click a skill to view configuration.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* UAR registry rescan */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshSkills.isPending}
            title="Trigger UAR to rescan its skills directory"
            className="flex h-8 items-center gap-1.5"
          >
            {refreshSkills.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Rescan UAR
          </Button>

          {/* Required-skills sync */}
          <Button
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            title="Sync built-in skills to the UAR"
            className="flex h-8 items-center gap-1.5"
          >
            {syncing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            Sync Built-ins
          </Button>
        </div>
      </div>

      {/* Sync status banner */}
      {(synced || syncError) && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-2.5 font-ui text-sm ${
            syncError
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-green-500/20 bg-green-500/5 text-green-400"
          }`}
        >
          {syncError ? (
            <>
              <AlertCircle size={14} />
              <span>Sync error: {syncError}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              <span>
                {syncedCount} required skills synced
                {missingCount > 0 && (
                  <span className="ml-1 text-amber-400">
                    · {missingCount} not yet available in this UAR
                  </span>
                )}
              </span>
            </>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !skills?.length ? (
        <EmptyState
          title="No skills available"
          description={'Skills will appear here once they are loaded from the UAR. Click "Sync Built-ins" to register required skills.'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => {
            const category = categorizeSkill(skill);
            return (
              <div
                key={skill.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSkillClick(skill)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSkillClick(skill);
                  }
                }}
                className={`cursor-pointer rounded-lg border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
                  category.type === "knowme" || category.type === "platform" 
                    ? "border-primary/20" 
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={16} className={category.color} />
                    <div>
                      <h4 className="font-display text-sm font-semibold text-foreground">
                        {skill.name}
                      </h4>
                      <span className={`font-mono text-[9px] uppercase tracking-wider ${category.color}`}>
                        {category.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Configure button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSkillClick(skill);
                      }}
                      className="h-7 w-7 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="View configuration"
                    >
                      <Settings size={14} />
                    </Button>

                    {/* Toggle switch */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(skill.id, skill.enabled);
                      }}
                      disabled={toggleSkill.isPending}
                      aria-label={skill.enabled ? "Disable skill" : "Enable skill"}
                      className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-50 ${
                        skill.enabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-card shadow transition-transform ${
                          skill.enabled ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {skill.description && (
                  <p className="mt-2 font-body text-sm text-muted-foreground line-clamp-3">
                    {skill.description}
                  </p>
                )}

                {/* Show tools preview */}
                {skill.preferred_tools && skill.preferred_tools.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {skill.preferred_tools.slice(0, 3).map((tool) => (
                      <span
                        key={tool}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tool}
                      </span>
                    ))}
                    {skill.preferred_tools.length > 3 && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        +{skill.preferred_tools.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Skill Detail Panel */}
      {selectedSkill && (
        <SkillDetailPanel skill={selectedSkill} onClose={handleCloseDetail} />
      )}
    </div>
  );
}
