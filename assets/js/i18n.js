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

  function applyLang(lang) {
    var dict = window.RAPHNLAB_I18N && window.RAPHNLAB_I18N[lang];
    if (!dict) return;

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
      var pkey = pnode.getAttribute("data-i18n-placeholder");
      var pvalue = getByPath(dict, pkey);
      if (pvalue !== undefined) pnode.setAttribute("placeholder", pvalue);
    }

    var titleNode = document.querySelector("title[data-i18n]");
    if (titleNode) {
      var tval = getByPath(dict, titleNode.getAttribute("data-i18n"));
      if (tval !== undefined) document.title = tval;
    }

    var switches = document.querySelectorAll(".lang-switch button");
    for (var k = 0; k < switches.length; k++) {
      var btn = switches[k];
      btn.classList.toggle("active", btn.getAttribute("data-lang") === lang);
    }
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    applyLang(lang);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var initial = detectInitialLang();
    applyLang(initial);

    var switches = document.querySelectorAll(".lang-switch button");
    for (var i = 0; i < switches.length; i++) {
      switches[i].addEventListener("click", function () {
        setLang(this.getAttribute("data-lang"));
      });
    }
  });

  window.RaphNLabSetLang = setLang;
})();
