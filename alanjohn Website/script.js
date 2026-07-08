// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Hero video autoplay fallback. Some mobile browsers (data saver mode,
// low power mode, slow connections) silently skip the native "autoplay"
// attribute even when muted, and never retry on their own. Explicitly
// trigger playback, retry once the video is actually ready, and fall
// back to starting it on the first user interaction if it's still paused.
const heroVideo = document.querySelector(".hero-video");
if (heroVideo) {
  const tryPlayHeroVideo = () => {
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) playPromise.catch(() => {});
  };

  tryPlayHeroVideo();
  heroVideo.addEventListener("loadeddata", tryPlayHeroVideo);
  heroVideo.addEventListener("canplay", tryPlayHeroVideo);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && heroVideo.paused) tryPlayHeroVideo();
  });

  const resumeHeroVideoOnInteraction = () => {
    if (heroVideo.paused) tryPlayHeroVideo();
  };
  ["pointerdown", "touchstart", "keydown", "scroll"].forEach((evt) =>
    document.addEventListener(evt, resumeHeroVideoOnInteraction, { passive: true, once: true })
  );
}

// Booking form -> sends the request to a Supabase Edge Function, which
// emails the DJ with an Accept/Decline link for each request. Accepting
// automatically adds the event to "Upcoming Events" below.
const SUPABASE_URL = "https://nnmoqqjtgrxmsieauqqm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubW9xcWp0Z3J4bXNpZWF1cXFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0NDQ2MjgsImV4cCI6MjA5OTAyMDYyOH0.TLnjEXXVqZUGxVKjnwSsgN-hPlMPAQFvxrpoySaCB1A";
const BOOKING_EMAIL = "alanjohncotton@gmail.com";

const form = document.getElementById("bookingForm");
const statusEl = document.getElementById("bookingStatus");

function showBookingStatus(text, tone) {
  statusEl.textContent = text;
  statusEl.className = `booking-status ${tone}`;
  statusEl.hidden = false;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  const name = (data.get("name") || "").toString().trim();
  const email = (data.get("email") || "").toString().trim();

  // Minimal validation
  if (!name || !email) {
    form.reportValidity();
    return;
  }

  const payload = {
    name,
    email,
    type: data.get("type") || "",
    date: data.get("date") || "",
    location: (data.get("location") || "").toString().trim(),
    budget: (data.get("budget") || "").toString().trim(),
    message: (data.get("message") || "").toString().trim(),
  };

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  statusEl.hidden = true;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/submit-booking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("request failed");

    form.reset();
    showBookingStatus("Danke! Deine Anfrage ist raus, ich melde mich so schnell wie möglich.", "ok");
  } catch (err) {
    showBookingStatus(
      `Anfrage konnte nicht gesendet werden. Bitte direkt per Mail an ${BOOKING_EMAIL}.`,
      "error"
    );
  } finally {
    submitBtn.disabled = false;
  }
});

// Upcoming Events -> loaded live from Supabase. Confirming a booking
// request (via the Accept link in the email) inserts a row here, so new
// events show up automatically without touching this file or index.html.
const upcomingList = document.getElementById("upcomingEventList");
const MONTHS_DE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

