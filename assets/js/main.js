/*
 * RaphNLab — shared page behaviour: mobile nav toggle, active nav link,
 * footer year, and the mailto-based contact form.
 */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    // Mobile nav toggle
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        links.classList.toggle("open");
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { links.classList.remove("open"); });
      });
    }

    // Highlight current page in nav
    var here = document.body.getAttribute("data-page");
    if (here) {
      document.querySelectorAll(".nav-links a[data-page]").forEach(function (a) {
        if (a.getAttribute("data-page") === here) a.classList.add("active");
      });
    }

    // Footer year
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    // Contact form -> mailto (no backend on a static site; swap for a real
    // form endpoint such as Formspree/your own API if you add one later)
    var form = document.getElementById("contact-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = form.querySelector("#cf-name").value.trim();
        var email = form.querySelector("#cf-email").value.trim();
        var interest = form.querySelector("#cf-interest");
        var interestLabel = interest.options[interest.selectedIndex].text;
        var message = form.querySelector("#cf-message").value.trim();

        var subject = "RaphNLab — " + interestLabel;
        var body =
          "Name: " + name + "\n" +
          "Email: " + email + "\n" +
          "Topic: " + interestLabel + "\n\n" +
          message;

        var mailto =
          "mailto:s.ngoufack@raphnlab.de" +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body);

        window.location.href = mailto;
      });
    }
  });
})();
