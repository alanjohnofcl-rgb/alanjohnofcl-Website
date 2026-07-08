// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Booking form -> composes a pre-filled email to the DJ.
// No backend required: opens the visitor's mail client with everything filled in.
const BOOKING_EMAIL = "alanjohncotton@gmail.com";

const form = document.getElementById("bookingForm");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("email") || "").toString().trim();

  // Minimal validation
  if (!name || !email) {
    form.reportValidity();
    return;
  }

  const type = data.get("type") || "-";
  const date = data.get("date") || "-";
  const location = data.get("location") || "-";
  const budget = data.get("budget") || "-";
  const message = (data.get("message") || "").toString().trim() || "-";

  const subject = `Booking-Anfrage: ${type} / ${name}`;

  const body = [
    `Name / Veranstalter: ${name}`,
    `E-Mail: ${email}`,
    `Event-Typ: ${type}`,
    `Datum: ${date}`,
    `Location / Stadt: ${location}`,
    `Budget: ${budget}`,
    ``,
    `Nachricht:`,
    message,
    ``,
    `Gesendet über die Booking-Seite`,
  ].join("\n");

  const mailto =
    `mailto:${BOOKING_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  window.location.href = mailto;
});

// Subtle nav background on scroll
const nav = document.querySelector(".nav");
const onScroll = () => {
  if (window.scrollY > 20) nav.style.background = "rgba(5, 6, 10, 0.85)";
  else nav.style.background = "rgba(5, 6, 10, 0.6)";
};
window.addEventListener("scroll", onScroll, { passive: true });

// Photo lightbox for past events.
// Bilder hinzufügen: einfach den passenden "images"-Array unten befüllen,
// z. B. images: ["images/events/tomorrowland-1.jpg", "images/events/tomorrowland-2.jpg"]
const EVENT_GALLERIES = {
  tomorrowland: {
    title: "Tomorrowland",
    sub: "Boom, Belgien · Besucht",
    images: [],
  },
  parookaville: {
    title: "Parookaville",
    sub: "Weeze, Deutschland · Besucht",
    images: [],
  },
  ibiza: {
    title: "Ibiza",
    sub: "Balearen, Spanien · Besucht",
    images: [],
  },
  "amsterdam-music-festival": {
    title: "Amsterdam Music Festival",
    sub: "Amsterdam, Niederlande · Besucht",
    images: [],
  },
};

const lightbox = document.getElementById("lightbox");
const lightboxTitle = lightbox.querySelector(".lightbox-title");
const lightboxSub = lightbox.querySelector(".lightbox-sub");
const lightboxGallery = lightbox.querySelector(".lightbox-gallery");
let lastFocusedEl = null;

function openLightbox(key) {
  const entry = EVENT_GALLERIES[key];
  if (!entry) return;

  lightboxTitle.textContent = entry.title;
  lightboxSub.textContent = entry.sub;
  lightboxGallery.innerHTML = "";

  if (entry.images.length === 0) {
    const placeholder = document.createElement("p");
    placeholder.className = "lightbox-empty";
    placeholder.textContent = "Fotos folgen bald.";
    lightboxGallery.appendChild(placeholder);
  } else {
    entry.images.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.alt = entry.title;
      img.loading = "lazy";
      lightboxGallery.appendChild(img);
    });
  }

  lastFocusedEl = document.activeElement;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  lightbox.querySelector(".lightbox-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
  if (lastFocusedEl) lastFocusedEl.focus();
}

document.querySelectorAll(".event.past[data-gallery]").forEach((el) => {
  el.addEventListener("click", () => openLightbox(el.dataset.gallery));
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(el.dataset.gallery);
    }
  });
});

lightbox.addEventListener("click", (e) => {
  if (e.target.hasAttribute("data-lightbox-close")) closeLightbox();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
