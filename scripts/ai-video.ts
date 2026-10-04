import fs from "node:fs";
import path from "node:path";
import { analyzeVideo, runCreatorPipeline } from "../src/lib/ai/services";

async function main() {
  const videoArg = process.argv[2] ?? "./sample.mp4";

  console.log("=== CreatorAI Video E2E Pipeline Script ===");

  const resolvedPath = path.resolve(videoArg);
  const exists = fs.existsSync(resolvedPath);

  console.log(`Target Video: ${videoArg}`);
  console.log(`File Exists: ${exists}`);

  // Script matching the "Power of Small Habits" video theme
  const sampleScript =
    "Most people fail at their goals because they try to change everything overnight. " +
    "The secret isn't massive action—it's the compounding power of small daily habits. " +
    "When you improve just 1% each day, you become 37 times better in a year. " +
    "Focus on identity-based habits, start small, and stay consistent.";

  // Step 1: analyzeVideo
  console.log("\n[1/2] Running analyzeVideo...");
  const t0 = performance.now();
  const videoAnalysis = await analyzeVideo({
    filePath: exists ? resolvedPath : undefined,
    fileUri: !exists && videoArg ? videoArg : undefined,
    mimeType: "video/mp4",
  });
  const t1 = performance.now();
  const analyzeLatency = ((t1 - t0) / 1000).toFixed(2);
  console.log(`analyzeVideo Latency: ${analyzeLatency}s`);

  const transcriptLines = (videoAnalysis.transcript || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  console.log(`\nTranscript (first 10 lines, total ${transcriptLines.length} lines):`);
  if (transcriptLines.length === 0) {
    console.log("  (No transcript lines generated / fallback returned empty transcript)");
  } else {
    transcriptLines.slice(0, 10).forEach((line, idx) => {
      console.log(`  ${idx + 1}: ${line}`);
    });
  }

  console.log(`\nScene Count: ${videoAnalysis.scenes.length}`);
  if (videoAnalysis.scenes.length > 0) {
    videoAnalysis.scenes.slice(0, 5).forEach((scene, idx) => {
      console.log(`  Scene ${idx + 1} [${scene.startTime} - ${scene.endTime}]: ${scene.description}`);
    });
  }

  // Step 2: runCreatorPipeline
  console.log("\n[2/2] Running runCreatorPipeline...");
  const t2 = performance.now();
  const pipelineResult = await runCreatorPipeline({
    script: sampleScript,
    video: {
      filePath: exists ? resolvedPath : undefined,
      fileUri: !exists && videoArg ? videoArg : undefined,
      mimeType: "video/mp4",
    },
    transcript: videoAnalysis.transcript || undefined,
    platforms: ["youtube_shorts", "tiktok", "instagram_reels"],
  });
  const t3 = performance.now();
  const pipelineLatency = ((t3 - t2) / 1000).toFixed(2);
  console.log(`runCreatorPipeline Latency: ${pipelineLatency}s`);

  console.log("\n--- Per-Step Execution Source & Provider ---");
  console.log(`  Video Analysis: ${pipelineResult.source.videoAnalysis ?? "N/A"} (${pipelineResult.provider.videoAnalysis ?? "N/A"})`);
  console.log(`  Generate Hooks: ${pipelineResult.source.generateHooks} (${pipelineResult.provider.generateHooks})`);
  console.log(`  Suggest Clips:  ${pipelineResult.source.suggestClips} (${pipelineResult.provider.suggestClips})`);
  console.log(`  Match Footage:  ${pipelineResult.source.matchScriptToFootage} (${pipelineResult.provider.matchScriptToFootage})`);
  console.log(`  Adapt Content:  ${pipelineResult.source.adaptContent} (${pipelineResult.provider.adaptContent})`);

  console.log("\nSuggested Clips:");
  if (pipelineResult.clips.length === 0) {
    console.log("  (No clips generated)");
  } else {
    pipelineResult.clips.forEach((clip, idx) => {
      console.log(`  Clip ${idx + 1} [${clip.startTime} - ${clip.endTime}] (Conf: ${clip.confidence}): ${clip.title}`);
    });
  }

  console.log("\nMatched Script Beats:");
  if (pipelineResult.matches.length === 0) {
    console.log("  (No script matches)");
  } else {
    pipelineResult.matches.forEach((m, idx) => {
      console.log(`  Beat ${idx + 1} [${m.startTime} - ${m.endTime}] (Score: ${m.matchScore}): ${m.scriptBeat}`);
    });
  }

  console.log("\nPipeline Warnings:");
  if (pipelineResult.warnings.length === 0) {
    console.log("  (None)");
  } else {
    pipelineResult.warnings.forEach((w, idx) => {
      console.log(`  Warning ${idx + 1}: ${w}`);
    });
  }

  console.log("\n=== Video E2E Execution Complete ===");
}

main().catch((err) => {
  console.error("Fatal error in video e2e script:", err);
  process.exit(1);
});
