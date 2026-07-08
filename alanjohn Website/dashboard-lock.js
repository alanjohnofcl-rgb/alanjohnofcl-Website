// PIN gate for the analytics dashboard. Only a SHA-256 hash of the PIN
// lives here, never the plain code. Nothing dashboard-related (not even
// the Supabase script) loads until the correct PIN is entered, so no
// stats ever touch the DOM before that point.
(function () {
  const PIN_HASH = "e5fddf80fe11ca0ecf994093d3603859d9e96ff539545fa9f8b100989828fbdc";
  const SESSION_KEY = "aj_dash_unlocked";

  const overlay = document.getElementById("dashLock");
  const header = document.getElementById("dashHeader");
  const main = document.getElementById("dashMain");
  const form = document.getElementById("lockForm");
  const input = document.getElementById("lockInput");
  const errorEl = document.getElementById("lockError");

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function loadDashboardScripts() {
    const supabaseScript = document.createElement("script");
    supabaseScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    supabaseScript.onload = () => {
      const dashScript = document.createElement("script");
      dashScript.src = "dashboard.js";
      document.body.appendChild(dashScript);
    };
    document.body.appendChild(supabaseScript);
  }

  function unlock() {
    overlay.hidden = true;
    header.hidden = false;
    main.hidden = false;
    document.body.classList.remove("locked");
    loadDashboardScripts();
  }

  if (sessionStorage.getItem(SESSION_KEY) === "1") {
    unlock();
  } else {
    input.focus();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const hash = await sha256Hex(input.value.trim());
    if (hash === PIN_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      errorEl.hidden = true;
      unlock();
    } else {
      errorEl.hidden = false;
      input.value = "";
      input.focus();
    }
  });
})();
