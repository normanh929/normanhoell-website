document.getElementById("year").textContent = new Date().getFullYear();

const nav = document.getElementById("site-nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 40);
});

const navToggle = document.getElementById("nav-toggle");
const navLinksEl = document.getElementById("nav-links");
if (navToggle && navLinksEl) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinksEl.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  navLinksEl.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinksEl.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

initScrollSpy();

function initScrollSpy() {
  const sectionToLink = {
    angebot: "angebot",
    sportpolitik: "angebot",
    bewegung: "angebot",
    beratung: "angebot",
    referenzen: "angebot",
    news: "news",
    "ueber-mich": "ueber-mich",
    kontakt: "kontakt",
  };
  const links = {};
  navLinksEl?.querySelectorAll("a").forEach((a) => {
    links[a.getAttribute("href").slice(1)] = a;
  });

  const sections = Object.keys(sectionToLink)
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = (id) => {
    Object.values(links).forEach((a) => a.classList.remove("is-active"));
    const link = links[sectionToLink[id]];
    if (link) link.classList.add("is-active");
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => observer.observe(s));
}

let openPostModal = null;

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

    list.innerHTML = `<div class="card-grid card-grid-3">${posts.map(renderPost).join("")}</div>`;

    list.querySelectorAll(".info-card[data-post-index]").forEach((card) => {
      card.addEventListener("click", () => {
        openPostModal(posts[Number(card.dataset.postIndex)]);
      });
    });
  } catch (err) {
    list.innerHTML = '<p class="news-empty">News konnten nicht geladen werden.</p>';
    console.error(err);
  }
}

function renderPost(post, index) {
  const hasBody = Array.isArray(post.body) && post.body.length > 0;
  const images = Array.isArray(post.images) ? post.images : [];
  const cover = images[0];

  const coverHtml = cover
    ? `<div class="news-cover"><img src="${escapeHtml(cover)}" alt="${escapeHtml(post.title)}"></div>`
    : `<div class="news-cover news-cover-placeholder" aria-hidden="true">
         <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5">
           <path d="M4 4h16v16H4z" stroke-opacity="0.85"/>
           <path d="M8 9h8M8 13h8M8 17h4" stroke-opacity="0.85"/>
         </svg>
       </div>`;

  const cardClass = "info-card has-cover" + (hasBody ? " is-clickable" : "");
  const indexAttr = hasBody ? ` data-post-index="${index}"` : "";

  return `
  <div class="${cardClass}"${indexAttr}>
    ${coverHtml}
    <div class="info-card-body">
      <span class="info-date">${formatDate(post.date)}</span>
      <h4>${escapeHtml(post.title)}</h4>
      <p>${escapeHtml(post.excerpt || "")}</p>
      ${hasBody ? '<span class="read-more">Weiterlesen →</span>' : ""}
    </div>
  </div>`;
}

function renderImages(images, title) {
  if (!images.length) return "";

  const alt = escapeHtml(title);
  if (images.length === 1) {
    return `<div class="news-cover"><img src="${escapeHtml(images[0])}" alt="${alt}"></div>`;
  }

  const slides = images.map((src) => `<img src="${escapeHtml(src)}" alt="${alt}" class="news-image">`).join("");
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

function initPostModal() {
  const modal = document.createElement("div");
  modal.className = "post-modal";
  modal.innerHTML = `
    <div class="post-modal-backdrop"></div>
    <div class="post-modal-panel">
      <button type="button" class="post-modal-close" aria-label="Schließen">&times;</button>
      <div class="post-modal-content"></div>
    </div>`;
  document.body.appendChild(modal);
  const content = modal.querySelector(".post-modal-content");

  function close() {
    modal.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
  }

  modal.querySelector(".post-modal-backdrop").addEventListener("click", close);
  modal.querySelector(".post-modal-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  return function open(post) {
    const images = Array.isArray(post.images) ? post.images : [];
    const bodyHtml = (post.body || []).map((p) => `<p>${escapeHtml(p)}</p>`).join("");
    const linkHtml = post.link
      ? `<a href="${escapeHtml(post.link)}" class="cta-button" target="_blank" rel="noopener">${escapeHtml(post.linkText || "Mehr erfahren")}</a>`
      : "";

    content.innerHTML = `
      ${renderImages(images, post.title)}
      <div class="post-modal-body">
        <span class="info-date">${formatDate(post.date)}</span>
        <h3>${escapeHtml(post.title)}</h3>
        ${bodyHtml}
        ${linkHtml}
      </div>`;
    initSliders(content);
    modal.scrollTop = 0;
    content.closest(".post-modal-panel").scrollTop = 0;
    modal.classList.add("is-open");
    document.body.classList.add("no-scroll");
  };
}

loadNews();
openPostModal = initPostModal();
