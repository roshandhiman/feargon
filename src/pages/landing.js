/* ====================================
   Landing Page
   ==================================== */

import { drawLineChart, generateSmoothData } from '../components/chart.js';
import { initScrollAnimations } from '../utils/animations.js';
import { icons } from '../utils/helpers.js';
import { initASMRBackground } from '../components/asmr.js';

export function renderLanding(container) {
  container.innerHTML = `
    <!-- Navbar -->
    <nav class="landing-nav" id="landing-nav">
      <div class="nav-inner">
        <a href="#/" class="nav-logo">
          <img src="/logo.jpeg" alt="Fearless Invest Logo" class="nav-logo-icon" style="border-radius: 8px; object-fit: cover;" />
          <span class="text-gradient">Feargon</span>
        </a>
        <div class="nav-links">
          <span class="nav-link" data-scroll="features">Features</span>
          <span class="nav-link" data-scroll="how">How it Works</span>
          <span class="nav-link" data-scroll="preview">Preview</span>
        </div>
        <div class="nav-actions">
          <a href="#/auth" class="btn btn-ghost btn-sm">Log In</a>
          <a href="#/auth" class="btn btn-primary btn-sm">Get Started</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero" style="background: #0a0a0c;">
      <div class="hero-bg">
        <canvas id="hero-asmr-canvas" class="hero-bg-canvas" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; pointer-events: none;"></canvas>
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="hero-badge-dot"></span>
          AI-Powered Investment Platform
        </div>
        <h1>
          <span class="hero-gradient-1">Invest Without</span><br/>
          <span class="hero-gradient-2">Fear</span>
        </h1>
        <p class="hero-subtitle text-orange-100">
          AI-powered simulation that shows you the real risk before you invest. 
          See every scenario, understand every outcome, invest with confidence.
        </p>
        <div class="hero-actions">
          <a href="#/dashboard" class="btn btn-hero-primary btn-lg" id="hero-cta-primary">Start Investing</a>
          <a href="#/simulator" class="btn btn-hero-secondary btn-lg" id="hero-cta-demo">Try Simulator</a>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <div class="hero-stat-value hero-gradient-1">Soon</div>
            <div class="hero-stat-label text-orange-100">Public Launch</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-value hero-gradient-1">Soon</div>
            <div class="hero-stat-label text-orange-100">Live Trading</div>
          </div>
          <div class="hero-stat">
            <div class="hero-stat-value hero-gradient-2">Waitlist</div>
            <div class="hero-stat-label text-orange-100">Mobile App</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features-section section" id="features">
      <div class="container">
        <div class="reveal">
          <span class="section-label">Features</span>
          <h2 class="section-title">Everything you need to invest <span class="text-gradient">Feargon</span></h2>
          <p class="section-desc">Powered by advanced AI and real-time simulations to help you make informed decisions.</p>
        </div>
        <div class="grid grid-4" id="feature-cards">
          <div class="feature-card glass hover-lift" data-aos="fade-up" data-aos-duration="3000">
            <div class="feature-icon">
              ${icons.brain}
            </div>
            <h3>AI Advisor</h3>
            <p>Get personalized investment advice powered by machine learning that understands your goals and risk profile.</p>
          </div>
          <div class="feature-card glass hover-lift" data-aos="fade-up" data-aos-duration="3000" data-aos-delay="100">
            <div class="feature-icon">
              ${icons.shield}
            </div>
            <h3>Risk Simulator</h3>
            <p>Visualize every possible outcome before you invest. See best case, worst case, and everything in between.</p>
          </div>
          <div class="feature-card glass hover-lift" data-aos="fade-up" data-aos-duration="3000" data-aos-delay="200">
            <div class="feature-icon">
              ${icons.target}
            </div>
            <h3>Portfolio Intelligence</h3>
            <p>Smart portfolio analysis with real-time risk scoring, diversification insights, and rebalancing recommendations.</p>
          </div>
          <div class="feature-card glass hover-lift" data-aos="fade-up" data-aos-duration="3000" data-aos-delay="300">
            <div class="feature-icon">
              ${icons.timeMachine}
            </div>
            <h3>Time Machine</h3>
            <p>Test your investment strategy against historical data. See how your portfolio would have performed in past markets.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-section section" id="how">
      <div class="container">
        <div class="reveal" style="text-align:center;">
          <span class="section-label">How It Works</span>
          <h2 class="section-title">From idea to <span class="text-gradient">informed decision</span> in seconds</h2>
        </div>
        <div class="steps-flow reveal" style="margin-top:3rem;">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-connector"></div>
            <h4>Input</h4>
            <p>Enter amount & timeline</p>
          </div>
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-connector"></div>
            <h4>Simulation</h4>
            <p>AI runs 10,000 scenarios</p>
          </div>
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-connector"></div>
            <h4>Visualize</h4>
            <p>See risk graphs & outcomes</p>
          </div>
          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-connector"></div>
            <h4>AI Insight</h4>
            <p>Get plain-language analysis</p>
          </div>
          <div class="step-item">
            <div class="step-number">5</div>
            <h4>Confidence</h4>
            <p>Invest with clarity</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Chart Preview -->
    <section class="chart-preview-section section" id="preview">
      <div class="container">
        <div class="reveal" style="text-align:center;">
          <span class="section-label">Preview</span>
          <h2 class="section-title">Real-time <span class="text-gradient">portfolio tracking</span></h2>
          <p class="section-desc" style="margin-left:auto;margin-right:auto;">Interactive charts that make complex data beautiful and understandable.</p>
        </div>
        <div class="chart-preview-wrapper glass reveal-scale" style="margin-top:3rem;">
          <canvas class="chart-preview-canvas" id="preview-chart"></canvas>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials-section section">
      <div class="container">
        <div class="reveal" style="text-align:center;">
          <span class="section-label">Trusted</span>
          <h2 class="section-title">What our users <span class="text-gradient">say</span></h2>
        </div>
        <div class="grid grid-3 stagger-children" style="margin-top:3rem;">
          <div class="testimonial-card glass hover-lift">
            <p class="testimonial-text">"The simulator completely changed how I approach investing. I finally understand the risks before committing my money."</p>
            <div class="testimonial-author">
              <div class="testimonial-avatar">A</div>
              <div>
                <div class="testimonial-name">Early Adopter</div>
                <div class="testimonial-role">Retail Investor</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card glass hover-lift">
            <p class="testimonial-text">"The AI advisor feels like having a personal financial analyst. It explains complex concepts in simple terms."</p>
            <div class="testimonial-author">
              <div class="testimonial-avatar" style="background:var(--gradient-secondary);">B</div>
              <div>
                <div class="testimonial-name">Power User</div>
                <div class="testimonial-role">Portfolio Manager</div>
              </div>
            </div>
          </div>
          <div class="testimonial-card glass hover-lift">
            <p class="testimonial-text">"Beautiful interface, incredibly fast, and the Time Machine feature is genius. This is the future of investing platforms."</p>
            <div class="testimonial-author">
              <div class="testimonial-avatar" style="background:linear-gradient(135deg,#a855f7,#ec4899);">C</div>
              <div>
                <div class="testimonial-name">Beta Tester</div>
                <div class="testimonial-role">Tech Enthusiast</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="final-cta section">
      <div class="container">
        <div class="final-cta-card glass reveal-scale">
          <h2><span class="text-gradient">Ready to invest without fear?</span></h2>
          <p>Join thousands of investors who trust AI-powered simulations to make confident decisions.</p>
          <div style="position:relative;">
            <a href="#/auth" class="btn btn-primary btn-lg">Get Started — Free</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="landing-footer">
      <div class="container">
        <p>Feargon Invest — AI-powered investment confidence</p>
      </div>
    </footer>
  `;

  // === Interactive behavior ===

  // Navbar scroll effect
  const nav = container.querySelector('#landing-nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Smooth scroll for nav links
  container.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Init scroll animations
  initScrollAnimations();

  // Animate chart on scroll
  const chartObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const canvas = document.getElementById('preview-chart');
        if (canvas) {
          drawLineChart(canvas, {
            data: generateSmoothData(80, 0.8),
            lineColor: '#00d4ff',
            gradientStart: 'rgba(0, 212, 255, 0.2)',
            gradientEnd: 'rgba(0, 212, 255, 0)',
          });
        }
        chartObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const chartSection = container.querySelector('#preview-chart');
  if (chartSection) chartObserver.observe(chartSection);

  // Init Hero ASMR Background
  const heroCanvas = document.getElementById('hero-asmr-canvas');
  if (heroCanvas) {
    // Add magnetic interactivity by capturing global mouse events in landing section
    const cleanupAsmr = initASMRBackground(heroCanvas);
  }
}
