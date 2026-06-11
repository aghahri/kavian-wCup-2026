type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="mt-4 text-base font-semibold text-white">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-white/60">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
