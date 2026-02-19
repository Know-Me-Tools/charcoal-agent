import { useSkills, useUpdateSkill } from "@/hooks/use-skills";
import { SectionLabel } from "@/components/common/section-label";
import { SkeletonCard } from "@/components/common/skeleton-loader";
import { EmptyState } from "@/components/common/empty-state";
import { Wrench } from "lucide-react";

export default function SkillsPage() {
  const { data: skills, isLoading } = useSkills();
  const updateSkill = useUpdateSkill();

  const handleToggle = (id: string, enabled: boolean) => {
    updateSkill.mutate({ id, enabled: !enabled });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6">
        <SectionLabel>Skills Library</SectionLabel>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
          Skills
        </h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !skills?.length ? (
        <EmptyState
          title="No skills available"
          description="Skills will appear here when configured in the backend."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-primary" />
                  <h4 className="font-display text-sm font-semibold text-foreground">
                    {skill.name}
                  </h4>
                </div>
                <button
                  onClick={() => handleToggle(skill.id, skill.enabled)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    skill.enabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-card transition-transform ${
                      skill.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                {skill.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
