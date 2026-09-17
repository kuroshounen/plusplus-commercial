/**
 * PlusPlus Commercial (ПлюсПлюс) - Interactive Presentation Engine
 * Architecture: Modular, performant, touch-first responsive slider
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const slider = document.getElementById('slider');
  const slides = document.querySelectorAll('.slide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const counterCurrent = document.querySelector('.slide-counter .current');
  const counterTotal = document.querySelector('.slide-counter .total');
  const progressBar = document.getElementById('progressBar');
  
  // Drawer Elements
  const drawerBtn = document.getElementById('drawerBtn');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const drawerItems = document.querySelectorAll('.drawer-item');

  // State
  let currentSlide = 0;
  const totalSlides = slides.length;
  let isNavigating = false;
  const transitionDuration = 450; // ms

  if (counterTotal) {
    counterTotal.textContent = totalSlides < 10 ? `0${totalSlides}` : `${totalSlides}`;
  }

  // =========================================
  // 🎯 CORE SLIDE NAVIGATION
  // =========================================
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides || isNavigating) return;
    if (index === currentSlide && slides[currentSlide].classList.contains('active')) return;

    isNavigating = true;

    // Remove active from all
    slides.forEach((s) => s.classList.remove('active'));

    currentSlide = index;
    const activeSlide = slides[currentSlide];
    activeSlide.classList.add('active');

    // Scroll slide container back to top (for mobile)
    activeSlide.scrollTop = 0;

    // Update Counter & Progress
    if (counterCurrent) {
      counterCurrent.textContent = (currentSlide + 1) < 10 ? `0${currentSlide + 1}` : `${currentSlide + 1}`;
    }
    if (progressBar) {
      const percentage = ((currentSlide) / (totalSlides - 1)) * 100;
      progressBar.style.width = `${Math.max(percentage, 8)}%`;
    }

    // Update Nav Buttons Disabled State
    if (prevBtn) prevBtn.disabled = currentSlide === 0;
    if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;

    // Update Drawer Active Item
    drawerItems.forEach((item, idx) => {
      if (idx === currentSlide) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Trigger Animations & Counters on Active Slide
    triggerSlideEffects(activeSlide);

    // Toggle Circuit Animation loop on Slide 1
    if (typeof checkCircuitLoop === 'function') {
      checkCircuitLoop();
    }

    // Release navigation lock
    setTimeout(() => {
      isNavigating = false;
    }, transitionDuration);
  }

  function nextSlide() {
    if (currentSlide < totalSlides - 1) {
      goToSlide(currentSlide + 1);
    }
  }

  function prevSlide() {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  }

  // =========================================
  // ⚡ INTERACTIVE SLIDE EFFECTS & COUNTERS
  // =========================================
  function triggerSlideEffects(slide) {
    // 1. Number Counters (data-count)
    const counters = slide.querySelectorAll('[data-count]');
    counters.forEach(c => {
      const target = parseFloat(c.getAttribute('data-count'));
      const prefix = c.getAttribute('data-prefix') || '';
      const suffix = c.getAttribute('data-suffix') || '';
      const duration = 1600;
      const startTime = performance.now();

      function updateNumber(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(ease * target);

        c.textContent = `${prefix}${current}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(updateNumber);
        } else {
          c.textContent = `${prefix}${target}${suffix}`;
        }
      }
      requestAnimationFrame(updateNumber);
    });
  }

  // =========================================
  // ⌨️ KEYBOARD & WHEEL NAVIGATION
  // =========================================
  document.addEventListener('keydown', (e) => {
    // Don't intercept if user is typing in form inputs
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'Escape') {
      closeDrawer();
    }
  });

  // Wheel with debounce
  let wheelTimeout = null;
  window.addEventListener('wheel', (e) => {
    // Don't intercept wheel if inside drawer or if slide is scrollable and not at boundaries
    if (drawerOverlay && drawerOverlay.classList.contains('open')) return;

    const activeSlide = slides[currentSlide];
    const isScrollable = activeSlide.scrollHeight > activeSlide.clientHeight;

    if (isScrollable) {
      const atBottom = activeSlide.scrollHeight - activeSlide.scrollTop <= activeSlide.clientHeight + 5;
      const atTop = activeSlide.scrollTop <= 5;
      if (e.deltaY > 0 && !atBottom) return; // Allow natural scroll down
      if (e.deltaY < 0 && !atTop) return;    // Allow natural scroll up
    }

    if (wheelTimeout) return;
    if (Math.abs(e.deltaY) < 30) return; // Ignore small trackpad drift

    if (e.deltaY > 0) {
      nextSlide();
    } else {
      prevSlide();
    }

    wheelTimeout = setTimeout(() => {
      wheelTimeout = null;
    }, 600);
  }, { passive: true });

  // =========================================
  // 📱 TOUCH & SWIPE DETECTION
  // =========================================
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    touchStartTime = performance.now();
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchDuration = performance.now() - touchStartTime;

    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // Check if swipe is predominantly horizontal
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 45 && touchDuration < 600) {
      if (diffX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }, { passive: true });

  // Button clicks
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);

  // Quick jump button on hero
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      nextSlide();
    });
  }

  // =========================================
  // 🗂️ SLIDE DRAWER (OVERVIEW MENU)
  // =========================================
  function openDrawer() {
    if (drawerOverlay) drawerOverlay.classList.add('open');
  }

  function closeDrawer() {
    if (drawerOverlay) drawerOverlay.classList.remove('open');
  }

  if (drawerBtn) drawerBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', (e) => {
      if (e.target === drawerOverlay) closeDrawer();
    });
  }

  drawerItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(item.getAttribute('data-target-slide'), 10);
      goToSlide(targetIndex);
      closeDrawer();
    });
  });

  // Direct CTA buttons inside slides jumping to slide 12
  document.querySelectorAll('[data-jump="contact"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      goToSlide(11); // Slide 12 is index 11
    });
  });

  // =========================================
  // 🧮 INTERACTIVE LOSS CALCULATOR (SLIDE 3)
  // =========================================
  const revenueSlider = document.getElementById('revenueSlider');
  const revenueValDisplay = document.getElementById('revenueValDisplay');
  const wastedBudgetDisplay = document.getElementById('wastedBudgetDisplay');
  const lostDealsDisplay = document.getElementById('lostDealsDisplay');

  if (revenueSlider && revenueValDisplay && wastedBudgetDisplay && lostDealsDisplay) {
    function updateCalculator() {
      const revenueMln = parseInt(revenueSlider.value, 10);
      revenueValDisplay.textContent = `${revenueMln} млн ₽`;

      // Conservative estimation based on typical 15-25% sales/marketing leakage
      const wastedMin = Math.round(revenueMln * 0.15 * 100) / 100;
      const wastedMax = Math.round(revenueMln * 0.28 * 100) / 100;
      const lostDeals = Math.round(revenueMln * 1.8);

      wastedBudgetDisplay.textContent = `${wastedMin} – ${wastedMax} млн ₽ / год`;
      lostDealsDisplay.textContent = `от ${lostDeals} сделок`;
    }

    revenueSlider.addEventListener('input', updateCalculator);
    updateCalculator();
  }

  // =========================================
  // 📋 LEAD CAPTURE FORM (SLIDE 12)
  // =========================================
  const auditForm = document.getElementById('auditForm');
  const formSuccessBox = document.getElementById('formSuccessBox');

  if (auditForm) {
    auditForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('clientName');
      const contactInput = document.getElementById('clientContact');
      const nicheInput = document.getElementById('clientNiche');

      const name = nameInput ? nameInput.value.trim() : '';
      const contact = contactInput ? contactInput.value.trim() : '';
      const niche = nicheInput ? nicheInput.value.trim() : '';

      if (!name || !contact) {
        alert('Пожалуйста, укажите ваше имя и контактные данные (телефон или Telegram).');
        return;
      }

      // Format direct telegram text
      const telegramMessage = encodeURIComponent(
        `Здравствуйте, Сергей! Заявка на экспресс Zoom-диагностику PlusPlus Commercial.\nИмя: ${name}\nКонтакт: ${contact}\nНиша и задача: ${niche || 'Не указано'}`
      );
      const tgLink = `https://t.me/denezhkin_serge?text=${telegramMessage}`;

      // Show success box
      auditForm.style.display = 'none';
      if (formSuccessBox) {
        formSuccessBox.style.display = 'block';
        const directLinkBtn = formSuccessBox.querySelector('.tg-direct-link');
        if (directLinkBtn) {
          directLinkBtn.href = tgLink;
        }
      }
    });
  }

  // =========================================
  // 🔮 INTERACTIVE COMMERCIAL CIRCUIT (SLIDE 1)
  // =========================================
  let checkCircuitLoop = null;
  const canvas = document.getElementById('circuitCanvas');
  const slide1 = document.getElementById('slide-1');
  let circuitAnimationId = null;

  if (canvas && slide1) {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = slide1.clientWidth);
    let height = (canvas.height = slide1.clientHeight);

    // Business nodes representing commercial architecture
    const nodeLabels = [
      { text: 'Маркетинг', type: 'mkt' },
      { text: 'Продажи', type: 'sales' },
      { text: 'Сквозная CRM', type: 'sync' },
      { text: 'ROMI', type: 'mkt' },
      { text: 'LTV', type: 'sales' },
      { text: 'CAC', type: 'mkt' },
      { text: 'Лиды', type: 'mkt' },
      { text: 'Сделки', type: 'sales' },
      { text: 'HRBP', type: 'sales' },
      { text: 'Юнит-экономика', type: 'sync' },
      { text: 'Выручка 250М+', type: 'sync' },
      { text: 'PlusPlus', type: 'plus' },
      { text: '+', type: 'plus' },
      { text: '++', type: 'plus' }
    ];

    const nodes = [];
    const colors = {
      mkt: '#0F172A',
      sales: '#1E293B',
      sync: '#C25E34',
      plus: '#C25E34'
    };

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = slide1.clientWidth;
      height = slide1.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes
    nodeLabels.forEach((item) => {
      nodes.push({
        x: Math.random() * (width - 120) + 60,
        y: Math.random() * (height - 140) + 70,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseVx: (Math.random() - 0.5) * 0.4,
        baseVy: (Math.random() - 0.5) * 0.4,
        radius: item.type === 'plus' ? 3.5 : 4.5,
        text: item.text,
        type: item.type,
        color: colors[item.type],
        pulse: Math.random() * Math.PI
      });
    });

    // Mouse coordinates
    const mouse = { x: -1000, y: -1000, active: false };

    slide1.addEventListener('mousemove', (e) => {
      const rect = slide1.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    slide1.addEventListener('mouseleave', () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    });

    slide1.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = slide1.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
        mouse.active = true;
      }
    }, { passive: true });

    slide1.addEventListener('touchend', () => {
      mouse.active = false;
    });

    function drawCircuit() {
      ctx.clearRect(0, 0, width, height);

      // 1. Update and draw nodes
      nodes.forEach((n) => {
        n.pulse += 0.03;
        n.x += n.vx;
        n.y += n.vy;

        // Bounce from walls
        if (n.x < 40 || n.x > width - 40) n.vx *= -1;
        if (n.y < 50 || n.y > height - 50) n.vy *= -1;

        // Mouse magnetic gravitation
        if (mouse.active) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 220;

          if (dist < maxDist && dist > 1) {
            // Gentle gravitational pull
            const force = (1 - dist / maxDist) * 0.045;
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;

            // Draw glowing connection line to cursor
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(194, 94, 52, ${(1 - dist / maxDist) * 0.4})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Glow dot at cursor
            ctx.fillStyle = 'rgba(194, 94, 52, 0.06)';
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, (1 - dist / maxDist) * 14, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Return to natural speed
            n.vx = n.vx * 0.98 + n.baseVx * 0.02;
            n.vy = n.vy * 0.98 + n.baseVy * 0.02;
          }
        }
      });

      // 2. Draw inter-node circuit lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxLineDist = 140;

          if (dist < maxLineDist) {
            const alpha = (1 - dist / maxLineDist) * 0.16;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);

            // Highlight connection between Marketing and Sales
            const isBridge = (n1.type === 'mkt' && n2.type === 'sales') || (n1.type === 'sales' && n2.type === 'mkt') || (n1.type === 'sync' || n2.type === 'sync');
            if (isBridge && mouse.active) {
              ctx.strokeStyle = `rgba(194, 94, 52, ${alpha * 2.2})`;
              ctx.lineWidth = 1.2;
            } else {
              ctx.strokeStyle = `rgba(15, 23, 42, ${alpha})`;
              ctx.lineWidth = 0.75;
            }
            ctx.stroke();

            // Midpoint pulse spark
            if (isBridge && dist < 85) {
              const mx = (n1.x + n2.x) / 2;
              const my = (n1.y + n2.y) / 2;
              ctx.fillStyle = 'rgba(194, 94, 52, 0.45)';
              ctx.font = '10px "JetBrains Mono", monospace';
              ctx.fillText('+', mx - 3, my + 3);
            }
          }
        }
      }

      // 3. Draw node labels and dots
      nodes.forEach((n) => {
        // Node center dot
        ctx.beginPath();
        const pulseR = n.radius + Math.sin(n.pulse) * 0.8;
        ctx.arc(n.x, n.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        // Node subtle badge label
        ctx.font = n.type === 'plus' ? 'bold 12px "JetBrains Mono", monospace' : '600 11px "Plus Jakarta Sans", sans-serif';
        const textWidth = ctx.measureText(n.text).width;
        
        // Background capsule
        ctx.fillStyle = n.type === 'sync' ? 'rgba(255, 247, 237, 0.92)' : 'rgba(255, 255, 255, 0.86)';
        ctx.strokeStyle = n.type === 'sync' ? 'rgba(253, 186, 116, 0.7)' : 'rgba(226, 232, 240, 0.7)';
        ctx.lineWidth = 0.8;
        
        const padX = 6;
        const padY = 3;
        const rx = n.x - textWidth / 2 - padX;
        const ry = n.y - 18 - padY;
        const rw = textWidth + padX * 2;
        const rh = 16 + padY;

        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, 4);
        ctx.fill();
        ctx.stroke();

        // Text
        ctx.fillStyle = n.type === 'sync' || n.type === 'plus' ? '#C25E34' : '#475569';
        ctx.fillText(n.text, n.x - textWidth / 2, n.y - 8);
      });

      if (currentSlide === 0) {
        circuitAnimationId = requestAnimationFrame(drawCircuit);
      }
    }

    // Start/stop loop based on active slide
    checkCircuitLoop = function() {
      if (currentSlide === 0) {
        if (!circuitAnimationId) {
          circuitAnimationId = requestAnimationFrame(drawCircuit);
        }
      } else {
        if (circuitAnimationId) {
          cancelAnimationFrame(circuitAnimationId);
          circuitAnimationId = null;
        }
      }
    };

    // Kick off animation
    checkCircuitLoop();
  }

  // Initial load
  goToSlide(0);
});
