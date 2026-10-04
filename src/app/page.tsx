import { prisma } from "@/server/db";
import { FeatureCard } from "@/components";

export default async function HomePage() {
  let dbStatus = "Connected";
  let count = 0;

  try {
    count = await prisma.project.count();
  } catch {
    dbStatus = "Connection error";
  }

  const structureItems = [
    {
      title: "/src/components",
      description: "Reusable UI components, layouts, and design system elements.",
      badge: "UI Layer",
    },
    {
      title: "/src/lib",
      description: "Client & shared utilities, Prisma singleton, and third-party integrations.",
      badge: "Core Lib",
    },
    {
      title: "/src/server",
      description: "Server-only logic, database access modules, and backend operations.",
      badge: "Server Layer",
    },
    {
      title: "/src/types",
      description: "Shared TypeScript interfaces, schemas, and type definitions.",
      badge: "Type System",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-8 sm:p-16">
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            Next.js App Router + Prisma
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            TypeScript &bull; Tailwind CSS v3 &bull; SQLite Local Dev
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3.5 py-1.5 text-xs">
          <span className="text-zinc-400">Database:</span>
          <span className="font-semibold text-emerald-400">{dbStatus}</span>
          <span className="text-zinc-600">({count} records)</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full my-12 space-y-10">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-zinc-200">Configured Directory Structure</h2>
          <p className="text-sm text-zinc-400">
            The requested architecture is established and ready for feature development:
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
            {structureItems.map((item) => (
              <FeatureCard
                key={item.title}
                title={item.title}
                description={item.description}
                badge={item.badge}
              />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h2 className="text-base font-medium text-zinc-200">Prisma SQLite Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Provider</span>
              <span className="text-zinc-200">SQLite (dev.db)</span>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Prisma Client</span>
              <span className="text-zinc-200">src/lib/prisma.ts</span>
            </div>
            <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block mb-1">Server Access</span>
              <span className="text-zinc-200">src/server/db.ts</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto w-full border-t border-zinc-800 pt-6 text-center text-xs text-zinc-500">
        Initialized with Next.js App Router, Tailwind CSS v3, TypeScript, and Prisma (SQLite).
      </footer>
    </div>
  );
}
