// Añade rutas relativas como './imagenes/gta-vi.jpg' para sustituir los cuadrados.
const images = {
  box: './images/caja.png',
  socks: './images/calcetin.png',
  potato: './images/patata.png',
  paper: './images/papel.png',
  sponge: './images/esponja.png',
  cardboard: './images/carton.png',
  gold: './images/cuchillo.png',
  gta: './images/gta.png',
};

const jokeGifts = [
  { name: 'Calcetín suelto', image: images.socks, mark: 'CS' },
  { name: 'Una patata', image: images.potato, mark: 'PA' },
  { name: 'Papel higiénico', image: images.paper, mark: 'PH' },
  { name: 'Un estropajo', image: images.sponge, mark: 'ES' },
  { name: 'Tubo de cartón', image: images.cardboard, mark: 'TC' },
];

const experience = document.querySelector('.experience');
const headline = document.querySelector('#headline');
const description = document.querySelector('.description');
const announcement = document.querySelector('#announcement');
const boxPanel = document.querySelector('#box-panel');
const reelPanel = document.querySelector('#reel-panel');
const track = document.querySelector('#reel-track');
const giftTile = document.querySelector('#gift-tile');
const dialog = document.querySelector('#prize-dialog');
const closeButton = document.querySelector('#close-prize');
const prizeConfetti = document.querySelector('#prize-confetti');
const prizeAudio = document.querySelector('#prize-audio');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let revealTrigger;

function addImage(tile, path) {
  if (!path) return;
  const image = new Image();
  image.alt = '';
  image.onload = () => {
    tile.append(image);
    tile.classList.add('has-image');
  };
  image.src = path;
}

function setStage(stage, title, text) {
  experience.dataset.stage = stage;
  headline.textContent = title;
  description.textContent = text;
}

function makeCard(gift, winning) {
  const card = document.createElement(winning ? 'button' : 'div');
  card.className = winning ? 'reel-card winning-card' : 'reel-card';
  if (winning) {
    card.type = 'button';
    card.disabled = true;
    card.setAttribute('aria-label', 'Abrir premio dorado');
    card.addEventListener('click', revealPrize);
  } else {
    card.setAttribute('aria-hidden', 'true');
  }

  const art = document.createElement('span');
  art.className = 'tile-art card-art';
  art.setAttribute('aria-hidden', 'true');
  art.textContent = gift.mark;
  addImage(art, gift.image);

  const label = document.createElement('span');
  label.className = 'card-label';
  label.textContent = gift.name;
  card.append(art, label);
  return card;
}

function position(index) {
  return `translateX(calc(var(--card-width) * -0.5 - var(--card-step) * ${index}))`;
}

function createReelAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  let context;
  let ready;
  try {
    context = new AudioContext();
    ready = context.resume().catch(() => {});
  } catch {
    return;
  }

  const clickNoise = context.createBuffer(1, Math.ceil(context.sampleRate * .038), context.sampleRate);
  const samples = clickNoise.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;

  function tone({ frequency, endFrequency = frequency, start, duration, volume, brass = false }) {
    const oscillator = context.createOscillator();
    oscillator.type = brass ? 'sawtooth' : 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(.001, start);
    if (brass) {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = .7;
      filter.frequency.setValueAtTime(900, start);
      filter.frequency.exponentialRampToValueAtTime(2900, start + .045);
      filter.frequency.exponentialRampToValueAtTime(1150, start + duration);
      oscillator.connect(filter).connect(gain);
      gain.gain.linearRampToValueAtTime(volume, start + .025);
      gain.gain.setValueAtTime(volume, start + duration * .6);
    } else {
      oscillator.connect(gain);
      gain.gain.linearRampToValueAtTime(volume, start + .003);
    }
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  return {
    tick() {
      if (context.state !== 'running') return;
      const start = context.currentTime;
      const noise = context.createBufferSource();
      noise.buffer = clickNoise;
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3100;
      filter.Q.value = 1.5;
      const gain = context.createGain();
      gain.gain.setValueAtTime(.28, start);
      gain.gain.exponentialRampToValueAtTime(.001, start + .012);
      gain.gain.setValueAtTime(.14, start + .016);
      gain.gain.exponentialRampToValueAtTime(.001, start + .036);
      noise.connect(filter).connect(gain).connect(context.destination);
      noise.start(start);
      tone({ frequency: 1640, endFrequency: 1510, start, duration: .021, volume: .07 });
      tone({ frequency: 1030, endFrequency: 940, start: start + .016, duration: .021, volume: .045 });
    },
    async prize() {
      await ready;
      if (context.state !== 'running') return;
      const start = context.currentTime;
      [392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
        tone({ frequency, start: start + index * .145, duration: index === 3 ? .66 : .17, volume: .15, brass: true });
      });
      const chordStart = start + .435;
      tone({ frequency: 523.25, start: chordStart, duration: .64, volume: .07, brass: true });
      tone({ frequency: 261.63, start: chordStart, duration: .65, volume: .08, brass: true });
    },
  };
}

