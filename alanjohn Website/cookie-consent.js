// Cookie-/Consent-Banner: schaltet die Statistik (analytics.js, nutzt
// localStorage + Supabase) erst nach Zustimmung frei. "Nur notwendige"
// lehnt die Statistik ab und lädt analytics.js nicht.
(function () {
  const CONSENT_KEY = "aj_cookie_consent";

  function getConsent() {
    try {
      return JSON.parse(localStorage.getItem(CONSENT_KEY));
    } catch {
      return null;
    }
  }

  function setConsent(statistics) {
    const consent = { statistics, decided_at: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    applyConsent(consent);
  }

  function applyConsent(consent) {
    if (consent && consent.statistics && !window.__ajAnalyticsLoaded) {
      window.__ajAnalyticsLoaded = true;
      const script = document.createElement("script");
      script.src = "analytics.js";
      document.body.appendChild(script);
    }
  }

  function closeBanner() {
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.remove();
  }

  function buildBanner() {
    closeBanner();
    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.id = "cookieBanner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie-Einstellungen");
    banner.innerHTML = `
      <p>
        Diese Website speichert eine zufällige Kennung im lokalen Speicher deines
        Browsers, um anonyme Besuchsstatistiken zu erfassen (z.&nbsp;B. wie viele
        Personen gerade online sind). Das ist nicht technisch notwendig &ndash; du
        entscheidest. Details in der
        <a href="datenschutz.html">Datenschutzerklärung</a>.
      </p>
      <div class="cookie-banner-actions">
        <button type="button" class="btn btn-ghost" id="cookieRejectBtn">Nur notwendige</button>
        <button type="button" class="btn btn-primary" id="cookieAcceptBtn">Alle akzeptieren</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById("cookieAcceptBtn").addEventListener("click", () => {
      setConsent(true);
      closeBanner();
    });
    document.getElementById("cookieRejectBtn").addEventListener("click", () => {
      setConsent(false);
      closeBanner();
    });
  }

  const existing = getConsent();
  if (existing) {
    applyConsent(existing);
  } else {
    buildBanner();
  }

  document.addEventListener("click", (e) => {
    if (e.target && e.target.closest && e.target.closest(".cookie-settings-link")) {
      e.preventDefault();
      buildBanner();
    }
  });
})();
