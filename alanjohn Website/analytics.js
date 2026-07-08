// Lightweight first-party analytics: logs an anonymous page view to
// Supabase and joins a Realtime Presence channel so the admin dashboard
// can show a live "visitors on site now" count. No cookies, no PII —
// just a random id kept in localStorage so repeat visits can be counted
// as unique visitors.
(function () {
  const SUPABASE_URL = "https://nnmoqqjtgrxmsieauqqm.supabase.co";
  const SUPABASE_KEY = "sb_publishable_dyLVgCFjaO78DnXKBl0vYw_3Gik4SPE";

  if (!window.supabase || !window.supabase.createClient) return;
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const VISITOR_KEY = "aj_visitor_id";
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  function detectDevice() {
    const w = window.innerWidth;
    if (w < 640) return "mobile";
    if (w < 1024) return "tablet";
    return "desktop";
  }

  function detectBrowser() {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\//.test(ua)) return "Opera";
    if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
    return "Other";
  }

  function detectOS() {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
    if (/Mac OS X/.test(ua)) return "macOS";
    if (/Windows/.test(ua)) return "Windows";
    if (/Linux/.test(ua)) return "Linux";
    return "Other";
  }

  client
    .from("page_views")
    .insert({
      path: window.location.pathname || "/",
      referrer: document.referrer || null,
      visitor_id: visitorId,
      device_type: detectDevice(),
      browser: detectBrowser(),
      os: detectOS(),
      language: navigator.language || null,
    })
    .then(() => {});

  const channel = client.channel("site-presence", {
    config: { presence: { key: visitorId } },
  });
  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.track({ online_at: new Date().toISOString() });
    }
  });
})();
