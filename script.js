/**
 * IDMR STRATEGIES - HERO SECTION INTERACTIVE ENGINE
 * Features:
 * - HTML5 Canvas Network & Dynamic Analytics Particles Engine
 * - Mouse Parallax Visual Tilt
 * - Animated Metric Counters
 * - Sticky Navigation & Mobile Menu Toggle
 * - Interactive Modal System (Consultation, Quote, Services)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all sub-engines
  initNavbarScroll();
  initMobileMenu();
  initHeroCanvas();
  initEcosystemCanvas();
  initCounters();
  initMouseParallax();
  initModals();
  initButtonRipples();
  initTrustedMarquee();
  initServicesFilter();
  initPortfolioFilter();
  initScrollSpy();
  initContactForm();
  initPdfViewer();
});

/* ==========================================================================
   1. NAVBAR SCROLL EFFECT
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/* ==========================================================================
   1B. SCROLL SPY ACTIVE LINK HIGHLIGHTER
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  if (!sections.length || !navLinks.length) return;

  const handleSpy = () => {
    let currentId = '';
    const scrollPosition = window.scrollY + 160;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentId = section.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          link.classList.remove('active');
          if (href === `#${currentId}`) {
            link.classList.add('active');
          }
        }
      });
    }
  };

  window.addEventListener('scroll', handleSpy, { passive: true });
}

/* ==========================================================================
   2. MOBILE MENU TOGGLE
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!toggleBtn || !mobileMenu) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isActive = mobileMenu.classList.contains('active');
    if (isActive) {
      mobileMenu.classList.remove('active');
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    } else {
      mobileMenu.classList.add('active');
      toggleBtn.classList.add('active');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
  });

  // Close menu when user clicks anywhere outside
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
      mobileMenu.classList.remove('active');
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu when any link or button inside is clicked
  const mobileClickables = mobileMenu.querySelectorAll('a, button');
  mobileClickables.forEach(item => {
    item.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      toggleBtn.classList.remove('active');
      toggleBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   3. HTML5 CANVAS: DIGITAL PARTICLES, NETWORK NODES & ANALYTICS GRAPHS
   ========================================================================== */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let animationFrameId;

  // Mouse tracker for particle attraction
  const mouse = {
    x: null,
    y: null,
    radius: 140
  };

  const particles = [];
  const particleCount = 38;
  
  // Analytics curve parameters
  let graphPhase = 0;

  function resizeCanvas() {
    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    width = rect.width;
    height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  // Particle Class
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.65;
      this.vy = (Math.random() - 0.5) * 0.65;
      this.radius = Math.random() * 2.2 + 1.5;
      // 80% royal blue, 20% gold
      this.color = Math.random() > 0.2 ? 'rgba(13, 110, 253, ' : 'rgba(212, 175, 55, ';
      this.alpha = Math.random() * 0.45 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce on edges
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse interaction
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 2;
          this.y -= (dy / dist) * force * 2;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${this.color}${this.alpha})`;
      ctx.fill();
    }
  }

  // Create particles
  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  // Draw connecting network lines
  function drawNetworkLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const lineAlpha = (1 - dist / 100) * 0.22;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(13, 110, 253, ${lineAlpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  // Draw animated background analytics bar chart graphic (matching mockup)
  function drawBackgroundBarGraph() {
    graphPhase += 0.015;
    
    ctx.save();
    
    // Draw subtle vertical bars on lower right
    const barCount = 12;
    const barWidth = 14;
    const gap = 10;
    const startX = width * 0.05;
    const startY = height * 0.88;

    for (let i = 0; i < barCount; i++) {
      const x = startX + i * (barWidth + gap);
      const heightFactor = Math.sin(i * 0.4 + graphPhase) * 0.25 + 0.5 + (i / barCount) * 0.5;
      const barHeight = heightFactor * (height * 0.28);
      
      const barGradient = ctx.createLinearGradient(0, startY - barHeight, 0, startY);
      barGradient.addColorStop(0, 'rgba(13, 110, 253, 0.22)');
      barGradient.addColorStop(1, 'rgba(13, 110, 253, 0.02)');
      
      ctx.fillStyle = barGradient;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, startY - barHeight, barWidth, barHeight, 4) : ctx.rect(x, startY - barHeight, barWidth, barHeight);
      ctx.fill();
    }

    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw subtle bar graph
    drawBackgroundBarGraph();

    // Draw particles & connections
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    drawNetworkLines();

    animationFrameId = requestAnimationFrame(animate);
  }

  // Setup canvas
  resizeCanvas();
  initParticles();
  animate();

  // Resize listener
  window.addEventListener('resize', () => {
    resizeCanvas();
    initParticles();
  });

  // Track mouse over canvas parent
  const parent = canvas.parentElement;
  parent.addEventListener('mousemove', (e) => {
    const rect = parent.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  parent.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });
}

/* ==========================================================================
   4. COUNTER ANIMATION ENGINE
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = parseFloat(el.getAttribute('data-target'));
    const isFloat = target % 1 !== 0;
    const duration = 2000;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = target * ease;

      el.textContent = isFloat ? currentVal.toFixed(1) : Math.floor(currentVal);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = isFloat ? target.toFixed(1) : target;
      }
    }

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

/* ==========================================================================
   5. MOUSE PARALLAX TILT EFFECT
   ========================================================================== */
function initMouseParallax() {
  const wrapper = document.getElementById('hero-visual-wrapper');
  if (!wrapper) return;

  const standaloneLogo = wrapper.querySelector('.hero-logo-standalone-container');

  window.addEventListener('mousemove', (e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
    const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);

    if (standaloneLogo) {
      standaloneLogo.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(${y * -6}px)`;
    }
  });

  window.addEventListener('mouseleave', () => {
    if (standaloneLogo) {
      standaloneLogo.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)`;
    }
  });
}

/* ==========================================================================
   6. MODALS MANAGEMENT
   ========================================================================== */
function initModals() {
  // Consult Modal
  const consultModal = document.getElementById('consult-modal');
  const openConsultBtns = document.querySelectorAll('.open-consult-modal');
  const closeConsultBtn = document.getElementById('close-consult-modal');

  // Quote Modal
  const quoteModal = document.getElementById('quote-modal');
  const openQuoteBtns = document.querySelectorAll('.open-quote-modal');
  const closeQuoteBtn = document.getElementById('close-quote-modal');

  // Services Modal
  const servicesModal = document.getElementById('services-modal');
  const openServicesBtns = document.querySelectorAll('.open-services-modal, #nav-services-link, #mobile-services-link');
  const closeServicesBtn = document.getElementById('close-services-modal');

  function openModal(modal) {
    if (modal) {
      modal.classList.add('active');
      modal.style.cssText = 'display: flex !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; z-index: 99999 !important;';
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove('active');
      modal.style.cssText = 'display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important;';
    }
  }

  openConsultBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal(servicesModal);
      openModal(consultModal);
    });
  });

  openQuoteBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(quoteModal);
    });
  });

  openServicesBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(servicesModal);
    });
  });

  if (closeConsultBtn) closeConsultBtn.addEventListener('click', () => closeModal(consultModal));
  if (closeQuoteBtn) closeQuoteBtn.addEventListener('click', () => closeModal(quoteModal));
  if (closeServicesBtn) closeServicesBtn.addEventListener('click', () => closeModal(servicesModal));

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      [consultModal, quoteModal, servicesModal].forEach(m => closeModal(m));
    });
  });

  [consultModal, quoteModal, servicesModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  const consultForm = document.getElementById('consult-form');
  if (consultForm) {
    consultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you! Your free consultation request has been submitted. Our senior strategist will contact you within 24 hours.');
      closeModal(consultModal);
      consultForm.reset();
    });
  }

  const quoteForm = document.getElementById('quote-form');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Proposal Request Received! We will prepare a customized pitch deck and estimate for your company.');
      closeModal(quoteModal);
      quoteForm.reset();
    });
  }

  const scrollIndicator = document.getElementById('scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      openModal(servicesModal);
    });
  }
}

/* ==========================================================================
   7. BUTTON RIPPLE EFFECT
   ========================================================================== */
function initButtonRipples() {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      const rect = button.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('ripple');

      const ripple = button.getElementsByClassName('ripple')[0];
      if (ripple) {
        ripple.remove();
      }

      button.appendChild(circle);
    });
  });
}

/* ==========================================================================
   8. ABOUT SECTION INTERACTIVE ILLUSTRATION CANVAS
   ========================================================================== */
/* ==========================================================================
   8. DIGITAL MARKETING ECOSYSTEM CANVAS ENGINE (#eco-canvas)
   ========================================================================== */
function initEcosystemCanvas() {
  const canvas = document.getElementById('eco-canvas');
  if (!canvas) return;

  const container = document.getElementById('eco-system-container');
  if (!container) return;

  const ctx = canvas.getContext('2d');
  let width, height, centerX, centerY;

  // Particle engine traveling along spokes
  const particles = [];
  const particleCount = 28;

  function resize() {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    centerX = width / 2;
    centerY = height / 2;
  }

  // Create traveling particles along 8 radial spokes
  function initParticles() {
    particles.length = 0;
    const cards = container.querySelectorAll('.eco-node-card');
    if (!cards.length) return;

    for (let i = 0; i < particleCount; i++) {
      const cardIdx = i % cards.length;
      particles.push({
        cardIdx: cardIdx,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
        size: 2.5 + Math.random() * 2,
        color: i % 3 === 0 ? '#0D6EFD' : (i % 3 === 1 ? '#D4AF37' : '#00D2FF')
      });
    }
  }

  let phase = 0;

  // 3D Rotating DNA Helix Strands
  function drawDNAHelix(startX, startY, length, angle, time, scale = 1) {
    ctx.save();
    ctx.translate(startX, startY);
    ctx.rotate(angle);

    const numNodes = 22;
    const spacing = length / numNodes;
    const amplitude = 28 * scale;
    const frequency = 0.28;

    for (let i = 0; i < numNodes; i++) {
      const t = i * frequency + time;
      const x1 = Math.sin(t) * amplitude;
      const z1 = Math.cos(t);
      const x2 = -x1;
      const y = i * spacing - length / 2;

      // Base pair rungs
      const alpha = 0.2 + (z1 + 1) * 0.25;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.strokeStyle = z1 > 0 ? `rgba(13, 110, 253, ${alpha * 0.5})` : `rgba(212, 175, 55, ${alpha * 0.4})`;
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();

      // Base pair central node
      ctx.beginPath();
      ctx.arc(0, y, 1.8 * scale, 0, Math.PI * 2);
      ctx.fillStyle = z1 > 0 ? `rgba(0, 210, 255, ${alpha * 0.8})` : `rgba(212, 175, 55, ${alpha * 0.8})`;
      ctx.fill();

      // Strand 1 Nucleotide Node (Royal Blue / Cyan)
      const r1 = Math.max(1, (2.8 + z1 * 1.2) * scale);
      ctx.beginPath();
      ctx.arc(x1, y, r1, 0, Math.PI * 2);
      ctx.fillStyle = z1 > 0 ? '#0D6EFD' : '#0052CC';
      if (z1 > 0.4) {
        ctx.shadowColor = '#00D2FF';
        ctx.shadowBlur = 6 * scale;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Strand 2 Nucleotide Node (Gold / Yellow)
      const r2 = Math.max(1, (2.8 - z1 * 1.2) * scale);
      ctx.beginPath();
      ctx.arc(x2, y, r2, 0, Math.PI * 2);
      ctx.fillStyle = z1 < 0 ? '#D4AF37' : '#FFD700';
      if (z1 < -0.4) {
        ctx.shadowColor = '#D4AF37';
        ctx.shadowBlur = 6 * scale;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Backbone curves
    ctx.beginPath();
    for (let i = 0; i < numNodes; i++) {
      const t = i * frequency + time;
      const x = Math.sin(t) * amplitude;
      const y = i * spacing - length / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(13, 110, 253, 0.45)';
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < numNodes; i++) {
      const t = i * frequency + time;
      const x = -Math.sin(t) * amplitude;
      const y = i * spacing - length / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();

    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    phase += 0.012;

    const cards = container.querySelectorAll('.eco-node-card');
    const centerHubRadius = width < 868 ? 78 : 105;

    // 1. Draw subtle digital background grid & soft radial glow
    const bgGlow = ctx.createRadialGradient(centerX, centerY, 30, centerX, centerY, width * 0.45);
    bgGlow.addColorStop(0, 'rgba(13, 110, 253, 0.07)');
    bgGlow.addColorStop(0.55, 'rgba(13, 110, 253, 0.02)');
    bgGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);

    // 1B. Draw Live 3D Dynamic DNA Double-Helix Strands on Left & Right Flanks
    if (width > 500) {
      drawDNAHelix(centerX - width * 0.41, centerY, height * 0.9, 0.12, phase * 1.8, 0.85);
      drawDNAHelix(centerX + width * 0.41, centerY, height * 0.9, -0.12, phase * 1.8 + Math.PI, 0.85);
    } else {
      drawDNAHelix(centerX - width * 0.36, centerY, height * 0.85, 0.08, phase * 1.8, 0.65);
      drawDNAHelix(centerX + width * 0.36, centerY, height * 0.85, -0.08, phase * 1.8 + Math.PI, 0.65);
    }

    // 2. Draw Concentric Orbital Rings (matching reference image)
    const ringRadii = [135, 185, 235];
    ringRadii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(13, 110, 253, ${0.14 - idx * 0.03})`;
      ctx.lineWidth = 1;
      ctx.setLineDash(idx === 1 ? [4, 6] : [6, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Outer subtle orbital ring node dots
    ringRadii.forEach((r, idx) => {
      const dotCount = 6 + idx * 4;
      for (let d = 0; d < dotCount; d++) {
        const dotAngle = (d / dotCount) * Math.PI * 2 + phase * (idx % 2 === 0 ? 0.3 : -0.2);
        const dx = centerX + Math.cos(dotAngle) * r;
        const dy = centerY + Math.sin(dotAngle) * r;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(13, 110, 253, 0.32)';
        ctx.fill();
      }
    });

    // 3. Measure Node Card Position & Draw Spokes to Center Hub
    const nodeCoords = [];

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();
      
      const nx = (cardRect.left + cardRect.width / 2) - contRect.left;
      const ny = (cardRect.top + cardRect.height / 2) - contRect.top;

      nodeCoords.push({ x: nx, y: ny });

      // Calculate direction to center
      const dx = centerX - nx;
      const dy = centerY - ny;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        // Point on center hub boundary
        const hx = centerX - (dx / dist) * centerHubRadius;
        const hy = centerY - (dy / dist) * centerHubRadius;

        // Draw connecting line
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(hx, hy);
        ctx.strokeStyle = 'rgba(13, 110, 253, 0.28)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw glowing dot at center hub attachment point
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#0D6EFD';
        ctx.shadowColor = '#0D6EFD';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw node attachment dot
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0D6EFD';
        ctx.fill();
      }
    });

    // 4. Update & Draw Traveling Data Flow Particles
    particles.forEach(p => {
      if (!nodeCoords[p.cardIdx]) return;
      
      const node = nodeCoords[p.cardIdx];
      const dx = node.x - centerX;
      const dy = node.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        // Move particle
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        // Position between center hub and node card
        const startR = centerHubRadius;
        const endR = dist;
        const currentR = startR + (endR - startR) * p.progress;

        const angle = Math.atan2(dy, dx);
        const px = centerX + Math.cos(angle) * currentR;
        const py = centerY + Math.sin(angle) * currentR;

        // Draw particle
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    requestAnimationFrame(draw);
  }

  resize();
  initParticles();
  draw();

  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });
}

