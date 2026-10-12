/*
 * RaphNLab — shared page behaviour: mobile nav, active nav link, footer year,
 * carousels, training sub-navigation, the contact form and the training
 * reservation drawer.
 */
(function () {
  "use strict";

  var EMAIL = "s.ngoufack@raphnlab.de";

  function t(key, fallback) {
    var v = window.RaphNLabT ? window.RaphNLabT(key) : undefined;
    return v === undefined ? (fallback || "") : v;
  }

  /* ------------------------------------------------------------------ nav */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (toggle && links) {
      var setOpen = function (open) {
        links.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      };
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        setOpen(!links.classList.contains("open"));
      });
      links.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { setOpen(false); });
      });
      document.addEventListener("click", function (e) {
        if (!links.contains(e.target) && e.target !== toggle) setOpen(false);
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
    }

    var here = document.body.getAttribute("data-page");
    if (here) {
      document.querySelectorAll(".nav-links a[data-page]").forEach(function (a) {
        if (a.getAttribute("data-page") === here) {
          a.classList.add("active");
          a.setAttribute("aria-current", "page");
        }
      });
    }

    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });

    // Service capabilities: visible on larger screens, behind a toggle on phones
    if (window.matchMedia("(max-width: 640px)").matches) {
      document.querySelectorAll(".caps-wrap[open]").forEach(function (d) { d.removeAttribute("open"); });
    }
  }

  /* ------------------------------------------------------------ carousels */
  // Any scroll-snap row followed by an empty .carousel-nav gets dots + arrows.
  // CSS decides at which widths the row actually scrolls and the nav shows.
  function initCarousels() {
    document.querySelectorAll(".carousel-nav").forEach(function (nav) {
      var track = nav.previousElementSibling;
      if (!track) return;
      var items = Array.prototype.filter.call(track.children, function (el) {
        return !el.classList.contains("path-arrow");
      });
      if (items.length < 2) return;

      var prev = document.createElement("button");
      prev.type = "button";
      prev.className = "carousel-arrow";
      prev.innerHTML = "&#8592;";
      prev.setAttribute("data-i18n-aria", "common.carousel_prev");
      prev.setAttribute("aria-label", t("common.carousel_prev", "Previous"));
      var next = prev.cloneNode(true);
      next.innerHTML = "&#8594;";
      next.setAttribute("data-i18n-aria", "common.carousel_next");
      next.setAttribute("aria-label", t("common.carousel_next", "Next"));

      var dots = document.createElement("div");
      dots.className = "carousel-dots";
      items.forEach(function (item, i) {
        var d = document.createElement("button");
        d.type = "button";
        d.setAttribute("aria-label", (i + 1) + " / " + items.length);
        d.addEventListener("click", function () { go(i); });
        dots.appendChild(d);
      });
      nav.appendChild(prev);
      nav.appendChild(dots);
      nav.appendChild(next);

      function index() {
        var left = track.scrollLeft;
        var best = 0;
        var bestDist = Infinity;
        items.forEach(function (item, i) {
          var dist = Math.abs(item.offsetLeft - track.offsetLeft - left - parseFloat(getComputedStyle(track).paddingLeft || 0));
          if (dist < bestDist) { bestDist = dist; best = i; }
        });
        // At the far right the last items can't snap to the start edge
        if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 4) best = items.length - 1;
        return best;
      }
      function go(i) {
        i = Math.max(0, Math.min(items.length - 1, i));
        var pad = parseFloat(getComputedStyle(track).paddingLeft || 0);
        track.scrollTo({ left: items[i].offsetLeft - track.offsetLeft - pad, behavior: "smooth" });
      }
      function update() {
        var i = index();
        Array.prototype.forEach.call(dots.children, function (d, k) {
          d.setAttribute("aria-current", k === i ? "true" : "false");
        });
        prev.disabled = i === 0;
        next.disabled = i === items.length - 1;
      }
      prev.addEventListener("click", function () { go(index() - 1); });
      next.addEventListener("click", function () { go(index() + 1); });
      var raf = null;
      track.addEventListener("scroll", function () {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = null; update(); });
      }, { passive: true });
      window.addEventListener("resize", update);
      update();
    });
  }

  /* -------------------------------------------------------- sticky subnav */
  function initSubnav() {
    var links = document.querySelectorAll(".subnav a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute("href"));
      if (target) map[target.id] = a;
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("active"); });
        var a = map[entry.target.id];
        if (a) {
          a.classList.add("active");
          if (a.scrollIntoView && window.innerWidth < 640) {
            a.parentNode.parentNode.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
          }
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { observer.observe(document.getElementById(id)); });
  }

  /* --------------------------------------------------------- form sending */
  // If a form has data-endpoint (e.g. a Formspree URL), the message is really
  // sent from the page. Without one, we fall back to opening the visitor's
  // email app with everything pre-filled, and say so honestly in the UI.
  function sendForm(form, subject, lines) {
    var status = form.querySelector(".form-status");
    var endpoint = form.getAttribute("data-endpoint");
    var body = lines.join("\n");

    function show(key, cls) {
      if (!status) return;
      status.textContent = t(key);
      status.className = "form-status " + cls;
    }

    if (endpoint) {
      var data = new FormData(form);
      data.append("_subject", subject);
      var btn = form.querySelector("[type=submit]");
      if (btn) btn.disabled = true;
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          show("common.form_sent", "ok");
        })
        .catch(function () { show("common.form_error", "err"); })
        .then(function () { if (btn) btn.disabled = false; });
      return;
    }

    window.location.href =
      "mailto:" + EMAIL +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    show("common.form_mailto_opened", "ok");
  }

  /* -------------------------------------------------------- contact form */
  function initContact() {
    var form = document.getElementById("contact-form");
    if (!form) return;

    var message = form.querySelector("#cf-message");
    var messageLabel = form.querySelector("label[for='cf-message']");
    var radios = form.querySelectorAll("input[name='topic']");

    function currentTopic() {
      var checked = form.querySelector("input[name='topic']:checked");
      return checked ? checked.value : "project";
    }
    // The form adapts to the visitor's intent without becoming complicated
    function adapt() {
      var topic = currentTopic();
      message.setAttribute("placeholder", t("contact.ph_" + topic));
      if (messageLabel) messageLabel.textContent = t("contact.label_" + topic);
    }

    var params = new URLSearchParams(window.location.search);
    var preset = params.get("topic");
    if (preset) {
      var match = form.querySelector("input[name='topic'][value='" + preset.replace(/[^a-z]/g, "") + "']");
      if (match) match.checked = true;
    }
    var course = params.get("course");
    if (course && !message.value) {
      var title = t("training." + course.replace(/[^a-z0-9]/g, "") + "_title");
      if (title) message.value = t("contact.prefill_course") + " " + title + "\n\n";
    }

    radios.forEach(function (r) { r.addEventListener("change", adapt); });
    document.addEventListener("raphnlab:lang", adapt);
    adapt();

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var topicLabel = t("contact.topic_" + currentTopic());
      var name = form.querySelector("#cf-name").value.trim();
      var email = form.querySelector("#cf-email").value.trim();
      var org = form.querySelector("#cf-org");
      sendForm(form, "RaphNLab — " + topicLabel, [
        "Name: " + name,
        "Email: " + email,
        org && org.value.trim() ? "Organisation: " + org.value.trim() : "",
        "Topic: " + topicLabel,
        "",
        message.value.trim()
      ].filter(function (l, i) { return l !== "" || i === 4; }));
    });
  }

  /* ---------------------------------------------- training reservation */
  function initReservation() {
    var dialog = document.getElementById("reserve");
    var form = document.getElementById("reserve-form");
    if (!dialog || !form) return;
    var courseSelect = form.querySelector("#rs-course");
    var lastTrigger = null;

    document.querySelectorAll("[data-reserve]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (typeof dialog.showModal !== "function") return; // old browser: follow the link
        e.preventDefault();
        lastTrigger = btn;
        courseSelect.value = btn.getAttribute("data-reserve");
        var status = form.querySelector(".form-status");
        if (status) status.textContent = "";
        dialog.showModal();
      });
    });
    dialog.querySelectorAll("[data-close]").forEach(function (btn) {
      btn.addEventListener("click", function () { dialog.close(); });
    });
    dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener("close", function () { if (lastTrigger) lastTrigger.focus(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var courseLabel = courseSelect.options[courseSelect.selectedIndex].text;
      var session = form.querySelector("#rs-session");
      var level = form.querySelector("#rs-level");
      sendForm(form, "RaphNLab — " + t("training.reserve_subject") + ": " + courseLabel, [
        "Name: " + form.querySelector("#rs-name").value.trim(),
        "Email: " + form.querySelector("#rs-email").value.trim(),
        "Course: " + courseLabel,
        "Preferred session: " + session.options[session.selectedIndex].text,
        "Experience: " + level.options[level.selectedIndex].text,
        "",
        form.querySelector("#rs-notes").value.trim()
      ]);
    });
  }

  /* ---------------------------------------------------------- copy email */
  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        var done = function () {
          btn.classList.add("copied");
          btn.textContent = t("contact.copied", "Copied");
          setTimeout(function () {
            btn.classList.remove("copied");
            btn.textContent = t("contact.copy_email", "Copy email");
          }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () {});
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initCarousels();
    initSubnav();
    initContact();
    initReservation();
    initCopy();
  });
})();
