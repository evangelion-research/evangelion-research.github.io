/* Evangelion Research: theme toggle. */
(function () {
  "use strict";

  var root = document.documentElement;

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
})();
