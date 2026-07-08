(function () {
  const SUPABASE_URL = "https://nnmoqqjtgrxmsieauqqm.supabase.co";
  const SUPABASE_KEY = "sb_publishable_dyLVgCFjaO78DnXKBl0vYw_3Gik4SPE";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const fmt = new Intl.NumberFormat("de-DE");
  const dayFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });

  // ---------- Live visitor count (Realtime Presence, read-only) ----------
  const liveCountEl = document.getElementById("liveCount");
  const presenceChannel = client.channel("site-presence");
  presenceChannel
    .on("presence", { event: "sync" }, () => {
      const state = presenceChannel.presenceState();
      liveCountEl.textContent = fmt.format(Object.keys(state).length);
    })
    .subscribe();

  // ---------- Overview tiles ----------
  async function loadOverview() {
    const { data, error } = await client.rpc("get_overview_stats");
    if (error || !data || !data[0]) return;
    const s = data[0];
    document.getElementById("tTotalViews").textContent = fmt.format(s.total_views);
    document.getElementById("tTotalVisitors").textContent = fmt.format(s.total_visitors);
    document.getElementById("tTodayViews").textContent = fmt.format(s.views_today);
    document.getElementById("tTodayVisitors").textContent = fmt.format(s.visitors_today);
    document.getElementById("tWeekViews").textContent = fmt.format(s.views_last_7_days);
    document.getElementById("tWeekVisitors").textContent = fmt.format(s.visitors_last_7_days);
  }

  // ---------- Timeseries line chart ----------
  const chartSvg = document.getElementById("chart");
  const chartWrap = document.getElementById("chartWrap");
  const tooltip = document.getElementById("tooltip");
  const NS = "http://www.w3.org/2000/svg";
  const VB_W = 960, VB_H = 260;
  const PAD = { top: 14, right: 14, bottom: 26, left: 36 };

  function svgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  let seriesData = [];

  function renderChart(rows) {
    seriesData = rows;
    chartSvg.setAttribute("viewBox", `0 0 ${VB_W} ${VB_H}`);
    chartSvg.setAttribute("preserveAspectRatio", "none");
    chartSvg.innerHTML = "";

    const innerW = VB_W - PAD.left - PAD.right;
    const innerH = VB_H - PAD.top - PAD.bottom;
    const maxVal = Math.max(1, ...rows.map((r) => Math.max(r.views, r.visitors)));
    const n = rows.length;

    const x = (i) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * innerW);
    const y = (v) => PAD.top + innerH - (v / maxVal) * innerH;

    // gridlines (4 horizontal bands)
    const gridGroup = svgEl("g", {});
    for (let g = 0; g <= 3; g++) {
      const gy = PAD.top + (innerH / 3) * g;
      gridGroup.appendChild(
        svgEl("line", { x1: PAD.left, x2: VB_W - PAD.right, y1: gy, y2: gy, stroke: "var(--gridline)", "stroke-width": 1 })
      );
      const val = Math.round(maxVal - (maxVal / 3) * g);
      const label = svgEl("text", { x: 0, y: gy + 4, fill: "var(--muted)", "font-size": 11 });
      label.textContent = fmt.format(val);
      gridGroup.appendChild(label);
    }
    chartSvg.appendChild(gridGroup);

    // baseline
    chartSvg.appendChild(
      svgEl("line", { x1: PAD.left, x2: VB_W - PAD.right, y1: PAD.top + innerH, y2: PAD.top + innerH, stroke: "var(--baseline)", "stroke-width": 1 })
    );

    // x-axis labels (start, middle, end)
    [0, Math.floor((n - 1) / 2), n - 1].forEach((i) => {
      if (i < 0 || i >= n) return;
      const t = svgEl("text", {
        x: x(i),
        y: VB_H - 6,
        fill: "var(--muted)",
        "font-size": 11,
        "text-anchor": i === 0 ? "start" : i === n - 1 ? "end" : "middle",
      });
      t.textContent = dayFmt.format(new Date(rows[i].day));
      chartSvg.appendChild(t);
    });

    function linePath(key) {
      return rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(r[key])}`).join(" ");
    }

    chartSvg.appendChild(svgEl("path", { d: linePath("views"), fill: "none", stroke: "var(--series-1)", "stroke-width": 2, "stroke-linecap": "round" }));
    chartSvg.appendChild(svgEl("path", { d: linePath("visitors"), fill: "none", stroke: "var(--series-2)", "stroke-width": 2, "stroke-linecap": "round" }));

    // hover layer
    const hoverLine = svgEl("line", { y1: PAD.top, y2: PAD.top + innerH, stroke: "var(--baseline)", "stroke-width": 1, opacity: 0 });
    const dotViews = svgEl("circle", { r: 4, fill: "var(--series-1)", opacity: 0 });
    const dotVisitors = svgEl("circle", { r: 4, fill: "var(--series-2)", opacity: 0 });
    chartSvg.appendChild(hoverLine);
    chartSvg.appendChild(dotViews);
    chartSvg.appendChild(dotVisitors);

    const overlay = svgEl("rect", { x: PAD.left, y: PAD.top, width: innerW, height: innerH, fill: "transparent" });
    overlay.addEventListener("mousemove", (e) => {
      const rect = chartSvg.getBoundingClientRect();
      const relX = ((e.clientX - rect.left) / rect.width) * VB_W;
      const idx = Math.round(((relX - PAD.left) / innerW) * (n - 1));
      const i = Math.max(0, Math.min(n - 1, idx));
      const row = rows[i];
      hoverLine.setAttribute("x1", x(i));
      hoverLine.setAttribute("x2", x(i));
      hoverLine.setAttribute("opacity", 1);
      dotViews.setAttribute("cx", x(i));
      dotViews.setAttribute("cy", y(row.views));
      dotViews.setAttribute("opacity", 1);
      dotVisitors.setAttribute("cx", x(i));
      dotVisitors.setAttribute("cy", y(row.visitors));
      dotVisitors.setAttribute("opacity", 1);

      const wrapRect = chartWrap.getBoundingClientRect();
      tooltip.hidden = false;
      tooltip.style.left = `${e.clientX - wrapRect.left}px`;
      tooltip.style.top = `${(y(Math.max(row.views, row.visitors)) / VB_H) * wrapRect.height}px`;
      tooltip.innerHTML = `
        <strong>${dayFmt.format(new Date(row.day))}</strong>
        <span class="row"><i style="background:var(--series-1)"></i>Aufrufe: ${fmt.format(row.views)}</span>
        <span class="row"><i style="background:var(--series-2)"></i>Besucher: ${fmt.format(row.visitors)}</span>
      `;
    });
    overlay.addEventListener("mouseleave", () => {
      tooltip.hidden = true;
      hoverLine.setAttribute("opacity", 0);
      dotViews.setAttribute("opacity", 0);
      dotVisitors.setAttribute("opacity", 0);
    });
    chartSvg.appendChild(overlay);
  }

  function renderTimeseriesTable(rows) {
    const body = document.getElementById("timeseriesTableBody");
    body.innerHTML = rows
      .slice()
      .reverse()
      .map(
        (r) =>
          `<tr><td>${dayFmt.format(new Date(r.day))}</td><td>${fmt.format(r.views)}</td><td>${fmt.format(r.visitors)}</td></tr>`
      )
      .join("");
  }

  async function loadTimeseries() {
    const { data, error } = await client.rpc("get_views_timeseries", { days_back: 30 });
    if (error || !data) return;
    renderChart(data);
    renderTimeseriesTable(data);
  }

  document.getElementById("toggleTimeseriesTable").addEventListener("click", (e) => {
    const wrap = document.getElementById("timeseriesTableWrap");
    const isHidden = wrap.hidden;
    wrap.hidden = !isHidden;
    e.target.textContent = isHidden ? "Tabelle verbergen" : "Tabelle anzeigen";
  });

  // ---------- Breakdown bar lists ----------
  const DIMENSION_LABELS = {
    device_type: (v) => ({ mobile: "Mobil", tablet: "Tablet", desktop: "Desktop" }[v] || v),
  };

  async function loadBreakdown(dimension, targetId) {
    const { data, error } = await client.rpc("get_stat_breakdown", { dimension, limit_count: 8 });
    const el = document.getElementById(targetId);
    if (error || !data || data.length === 0) {
      el.innerHTML = '<p class="empty">Noch keine Daten.</p>';
      return;
    }
    const max = Math.max(...data.map((d) => Number(d.views)));
    const mapLabel = DIMENSION_LABELS[dimension] || ((v) => v);
    el.innerHTML = data
      .map((d) => {
        const pct = max > 0 ? (Number(d.views) / max) * 100 : 0;
        return `
          <div class="bar-row">
            <span class="bar-label" title="${escapeHtml(d.label)}">${escapeHtml(mapLabel(d.label))}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
            <span class="bar-value">${fmt.format(d.views)}</span>
          </div>`;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  loadOverview();
  loadTimeseries();
  loadBreakdown("path", "breakdownPath");
  loadBreakdown("referrer", "breakdownReferrer");
  loadBreakdown("device_type", "breakdownDevice");
  loadBreakdown("browser", "breakdownBrowser");
})();
