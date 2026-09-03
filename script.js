let currentPage = 0;
const pages = Array.from(document.querySelectorAll(".page"));
const book = document.getElementById("book");
const prevButton = document.getElementById("prev-btn");
const nextButton = document.getElementById("next-btn");
const pageLabel = document.getElementById("page-label");
const progressBar = document.getElementById("progress-bar");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxClose = document.querySelector(".lightbox-close");
const canvas = document.getElementById("background-canvas");
const ctx = canvas.getContext("2d");

const labels = [
  "Cover",
  "Capability",
  "Featured Review",
  "Photo Board",
  "Quality Notes",
  "Contact"
];

let isTurning = false;
let width = 0;
let height = 0;
let particles = [];
const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
const turnDuration = 980;
const maxPageTurn = pages.length - 1;

function updateControls() {
  prevButton.disabled = currentPage === 0 || isTurning;
  nextButton.disabled = currentPage === maxPageTurn || isTurning;
  pageLabel.textContent = labels[currentPage] || `Page ${currentPage + 1}`;
  progressBar.style.width = `${(currentPage / maxPageTurn) * 100}%`;
}

function setPageStack() {
  pages.forEach((page, index) => {
    page.style.zIndex = page.classList.contains("flipped")
      ? index + 1
      : pages.length * 2 - index;
  });

  updateControls();
}

function turnPage(page, onTurn) {
  isTurning = true;
  page.classList.add("turning");
  page.style.zIndex = pages.length * 3;
  updateControls();

  requestAnimationFrame(onTurn);

  window.setTimeout(() => {
    page.classList.remove("turning");
    isTurning = false;
    setPageStack();
  }, turnDuration);
}

function nextPage() {
  if (isTurning || currentPage >= maxPageTurn) return;

  const page = pages[currentPage];
  currentPage += 1;
  turnPage(page, () => page.classList.add("flipped"));
}

function prevPage() {
  if (isTurning || currentPage <= 0) return;

  currentPage -= 1;
  const page = pages[currentPage];
  turnPage(page, () => page.classList.remove("flipped"));
}

prevButton.addEventListener("click", prevPage);
nextButton.addEventListener("click", nextPage);

book.addEventListener("click", (event) => {
  if (event.target.closest(".photo-card")) return;

  const bounds = book.getBoundingClientRect();
  const clickedRightSide = event.clientX > bounds.left + bounds.width / 2;
  clickedRightSide ? nextPage() : prevPage();
});

window.addEventListener("keydown", (event) => {
  if (lightbox.classList.contains("open") && event.key === "Escape") {
    closeLightbox();
    return;
  }

  if (event.key === "ArrowRight") nextPage();
  if (event.key === "ArrowLeft") prevPage();
});

document.querySelectorAll(".photo-card").forEach((card) => {
  card.addEventListener("click", () => {
    lightboxImage.src = card.dataset.full;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
}

lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

function resizeCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createParticles();
}

function createParticles() {
  const count = Math.min(120, Math.floor((width * height) / 11000));
  particles = Array.from({ length: count }, (_, index) => {
    const warm = index % 3 === 0;

    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2 + 0.8,
      hue: warm ? 36 + Math.random() * 18 : 184 + Math.random() * 20,
      drift: Math.random() * Math.PI * 2
    };
  });
}

function drawBackground(time) {
  ctx.clearRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, Math.max(width, height) * 0.55);
  glow.addColorStop(0, "rgba(213, 154, 59, 0.16)");
  glow.addColorStop(0.32, "rgba(80, 214, 232, 0.08)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  particles.forEach((particle, index) => {
    const dx = pointer.x - particle.x;
    const dy = pointer.y - particle.y;
    const distance = Math.hypot(dx, dy) || 1;
    const pull = Math.min(0.035, 45 / (distance * distance));

    particle.drift += 0.018;
    particle.vx += (dx / distance) * pull + Math.cos(particle.drift) * 0.008;
    particle.vy += (dy / distance) * pull + Math.sin(particle.drift) * 0.008;
    particle.vx *= 0.994;
    particle.vy *= 0.994;
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -20) particle.x = width + 20;
    if (particle.x > width + 20) particle.x = -20;
    if (particle.y < -20) particle.y = height + 20;
    if (particle.y > height + 20) particle.y = -20;

    const pulse = Math.sin(time * 0.003 + index) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.fillStyle = `hsla(${particle.hue}, 92%, ${56 + pulse * 16}%, ${0.34 + pulse * 0.35})`;
    ctx.shadowColor = `hsl(${particle.hue}, 90%, 58%)`;
    ctx.shadowBlur = 14;
    ctx.arc(particle.x, particle.y, particle.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.shadowBlur = 0;
  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 1) {
      const a = particles[i];
      const b = particles[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);

      if (distance < 116) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(80, 214, 232, ${0.12 * (1 - distance / 116)})`;
        ctx.lineWidth = 0.7;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(drawBackground);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
});

setPageStack();
resizeCanvas();
requestAnimationFrame(drawBackground);
