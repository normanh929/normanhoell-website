document.getElementById("year").textContent = new Date().getFullYear();

const nav = document.getElementById("site-nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 40);
});

async function loadNews() {
  const list = document.getElementById("news-list");
  try {
    const res = await fetch("content/news.json", { cache: "no-store" });
    if (!res.ok) throw new Error("news.json nicht gefunden");
    const data = await res.json();
    const posts = (data.posts || [])
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!posts.length) {
      list.innerHTML = '<p class="news-empty">Noch keine News veröffentlicht.</p>';
      return;
    }

    const featured = posts.slice(0, 2);
    const archive = posts.slice(2);

    const featuredHtml = `<div class="card-grid">${featured.map(renderPost).join("")}</div>`;
    const archiveHtml = archive.length
      ? `<div class="news-archive">${archive.map(renderArchivePost).join("")}</div>`
      : "";

    list.innerHTML = featuredHtml + archiveHtml;
    initSliders(list);
  } catch (err) {
    list.innerHTML = '<p class="news-empty">News konnten nicht geladen werden.</p>';
    console.error(err);
  }
}

function renderPost(post) {
  const hasBody = Array.isArray(post.body) && post.body.length > 0;
  const summary = `
    <span class="info-date">${formatDate(post.date)}</span>
    <h4>${escapeHtml(post.title)}</h4>
    <p>${escapeHtml(post.excerpt || "")}</p>`;

  if (!hasBody) {
    return `<div class="info-card">${summary}</div>`;
  }

  const images = Array.isArray(post.images) ? post.images : [];
  const bodyHtml = post.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("");

  return `
  <details class="info-card">
    <summary>${summary}</summary>
    <div class="info-card-detail">
      ${renderImages(images, post.title)}
      ${bodyHtml}
    </div>
  </details>`;
}

function renderArchivePost(post) {
  const summary = `
    <span class="info-date">${formatDate(post.date)}</span>
    <h4>${escapeHtml(post.title)}</h4>`;

  const hasBody = Array.isArray(post.body) && post.body.length > 0;
  const images = Array.isArray(post.images) ? post.images : [];

  if (!hasBody && !post.excerpt) {
    return `<div class="news-archive-item">${summary}</div>`;
  }

  const teaser = post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : "";
  const bodyHtml = hasBody ? post.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("") : "";

  return `
  <details class="news-archive-item">
    <summary>${summary}</summary>
    <div class="info-card-detail">
      ${renderImages(images, post.title)}
      ${teaser}
      ${bodyHtml}
    </div>
  </details>`;
}

function renderImages(images, title) {
  if (!images.length) return "";

  const alt = escapeHtml(title);
  if (images.length === 1) {
    return `<img src="${escapeHtml(images[0])}" alt="${alt}" class="news-image lightbox-img">`;
  }

  const slides = images
    .map((src) => `<img src="${escapeHtml(src)}" alt="${alt}" class="news-image lightbox-img">`)
    .join("");
  const dots = images
    .map((_, i) => `<button type="button" class="slider-dot${i === 0 ? " is-active" : ""}" data-slide-to="${i}" aria-label="Bild ${i + 1}"></button>`)
    .join("");

  return `
    <div class="news-slider" data-index="0">
      <div class="news-slider-track">${slides}</div>
      <button type="button" class="slider-btn slider-prev" aria-label="Vorheriges Bild">&#8249;</button>
      <button type="button" class="slider-btn slider-next" aria-label="Nächstes Bild">&#8250;</button>
      <div class="slider-dots">${dots}</div>
    </div>`;
}

function initSliders(container) {
  container.querySelectorAll(".news-slider").forEach((slider) => {
    const track = slider.querySelector(".news-slider-track");
    const dots = slider.querySelectorAll(".slider-dot");
    const slideCount = track.children.length;

    const goTo = (index) => {
      const clamped = (index + slideCount) % slideCount;
      slider.dataset.index = clamped;
      track.style.transform = `translateX(-${clamped * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === clamped));
    };

    slider.querySelector(".slider-prev").addEventListener("click", (e) => {
      e.preventDefault();
      goTo(Number(slider.dataset.index) - 1);
    });
    slider.querySelector(".slider-next").addEventListener("click", (e) => {
      e.preventDefault();
      goTo(Number(slider.dataset.index) + 1);
    });
    dots.forEach((dot) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        goTo(Number(dot.dataset.slideTo));
      });
    });
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function initLightbox() {
  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.innerHTML = '<img alt="" /><button type="button" class="lightbox-close" aria-label="Schließen">&times;</button>';
  document.body.appendChild(overlay);
  const overlayImg = overlay.querySelector("img");

  document.addEventListener("click", (e) => {
    const target = e.target.closest(".lightbox-img");
    if (!target) return;
    overlayImg.src = target.src;
    overlayImg.alt = target.alt;
    overlay.classList.add("is-open");
  });

  overlay.addEventListener("click", () => overlay.classList.remove("is-open"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.classList.remove("is-open");
  });
}

loadNews();
initLightbox();
