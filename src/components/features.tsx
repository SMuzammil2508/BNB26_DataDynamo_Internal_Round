import React from "react";

interface FeatureItemProps {
  title: string;
  description: string;
  badge: string;
}

export function FeatureCard({ title, description, badge }: FeatureItemProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
          {badge}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