/* ==========================================================================
   9. TRUSTED BY / WE WORKED WITH LOGO MARQUEE ENGINE (REFERENCE MATCHED)
   ========================================================================== */
function initTrustedMarquee() {
  const track = document.getElementById('marquee-track');
  const container = document.getElementById('marquee-container');

  if (!track || !container) return;

  // Seamless infinite loop: Clone initial set of logo pill cards twice
  const initialCards = Array.from(track.children);
  initialCards.forEach(card => {
    const clone = card.cloneNode(true);
    track.appendChild(clone);
  });

  // Touch Swipe & Drag support
  let isDown = false;
  let startX;
  let scrollLeft;

  container.addEventListener('mousedown', (e) => {
    isDown = true;
    container.classList.add('active');
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseleave', () => {
    isDown = false;
  });

  container.addEventListener('mouseup', () => {
    isDown = false;
  });

  container.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 2;
    container.scrollLeft = scrollLeft - walk;
  });
}

/* ==========================================================================
   10. OUR SERVICES CATEGORY FILTER ENGINE
   ========================================================================== */
function initServicesFilter() {
  const filterBar = document.getElementById('services-filter');
  const grid = document.getElementById('services-grid');

  if (!filterBar || !grid) return;

  const buttons = filterBar.querySelectorAll('.service-filter-btn');
  const cards = grid.querySelectorAll('.service-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active class on filter buttons
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterVal === 'all' || category === filterVal) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ==========================================================================
   11. PORTFOLIO CATEGORY FILTER ENGINE
   ========================================================================== */
function initPortfolioFilter() {
  const filterBar = document.getElementById('portfolio-filter');
  const grid = document.getElementById('portfolio-grid');

  if (!filterBar || !grid) return;

  const buttons = filterBar.querySelectorAll('.portfolio-filter-btn');
  const cards = grid.querySelectorAll('.portfolio-card');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      cards.forEach(card => {
        const categories = card.getAttribute('data-category').split(' ');
        if (filterVal === 'all' || categories.includes(filterVal)) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 50);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ==========================================================================
   12. MAIN CONTACT FORM SUBMISSION ENGINE
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('main-contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.contact-submit-btn');
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span>Sending Request...</span>';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = '<span>✓ Request Sent Successfully!</span>';
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        form.reset();

        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.style.background = '';
          btn.disabled = false;
        }, 3500);
      }, 1200);
}

