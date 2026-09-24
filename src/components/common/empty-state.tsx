interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="mb-2 font-display text-xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="mb-6 font-body text-sm text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  );
}
