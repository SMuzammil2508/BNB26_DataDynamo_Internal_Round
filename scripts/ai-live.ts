import {
  generateHooks,
  suggestClips,
  adaptContent,
  matchScriptToFootage,
  buildEditDecisionList,
  generateCreatorInsights,
  runCreatorPipeline,
} from "../src/lib/ai/services";

async function runLiveBenchmark() {
  console.log("=== CreatorAI AI Live Execution Benchmark ===");
  const sampleScript =
    "Most creators spend 80% of their time editing and only 20% creating. " +
    "Today I am sharing the exact AI automation stack that cuts video production time in half. " +
    "Step 1: Automated transcription and beat matching. " +
    "Step 2: Scroll-stopping hook generation tailored per platform. " +
    "Step 3: Instant EDL timeline export for Premiere and CapCut. " +
    "Try this workflow today and watch your output scale.";

  const sampleTranscript =
    "[00:00] Stop spending all your time editing footage. " +
    "[00:12] The 80-20 rule that holds back most creators. " +
    "[00:30] Step 1: Hook generation and transcript sync. " +
    "[00:55] Step 2: Instant multi-platform adaptations. " +
    "[01:25] Final export and workflow summary.";

  async function measure<T>(name: string, fn: () => Promise<T>): Promise<void> {
    const start = performance.now();
    try {
      const result = await fn();
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      console.log(`PASS: ${name} (${elapsed}s)`);
    } catch (err) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      console.log(`FAIL: ${name} (${elapsed}s) - Error: ${err instanceof Error ? err.message : "Unknown"}`);
    }
  }

  await measure("generateHooks", () => generateHooks(sampleScript));
  await measure("suggestClips", () => suggestClips(sampleScript, sampleTranscript));
  await measure("adaptContent", () => adaptContent(sampleScript, ["youtube_shorts", "tiktok", "linkedin"]));
  await measure("matchScriptToFootage", () => matchScriptToFootage(sampleScript, sampleTranscript));
  await measure("generateCreatorInsights", () =>
    generateCreatorInsights([
      {
        title: "AI Editing Masterclass",
        platform: "youtube_shorts",
        views: 50000,
        likes: 4200,
        comments: 310,
        shares: 600,
        durationSeconds: 45,
        publishedAt: "2026-10-01",
      },
    ])
  );
  await measure("runCreatorPipeline", () =>
    runCreatorPipeline({
      script: sampleScript,
      transcript: sampleTranscript,
      platforms: ["youtube_shorts", "tiktok"],
    })
  );

  console.log("Live execution benchmark completed.");
  process.exit(0);
}

runLiveBenchmark();
