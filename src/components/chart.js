/* ====================================
   Chart Components — Canvas-based animated charts
   ==================================== */

/**
 * Draw an animated line chart on canvas
 */
export function drawLineChart(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const {
    data = generateSmoothData(60),
    labels = null,
    lineColor = '#00d4ff',
    gradientStart = 'rgba(0, 212, 255, 0.15)',
    gradientEnd = 'rgba(0, 212, 255, 0)',
    lineWidth = 2,
    animate = true,
    padding = labels ? { top: 20, right: 30, bottom: 40, left: 60 } : { top: 10, right: 10, bottom: 10, left: 10 },
    xSteps = null,
  } = options;

  const w = rect.width - padding.left - padding.right;
  const h = rect.height - padding.top - padding.bottom;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  function getPoint(i) {
    return {
      x: padding.left + (i / (data.length - 1)) * w,
      y: padding.top + h - ((data[i] - min) / range) * h,
    };
  }

  let progress = animate ? 0 : 1;

  function draw() {
    ctx.clearRect(0, 0, rect.width, rect.height);

    const drawCount = Math.floor(data.length * progress);
    if (drawCount < 2) {
      if (progress < 1) {
        progress += 0.02;
        requestAnimationFrame(draw);
      }
      return;
    }

    // Grid and Labels
    if (labels) {
       ctx.fillStyle = 'rgba(0,0,0,0.6)';
       ctx.font = '12px Inter, sans-serif';
       
       // Y axis scale
       ctx.textAlign = 'right';
       for (let i = 0; i <= 4; i++) {
         const yVal = min + (range * i) / 4;
         const yPos = padding.top + h - (i / 4) * h;
         ctx.fillText(yVal.toFixed(2), padding.left - 10, yPos + 4);

         ctx.beginPath();
         ctx.moveTo(padding.left, yPos);
         ctx.lineTo(rect.width - padding.right, yPos);
         ctx.strokeStyle = 'rgba(0,0,0,0.05)';
         ctx.stroke();
       }

       // X axis labels
       ctx.textAlign = 'center';
       const steps = xSteps || Math.min(5, labels.length);
       if (steps > 0) {
         for (let i = 0; i < steps; i++) {
           const idx = steps === 1 ? 0 : Math.floor(i * (labels.length - 1) / (steps - 1));
           if (labels[idx]) {
             const xPos = padding.left + (idx / (data.length - 1)) * w;
             ctx.fillText(labels[idx], xPos, rect.height - padding.bottom + 20);
           }
         }
       }
    }

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, rect.height);
    gradient.addColorStop(0, gradientStart);
    gradient.addColorStop(1, gradientEnd);

    ctx.beginPath();
    let p = getPoint(0);
    ctx.moveTo(p.x, p.y);

    for (let i = 1; i < drawCount; i++) {
      const prev = getPoint(i - 1);
      const curr = getPoint(i);
      const cpx = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }

    // Stroke line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Fill under curve
    const lastPoint = getPoint(drawCount - 1);
    ctx.lineTo(lastPoint.x, rect.height);
    ctx.lineTo(padding.left, rect.height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Glow point at end
    if (progress >= 0.99) {
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = `${lineColor}33`;
      ctx.fill();
    }

    if (progress < 1) {
      progress += 0.02;
      requestAnimationFrame(draw);
    }
  }

  draw();
}

/**
 * Draw a sparkline on canvas
 */