async function loadUpcomingEvents() {
  if (!upcomingList) return;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/events?select=*&or=(event_date.gte.${today},event_date.is.null)&order=event_date.asc.nullslast`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!res.ok) throw new Error("request failed");
    const events = await res.json();

    if (!events.length) {
      upcomingList.innerHTML = '<li class="event-empty">Aktuell keine bestätigten Termine.</li>';
      return;
    }

    upcomingList.innerHTML = events.map(renderEvent).join("");
  } catch (err) {
    upcomingList.innerHTML = '<li class="event-empty">Events konnten nicht geladen werden.</li>';
  }
}

function renderEvent(ev) {
  let day = "";
  let month = "";
  if (ev.event_date) {
    const d = new Date(`${ev.event_date}T00:00:00`);
    day = String(d.getDate()).padStart(2, "0");
    month = MONTHS_DE[d.getMonth()];
  } else {
    month = "TBD";
  }

  const title = escapeHtml(ev.title || "Event");
  const location = escapeHtml(ev.location || "");
  const ticket = ev.ticket_url
    ? `<a class="event-cta" href="${escapeHtml(ev.ticket_url)}" target="_blank" rel="noopener">Tickets</a>`
    : "";

  return `
    <li class="event upcoming">
      <div class="event-date"><span class="d">${day}</span><span class="m">${month}</span></div>
      <div class="event-info">
        <strong>${title}</strong>
        ${location ? `<span>${location}</span>` : ""}
      </div>
      ${ticket}
    </li>`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

loadUpcomingEvents();

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
  "gardeneden-2026": {
    title: "GardenEden",
    sub: "Goldenstedt · 30.05.2026 · Aufgelegt",
    images: [],
  },
  "studi-party-ritter-butzke-apr26": {
    title: "Studi Party",
    sub: "Ritter Butzke (Aqua Höfe), Berlin · 25.04.2026 · Aufgelegt",
    images: [],
  },
  "studi-party-festsaal-kreuzberg": {
    title: "Studi Party",
    sub: "Festsaal Kreuzberg, Berlin · 14.03.2026 · Aufgelegt",
    images: [],
  },
  "the-sharp-london": {
    title: "The Sharp",
    sub: "London · 06.02.2026 · Aufgelegt",
    images: [],
  },
  "studi-party-ritter-butzke-dec25": {
    title: "Studi Party",
    sub: "Ritter Butzke (Aqua Höfe), Berlin · 28.12.2025 · Aufgelegt",
    images: [],
  },
  "hertha-bsc-party": {
    title: "Hertha BSC Party",
    sub: "Berlin · 09.12.2025 · Aufgelegt",
    images: [],
  },
  "kinderparty-bergwerk": {
    title: "Kinderparty",
    sub: "Club Bergwerk, Potsdam · 18.10.2025 · Aufgelegt",
    images: [],
  },
  "sommerparty-hangelsberg": {
    title: "Sommerparty",
    sub: "Hangelsberg · 25.07.2025 · Aufgelegt",
    images: [],
  },
  "abi-ball-hamburg": {
    title: "Abi Ball",
    sub: "Sportschule, Hamburg · 19.07.2025 · Aufgelegt",
    images: [],
  },
  "gardeneden-2025": {
    title: "GardenEden",
    sub: "Goldenstedt · 17.05.2025 · Aufgelegt",
    images: [],
  },
  "sommerparty-lindenpark": {
    title: "Sommerparty",
    sub: "Lindenpark, Potsdam · 11.05.2025 · Aufgelegt",
    images: [],
  },
  "winterparty-lindenpark": {
    title: "Winterparty",
    sub: "Lindenpark, Potsdam · 08.02.2025 · Aufgelegt",
    images: [],
  },
  "sio-festival-berlin": {
    title: "SIO Festival Berlin",
    sub: "Kulturbrauerei, Berlin · 28.12.2024 · Aufgelegt",
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

// "Weitere anzeigen" toggle for the long Past Events list
const pastEventsToggle = document.getElementById("pastEventsToggle");
if (pastEventsToggle) {
  const hiddenPastEvents = pastEventsToggle
    .closest(".events-col")
    .querySelectorAll(".event.past[hidden]");
  pastEventsToggle.addEventListener("click", () => {
    const expand = pastEventsToggle.getAttribute("aria-expanded") !== "true";
    hiddenPastEvents.forEach((el) => (el.hidden = !expand));
    pastEventsToggle.setAttribute("aria-expanded", String(expand));
    pastEventsToggle.textContent = expand
      ? "Weniger anzeigen"
      : `Weitere anzeigen (+${hiddenPastEvents.length})`;
  });
}
