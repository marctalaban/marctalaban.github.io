/* app.js — behaviour: theme, language, nav, tabs, project sheets, contact form.
   Depends on I18N from i18n.js, which must load first (both are deferred in
   <head>, and deferred scripts run in document order). */

(function () {
  "use strict";

  /* First statement, before anything that could throw: tell the failsafe
     timer in <head> that we made it. */
  document.documentElement.setAttribute("data-app-ready", "1");

  /* Each init step runs inside this. Without it, a single throw anywhere
     stops every listener registered after it — which is how a missing
     translations file could end up hiding the whole page. */
  function safe(name, fn) {
    try { fn(); }
    catch (err) { console.warn("[portfolio] " + name + " failed to initialise:", err); }
  }

  /* i18n.js may not have loaded. If it didn't, we leave the English that's
     already written in the HTML and hide the language switch. */
  var hasI18N = (typeof I18N !== "undefined" && I18N && I18N.en);

  /* Shared across modules — must live here, not inside a safe() callback. */
  var root = document.documentElement;
  var THEME_KEY = "mt-theme";
  var EMAIL = "mrctalaban@gmail.com";

  function store(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* private mode, sandbox */ }
  }
  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  var LANG_KEY = "mt-lang";
  var lang = "en";

  function t(key) {
    if (!hasI18N) return "";
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || "";
  }

  function detectLang() {
    // 1. explicit ?lang= wins, so you can send a direct Spanish link
    var param = new URLSearchParams(window.location.search).get("lang");
    if (param === "es" || param === "en") return param;
    // 2. previous choice
    var saved = read(LANG_KEY);
    if (saved === "es" || saved === "en") return saved;
    // 3. browser preference — Catalan speakers get Spanish, not English
    var nav = (navigator.language || "en").toLowerCase();
    return (nav.indexOf("es") === 0 || nav.indexOf("ca") === 0) ? "es" : "en";
  }

  function applyLang(next) {
    if (!hasI18N) return;   // dictionary missing — HTML fallback text stays put
    lang = next;
    document.documentElement.setAttribute("lang", next);

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });

    document.title = t("meta.title");
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", t("meta.desc"));
  }

  /* ---------------- theme ---------------- */
  safe("theme", function () {
    function setTheme(theme) {
      root.setAttribute("data-theme", theme);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", theme === "dark" ? "#141310" : "#FDF6DD");
    }

    // The inline <head> script already applied the saved theme before paint;
    // this re-runs it only to sync the theme-color meta tag.
    var saved = read(THEME_KEY);
    if (saved === "dark" || saved === "light") setTheme(saved);

    document.getElementById("themeToggle").addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next);
      store(THEME_KEY, next);
    });
  });

  /* ---------------- mobile menu ---------------- */
  safe("mobile menu", function () {
    var menuBtn = document.getElementById("menuToggle");
    var siteNav = document.getElementById("siteNav");

    function closeMenu() {
      siteNav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    }
    menuBtn.addEventListener("click", function () {
      var open = siteNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    siteNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) closeMenu();
    });
  });

  /* ---------------- language ---------------- */
  safe("language", function () {
    var langBtn = document.getElementById("langToggle");
    if (!hasI18N) { if (langBtn) langBtn.hidden = true; return; }

    applyLang(detectLang());
    langBtn.addEventListener("click", function () {
      applyLang(lang === "es" ? "en" : "es");
      store(LANG_KEY, lang);
    });
  });

  /* ---------------- sticky masthead ---------------- */
  safe("sticky masthead", function () {
    var masthead = document.getElementById("masthead");
    var onScroll = function () {
      masthead.classList.toggle("stuck", window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  });

  /* ---------------- pipeline tabs ---------------- */
  safe("pipeline tabs", function () {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".pipe-tab"));

    function selectTab(tab) {
      tabs.forEach(function (t) {
        var active = t === tab;
        t.setAttribute("aria-selected", active ? "true" : "false");
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !active;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectTab(tab); });
      tab.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        selectTab(next);
      });
    });
  });

  /* ---------------- project sheets ---------------- */
  safe("project sheets", function () {
    var sheet = document.getElementById("sheet");
    var sheetInner = document.getElementById("sheetInner");
    var lastFocused = null;
    var supportsDialog = typeof sheet.showModal === "function";

    function openSheet(id) {
      var source = document.getElementById(id);
      if (!source) return;
      lastFocused = document.activeElement;
      sheetInner.innerHTML = "";
      sheetInner.appendChild(cloned(source));
      if (supportsDialog) {
        sheet.showModal();
      } else {
        sheet.setAttribute("open", "");
      }
      document.body.classList.add("locked");
      sheetInner.scrollTop = 0;
      document.getElementById("sheetClose").focus();
    }

    function cloned(node) {
      var copy = node.cloneNode(true);
      copy.removeAttribute("id");
      return copy;
    }

    function closeSheet() {
      if (supportsDialog && sheet.open) {
        sheet.close();                      // fires 'close' → cleanup below
      } else {
        sheet.removeAttribute("open");
        cleanup();
      }
    }

    function cleanup() {
      document.body.classList.remove("locked");
      if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    }

    document.querySelectorAll(".card-more").forEach(function (btn) {
      btn.addEventListener("click", function () { openSheet(btn.getAttribute("data-detail")); });
    });
    document.getElementById("sheetClose").addEventListener("click", closeSheet);
    sheet.addEventListener("close", cleanup);   // covers ESC too
    sheet.addEventListener("click", function (e) {
      if (e.target === sheet) closeSheet();   // click on backdrop area
    });
  });

  /* ---------------- contact form ---------------- */
  safe("contact form", function () {
    /* Set this to your Formspree (or equivalent) endpoint to receive messages
       directly in your inbox. Leave it empty and the form falls back to
       opening the visitor's mail client with everything pre-filled. */
    var FORM_ENDPOINT = "";

    var form = document.getElementById("contactForm");
    var statusEl = document.getElementById("formStatus");
    var submitBtn = document.getElementById("submitBtn");

    function setError(name, message) {
      var wrap = form.querySelector('[data-field="' + name + '"]');
      if (!wrap) return;
      var input = wrap.querySelector("input,textarea");
      var errEl = wrap.querySelector(".err");
      wrap.classList.toggle("invalid", Boolean(message));
      errEl.textContent = message || "";
      if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validate(data) {
      var ok = true;
      ["name", "email", "subject", "message"].forEach(function (f) { setError(f, ""); });

      if (!data.name.trim()) { setError("name", t("err.name")); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) { setError("email", t("err.email")); ok = false; }
      if (data.message.trim().length < 12) { setError("message", t("err.message")); ok = false; }
      return ok;
    }

    function buildMailto(data) {
      var subject = data.subject.trim() || (lang === "es" ? "Hola desde tu web" : "Hello from your site");
      var body = data.message + "\n\n—\n" + data.name + "\n" + data.email;
      return "mailto:" + EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    }

    // Called synchronously from the submit handler (no FORM_ENDPOINT configured).
    // Still inside the user's click, so window.open is not treated as a popup.
    function mailtoFallback(data) {
      var win = window.open(buildMailto(data), "_blank");
      statusEl.className = "form-status ok";
      if (win) {
        statusEl.textContent = t("st.mailopen");
      } else {
        showManualMailLink(data);
      }
    }

    // Called after an async fetch failure. By then the user gesture has
    // "expired" in most browsers, so window.open would silently get blocked
    // as a popup. Instead, hand the visitor a real link they click themselves —
    // that always works, regardless of popup-blocker settings.
    function showManualMailLink(data) {
      statusEl.className = "form-status ok";
      statusEl.innerHTML = t("st.manual1") + '<a href="' + buildMailto(data) +
        '" style="color:var(--saffron);text-decoration:underline">' + t("st.manual2") + '</a>.';
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var el = form.elements;
      var data = {
        name: el.namedItem("name").value,
        email: el.namedItem("email").value,
        subject: el.namedItem("subject").value,
        message: el.namedItem("message").value,
        company: el.namedItem("company").value
      };

      if (data.company) return;            // honeypot: bots fill this, humans don't see it
      if (!validate(data)) {
        statusEl.className = "form-status";
        statusEl.textContent = "";
        return;
      }

      if (!FORM_ENDPOINT) { mailtoFallback(data); return; }

      submitBtn.disabled = true;
      statusEl.className = "form-status";
      statusEl.textContent = t("st.sending");

      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        statusEl.className = "form-status ok";
        statusEl.textContent = t("st.sent");
      }).catch(function () {
        showManualMailLink(data);
      }).then(function () {
        submitBtn.disabled = false;
      });
    });
  });

  /* ---------------- reveal on scroll ---------------- */
  safe("reveal on scroll", function () {
    var reveals = document.querySelectorAll(".reveal");
    function showAll() { reveals.forEach(function (el) { el.classList.add("in"); }); }

    // This module is the only thing standing between the visitor and a page
    // of invisible sections, so every branch ends with the content shown.
    var reduced = false;
    try { reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    if (!("IntersectionObserver" in window) || reduced) { showAll(); return; }

    try {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
      reveals.forEach(function (el) { io.observe(el); });
    } catch (err) {
      showAll();    // animation is optional; reading the page is not
      throw err;    // still surfaced by safe()
    }
  });

  /* ---------------- for the curious ---------------- */
  safe("for the curious", function () {
    var wink = [
      "%cSo you opened the console.",
      "",
      "Short version: yes, a lot of this page was written with AI help.",
      "So is a growing share of the code running in production everywhere,",
      "and pretending otherwise is just a slower way of falling behind.",
      "",
      "What doesn't get outsourced: knowing why the 06:00 load failed,",
      "deciding what the number actually means, and being the one who",
      "tells a client their favourite report has been wrong for a year.",
      "",
      "I use the tools. I own the output. Those are different skills and",
      "I'd rather have both.",
      "",
      "If you got this far you're exactly the kind of person I like working",
      "with — " + EMAIL + ". Tell me what the AI got wrong."
    ].join("\n");

    console.log(wink, "font-family:Georgia,serif;font-size:22px;font-weight:bold");

    document.getElementById("eggBtn").addEventListener("click", function () {
      var statusEl = document.getElementById("formStatus");
      statusEl.className = "form-status ok";
      statusEl.textContent = t("st.egg");
      document.getElementById("contact").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

})();
