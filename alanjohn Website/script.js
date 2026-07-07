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