function watchReelTicks(audio, startIndex, winningIndex) {
  if (!audio) return;

  const [first, second] = track.children;
  const viewport = track.parentElement;
  let lastIndex = startIndex;
  let frame;
  function checkCenter() {
    const bounds = viewport.getBoundingClientRect();
    const firstCard = first.getBoundingClientRect();
    const step = second.getBoundingClientRect().left - firstCard.left;
    if (step > 0) {
      const distance = bounds.left + bounds.width / 2 - (firstCard.left + firstCard.width / 2);
      const index = Math.floor(distance / step + .001);
      if (index > lastIndex) {
        if (index < winningIndex) audio.tick();
        lastIndex = index;
      }
    }
    frame = requestAnimationFrame(checkCenter);
  }

  frame = requestAnimationFrame(checkCenter);
  return () => cancelAnimationFrame(frame);
}

async function openBox() {
  if (experience.dataset.stage !== 'box') return;
  const audio = createReelAudio();
  setStage('spin', '¿Qué te tocará?', 'La ruleta está girando…');
  announcement.textContent = 'La ruleta está girando.';
  boxPanel.hidden = true;
  reelPanel.hidden = false;
  headline.focus({ preventScroll: true });

  const pastGifts = Array.from({ length: 40 }, (_, index) => jokeGifts[index % jokeGifts.length]);
  const winner = makeCard({ name: 'Premio dorado', image: images.gold, mark: '✦' }, true);
  track.append(...pastGifts.map(gift => makeCard(gift, false)), winner,
    ...[...jokeGifts, ...jokeGifts].map(gift => makeCard(gift, false)));
  const winningIndex = pastGifts.length;
  const stop = position(winningIndex);

  if (!reducedMotion.matches && track.animate) {
    const startIndex = 8;
    const spin = track.animate([
      { transform: position(startIndex), easing: 'cubic-bezier(.13, .24, .60, .86)' },
      { transform: position(winningIndex - 3.5), offset: .58, easing: 'cubic-bezier(.24, .35, .65, .83)' },
      { transform: position(winningIndex - .65), offset: .83, easing: 'cubic-bezier(.24, .35, .65, 1)' },
      { transform: stop },
    ], { duration: 8900, fill: 'forwards' });
    const stopTicks = watchReelTicks(audio, startIndex, winningIndex);
    await spin.finished.catch(() => {});
    stopTicks?.();
    track.style.transform = stop;
    spin.cancel();
  } else {
    track.style.transform = stop;
  }

  setStage('prize', '¡Premio dorado!', 'Toca el icono dorado para abrir tu regalo.');
  announcement.textContent = 'Premio dorado desbloqueado.';
  winner.disabled = false;
  audio?.prize();
  if (document.activeElement === headline) winner.focus({ preventScroll: true });
}

function burstConfetti() {
  const colors = ['#ffcf4b', '#f45d87', '#6126a7', '#168e82', '#317ad4', '#fff9e9'];
  const pieces = Array.from({ length: 44 }, (_, index) => {
    const piece = document.createElement('span');
    const direction = index % 2 === 0 ? 1 : -1;
    piece.style.setProperty('--origin', direction === 1 ? '8%' : '92%');
    piece.style.setProperty('--drift', `${direction * (30 + Math.random() * 47)}vw`);
    piece.style.setProperty('--rise', `${-32 - Math.random() * 33}dvh`);
    piece.style.setProperty('--turn', `${direction * (240 + Math.random() * 520)}deg`);
    piece.style.setProperty('--size', `${5 + Math.random() * 5}px`);
    piece.style.setProperty('--color', colors[index % colors.length]);
    piece.style.setProperty('--duration', `${1.15 + Math.random() * .65}s`);
    piece.style.setProperty('--delay', `${Math.random() * .14}s`);
    return piece;
  });
  prizeConfetti.replaceChildren(...pieces);
}

function revealPrize(event) {
  if (experience.dataset.stage !== 'prize' || dialog.open) return;
  revealTrigger = event.currentTarget;
  if (!reducedMotion.matches) burstConfetti();
  dialog.showModal();
  prizeAudio.currentTime = 0;
  prizeAudio.play().catch(() => {});
}

addImage(document.querySelector('#box-art'), images.box);
addImage(document.querySelector('#cover-art'), images.gta);
giftTile.addEventListener('click', openBox);
closeButton.addEventListener('click', () => dialog.close());
prizeConfetti.addEventListener('animationend', event => event.target.remove());
dialog.addEventListener('close', () => {
  if (dialog.open) return;
  prizeConfetti.replaceChildren();
  prizeAudio.pause();
  revealTrigger?.focus({ preventScroll: true });
});