/* ==========================================================================
   13. CRISP HIGH-RESOLUTION PRESENTATION LIGHTBOX & PDF UPLOADER ENGINE
   ========================================================================== */
function initPresentationLightbox() {
  const lightboxModal = document.getElementById('presentation-lightbox');
  const lbActiveImage = document.getElementById('lb-active-image');
  const lbCounter = document.getElementById('lb-counter');
  const lbCloseBtn = document.getElementById('lb-close-btn');
  const lbPrevBtn = document.getElementById('lb-prev-btn');
  const lbNextBtn = document.getElementById('lb-next-btn');

  const totalSlides = 18;
  let currentSlideIndex = 0;

  function updateLightboxSlide(index) {
    currentSlideIndex = (index + totalSlides) % totalSlides;
    const slideNumNum = String(currentSlideIndex + 1).padStart(2, '0');
    if (lbActiveImage) {
      lbActiveImage.src = `assets/pdf_slides/slide_${slideNumNum}.png`;
      lbActiveImage.alt = `IDMR Slide ${slideNumNum} Fullscreen View`;
    }
    if (lbCounter) {
      lbCounter.textContent = `Slide ${currentSlideIndex + 1} of ${totalSlides}`;
    }

    // Update active quick-jump pill
    document.querySelectorAll('.sq-pill').forEach((pill, idx) => {
      pill.classList.toggle('active', idx === currentSlideIndex);
    });
  }

  // Open Lightbox Event Trigger
  document.querySelectorAll('.open-presentation-lightbox').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const slideIndexAttr = trigger.getAttribute('data-slide-index');
      const slideIndex = slideIndexAttr !== null ? parseInt(slideIndexAttr, 10) : 0;
      updateLightboxSlide(slideIndex);
      if (lightboxModal) {
        lightboxModal.classList.add('active');
        lightboxModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close Lightbox Event Trigger
  function closeLightbox() {
    if (lightboxModal) {
      lightboxModal.classList.remove('active');
      lightboxModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (lbCloseBtn) lbCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxModal) {
    const overlay = lightboxModal.querySelector('.lightbox-overlay');
    if (overlay) overlay.addEventListener('click', closeLightbox);
  }

  // Next & Prev Slide Controls
  if (lbPrevBtn) {
    lbPrevBtn.addEventListener('click', () => updateLightboxSlide(currentSlideIndex - 1));
  }
  if (lbNextBtn) {
    lbNextBtn.addEventListener('click', () => updateLightboxSlide(currentSlideIndex + 1));
  }

  // Keyboard Navigation (Left/Right Arrow Keys & ESC)
  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') {
      updateLightboxSlide(currentSlideIndex - 1);
    } else if (e.key === 'ArrowRight') {
      updateLightboxSlide(currentSlideIndex + 1);
    } else if (e.key === 'Escape') {
      closeLightbox();
    }
  });

  // PDF Uploader Live Preview Handling
  const pdfInput = document.getElementById('pdf-upload-input');
  if (pdfInput) {
    pdfInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type === 'application/pdf') {
        const fileUrl = URL.createObjectURL(file);
        const downloadBtn = document.getElementById('pdf-download-btn');
        if (downloadBtn) {
          downloadBtn.href = fileUrl;
          downloadBtn.download = file.name;
        }
        alert(`PDF "${file.name}" loaded successfully! Click "Download PDF" to save or view presentation.`);
      } else if (file) {
        alert('Please select a valid PDF document (.pdf)');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPresentationLightbox();
  syncCMSData();
});

