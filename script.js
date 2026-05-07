/* ── Custom cursor ── */
const dot = document.getElementById('cursorDot');
document.addEventListener('mousemove', e => {
  dot.style.left = e.clientX + 'px';
  dot.style.top  = e.clientY + 'px';
}, { passive: true });

/* ── Nav scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ── Mobile menu ── */
const toggle     = document.querySelector('.menu-toggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link');

toggle.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  const spans = toggle.querySelectorAll('span');
  if (open) {
    spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});
mobileLinks.forEach(link => link.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
}));

/* ── Scroll reveal ── */
const revealEls = document.querySelectorAll('.reveal-in, .reveal-up, .reveal-clip, .reveal-card');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObs.observe(el));

/* ── Text scramble on hero name ── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function scramble(el, final, duration = 820) {
  const len = final.length;
  let start = null;
  (function tick(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const resolved = Math.floor(p * len);
    let out = '';
    for (let i = 0; i < len; i++) {
      out += i < resolved ? final[i] : CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = final;
  })(performance.now());
}

const nameEl = document.getElementById('scrambleName');
const nameObs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) {
    setTimeout(() => scramble(nameEl, 'Sam'), 250);
    nameObs.disconnect();
  }
}, { threshold: 0.5 });
nameObs.observe(nameEl);

/* ── Active nav link ── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 130) current = sec.id;
  });
  navLinks.forEach(link => {
    if (link.classList.contains('nav-cta')) return;
    link.style.color = link.getAttribute('href') === `#${current}` ? 'var(--text)' : '';
  });
}, { passive: true });

/* ── Contact form ── */
const form = document.getElementById('contactForm');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = form.querySelector('.btn-submit');

  btn.textContent = 'Wird gesendet…';
  btn.disabled    = true;

  const data = new FormData(form);
  data.append('access_key', 'bad1bf9b-54f5-4978-bd4a-50c04a6ae4b9');
  data.append('subject', `Neue Anfrage: ${data.get('subject') || 'Kontaktformular'}`);
  data.append('from_name', 'sam. Website');
  data.append('botcheck', '');

  try {
    const res  = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
    const json = await res.json();

    if (json.success) {
      btn.textContent      = 'Gesendet ✓';
      btn.style.background = '#22c55e';
      btn.style.color      = '#fff';
      setTimeout(() => {
        btn.textContent      = 'Nachricht senden →';
        btn.style.background = '';
        btn.style.color      = '';
        btn.disabled         = false;
        form.reset();
      }, 3500);
    } else {
      throw new Error(json.message);
    }
  } catch {
    btn.textContent      = 'Fehler – bitte erneut versuchen';
    btn.style.background = '#ef4444';
    btn.style.color      = '#fff';
    setTimeout(() => {
      btn.textContent      = 'Nachricht senden →';
      btn.style.background = '';
      btn.style.color      = '';
      btn.disabled         = false;
    }, 3500);
  }
});
