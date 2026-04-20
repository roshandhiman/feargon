import { icons, renderUserProfile } from '../utils/helpers.js';

export function renderFearBreaker(container) {
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
        <h1 class="top-navbar-title">Psychological Fear Profiler</h1>
      </div>
      <div class="top-navbar-actions">
        <button class="notification-btn">${icons.bell}</button>
        ${renderUserProfile()}
      </div>
    </div>

    <div class="dashboard-content">
      <div style="max-width: 900px; margin: 0 auto;">
        <div id="fb-intro" style="text-align: center; padding: 60px 20px;">
           <div class="orb orb-purple" style="margin: 0 auto 24px; width: 120px; height: 120px; filter: blur(40px); opacity: 0.6;"></div>
           <h1 class="text-gradient" style="font-size: 48px; margin-bottom: 16px;">Break Your Investing Fear</h1>
           <p class="text-secondary" style="font-size: 18px; max-width: 600px; margin: 0 auto 40px;">
             Fear is the #1 reason investors lose money. Our AI-driven profiler identifies your psychological stressors and gives you a blueprint to combat them.
           </p>
           <button id="start-quiz" class="btn btn-primary btn-lg" style="padding: 16px 48px;">Begin Assessment</button>
        </div>

        <!-- Quiz Container -->
        <div id="fb-quiz-container" style="display: none; padding-top: 40px;">
          <div class="glass-strong" style="padding: 48px; position: relative; border-radius: 24px; overflow: hidden;">
            <div id="progress-container" style="margin-bottom: 40px;">
               <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px;">
                 <span>ASSESSMENT PROGRESS</span>
                 <span id="progress-text">Question 1/3</span>
               </div>
               <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 3px;">
                 <div id="fb-progress" style="width: 33%; height: 100%; background: var(--gradient-primary); border-radius: 3px; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);"></div>
               </div>
            </div>

            <div id="quiz-content" class="animate-fade-in">
              <h2 id="fb-question" style="font-size: 28px; line-height: 1.4; margin-bottom: 40px; text-align: center;"></h2>
              <div id="fb-options" style="display: grid; gap: 16px;"></div>
            </div>
          </div>
        </div>

        <!-- Final Result -->
        <div id="fb-result-container" style="display: none; padding-bottom: 60px;">
          <div class="glass" style="padding: 0; overflow: hidden; border-radius: 24px;">
            <div style="background: var(--gradient-primary); padding: 60px 40px; text-align: center; color: white;">
               <div id="persona-icon" style="font-size: 64px; margin-bottom: 16px;">🐢</div>
               <h3 style="text-transform: uppercase; letter-spacing: 2px; font-size: 14px; opacity: 0.8; margin-bottom: 8px;">Your Fear Persona is</h3>
               <h2 id="persona-name" style="font-size: 42px; font-weight: 900; margin-bottom: 12px;">The Obsidian Turtle</h2>
               <p id="persona-tagline" style="font-size: 18px; opacity: 0.9; max-width: 500px; margin: 0 auto;"></p>
            </div>
            
            <div style="padding: 40px;">
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 40px;">
                  <div class="glass-strong" style="padding: 24px;">
                    <h4 style="color: var(--accent-purple); font-size: 14px; margin-bottom: 12px;">CORE WEAKNESS</h4>
                    <p id="persona-weakness" style="color: var(--text-secondary); line-height: 1.5;"></p>
                  </div>
                  <div class="glass-strong" style="padding: 24px;">
                    <h4 style="color: var(--accent-cyan); font-size: 14px; margin-bottom: 12px;">AI STRATEGY</h4>
                    <p id="persona-strategy" style="color: var(--text-secondary); line-height: 1.5;"></p>
                  </div>
               </div>

               <div style="background: rgba(123, 97, 255, 0.05); padding: 32px; border-radius: 16px; border: 1px solid rgba(123, 97, 255, 0.2);">
                 <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px;">
                   ${icons.zap}
                   Your Personalized Combat Plan
                 </h3>
                 <ul id="combat-plan" style="display: grid; gap: 12px; color: var(--text-secondary);"></ul>
               </div>

               <div style="margin-top: 40px; display: flex; gap: 16px;">
                 <a href="#/simulator" class="btn btn-primary btn-lg" style="flex: 1; justify-content: center;">Go to Simulator</a>
                 <button id="retake-quiz" class="btn btn-secondary btn-lg">Retake Quiz</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  layout.appendChild(main);
  container.appendChild(layout);

  const mobileSlot = main.querySelector('#mobile-menu-slot');
  mobileSlot.appendChild(createMobileMenuBtn());

  // Quiz Logic
  const intro = main.querySelector('#fb-intro');
  const quizContainer = main.querySelector('#fb-quiz-container');
  const resultContainer = main.querySelector('#fb-result-container');
  const qText = main.querySelector('#fb-question');
  const optsContainer = main.querySelector('#fb-options');
  const progressBar = main.querySelector('#fb-progress');
  const progressText = main.querySelector('#progress-text');

  const questions = [
    {
      q: "Your portfolio is down 20% in a single day due to market panic. What is your gut reaction?",
      opts: [
        { text: "Sell immediately to save what is left. I can't sleep.", score: 1 },
        { text: "Do nothing. I believe it will recover eventually.", score: 5 },
        { text: "This is a sale! I'm buying more with every dollar I have.", score: 10 }
      ]
    },
    {
      q: "A close friend just made 10x ROI on a hype-coin. You missed it. How do you feel?",
      opts: [
        { text: "Happy for them, but I'm sticking to my boring safe plan.", score: 1 },
        { text: "Slightly annoyed. I'll look for the next big project carefully.", score: 5 },
        { text: "Extreme regret. I need to jump into the next thing NOW.", score: 10 }
      ]
    },
    {
      q: "Which scenario sounds more terrifying to you?",
      opts: [
        { text: "Losing 50% of my initial investment in a month.", score: 1 },
        { text: "Staying flat for 5 years while others get rich.", score: 10 }
      ]
    }
  ];

  let currentStep = 0;
  let totalScore = 0;

  main.querySelector('#start-quiz').onclick = () => {
    intro.style.display = 'none';
    quizContainer.style.display = 'block';
    renderQuestion();
  };

  function renderQuestion() {
    const q = questions[currentStep];
    qText.textContent = q.q;
    progressText.textContent = `Question ${currentStep + 1}/${questions.length}`;
    progressBar.style.width = `${((currentStep + 1) / questions.length) * 100}%`;

    optsContainer.innerHTML = '';
    q.opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary fb-option animate-scale-in';
      btn.style.padding = '24px';
      btn.style.textAlign = 'left';
      btn.style.fontSize = '16px';
      btn.style.lineHeight = '1.4';
      btn.innerHTML = `${opt.text}`;
      
      btn.onclick = () => {
        totalScore += opt.score;
        currentStep++;
        if (currentStep < questions.length) {
          renderQuestion();
        } else {
          showResults();
        }
      };
      optsContainer.appendChild(btn);
    });
  }

  function showResults() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    
    const personaName = main.querySelector('#persona-name');
    const personaIcon = main.querySelector('#persona-icon');
    const personaTagline = main.querySelector('#persona-tagline');
    const weakness = main.querySelector('#persona-weakness');
    const strategy = main.querySelector('#persona-strategy');
    const plan = main.querySelector('#combat-plan');

    let pData;
    if (totalScore <= 7) {
      pData = {
        name: "The Obsidian Turtle",
        icon: "🐢",
        tagline: "Driven by the fear of loss. You prioritize absolute security over growth.",
        weakness: "Hyper-conservative bias. You miss out on 90% of market gains due to inaction.",
        strategy: "Statistical exposure. Use our Simulator to realize that 0% risk is actually high-risk due to inflation.",
        steps: [
          "Set up a 10% 'Play Fund' to practice losing small amounts comfortably.",
          "Use the Simulator to map a 10-year growth vs. inflation chart.",
          "Activate 'AutoMode' for low-risk index tracking to remove decision fatigue."
        ]
      };
    } else if (totalScore <= 18) {
      pData = {
        name: "The Calculated Sniper",
        icon: "🎯",
        tagline: "Strategic and patient. You only fear the variables you haven't mapped yet.",
        weakness: "Analysis Paralysis. You often wait for the 'perfect' entry that never comes.",
        strategy: "Binary execution. Use our AI Advisor to validate your entry points and act decisively.",
        steps: [
          "Upload your charts to 'Trade Vision' for secondary validation.",
          "Implement a 'DCA' (Dollar Cost Averaging) strategy to automate entries.",
          "Set strict Take-Profit and Stop-Loss levels in the simulator."
        ]
      };
    } else {
      pData = {
        name: "The Fearless Raider",
        icon: "⚡",
        tagline: "Driven by the fear of missing out (FOMO). You are a high-octane opportunist.",
        weakness: "Over-leveraging and emotional chasing. You risk total liquidation for quick dopamine.",
        strategy: "Emotional Decoupling. You need systemic boundaries to protect your capital from your own impulses.",
        steps: [
          "Run 'Worst Case' simulations before every trade to ground your expectations.",
          "Cap single-asset exposure to maximum 15% of total portfolio.",
          "Consult the AI Advisor's 'Risk Probability' score before clicking Buy."
        ]
      };
    }

    personaName.textContent = pData.name;
    personaIcon.textContent = pData.icon;
    personaTagline.textContent = pData.tagline;
    weakness.textContent = pData.weakness;
    strategy.textContent = pData.strategy;
    plan.innerHTML = pData.steps.map(s => `<li>• ${s}</li>`).join('');
  }

  main.querySelector('#retake-quiz').onclick = () => {
    currentStep = 0;
    totalScore = 0;
    resultContainer.style.display = 'none';
    intro.style.display = 'block';
  };
}