// Listen for live storage updates across browser tabs
window.addEventListener('storage', () => {
  syncCMSData();
});

/* Dynamic CMS & LocalStorage Live Sync Engine */
function applyCMSData(data) {
  if (!data) return;

  // 1. FOOTER SETTINGS
  const f = data.footer;
  if (f) {
    const ctaBadge = document.querySelector('.cta-card-badge');
    if (ctaBadge && f.cta_badge) ctaBadge.textContent = f.cta_badge;

    const ctaTitle = document.querySelector('.cta-card-title');
    if (ctaTitle && f.cta_title) ctaTitle.textContent = f.cta_title;

    const ctaSub = document.querySelector('.cta-card-subtitle');
    if (ctaSub && f.cta_subtitle) ctaSub.textContent = f.cta_subtitle;

    const primaryBtn = document.querySelector('.cta-btn-gold');
    if (primaryBtn) {
      const textSpan = primaryBtn.querySelector('span:first-child');
      if (textSpan && f.cta_primary_btn_text) textSpan.textContent = f.cta_primary_btn_text;
      if (f.cta_primary_btn_link) primaryBtn.href = f.cta_primary_btn_link;
    }

    const secondaryBtn = document.querySelector('.cta-btn-glass');
    if (secondaryBtn) {
      if (f.cta_secondary_btn_text) secondaryBtn.textContent = f.cta_secondary_btn_text;
      if (f.cta_secondary_btn_link) secondaryBtn.href = f.cta_secondary_btn_link;
    }

    const brandDesc = document.querySelector('.footer-brand-desc');
    if (brandDesc && f.brand_description) brandDesc.textContent = f.brand_description;

    const statusPill = document.querySelector('.footer-status-pill span:last-child');
    if (statusPill && f.status_pill_text) statusPill.textContent = f.status_pill_text;

    // Contact Details
    const phoneEl = document.querySelector('.footer-phone-link') || document.querySelector('.footer-info-item a[href*="tel"]');
    if (phoneEl && f.phone_number) {
      phoneEl.href = 'tel:' + f.phone_number.replace(/[^\d+]/g, '');
      phoneEl.textContent = f.phone_number;
    }

    const emailEl = document.querySelector('.footer-email-link') || document.querySelector('.footer-info-item a[href*="mailto"]');
    if (emailEl && f.work_email) {
      emailEl.href = 'mailto:' + f.work_email;
      emailEl.textContent = f.work_email;
    }

    const addressEl = document.querySelector('.footer-address-text') || document.querySelector('.footer-info-item:nth-child(1) strong');
    if (addressEl && f.office_address) addressEl.textContent = f.office_address;

    const hoursEl = document.querySelector('.footer-hours-text') || document.querySelector('.footer-info-item:nth-child(4) strong');
    if (hoursEl && f.working_hours) hoursEl.textContent = f.working_hours;

    // Social Links
    if (f.facebook_url) {
      const fb = document.querySelector('.footer-social-btn[aria-label="Facebook"]');
      if (fb) fb.href = f.facebook_url;
    }
    if (f.instagram_url) {
      const ig = document.querySelector('.footer-social-btn[aria-label="Instagram"]');
      if (ig) ig.href = f.instagram_url;
    }
    if (f.linkedin_url) {
      const li = document.querySelector('.footer-social-btn[aria-label="LinkedIn"]');
      if (li) li.href = f.linkedin_url;
    }
    if (f.twitter_url) {
      const tw = document.querySelector('.footer-social-btn[aria-label="X (Twitter)"]');
      if (tw) tw.href = f.twitter_url;
    }
    if (f.youtube_url) {
      const yt = document.querySelector('.footer-social-btn[aria-label="YouTube"]');
      if (yt) yt.href = f.youtube_url;
    }

    const copyEl = document.querySelector('.idmr-footer-copy');
    if (copyEl && f.copyright_text) copyEl.innerHTML = f.copyright_text;
  }

  // 2. HOMEPAGE HERO & ABOUT SETTINGS
  const h = data.hero;
  if (h) {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && h.headline) heroTitle.innerHTML = h.headline;

    const heroSub = document.querySelector('.hero-subtitle');
    if (heroSub && h.subheading) heroSub.textContent = h.subheading;

    const heroBadge = document.querySelector('.hero-badge span:last-child');
    if (heroBadge && h.badge_text) heroBadge.textContent = h.badge_text;
  }

  const a = data.about;
  if (a) {
    const aboutTitle = document.querySelector('.about-section .section-headline');
    if (aboutTitle && a.heading) aboutTitle.innerHTML = a.heading;

    const aboutDesc = document.querySelector('.about-section .section-subhead');
    if (aboutDesc && a.description) aboutDesc.textContent = a.description;
  }

  // 3. CORPORATE STATS CARDS
  const s = data.stats;
  if (Array.isArray(s) && s.length >= 4) {
    const statCards = document.querySelectorAll('.corporate-stats-grid .corp-stat-card');
    statCards.forEach((card, idx) => {
      const item = s[idx];
      if (!item) return;

      const counterEl = card.querySelector('.corp-stat-value');
      if (counterEl) {
        counterEl.setAttribute('data-target', item.value);
        counterEl.textContent = item.value;
      }

      const prefixEl = card.querySelector('.corp-stat-prefix');
      if (prefixEl) prefixEl.textContent = item.prefix || '';

      const suffixEl = card.querySelector('.corp-stat-suffix');
      if (suffixEl) suffixEl.textContent = item.suffix || '';

      const titleEl = card.querySelector('.corp-stat-title');
      if (titleEl && item.title) titleEl.textContent = item.title;

      const subEl = card.querySelector('.corp-stat-sub');
      if (subEl && item.sub) subEl.textContent = item.sub;
    });
  }
}

