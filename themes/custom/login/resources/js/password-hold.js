/* Press-and-hold password reveal (design-rules.md §5): the field shows plaintext
   only while the button is pressed (pointer or Space/Enter), and re-masks on
   release / leave / blur. Replaces Keycloak's default click-toggle. */
(function () {
  "use strict";

  function bind(btn) {
    var input = document.getElementById(btn.getAttribute("aria-controls") || "password");
    if (!input) return;

    var show = function () { input.type = "text"; btn.setAttribute("aria-pressed", "true"); };
    var hide = function () { input.type = "password"; btn.setAttribute("aria-pressed", "false"); };

    btn.addEventListener("pointerdown", function (e) { e.preventDefault(); show(); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { btn.addEventListener(ev, hide); });
    btn.addEventListener("keydown", function (e) {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); show(); }
    });
    btn.addEventListener("keyup", function (e) {
      if (e.key === " " || e.key === "Enter") hide();
    });
    btn.addEventListener("blur", hide);
    hide(); // ensure starting state
  }

  document.querySelectorAll("button[data-password-hold]").forEach(bind);
})();
