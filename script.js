const stage = document.querySelector('.ball-stage');
const elements = [...document.querySelectorAll('[data-ball]')];
const destination = document.querySelector('#about');
const curtain = document.querySelector('.page-transition');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let startedAt = null;
let navigating = false;
let selectedBall = null;

function animate(time) {
  if (startedAt === null) startedAt = time;
  const width = stage.clientWidth;
  const ballSize = elements[0].offsetWidth;
  const span = width + ballSize * 2;
  const travel = reducedMotion.matches ? 0 : (time - startedAt) * 0.045;
  elements.forEach((ball, index) => {
    if (ball === selectedBall) return;
    const x = ((index * span / elements.length + travel) % span) - ballSize;
    ball.style.transform = `translate3d(${x}px, -50%, 0)`;
  });
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function showInformation() {
  // Перемещение страницы происходит под закрытым экраном, а не на глазах посетителя.
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo({ top: destination.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
  root.style.scrollBehavior = previousBehavior;
  curtain.classList.add('is-leaving');
  window.setTimeout(() => {
    root.classList.remove('intro-locked');
    // Скрываем заставку до сброса классов, чтобы она не анимировалась обратно вниз.
    curtain.hidden = true;
    curtain.classList.remove('is-visible', 'is-typing', 'is-leaving');
    stage.classList.remove('cue-strike', 'is-hit');
    requestAnimationFrame(() => requestAnimationFrame(() => { curtain.hidden = false; }));
    if (selectedBall) selectedBall.classList.remove('is-rolling', 'is-centering');
    selectedBall = null;
    navigating = false;
    const heading = destination.querySelector('h2.heading-reveal');
    if (heading && heading.getBoundingClientRect().top < window.innerHeight) {
      heading.classList.add('heading-in-view');
    }
    destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
  }, reducedMotion.matches ? 0 : 850);
}

function goToClub(ball) {
  if (navigating) return;
  navigating = true;
  selectedBall = ball;
  if (reducedMotion.matches) {
    curtain.classList.add('is-visible', 'is-typing');
    showInformation();
    return;
  }

  ball.classList.add('is-centering');
  requestAnimationFrame(() => {
    const center = (stage.clientWidth - ball.offsetWidth) / 2;
    ball.style.transform = `translate3d(${center}px, -50%, 0)`;
  });
  window.setTimeout(() => stage.classList.add('cue-strike'), 580);
  window.setTimeout(() => {
    stage.classList.add('is-hit');
    ball.classList.add('is-rolling');
  }, 1180);
  window.setTimeout(() => curtain.classList.add('is-visible'), 1480);
  window.setTimeout(() => curtain.classList.add('is-typing'), 2300);
  window.setTimeout(showInformation, 3700);
}

for (const ball of elements) {
  ball.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    goToClub(ball);
  });
  ball.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
      event.preventDefault();
      goToClub(ball);
    }
  });
}

// На заставке колесо запускает переход; дальше прокруткой управляет браузер.
const hero = document.querySelector('.hero');
window.addEventListener('wheel', (event) => {
  if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  if (navigating) {
    event.preventDefault();
    return;
  }
  const heroBottom = hero.getBoundingClientRect().bottom;
  if (event.deltaY > 0 && heroBottom > 0 && heroBottom <= window.innerHeight + 3) {
    event.preventDefault();
    goToClub(elements[0]);
  }
}, { passive: false });

// Заголовок снова выплывает при каждом возвращении к разделу.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const headings = document.querySelectorAll('.club-content section h2');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const behindCurtain = navigating && destination.contains(entry.target);
      entry.target.classList.toggle('heading-in-view', entry.isIntersecting && !behindCurtain);
    }
  }, { threshold: 0.15 });
  headings.forEach((heading) => {
    heading.classList.add('heading-reveal');
    observer.observe(heading);
  });
}

