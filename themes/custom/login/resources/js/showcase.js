/* Connected-service showcase: render PNGs from manifest.json as a stacked deck of
   browser-window cards and auto-rotate the front card to the back. Login form never
   depends on this — any failure degrades to an empty (display:none) panel. */
(function () {
  "use strict";

  var ROTATE_MS = 3500;
  var TRANS_MS = 700;    // must match .service-window transition in custom.css
  var DEPTH_Y = 16;      // px each deeper card shifts up
  var DEPTH_SCALE = 0.05;
  var DEPTH_FADE = 0.18;

  var stack = document.getElementById("service-stack");
  var base = (typeof RES_PATH !== "undefined" ? RES_PATH : "") + "/img/services/";
  if (!stack) return;

  fetch(base + "manifest.json", { credentials: "same-origin" })
    .then(function (r) {
      if (!r.ok) throw new Error("manifest " + r.status);
      return r.json();
    })
    .then(render)
    .catch(function (e) {
      console.warn("[showcase] disabled:", e.message); // form stays intact
    });

  function render(items) {
    if (!Array.isArray(items) || items.length === 0) return;

    var cards = items.map(buildCard);
    cards.forEach(function (c) { stack.appendChild(c); });
    document.getElementById("service-showcase").classList.add("is-ready");

    var n = cards.length;
    var front = 0;
    apply(cards, front, n);

    if (n < 2) return; // single card: nothing to rotate

    setInterval(function () {
      var leaving = cards[front];
      front = (front + 1) % n;
      apply(cards, front, n);
      leaving.style.zIndex = String(n + 1); // stays on top only while it slides back
      setTimeout(function () { apply(cards, front, n); }, TRANS_MS + 80); // then drops behind the deck
    }, ROTATE_MS);
  }

  function apply(cards, front, n) {
    for (var i = 0; i < n; i++) {
      var depth = (i - front + n) % n;
      var card = cards[i];
      card.style.transform =
        "translate(-50%, calc(-50% - " + depth * DEPTH_Y + "px)) scale(" + (1 - depth * DEPTH_SCALE) + ")";
      card.style.opacity = String(Math.max(0, 1 - depth * DEPTH_FADE));
      card.style.zIndex = String(n - depth);
      card.classList.toggle("is-front", depth === 0);
    }
  }

  function buildCard(item) {
    var card = document.createElement("div");
    card.className = "service-window";

    var bar = document.createElement("div");
    bar.className = "sw-bar";
    var dots = document.createElement("div");
    dots.className = "sw-dots";
    dots.innerHTML = "<span></span><span></span><span></span>";
    var title = document.createElement("div");
    title.className = "sw-title";
    title.textContent = item.title || "";
    bar.appendChild(dots);
    bar.appendChild(title);

    var body = document.createElement("div");
    body.className = "sw-body";
    var img = document.createElement("img");
    img.alt = item.title || "";
    img.loading = "lazy";
    img.src = base + item.file;
    img.onerror = function () { console.warn("[showcase] missing image:", item.file); };
    body.appendChild(img);

    card.appendChild(bar);
    card.appendChild(body);
    return card;
  }
})();
