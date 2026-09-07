/**
 * Usage:
 *   1. Deploy the [metrics-latency] logging added to getDashboardMetrics.
 *   2. Load the dashboard ~30-50 times (mix of cache hits and misses -
 *      wait 30s between some loads to force cache expiry, hit rapidly
 *      back-to-back for others to capture hits).
 *   3. In Vercel logs, filter on "[metrics-latency] cache_hit" and copy
 *      the duration numbers into CACHE_HIT_SAMPLES_MS below. Repeat for
 *      cache_miss.
 *   4. Run: npx tsx scripts/compute-percentiles.ts
 */

const CACHE_HIT_SAMPLES_MS: number[] = [
    // paste real numbers here, e.g. 0.8, 0.9, 1.1, 0.7, ...
]

const CACHE_MISS_SAMPLES_MS: number[] = [
    // paste real numbers here, e.g. 22.1, 24.5, 31.2, ...
]

function percentile(samples: number[], p: number): number {
    if (samples.length === 0) return NaN
    const sorted = [...samples].sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
}

function summarize(label: string, samples: number[]) {
    if (samples.length === 0) {
        console.log(`${label}: no samples provided`)
        return
    }
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length
    console.log(`\n${label} (n=${samples.length})`)
    console.log(`  mean: ${mean.toFixed(2)}ms`)
    console.log(`  p50:  ${percentile(samples, 50).toFixed(2)}ms`)
    console.log(`  p95:  ${percentile(samples, 95).toFixed(2)}ms`)
    console.log(`  p99:  ${percentile(samples, 99).toFixed(2)}ms`)
    console.log(`  max:  ${Math.max(...samples).toFixed(2)}ms`)
}

summarize('cache_hit', CACHE_HIT_SAMPLES_MS)
summarize('cache_miss', CACHE_MISS_SAMPLES_MS)