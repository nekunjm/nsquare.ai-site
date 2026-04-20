// ── Cursor glow ──
const cursorGlow = document.getElementById('cursor-glow');
if (cursorGlow) {
  let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorGlow.classList.add('active');
  });
  document.addEventListener('mouseleave', () => cursorGlow.classList.remove('active'));
  function animateGlow() {
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    cursorGlow.style.left = glowX + 'px';
    cursorGlow.style.top = glowY + 'px';
    requestAnimationFrame(animateGlow);
  }
  animateGlow();
}

// ── Navbar scroll effect ──
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('nav-scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── Mobile menu toggle ──
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    const open = !mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    menuBtn.setAttribute('aria-expanded', !open);
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobileMenu.classList.add('hidden');
    menuBtn.setAttribute('aria-expanded', 'false');
  }));
}

// ── Scroll reveal via Intersection Observer ──
const revealEls = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right');
if (revealEls.length) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));
}

// ── Animated counters ──
const counters = document.querySelectorAll('[data-counter]');
if (counters.length) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.counter);
        const suffix = el.dataset.suffix || '';
        const duration = 1200;
        const start = performance.now();
        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * target);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));
}

// ── Card tilt effect ──
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-8px) perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

// ── How it Works — animate on scroll ──
const hiwGrid = document.getElementById('hiw-grid');
if (hiwGrid) {
  const hiwObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.hiw-connector').forEach((c, i) => {
          setTimeout(() => c.classList.add('animate'), 400 + i * 500);
        });
        entry.target.querySelectorAll('.step-circle').forEach((c, i) => {
          setTimeout(() => c.classList.add('animate'), 200 + i * 500);
        });
        hiwObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  hiwObserver.observe(hiwGrid);
}

// ── Floating SVG Paths ──
function generatePaths(containerId, position) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 696 316');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
  for (let i = 0; i < 36; i++) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`;
    path.setAttribute('d', d);
    path.setAttribute('pathLength', '1');
    path.setAttribute('stroke-dasharray', '0.3 0.7');
    const strokeOpacity = (0.07 + i * 0.012).toFixed(3);
    path.setAttribute('stroke-opacity', Math.min(strokeOpacity, 0.45));
    path.setAttribute('stroke-width', (0.5 + i * 0.035).toFixed(2));
    const duration = (18 + Math.random() * 12).toFixed(1);
    const delay = (Math.random() * -25).toFixed(1);
    path.style.setProperty('--path-duration', duration + 's');
    path.style.animationDelay = delay + 's';
    svg.appendChild(path);
  }
  container.appendChild(svg);
}
generatePaths('floating-paths-1', 1);
generatePaths('floating-paths-2', -1);

// ── Marquee ──
function initMarquee(rowEl, reverse, duration) {
  if (!rowEl) return;
  const track = rowEl.querySelector('.marquee-track');
  const gap = 32;
  const origItems = Array.from(track.children);
  const setWidth = track.scrollWidth;
  const shift = setWidth + gap;
  const vw = window.innerWidth;
  while (track.scrollWidth < vw * 3) {
    origItems.forEach(el => track.appendChild(el.cloneNode(true)));
  }
  track.style.setProperty('--mq-shift', `-${shift}px`);
  const animName = reverse ? 'marqueeRight' : 'marqueeLeft';
  track.style.animation = `${animName} ${duration}s linear infinite`;
}
initMarquee(document.querySelector('.marquee-row-1'), false, 40);
initMarquee(document.querySelector('.marquee-row-2'), true, 35);

// ── FAQ accordion ──
const faqList = document.getElementById('faq-list');
if (faqList) {
  faqList.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-btn');
    if (!btn) return;
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
}

// ── Google Sheets contact form ──
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxR8sMYsILbvQY7FX24MONPA9fVH7NEgMnkBhEKogFBp0jfo5Tk0HrhMKY_VxYiTV-z/exec';
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    const payload = {
      name:     form.name.value,
      business: form.business.value,
      contact:  form['contact-info'].value,
      message:  form.message.value,
    };
    try {
      const params = new URLSearchParams(payload);
      await fetch(SHEET_URL + '?' + params.toString(), { method: 'GET', mode: 'no-cors' });
      document.getElementById('form-success').classList.remove('hidden');
      form.classList.add('hidden');
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Send Message';
      alert('Something went wrong. Please try again.');
    }
  });
}