async function syncCMSData() {
  let footerData = null;
  let homepageData = null;
  let statsData = null;

  // 1. Load latest CMS data from cms_data.json with timestamp cache buster
  try {
    const staticRes = await fetch('cms_data.json?v=' + Date.now());
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      if (staticData?.footer) footerData = staticData.footer;
      if (staticData?.homepage) homepageData = staticData.homepage;
      if (staticData?.stats) statsData = staticData.stats;
    }
  } catch (err) {}

  // 2. LocalStorage OVERRIDES EVERYTHING (Highest Priority for User Edits in Admin Panel)
  try {
    const localFooter = localStorage.getItem('idmr_footer_data');
    if (localFooter) {
      footerData = { ...footerData, ...JSON.parse(localFooter) };
    }
    const localHomepage = localStorage.getItem('idmr_homepage_data');
    if (localHomepage) {
      homepageData = { ...homepageData, ...JSON.parse(localHomepage) };
    }
    const localStats = localStorage.getItem('idmr_stats_data');
    if (localStats) {
      statsData = JSON.parse(localStats);
    }
  } catch (err) {
    console.error('LocalStorage merge error:', err);
  }

  // Apply final merged payload to DOM
  applyCMSData({
    footer: footerData,
    hero: homepageData?.hero,
    about: homepageData?.about,
    stats: statsData
  });
}


