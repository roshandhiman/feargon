/* ====================================
   Trade Vision - AI Graph Analysis
   ==================================== */

import { createSidebar, createMobileMenuBtn } from '../components/sidebar.js';
import { icons } from '../utils/helpers.js';
import { analyzeGraphVision } from '../utils/gemini.js';

export function renderTradeAnalysis(container) {
  container.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'dashboard-layout';

  const sidebar = createSidebar();
  layout.appendChild(sidebar);

  const main = document.createElement('div');
  main.className = 'main-content';

  main.innerHTML = `
    <div class="top-navbar">
      <div style="display:flex;align-items:center;gap:var(--space-3);">
        <div id="mobile-menu-slot"></div>
        <h1 class="top-navbar-title">Trade Vision AI</h1>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="glass" style="margin-bottom: var(--space-6); padding: var(--space-4); border-left: 4px solid var(--accent-purple); background: rgba(123, 97, 255, 0.1);">
        <p style="color: var(--accent-purple); font-weight: 600; font-size: var(--text-sm);">
          🚀 Multimodal Analysis: Upload any trading chart (Binomo, Quotex, Stocks, Crypto) and let Gemini predict the next move.
        </p>
      </div>

      <div class="trade-vision-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Upload Section -->
        <div class="glass" style="padding: 24px;">
          <h2 style="margin-bottom: 16px;">Step 1: Upload Screenshot</h2>
          <div id="drop-zone" style="border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s ease;">
             <div style="font-size: 40px; margin-bottom: 16px; opacity: 0.5;">🖼️</div>
             <p style="color: var(--text-secondary);">Click or Drag & Drop a chart screenshot</p>
             <p style="font-size: 10px; color: var(--text-tertiary); margin-top: 8px;">Supports PNG, JPG, WEBP</p>
             <input type="file" id="file-input" style="display:none;" accept="image/*" />
          </div>
          
          <div id="preview-container" style="display:none; margin-top: 20px;">
            <img id="image-preview" style="width:100%; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);" />
            <button id="reset-image" class="btn btn-secondary" style="margin-top: 12px; width: 100%;">Change Image</button>
          </div>

          <div style="margin-top: 24px;">
            <label style="display:block; font-size: 12px; margin-bottom: 8px; color: var(--text-secondary);">Mode</label>
            <div class="risk-toggle" id="trade-mode-toggle">
              <button class="risk-level-btn active safe" data-mode="intraday">Intraday</button>
              <button class="risk-level-btn moderate" data-mode="binary">Binary (1m/5m)</button>
              <button class="risk-level-btn aggressive" data-mode="crypto">Scalping</button>
            </div>
          </div>

          <button id="analyze-btn" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 24px; justify-content: center; gap: 12px;" disabled>
            ${icons.zap}
            Analyze Market
          </button>
        </div>

        <!-- Result Section -->
        <div class="glass" style="padding: 24px; position: relative;">
          <h2 style="margin-bottom: 16px;">Step 2: AI Verdict</h2>
          <div id="result-placeholder" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; color: var(--text-tertiary); min-height: 300px;">
             ${icons.sparkles}
             <p style="margin-top: 16px;">Upload a chart to receive AI-driven trade predictions.</p>
          </div>

          <div id="result-content" style="display:none;">
             <div id="prediction-badge" style="padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 32px; text-align: center; margin-bottom: 24px;">
               CALL (UP)
             </div>
             
             <div class="sim-field">
               <div class="sim-field-label">
                 <span>System Confidence</span>
                 <span id="confidence-val">85%</span>
               </div>
               <div class="risk-meter-bar" style="height: 8px;">
                 <div id="confidence-bar" class="risk-meter-fill" style="width: 85%;"></div>
               </div>
             </div>

             <div style="margin-top: 24px;">
               <h4 style="color: var(--accent-purple); margin-bottom: 8px; font-size: 14px;">Reasoning:</h4>
               <p id="ai-reasoning" style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;"></p>
             </div>

             <div style="margin-top: 24px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 8px; border-left: 3px solid #ef4444;">
               <p style="font-size: 11px; color: #fca5a5; line-height: 1.4;" id="ai-disclaimer"></p>
             </div>
          </div>
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  // Mobile menu
  const mobileSlot = main.querySelector('#mobile-menu-slot');
  mobileSlot.appendChild(createMobileMenuBtn());

  // Page Logic
  const dropZone = main.querySelector('#drop-zone');
  const fileInput = main.querySelector('#file-input');
  const previewContainer = main.querySelector('#preview-container');
  const imagePreview = main.querySelector('#image-preview');
  const analyzeBtn = main.querySelector('#analyze-btn');
  const resetBtn = main.querySelector('#reset-image');
  const resultPlaceholder = main.querySelector('#result-placeholder');
  const resultContent = main.querySelector('#result-content');

  let base64Image = null;
  let tradeType = 'intraday';

  // Drop zone events
  dropZone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      base64Image = e.target.result;
      imagePreview.src = base64Image;
      dropZone.style.display = 'none';
      previewContainer.style.display = 'block';
      analyzeBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  resetBtn.addEventListener('click', () => {
    base64Image = null;
    dropZone.style.display = 'block';
    previewContainer.style.display = 'none';
    analyzeBtn.disabled = true;
    resultPlaceholder.style.display = 'flex';
    resultContent.style.display = 'none';
  });

  // Mode Toggles
  const modeBtns = main.querySelectorAll('.risk-level-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tradeType = btn.dataset.mode;
    });
  });

  // Analyze
  analyzeBtn.addEventListener('click', async () => {
    if (!base64Image) return;

    analyzeBtn.innerHTML = `<span class="loading-spinner"></span> AI is reading chart...`;
    analyzeBtn.disabled = true;
    
    const result = await analyzeGraphVision(base64Image, tradeType);

    if (result) {
      resultPlaceholder.style.display = 'none';
      resultContent.style.display = 'block';
      
      const badge = main.querySelector('#prediction-badge');
      const isBuy = result.prediction.toUpperCase() === 'BUY' || result.prediction.toUpperCase() === 'UP';
      
      badge.textContent = isBuy ? 'CALL (UP)' : 'PUT (DOWN)';
      badge.style.background = isBuy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      badge.style.color = isBuy ? '#10b981' : '#ef4444';
      badge.style.border = `1px solid ${isBuy ? '#10b981' : '#ef4444'}`;

      main.querySelector('#confidence-val').textContent = `${result.confidence}%`;
      main.querySelector('#confidence-bar').style.width = `${result.confidence}%`;
      main.querySelector('#confidence-bar').style.background = isBuy ? '#10b981' : '#ef4444';
      main.querySelector('#ai-reasoning').textContent = result.reasoning;
      main.querySelector('#ai-disclaimer').textContent = result.disclaimer;
    }

    analyzeBtn.innerHTML = `${icons.zap} Analysis Complete`;
    setTimeout(() => {
        analyzeBtn.innerHTML = `${icons.zap} Re-Analyze`;
        analyzeBtn.disabled = false;
    }, 3000);
  });
}
