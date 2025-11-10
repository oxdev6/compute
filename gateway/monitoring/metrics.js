/**
 * Monitoring and Metrics
 * Prometheus-style metrics collection
 */

class Metrics {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byMethod: {},
      },
      latency: {
        sum: 0,
        count: 0,
        buckets: [10, 50, 100, 500, 1000, 5000], // ms
        distribution: {},
      },
      cache: {
        hits: 0,
        misses: 0,
      },
      signatures: {
        generated: 0,
        verified: 0,
        failed: 0,
      },
    };

    // Initialize buckets
    this.metrics.latency.buckets.forEach(bucket => {
      this.metrics.latency.distribution[`le_${bucket}`] = 0;
    });
    this.metrics.latency.distribution['le_inf'] = 0;
  }

  recordRequest(method, success, latency) {
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    if (!this.metrics.requests.byMethod[method]) {
      this.metrics.requests.byMethod[method] = { total: 0, success: 0, errors: 0 };
    }
    this.metrics.requests.byMethod[method].total++;
    if (success) {
      this.metrics.requests.byMethod[method].success++;
    } else {
      this.metrics.requests.byMethod[method].errors++;
    }

    // Record latency
    if (latency !== undefined) {
      this.metrics.latency.sum += latency;
      this.metrics.latency.count++;
      
      // Update buckets
      this.metrics.latency.buckets.forEach(bucket => {
        if (latency <= bucket) {
          this.metrics.latency.distribution[`le_${bucket}`]++;
        }
      });
      this.metrics.latency.distribution['le_inf']++;
    }
  }

  recordCacheHit() {
    this.metrics.cache.hits++;
  }

  recordCacheMiss() {
    this.metrics.cache.misses++;
  }

  recordSignatureGenerated() {
    this.metrics.signatures.generated++;
  }

  recordSignatureVerified(success) {
    if (success) {
      this.metrics.signatures.verified++;
    } else {
      this.metrics.signatures.failed++;
    }
  }

  getMetrics() {
    const avgLatency = this.metrics.latency.count > 0
      ? this.metrics.latency.sum / this.metrics.latency.count
      : 0;

    return {
      ...this.metrics,
      latency: {
        ...this.metrics.latency,
        average: avgLatency,
      },
      uptime: process.uptime(),
      timestamp: Date.now(),
    };
  }

  // Prometheus format
  toPrometheus() {
    const lines = [];
    
    // Requests
    lines.push(`# HELP ens_compute_requests_total Total number of requests`);
    lines.push(`# TYPE ens_compute_requests_total counter`);
    lines.push(`ens_compute_requests_total ${this.metrics.requests.total}`);
    
    lines.push(`# HELP ens_compute_requests_success_total Total successful requests`);
    lines.push(`# TYPE ens_compute_requests_success_total counter`);
    lines.push(`ens_compute_requests_success_total ${this.metrics.requests.success}`);
    
    lines.push(`# HELP ens_compute_requests_errors_total Total failed requests`);
    lines.push(`# TYPE ens_compute_requests_errors_total counter`);
    lines.push(`ens_compute_requests_errors_total ${this.metrics.requests.errors}`);
    
    // Latency
    const avgLatency = this.metrics.latency.count > 0
      ? this.metrics.latency.sum / this.metrics.latency.count
      : 0;
    lines.push(`# HELP ens_compute_latency_seconds Average request latency`);
    lines.push(`# TYPE ens_compute_latency_seconds gauge`);
    lines.push(`ens_compute_latency_seconds ${avgLatency / 1000}`);
    
    // Cache
    lines.push(`# HELP ens_compute_cache_hits_total Total cache hits`);
    lines.push(`# TYPE ens_compute_cache_hits_total counter`);
    lines.push(`ens_compute_cache_hits_total ${this.metrics.cache.hits}`);
    
    lines.push(`# HELP ens_compute_cache_misses_total Total cache misses`);
    lines.push(`# TYPE ens_compute_cache_misses_total counter`);
    lines.push(`ens_compute_cache_misses_total ${this.metrics.cache.misses}`);
    
    return lines.join('\n');
  }
}

// Singleton instance
const metrics = new Metrics();

module.exports = metrics;

