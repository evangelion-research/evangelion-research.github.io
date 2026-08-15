/* Evangelion Research — theme toggle, scroll reveal, UTC clock. */
(function () {
  "use strict";

  var root = document.documentElement;

  /* ---- theme ---- */
  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function paintToggle() {
    var label = document.querySelector("[data-theme-label]");
    if (label) label.textContent = currentTheme().toUpperCase();
  }

  var toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        localStorage.setItem("eva-theme", next);
      } catch (e) {}
      paintToggle();
    });
    paintToggle();
  }

  /* ---- scroll reveal ---- */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && "IntersectionObserver" in window) {
    var targets = document.querySelectorAll(
      "main section.shell, .thread-card, .post-item, .paper-item, .person-card, .problem-list li"
    );
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i % 6, 5) * 45 + "ms";
      io.observe(el);
    });
  }

  /* ---- UTC clock in the footer ---- */
  var clock = document.querySelector("[data-clock]");
  if (clock) {
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    var tick = function () {
      var d = new Date();
      clock.textContent =
        pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes()) + ":" + pad(d.getUTCSeconds());
    };
    tick();
    setInterval(tick, 1000);
  }
})();
