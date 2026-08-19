#!/usr/bin/env node

const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const durationSeconds = Number(process.env.DURATION_SECONDS || 30);
const concurrency = Number(process.env.CONCURRENCY || 300);
const targetPath = process.env.TARGET_PATH || '/health';

const results = [];
let stop = false;
const startedAt = Date.now();

async function worker() {
  while (!stop) {
    const requestStarted = performance.now();
    try {
      const response = await fetch(`${baseUrl}${targetPath}`);
      await response.arrayBuffer();
      results.push({
        ok: response.ok,
        status: response.status,
        latencyMs: performance.now() - requestStarted,
      });
    } catch (error) {
      results.push({ ok: false, status: 0, latencyMs: performance.now() - requestStarted, error });
    }
  }
}

const workers = Array.from({ length: concurrency }, () => worker());
setTimeout(() => { stop = true; }, durationSeconds * 1000);
await Promise.all(workers);

const elapsedSeconds = (Date.now() - startedAt) / 1000;
const successful = results.filter((result) => result.ok);
const failed = results.length - successful.length;
const sortedLatencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
const percentile = (value) => sortedLatencies[Math.min(sortedLatencies.length - 1, Math.floor(sortedLatencies.length * value))] || 0;

console.log(JSON.stringify({
  baseUrl,
  path: targetPath,
  durationSeconds: elapsedSeconds,
  concurrency,
  requests: results.length,
  successful: successful.length,
  failed,
  throughputRps: Number((results.length / elapsedSeconds).toFixed(2)),
  latencyMs: {
    p50: Number(percentile(0.5).toFixed(2)),
    p95: Number(percentile(0.95).toFixed(2)),
    p99: Number(percentile(0.99).toFixed(2)),
    max: Number((sortedLatencies.at(-1) || 0).toFixed(2)),
  },
}, null, 2));
