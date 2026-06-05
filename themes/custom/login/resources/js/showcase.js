/* Connected-service showcase: render PNGs from manifest.json as a fanned-out deck
   of browser-window cards. On each tick the front card is pulled straight down
   while rotating (ease-in-out: slow→fast→slow) and fully fades out, then is
   recycled — invisible — to the back of the fan and eases back in. No afterimage.
   Login form never depends on this: any failure degrades to an empty panel. */
(function () {
  "use strict";

  var ROTATE_MS = 3000;   // gap between drops
  var DROP_MS = 950;      // front-card drop duration
  var FAN_MS = 700;       // fan advance / fade-back-in duration
  var FAN_STEP = 7;       // deg of fan rotation per slot behind the front
  var FAN_SCALE = 0.05;   // shrink per slot
  var FAN_FADE = 0.12;    // opacity drop per slot
  var DROP_Y = 460;       // px the front card travels down before it is gone
  var DROP_ROT = -12;     // deg it rotates while falling
  var DROP_EASE = "cubic-bezier(0.7, 0, 0.3, 1)";   // slow → fast → slow
  var FAN_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";   // spring
  var FAN_TRANS = "transform " + FAN_MS + "ms " + FAN_EASE + ", opacity " + FAN_MS + "ms " + FAN_EASE;

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

    function fanTransform(slot) {
      return "translate(-50%, -50%) rotate(" + (slot * FAN_STEP) + "deg) scale(" + (1 - slot * FAN_SCALE) + ")";
    }
    function fanOpacity(slot) { return Math.max(0, 1 - slot * FAN_FADE); }
    function placeFan(card, slot) {
      card.style.transform = fanTransform(slot);
      card.style.zIndex = String(n - slot);
    }
    function slotOf(i) { return (i - front + n) % n; }

    cards.forEach(function (c, i) { placeFan(c, slotOf(i)); c.style.opacity = String(fanOpacity(slotOf(i))); });

    if (n < 2) return; // single card: nothing to rotate

    setInterval(function () {
      var leaving = cards[front];

      // 1) pull the front card straight down (center pivot) while rotating + fading out
      leaving.style.transformOrigin = "50% 50%";
      leaving.style.zIndex = String(n + 1);
      leaving.style.transition = "transform " + DROP_MS + "ms " + DROP_EASE + ", opacity " + DROP_MS + "ms " + DROP_EASE;
      leaving.style.transform = "translate(-50%, calc(-50% + " + DROP_Y + "px)) rotate(" + DROP_ROT + "deg) scale(0.82)";
      leaving.style.opacity = "0";

      // 2) advance everyone else up the fan
      front = (front + 1) % n;
      for (var i = 0; i < n; i++) {
        if (cards[i] === leaving) continue;
        cards[i].style.transition = FAN_TRANS;
        placeFan(cards[i], slotOf(i));
        cards[i].style.opacity = String(fanOpacity(slotOf(i)));
      }

      // 3) once it is fully gone, snap it (invisible) to the back of the fan, then ease in
      setTimeout(function () {
        leaving.style.transition = "none";
        leaving.style.transformOrigin = "";        // back to the fan pivot (CSS)
        placeFan(leaving, n - 1);
        leaving.style.opacity = "0";
        void leaving.offsetWidth;                  // commit the snap before transitioning
        requestAnimationFrame(function () {
          leaving.style.transition = FAN_TRANS;
          leaving.style.opacity = String(fanOpacity(n - 1));
        });
      }, DROP_MS);
    }, ROTATE_MS);
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
