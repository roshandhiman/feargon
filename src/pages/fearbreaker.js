export function renderFearBreaker(container) {
  container.innerHTML = `
    <!-- Top Nav -->
    <div class="top-nav">
      <div class="user-profile">
        <div class="user-avatar" id="nav-avatar">U</div>
        <div class="user-info">
          <div class="user-name" id="nav-username">User</div>
          <div class="user-status">Investor</div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container animate-fade-in" style="max-width: 800px; padding-top: var(--space-8);">
      <div class="content-header" style="text-align: center; margin-bottom: var(--space-12);">
        <h1 class="text-gradient" style="font-size: var(--text-5xl); margin-bottom: var(--space-4);">Discover Your Fear Profile</h1>
        <p class="text-secondary" style="max-width: 600px; margin: 0 auto; font-size: var(--text-lg);">
          Investing fear comes from the unknown. Take this 3-question psychology assessment to identify your stress triggers, reveal your personal Fear Persona, and let our AI build a combat strategy.
        </p>
      </div>

      <!-- Quiz Stage -->
      <div id="fb-quiz-stage" class="glass-strong" style="padding: var(--space-10); text-align: center; position: relative; overflow: hidden;">
        <div class="orb orb-purple" style="top: -20%; left:-10%; width: 200px; height: 200px;"></div>
        
        <div class="progress-bar mb-8" style="background: var(--bg-card); height: 8px; border-radius: 4px; overflow: hidden;">
          <div id="fb-progress" style="width: 33%; height: 100%; background: var(--gradient-primary); transition: width 0.3s ease;"></div>
        </div>

        <h3 id="fb-question" style="font-size: var(--text-2xl); margin-bottom: var(--space-8); position: relative; z-index: 1;">
          Question 1: The market crashes 20% in an hour. Your first instinct is to:
        </h3>

        <div class="grid grid-3" id="fb-options" style="position: relative; z-index: 1;">
          <button class="btn btn-secondary fb-option" data-score="1" style="height: auto; min-height: 80px; white-space: normal;">Panic sell to prevent further losses</button>
          <button class="btn btn-secondary fb-option" data-score="5" style="height: auto; min-height: 80px; white-space: normal;">Hold and wait for it to recover</button>
          <button class="btn btn-secondary fb-option" data-score="10" style="height: auto; min-height: 80px; white-space: normal;">Buy the dip aggressively</button>
        </div>
      </div>

      <!-- Result Stage -->
      <div id="fb-result-stage" style="display: none;">
        <div class="glass-strong" style="padding: var(--space-10); text-align: center;">
          <div class="badge badge-warning mb-4"><span class="pulse-dot"></span> Analysis Complete</div>
          <h2 class="text-3xl mb-2">You are <span id="fb-persona" class="text-gradient">The Strategic Holding</span></h2>
          <p class="mb-8 text-secondary" id="fb-description">Your fear response is highly controlled. You trust data over emotion.</p>
          
          <div class="radar-mockup mb-8" style="position: relative; height: 200px; display: flex; align-items: center; justify-content: center;">
             <div style="width: 150px; height: 150px; border-radius: 50%; border: 2px dashed rgba(255, 255, 255, 0.2); position: absolute; animation: spin-slow 20s linear infinite;"></div>
             <div style="width: 100px; height: 100px; border-radius: 50%; border: 2px dashed rgba(255, 255, 255, 0.4); position: absolute; animation: spin-slow 15s linear infinite reverse;"></div>
             <div class="orb orb-cyan" style="width: 80px; height: 80px; filter: blur(30px);"></div>
             <div style="z-index: 2; font-weight: 800; font-size: 24px; color: var(--accent-cyan); text-shadow: 0 0 10px rgba(0,212,255,0.8);">CONFIDENCE MATCH</div>
          </div>

          <div style="background: var(--bg-card); padding: var(--space-6); border-radius: var(--radius-lg); margin-bottom: var(--space-8); text-align: left;">
            <h4 class="mb-4 flex items-center gap-2"><svg width="20" height="20" fill="none" stroke="var(--accent-purple)" stroke-width="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> AI Combat Plan</h4>
            <ul style="color: var(--text-secondary); margin-left: 20px; list-style: disc;">
              <li class="mb-2">Run simulations on extreme high-volatility assets first.</li>
              <li class="mb-2">Map out the absolute worst-case scenario visually.</li>
              <li>Remove emotional trading by activating AutoMode for 1 week.</li>
            </ul>
          </div>

          <a href="#/simulator" class="btn btn-primary btn-lg" style="width: 100%;">Initialize Confidence Simulation</a>
        </div>
      </div>
    </div>
  `;

  // --- Logic ---
  const questions = [
    {
      q: "Question 1: The market crashes 20% in an hour. Your first instinct is to:",
      opts: [
        { t: "Panic sell everything", s: 1 },
        { t: "Hold and wait", s: 5 },
        { t: "Buy the dip aggressively", s: 10 }
      ]
    },
    {
      q: "Question 2: You hear a friend doubled their money on a meme coin. You...",
      opts: [
        { t: "Ignore it. Too risky.", s: 1 },
        { t: "Research the fundamentals first", s: 5 },
        { t: "Immediately invest $1000", s: 10 }
      ]
    },
    {
      q: "Question 3: When thinking about your retirement fund, you prioritize:",
      opts: [
        { t: "Zero risk of losing principal", s: 1 },
        { t: "Steady, moderate growth", s: 5 },
        { t: "Maximum potential returns", s: 10 }
      ]
    }
  ];

  let currentQ = 0;
  let totalScore = 0;

  const quizStage = container.querySelector('#fb-quiz-stage');
  const resultStage = container.querySelector('#fb-result-stage');
  const qText = container.querySelector('#fb-question');
  const optsContainer = container.querySelector('#fb-options');
  const progressBar = container.querySelector('#fb-progress');

  function renderQuestion(idx) {
    if (idx >= questions.length) {
      showResults();
      return;
    }
    const q = questions[idx];
    qText.textContent = q.q;
    progressBar.style.width = `${((idx + 1) / questions.length) * 100}%`;
    
    optsContainer.innerHTML = '';
    q.opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary fb-option animate-fade-in-up';
      btn.style.height = 'auto';
      btn.style.minHeight = '80px';
      btn.style.whiteSpace = 'normal';
      btn.textContent = opt.t;
      btn.dataset.score = opt.s;
      
      btn.addEventListener('click', () => {
        totalScore += opt.s;
        currentQ++;
        renderQuestion(currentQ);
      });
      optsContainer.appendChild(btn);
    });
  }

  function showResults() {
    quizStage.style.display = 'none';
    resultStage.style.display = 'block';
    resultStage.classList.add('animate-fade-in');

    const personaEl = container.querySelector('#fb-persona');
    const descEl = container.querySelector('#fb-description');

    if (totalScore <= 6) {
      personaEl.textContent = "The Cautious Saver";
      descEl.textContent = "Your primary fear is wealth destruction. You need our Simulator to prove that controlled minimal risks mathematically outperform inflation.";
    } else if (totalScore <= 18) {
      personaEl.textContent = "The Strategic Balancer";
      descEl.textContent = "You fear unpredictable volatility rather than risk itself. AutoMode will be your best friend by systematically managing your exposure.";
    } else {
      personaEl.textContent = "The FOMO Victim";
      descEl.textContent = "You don't fear losing money, you fear missing out. Your biggest risk is overexposure. The AI Advisor will help you construct disciplined boundaries.";
    }
  }

  renderQuestion(currentQ);
}
