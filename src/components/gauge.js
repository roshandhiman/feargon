/* ====================================
   Gauge Component — SVG-based confidence/risk gauge
   ==================================== */

/**
 * Create a semicircular gauge
 * @param {Object} options
 * @param {number} options.value - 0 to 100
 * @param {string} options.label - displayed below value
 * @param {string} options.size - 'sm' | 'md' | 'lg'
 */
export function createGauge(options = {}) {
  const {
    value = 72,
    label = 'Confidence Score',
    size = 'md',
  } = options;

  const sizes = {
    sm: { w: 120, h: 70, r: 45, sw: 8 },
    md: { w: 160, h: 90, r: 60, sw: 10 },
    lg: { w: 200, h: 110, r: 75, sw: 12 },
  };

  const s = sizes[size];
  const cx = s.w / 2;
  const cy = s.h;
  const circumference = Math.PI * s.r;
  const offset = circumference - (value / 100) * circumference;

  // Color based on value
  let color = '#10b981'; // green
  if (value < 40) color = '#ef4444'; // red
  else if (value < 70) color = '#f59e0b'; // yellow

  const container = document.createElement('div');
  container.className = 'gauge-container';

  container.innerHTML = `
    <svg class="gauge-svg" width="${s.w}" height="${s.h + 10}" viewBox="0 0 ${s.w} ${s.h + 10}">
      <!-- Track -->
      <path
        d="M ${cx - s.r} ${cy} A ${s.r} ${s.r} 0 0 1 ${cx + s.r} ${cy}"
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        stroke-width="${s.sw}"
        stroke-linecap="round"
      />
      <!-- Value arc -->
      <path
        d="M ${cx - s.r} ${cy} A ${s.r} ${s.r} 0 0 1 ${cx + s.r} ${cy}"
        fill="none"
        stroke="${color}"
        stroke-width="${s.sw}"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        style="transition: stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1); filter: drop-shadow(0 0 6px ${color}40);"
      />
    </svg>
    <div class="gauge-label" style="color: ${color}">${value}</div>
    <div class="gauge-sublabel">${label}</div>
  `;

  return container;
}
