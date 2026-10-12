/*
 * RaphNLab — tiny i18n engine.
 * No build step, no framework: reads window.RAPHNLAB_I18N (see translations.js),
 * walks every [data-i18n] element on the page, and swaps in the right string.
 */
(function () {
  "use strict";

  var SUPPORTED = ["en", "fr", "de"];
  var DEFAULT_LANG = "en";
  var STORAGE_KEY = "raphnlab_lang";
  var current = DEFAULT_LANG;

  function detectInitialLang() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;

    var nav = (navigator.language || navigator.userLanguage || "").slice(0, 2).toLowerCase();
    if (SUPPORTED.indexOf(nav) !== -1) return nav;

    return DEFAULT_LANG;
  }

  function getByPath(obj, path) {
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  // Look up a key in the active language, falling back to English.
  function t(key) {
    var all = window.RAPHNLAB_I18N || {};
    var value = getByPath(all[current] || {}, key);
    if (value === undefined) value = getByPath(all[DEFAULT_LANG] || {}, key);
    return value;
  }

  function applyLang(lang) {
    var dict = window.RAPHNLAB_I18N && window.RAPHNLAB_I18N[lang];
    if (!dict) return;
    current = lang;

    document.documentElement.setAttribute("lang", lang);

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var key = node.getAttribute("data-i18n");
      var value = getByPath(dict, key);
      if (value === undefined) continue;
      if (node.hasAttribute("data-i18n-html")) {
        node.innerHTML = value;
      } else {
        node.textContent = value;
      }
    }

    var placeholders = document.querySelectorAll("[data-i18n-placeholder]");
    for (var j = 0; j < placeholders.length; j++) {
      var pnode = placeholders[j];
      var pvalue = getByPath(dict, pnode.getAttribute("data-i18n-placeholder"));
      if (pvalue !== undefined) pnode.setAttribute("placeholder", pvalue);
    }

    var labels = document.querySelectorAll("[data-i18n-aria]");
    for (var a = 0; a < labels.length; a++) {
      var lnode = labels[a];
      var lvalue = getByPath(dict, lnode.getAttribute("data-i18n-aria"));
      if (lvalue !== undefined) lnode.setAttribute("aria-label", lvalue);
    }

    var titleNode = document.querySelector("title[data-i18n]");
    if (titleNode) {
      var tval = getByPath(dict, titleNode.getAttribute("data-i18n"));
      if (tval !== undefined) document.title = tval;
    }

    // Language dropdown: current flag/code + checked option
    document.querySelectorAll(".lang-current").forEach(function (btn) {
      var flag = btn.querySelector(".flag");
      var code = btn.querySelector(".lang-code");
      if (flag) flag.className = "flag flag-" + lang;
      if (code) code.textContent = lang.toUpperCase();
    });
    document.querySelectorAll(".lang-options [data-lang]").forEach(function (opt) {
      opt.setAttribute("aria-current", opt.getAttribute("data-lang") === lang ? "true" : "false");
    });

    document.dispatchEvent(new CustomEvent("raphnlab:lang", { detail: { lang: lang } }));
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    applyLang(lang);
  }

  document.addEventListener("DOMContentLoaded", function () {
    applyLang(detectInitialLang());

    document.querySelectorAll(".lang-menu").forEach(function (menu) {
      var trigger = menu.querySelector(".lang-current");
      function close() {
        menu.classList.remove("open");
        trigger.setAttribute("aria-expanded", "false");
      }
      trigger.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = menu.classList.toggle("open");
        trigger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      menu.querySelectorAll("[data-lang]").forEach(function (opt) {
        opt.addEventListener("click", function () {
          setLang(this.getAttribute("data-lang"));
          close();
          trigger.focus();
        });
      });
      document.addEventListener("click", function (e) { if (!menu.contains(e.target)) close(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    });
  });

  window.RaphNLabSetLang = setLang;
  window.RaphNLabT = t;
})();
