export function initASMRBackground(canvas) {
  if (!canvas) return null;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let width;
  let height;
  let animationFrameId;
  let particles = [];
  const mouse = { x: -1000, y: -1000 };

  const PARTICLE_COUNT = 800; // Optimized for performance
  const MAGNETIC_RADIUS = 280;
  const MAGNETIC_RADIUS_SQ = MAGNETIC_RADIUS * MAGNETIC_RADIUS;
  const VORTEX_STRENGTH = 0.07;
  const PULL_STRENGTH = 0.12;

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(full = false) {
      this.x = Math.random() * (width || window.innerWidth);
      this.y = Math.random() * (height || window.innerHeight);
      this.size = Math.random() * 1.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.2;
      this.vy = (Math.random() - 0.5) * 0.2;
      
      if (full) {
        // 70% Charcoal, 30% Glass
        const isGlass = Math.random() > 0.7;
        this.color = isGlass ? '240, 245, 255' : '80, 80, 85';
        this.alpha = Math.random() * 0.4 + 0.1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
      }
      this.frictionGlow = 0;
    }

    update() {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < MAGNETIC_RADIUS_SQ) {
        const dist = Math.sqrt(distSq) || 1; // Prevent division by zero
        const force = (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS;
        
        // Magnetic center pull
        this.vx += (dx / dist) * force * PULL_STRENGTH;
        this.vy += (dy / dist) * force * PULL_STRENGTH;

        // Swirl vortex motion (Perpendicular to radius)
        this.vx += (dy / dist) * force * VORTEX_STRENGTH * 10;
        this.vy -= (dx / dist) * force * VORTEX_STRENGTH * 10;

        // Glow based on proximity and velocity
        this.frictionGlow = force * 0.7;
      } else {
        this.frictionGlow *= 0.92;
      }

      // Physics application
      this.x += this.vx;
      this.y += this.vy;

      // Friction / Damping
      this.vx *= 0.95;
      this.vy *= 0.95;

      // Background jitter (frozen static feel)
      this.vx += (Math.random() - 0.5) * 0.04;
      this.vy += (Math.random() - 0.5) * 0.04;

      this.rotation += this.rotationSpeed + (Math.abs(this.vx) + Math.abs(this.vy)) * 0.05;

      // Screen wrap
      if (this.x < -40) this.x = width + 40;
      if (this.x > width + 40) this.x = -40;
      if (this.y < -40) this.y = height + 40;
      if (this.y > height + 40) this.y = -40;
    }

    draw() {
      const finalAlpha = Math.min(this.alpha + this.frictionGlow, 0.9);
      
      // Optimization: Only save/restore if we need shadow or rotation
      // Actually shards always need migration and rotation
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      ctx.fillStyle = `rgba(${this.color}, ${finalAlpha})`;
      
      if (this.frictionGlow > 0.3) {
        ctx.shadowBlur = 8 * this.frictionGlow;
        ctx.shadowColor = `rgba(180, 220, 255, ${this.frictionGlow})`;
      }

      // Sharp shard geometry
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 2.5);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size * 2.5);
      ctx.lineTo(-this.size, 0);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    }
  }

  const init = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // Only populate if empty to prevent jumpiness on resize
    if (particles.length === 0) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }
  };

  const render = (time) => {
    // Create slight motion blur effect
    ctx.fillStyle = 'rgba(10, 10, 12, 0.18)'; 
    ctx.fillRect(0, 0, width, height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    animationFrameId = requestAnimationFrame(render);
  };

  const handleMouseMove = (e) => {
    // Robust coordinate mapping
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  };

  const handleTouchMove = (e) => {
    if (e.touches[0]) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
    }
  };

  window.addEventListener('resize', init);
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('touchmove', handleTouchMove);

  init();
  render();

  return () => {
    window.removeEventListener('resize', init);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('touchmove', handleTouchMove);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  };
}