export function drawSparkline(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const {
    data = generateSmoothData(20),
    color = '#00d4ff',
    lineWidth = 1.5,
  } = options;

  const w = rect.width;
  const h = rect.height;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  ctx.beginPath();
  data.forEach((val, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = padding + (h - padding * 2) - ((val - min) / range) * (h - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/**
 * Draw animated donut chart
 */
export function drawDonutChart(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const {
    segments = [
      { value: 45, color: '#00d4ff' },
      { value: 25, color: '#7b61ff' },
      { value: 20, color: '#f59e0b' },
      { value: 10, color: '#10b981' },
    ],
    animate = true,
  } = options;

  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radius = Math.min(cx, cy) - 8;
  const innerRadius = radius * 0.65;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let progress = animate ? 0 : 1;

  function draw() {
    ctx.clearRect(0, 0, rect.width, rect.height);

    let startAngle = -Math.PI / 2;
    const currentTotal = total * progress;
    let drawn = 0;

    segments.forEach((seg) => {
      const segDraw = Math.min(seg.value, Math.max(0, currentTotal - drawn));
      const sweep = (segDraw / total) * Math.PI * 2;

      if (sweep > 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
        ctx.arc(cx, cy, innerRadius, startAngle + sweep, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
      }

      startAngle += (seg.value / total) * Math.PI * 2;
      drawn += seg.value;
    });

    if (progress < 1) {
      progress += 0.025;
      requestAnimationFrame(draw);
    }
  }

  draw();
}

/**
 * Draw animated wave chart for simulator
 */
export function drawSimulatorChart(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const styles = getComputedStyle(document.documentElement);
  const gridColor = styles.getPropertyValue('--border-subtle').trim() || 'rgba(0,0,0,0.08)';
  const textColor = styles.getPropertyValue('--text-tertiary').trim() || 'rgba(0,0,0,0.55)';
  const primaryTextColor = styles.getPropertyValue('--text-secondary').trim() || 'rgba(0,0,0,0.7)';

  const {
    amount = 10000,
    period = 3,
    scenarios: suppliedScenarios = null,
    activeRisk = 'moderate',
  } = options;

  const pointCount = Math.max(13, Math.min(121, period * 12 + 1));
  const defaultScenarios = {
    safe: {
      data: buildProjectionSeries(amount, period, 0.06, 0.12, pointCount, 1),
      color: '#10b981',
      label: 'Safe'
    },
    moderate: {
      data: buildProjectionSeries(amount, period, 0.1, 0.22, pointCount, 2),
      color: '#f59e0b',
      label: 'Moderate'
    },
    aggressive: {
      data: buildProjectionSeries(amount, period, 0.16, 0.36, pointCount, 3),
      color: '#ef4444',
      label: 'Aggressive'
    },
  };

  const scenarios = suppliedScenarios || defaultScenarios;
  let scenarioList = ['safe', 'moderate', 'aggressive']
    .map(key => ({ key, ...scenarios[key] }))
    .filter(scenario => Array.isArray(scenario.data) && scenario.data.length > 1);

  if (scenarioList.length === 0) {
    scenarioList = ['safe', 'moderate', 'aggressive']
      .map(key => ({ key, ...defaultScenarios[key] }));
  }

  const allData = scenarioList.flatMap(scenario => scenario.data);
  const min = Math.min(...allData) * 0.95;
  const max = Math.max(...allData) * 1.05;
  const range = max - min;

  let progress = 0;

  function formatCompactCurrency(value) {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }

  function drawGrid() {
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      const value = max - (range / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.fillText(formatCompactCurrency(value), padding.left - 8, y + 4);
    }

    ctx.textAlign = 'center';
    const labelCount = Math.min(5, period);
    for (let i = 0; i <= labelCount; i++) {
      const year = Math.round((i / Math.max(1, labelCount)) * period);
      const x = padding.left + (year / Math.max(1, period)) * chartW;
      ctx.fillText(`${year}Y`, x, h - 8);
    }
  }

  function drawScenarioLine(scenario) {
    const { data, color, key } = scenario;
    const drawCount = Math.floor(data.length * progress);
    if (drawCount < 2) return;

    ctx.beginPath();
    data.slice(0, drawCount).forEach((val, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - ((val - min) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = color;
    ctx.lineWidth = key === activeRisk ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow
    ctx.strokeStyle = color + '40';
    ctx.lineWidth = key === activeRisk ? 8 : 5;
    ctx.stroke();

    if (progress >= 0.99) {
      const lastValue = data[data.length - 1];
      const lastX = padding.left + chartW;
      const lastY = padding.top + chartH - ((lastValue - min) / range) * chartH;
      ctx.beginPath();
      ctx.arc(lastX, lastY, key === activeRisk ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  function drawLegend() {
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    let x = padding.left;
    const y = padding.top - 6;

    scenarioList.forEach(scenario => {
      ctx.fillStyle = scenario.color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = scenario.key === activeRisk ? primaryTextColor : textColor;
      ctx.fillText(scenario.label, x + 8, y + 4);
      x += ctx.measureText(scenario.label).width + 42;
    });
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    drawGrid();
    drawLegend();

    scenarioList.forEach(drawScenarioLine);

    if (progress < 1) {
      progress += 0.02;
      requestAnimationFrame(frame);
    }
  }

  frame();
}

function buildProjectionSeries(amount, years, annualReturn, annualVolatility, count, phase = 1) {
  const data = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(1, count - 1);
    const trend = amount * Math.pow(1 + annualReturn, t * years);
    const volatilityWave = Math.sin(t * Math.PI * years * 2 + phase) * annualVolatility * 0.055;
    const drawdownWave = Math.cos(t * Math.PI * years * 3 + phase * 0.7) * annualVolatility * 0.025;
    data.push(Math.max(amount * 0.2, trend * (1 + volatilityWave + drawdownWave)));
  }
  return data;
}

/**
 * Generate smooth random data
 */
export function generateSmoothData(count, volatility = 0.5) {
  const data = [50];
  for (let i = 1; i < count; i++) {
    const change = (Math.random() - 0.45) * volatility * 10;
    const value = data[i - 1] + change;
    data.push(Math.max(10, Math.min(90, value)));
  }
  return data;
}

/**
 * Generate growth data for simulator
 */
export function generateGrowthData(count, growth = 1.1, volatility = 0.05) {
  const data = [10000];
  for (let i = 1; i < count; i++) {
    const trend = Math.pow(growth, i / count);
    const noise = 1 + (Math.random() - 0.5) * volatility;
    data.push(data[0] * trend * noise);
  }
  return data;
}
