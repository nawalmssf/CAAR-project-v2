(function () {
  'use strict';

  /* ── Guard: already initialised? Exit. ── */
  if (window.__caarHeaderReady) return;

  /* ──────────────────────────────────────────────────────────
     UTIL: resolve components/header.html URL from script src
     so it works from any sub-directory.
  ────────────────────────────────────────────────────────── */
  function resolveHeaderURL() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute('src');
      if (s && s.indexOf('main.js') !== -1) {
        /* e.g. "js/main.js" → base = "" → "components/header.html" */
        var base = s.replace(/js\/main\.js.*$/, '');
        return base + 'components/header.html';
      }
    }
    /* Fallback: derive from current URL */
    var dir = window.location.pathname.slice(
      0, window.location.pathname.lastIndexOf('/') + 1
    );
    return dir + 'components/header.html';
  }

  /* ──────────────────────────────────────────────────────────
     ACTIVE PAGE DETECTION
     Maps filenames → nav data-page values so the correct
     link gets .active without hardcoding it in every HTML file.
  ────────────────────────────────────────────────────────── */
  var PAGE_MAP = {
    'index'              : 'index',
    ''                   : 'index',
    'products'           : 'products',
    'individual-risks'   : 'products',
    'auto-insurance'     : 'products',
    'transport-insurance': 'products',
    'technical-risks'    : 'products',
    'industrial-risks'   : 'products',
    'Online_subscription': 'products',
    'catnat-subscription': 'products',
    'roads'              : 'products',
    'company'            : 'company',
    'company-careers'    : 'company',
    'network'            : 'network',
    'news'               : 'news',
    'article-accident'   : 'news',
    'article-home'       : 'news',
    'article-business'   : 'news',
    'article-basics'     : 'news',
    'contact'            : 'contact',
  };

  function setActiveNav() {
    var file = window.location.pathname
      .split('/')
      .pop()
      .replace('.html', '') || '';

    var page = PAGE_MAP[file] || '';
    if (!page) return;

    document.querySelectorAll('[data-page]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });
  }

  /* ══════════════════════════════════════════════════════════
     initHeader()
     ─────────────
     Called ONCE after header HTML has been injected into #site-header.
     Binds ALL header interactions here — no page should re-bind
     #searchBtn / #langToggleBtn / #mobileMenuBtn in its own script.

     NULL CHECKS on every element: the function degrades gracefully
     if the header fails to load for any reason.
  ══════════════════════════════════════════════════════════ */
  function initHeader() {
    /* Hard stop — prevents double-bind if script is somehow loaded twice */
    if (window.__caarHeaderReady) return;
    window.__caarHeaderReady = true;

    /* ── Grab elements ── */
    var header       = document.getElementById('caar-header');
    var searchBtn    = document.getElementById('searchBtn');
    var searchBar    = document.getElementById('searchBar');
    var searchClose  = document.getElementById('searchCloseHdr');   /* NOTE: "Hdr" suffix */
    var searchInput  = document.getElementById('searchInput');
    var langDropdown = document.getElementById('langDropdown');
    var langToggle   = document.getElementById('langToggleBtn');
    var langMenu     = document.getElementById('langDropdownMenu');  /* the <ul> */
    var currentLang  = document.getElementById('currentLang');
    var mobileBtn    = document.getElementById('mobileMenuBtn');
    var mobileNav    = document.getElementById('mobileNav');
    var mobileOverlay= document.getElementById('mobileNavOverlay');
    var mobileClose  = document.getElementById('mobileNavClose');

    /* Dev-mode warning for missing elements */
    if (process && process.env && process.env.NODE_ENV === 'development') {
      [
        ['searchBtn',       searchBtn],
        ['searchBar',       searchBar],
        ['searchCloseHdr',  searchClose],
        ['langToggleBtn',   langToggle],
        ['langDropdownMenu',langMenu],
        ['mobileMenuBtn',   mobileBtn],
        ['mobileNav',       mobileNav],
      ].forEach(function (pair) {
        if (!pair[1]) console.warn('[CAAR header] #' + pair[0] + ' not found after load.');
      });
    }

    /* ────────────────────────────────────────────────────────
       SEARCH
       ──────
       BUG FIX: previously catnat-subscription.html had an inline
       <script> that called document.getElementById('searchBtn')
       BEFORE the async fetch completed → TypeError → rest of page
       JS silently stopped. Solution: never bind header elements in
       page-level scripts. This is the one place.
    ──────────────────────────────────────────────────────── */
    function openSearch() {
      if (!searchBar) return;
      searchBar.classList.add('open');
      searchBar.setAttribute('aria-hidden', 'false');
      if (searchInput) {
        /* Defer focus so display:flex has time to paint */
        setTimeout(function () { searchInput.focus(); }, 60);
      }
    }

    function closeSearch() {
      if (!searchBar) return;
      searchBar.classList.remove('open');
      searchBar.setAttribute('aria-hidden', 'true');
      if (searchInput) searchInput.value = '';
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        /* Toggle: if already open, close; otherwise open */
        if (searchBar && searchBar.classList.contains('open')) {
          closeSearch();
        } else {
          openSearch();
        }
      });
    }

    if (searchClose) {
      searchClose.addEventListener('click', function () {
        closeSearch();
      });
    }

    /* ────────────────────────────────────────────────────────
       LANGUAGE DROPDOWN
       ──────────────────
       BUG FIX: the old CSS used display:none + opacity:0 as the
       hidden state. When .show was added (display:block + opacity:1),
       browsers had no painted "from" state so the opacity transition
       never ran — on some browsers the menu appeared at opacity:0
       (invisible). The new header.css uses visibility+opacity instead,
       which DOES transition correctly because the element stays in
       the render tree.

       JS here only toggles .show and the aria attributes.
       CSS in header.css does all the visual work.
    ──────────────────────────────────────────────────────── */
    function openLang() {
      if (!langMenu) return;
      langMenu.classList.add('show');
      if (langDropdown) langDropdown.classList.add('lang-open');
      if (langToggle)   langToggle.setAttribute('aria-expanded', 'true');
    }

    function closeLang() {
      if (!langMenu) return;
      langMenu.classList.remove('show');
      if (langDropdown) langDropdown.classList.remove('lang-open');
      if (langToggle)   langToggle.setAttribute('aria-expanded', 'false');
    }

    if (langToggle) {
      langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        if (langMenu && langMenu.classList.contains('show')) {
          closeLang();
        } else {
          openLang();
        }
      });
    }

    /* Update the label text when a language is chosen */
    if (langMenu) {
      langMenu.querySelectorAll('[data-lang]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentLang) currentLang.textContent = this.getAttribute('data-lang');
          closeLang();
        });
      });
    }

    /* ────────────────────────────────────────────────────────
       MOBILE NAV DRAWER
       ──────────────────
       BUG FIX: the old CSS defined .mobile-nav twice with conflicting
       right values (-280px vs -300px). The second rule won, but both
       were processed. Also, animating right: triggers layout on every
       frame. The new header.css uses transform:translateX instead —
       composited, GPU-accelerated, zero layout cost.

       JS here just toggles .open. CSS does the animation.
    ──────────────────────────────────────────────────────── */
    function openMobile() {
      if (mobileNav)     {
        mobileNav.classList.add('open');
        mobileNav.setAttribute('aria-hidden', 'false');
      }
      if (mobileOverlay) mobileOverlay.classList.add('open');
      if (mobileBtn)     mobileBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMobile() {
      if (mobileNav)     {
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
      }
      if (mobileOverlay) mobileOverlay.classList.remove('open');
      if (mobileBtn)     mobileBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (mobileBtn)     mobileBtn.addEventListener('click', openMobile);
    if (mobileClose)   mobileClose.addEventListener('click', closeMobile);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);

    /* Close drawer when any nav link inside it is clicked */
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeMobile);
      });
    }

    /* ────────────────────────────────────────────────────────
       ESCAPE KEY — closes everything
    ──────────────────────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeSearch();
      closeLang();
      closeMobile();
    });

    /* ────────────────────────────────────────────────────────
       CLICK OUTSIDE — closes search & lang dropdown
       Uses event.target containment rather than stopPropagation
       so other page elements still receive their own click events.
    ──────────────────────────────────────────────────────── */
    document.addEventListener('click', function (e) {
      /* Close search when clicking outside the header entirely */
      if (searchBar && searchBar.classList.contains('open')) {
        if (header && !header.contains(e.target)) {
          closeSearch();
        }
      }

      /* Close lang dropdown when clicking outside .lang-dropdown */
      if (langDropdown && !langDropdown.contains(e.target)) {
        closeLang();
      }
    });

    /* ────────────────────────────────────────────────────────
       DESKTOP DROPDOWN — touch device support
       Prevents navigating away on first tap; opens submenu instead.
    ──────────────────────────────────────────────────────── */
    if (header) {
      header.querySelectorAll('.dropdown').forEach(function (dd) {
        dd.addEventListener('touchstart', function (e) {
          var isOpen = dd.classList.contains('touch-open');
          /* Close all others */
          header.querySelectorAll('.dropdown.touch-open').forEach(function (x) {
            if (x !== dd) x.classList.remove('touch-open');
          });
          if (!isOpen) {
            e.preventDefault();
            dd.classList.add('touch-open');
          } else {
            dd.classList.remove('touch-open');
          }
        }, { passive: false });
      });

      document.addEventListener('touchstart', function (e) {
        if (!e.target.closest || !e.target.closest('.dropdown')) {
          header.querySelectorAll('.dropdown.touch-open').forEach(function (dd) {
            dd.classList.remove('touch-open');
          });
        }
      }, { passive: true });
    }

    /* ── Mark active nav link based on current URL ── */
    setActiveNav();

  } /* ── end initHeader() ── */


  /* ══════════════════════════════════════════════════════════
     loadHeader()
     Fetches components/header.html and injects it into
     #site-header, then wires all interactions via initHeader().

     If the page has a hardcoded header (no #site-header), it
     still sets the active nav state and marks the guard.
  ══════════════════════════════════════════════════════════ */
  function loadHeader() {
    var placeholder = document.getElementById('site-header');

    if (!placeholder) {
      /* Hardcoded header — skip fetch, just activate nav */
      if (!window.__caarHeaderReady) {
        window.__caarHeaderReady = true;
        setActiveNav();
      }
      return;
    }

    fetch(resolveHeaderURL())
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        placeholder.innerHTML = html;   /* 1. HTML in DOM */
        initHeader();                   /* 2. Wire ALL interactions */
      })
      .catch(function (err) {
        console.warn('[CAAR] Header load failed:', err.message);
        /* Even if the header fails to load, mark ready so no retry loop */
        if (!window.__caarHeaderReady) {
          window.__caarHeaderReady = true;
          setActiveNav();
        }
      });
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }

}());

(function () {
  'use strict';

  /* ── Guard global ── */
  if (window.__caarAppReady) return;
  window.__caarAppReady = true;

  /* ════════════════════════════════════════════
     UTIL — resolve base path
  ════════════════════════════════════════════ */
  function resolveBase() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute('src');
      if (s && s.indexOf('main.js') !== -1) {
        return s.replace(/js\/main\.js.*$/, '');
      }
    }
    return window.location.pathname.slice(
      0,
      window.location.pathname.lastIndexOf('/') + 1
    );
  }

  /* ════════════════════════════════════════════
     ACTIVE NAV
  ════════════════════════════════════════════ */
  var PAGE_MAP = {
    'index': 'index',
    '': 'index',
    'products': 'products',
    'individual-risks': 'products',
    'auto-insurance': 'products',
    'transport-insurance': 'products',
    'technical-risks': 'products',
    'industrial-risks': 'products',
    'Online_subscription': 'products',
    'catnat-subscription': 'products',
    'roads': 'products',
    'company': 'company',
    'company-careers': 'company',
    'company-leadership': 'company',
    'network': 'network',
    'news': 'news',
    'article-accident': 'news',
    'article-home': 'news',
    'article-business': 'news',
    'article-basics': 'news',
    'contact': 'contact'
  };

  function setActiveNav() {
    var file = window.location.pathname
      .split('/')
      .pop()
      .replace('.html', '') || '';

    var page = PAGE_MAP[file] || '';
    if (!page) return;

    document.querySelectorAll('[data-page]').forEach(function (el) {
      el.classList.toggle(
        'active',
        el.getAttribute('data-page') === page
      );
    });
  }

  /* ════════════════════════════════════════════
     loadComponent
  ════════════════════════════════════════════ */
  function loadComponent(id, url, callback) {
    var el = document.getElementById(id);
    if (!el) {
      if (callback) callback();
      return;
    }

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        el.innerHTML = html;
        if (callback) callback();
      })
      .catch(function (err) {
        console.warn('[CAAR] Load failed:', url, err.message);
        if (callback) callback();
      });
  }

  /* ════════════════════════════════════════════
     BOOT
  ════════════════════════════════════════════ */
  function boot() {
    var base = resolveBase();

    /* Header */
    var headerEl = document.getElementById('site-header');
    if (headerEl) {
      loadComponent(
        'site-header',
        base + 'components/header.html',
        function () {
          /* ⚠️ IMPORTANT :
             On appelle initHeader SEULEMENT si elle existe
             (car définie dans ton autre script propre header) */
          if (typeof initHeader === 'function') {
            initHeader();
          }
        }
      );
    } else {
      setActiveNav();
    }

    /* Footer */
    loadComponent(
      'site-footer',
      base + 'components/footer.html'
    );
  }

  /* ════════════════════════════════════════════
     START
  ════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();

function show(k, btn) {
  const ids = ['mrh', 'mrp', 'catnat'];

  const labels = {
    'mrh':    'Multi-Risk Home Insurance',
    'mrp':    'Multi-Risk Professional Insurance',
    'catnat': 'Natural Disaster Insurance'
  };

  ids.forEach(i => {
    const el = document.getElementById('d-' + i);
    if (el) el.classList.remove('on');
  });

  document.querySelectorAll('.sidebar-btn').forEach(b => {
    b.classList.remove('active');
  });

  const active = document.getElementById('d-' + k);
  if (active) active.classList.add('on');

  if (btn) btn.classList.add('active');

  const bc = document.getElementById('bc');
  if (bc) bc.textContent = labels[k];
}
function show(k, btn) {
  /* ── Panels ── */
  document.querySelectorAll('.detail').forEach(function (p) {
    p.classList.remove('on');
  });

  /* ── Buttons ── */
  document.querySelectorAll('.sidebar-btn').forEach(function (b) {
    b.classList.remove('active');
  });

  /* ── Activer panel ── */
  var target = document.getElementById('d-' + k);
  if (target) target.classList.add('on');

  /* ── Activer bouton ── */
  if (btn) btn.classList.add('active');

  /* ── Breadcrumb / titre ── */
  var bc = document.getElementById('bc');
  if (bc && btn) {
    var title = btn.innerText ? btn.innerText.split('\n')[0] : '';
    bc.textContent = title;
  }
}


document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('caarContactForm');
  if (!form) return;

  /* ───────── UTILITIES ───────── */

  function showError(inputId, errorId) {
    var input = document.getElementById(inputId);
    var errEl = document.getElementById(errorId);
    if (input) {
      input.classList.add('field-error');
      input.classList.remove('field-ok');
    }
    if (errEl) errEl.classList.add('visible');
  }

  function clearError(inputId, errorId) {
    var input = document.getElementById(inputId);
    var errEl = document.getElementById(errorId);
    if (input) {
      input.classList.remove('field-error');
      input.classList.add('field-ok');
    }
    if (errEl) errEl.classList.remove('visible');
  }

  function liveValidate(inputId, errorId, validatorFn) {
    var el = document.getElementById(inputId);
    if (!el) return;

    el.addEventListener('input', function () {
      if (validatorFn(el.value.trim())) {
        clearError(inputId, errorId);
      }
    });

    el.addEventListener('blur', function () {
      var value = el.value.trim();
      if (value && !validatorFn(value)) {
        showError(inputId, errorId);
      } else if (value) {
        clearError(inputId, errorId);
      }
    });
  }

  /* ───────── CHAR COUNTER ───────── */

  window.updateCharCount = function (textarea) {
    var count = textarea.value.length;
    var max = parseInt(textarea.getAttribute('maxlength')) || 2000;
    var display = document.getElementById('cfCharCount');
    if (!display) return;

    display.textContent = count + ' / ' + max;
    display.className = 'cf-char-count';

    if (count > max * 0.9) display.classList.add('warn');
    if (count >= max) {
      display.classList.remove('warn');
      display.classList.add('over');
    }
  };

  /* ───────── RULES ───────── */

  var RULES = {
    subject: function (v) { return v.length > 0; },
    name: function (v) { return /^[\p{L}\s'\-]{3,100}$/u.test(v); },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
    phone: function (v) { return v === '' || /^[0-9\s\+\-\(\)]{8,20}$/.test(v); },
    message: function (v) { return v.length >= 10 && v.length <= 2000; }
  };

  /* ───────── LIVE VALIDATION ───────── */

  liveValidate('cfSubject', 'err-subject', RULES.subject);
  liveValidate('cfName', 'err-name', RULES.name);
  liveValidate('cfEmail', 'err-email', RULES.email);
  liveValidate('cfPhone', 'err-phone', RULES.phone);
  liveValidate('cfMessage', 'err-message', RULES.message);

  /* ───────── SUBMIT ───────── */

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitForm();
  });

  async function submitForm() {

    var subject = document.getElementById('cfSubject')?.value || '';
    var name = document.getElementById('cfName')?.value.trim() || '';
    var email = document.getElementById('cfEmail')?.value.trim() || '';
    var phone = document.getElementById('cfPhone')?.value.trim() || '';
    var message = document.getElementById('cfMessage')?.value.trim() || '';
    var consent = document.getElementById('cfConsent')?.checked;
    var robot = document.getElementById('cfRobot')?.checked;

    var hasError = false;

    if (!RULES.subject(subject)) { showError('cfSubject', 'err-subject'); hasError = true; }
    else clearError('cfSubject', 'err-subject');

    if (!RULES.name(name)) { showError('cfName', 'err-name'); hasError = true; }
    else clearError('cfName', 'err-name');

    if (!RULES.email(email)) { showError('cfEmail', 'err-email'); hasError = true; }
    else clearError('cfEmail', 'err-email');

    if (phone && !RULES.phone(phone)) { showError('cfPhone', 'err-phone'); hasError = true; }
    else clearError('cfPhone', 'err-phone');

    if (!RULES.message(message)) { showError('cfMessage', 'err-message'); hasError = true; }
    else clearError('cfMessage', 'err-message');

    if (!consent) {
      document.getElementById('err-consent')?.classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('err-consent')?.classList.remove('visible');
    }

    if (!robot) {
      document.getElementById('cfRobotWrap')?.classList.add('robot-error');
      document.getElementById('err-robot')?.classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('cfRobotWrap')?.classList.remove('robot-error');
      document.getElementById('err-robot')?.classList.remove('visible');
    }

    if (hasError) {
      var firstError = document.querySelector('.field-error, .cf-field-error.visible');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var btn = document.getElementById('sendBtn');
    if (!btn) return;

    btn.textContent = 'Sending…';
    btn.disabled = true;
    btn.classList.add('loading');

    try {
      var res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject,
          full_name: name,
          email: email,
          phone: phone || null,
          message: message
        })
      });

      var data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || 'Something went wrong.');
        return;
      }

      document.getElementById('formFields')?.style.setProperty('display', 'none');
      document.getElementById('successState')?.classList.add('show');

    } catch (err) {
      alert('Server error. Please try again later.');
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = 'Send my request';
    }
  }

  /* ───────── RESET ───────── */

  window.resetForm = function () {
    form.reset();

    form.querySelectorAll('.cf-input, .cf-select, .cf-textarea').forEach(function (el) {
      el.classList.remove('field-error', 'field-ok');
    });

    form.querySelectorAll('.cf-field-error').forEach(function (el) {
      el.classList.remove('visible');
    });

    document.getElementById('cfRobotWrap')?.classList.remove('robot-error');

    var counter = document.getElementById('cfCharCount');
    if (counter) counter.textContent = '0 / 2000';

    document.getElementById('formFields')?.style.setProperty('display', '');
    document.getElementById('successState')?.classList.remove('show');
  };

  /* ───────── CTA SCROLL ───────── */

  var formRevealed = false;

  var ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function () {
      var section = document.getElementById('contactForm');
      if (!section) return;

      if (!formRevealed) {
        section.classList.add('show');
        formRevealed = true;
      }

      setTimeout(function () {
        section.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    });
  }

  window.collapseForm = function () {
    var formSection = document.getElementById('contactForm');
    if (formSection) formSection.classList.remove('show');

    formRevealed = false;

    var hero = document.querySelector('.contact-hero');
    if (hero) hero.scrollIntoView({ behavior: 'smooth' });
  };

  /* ───────── MAP ───────── */

  if (typeof L !== 'undefined' && document.getElementById('hqMap')) {

    var HQ = { lat: 36.767043, lng: 3.052792 };

    var map = L.map('hqMap', {
      center: [HQ.lat, HQ.lng],
      zoom: 16,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(map);

    L.marker([HQ.lat, HQ.lng]).addTo(map);
  }

});
const AGENCIES = [
  {id:1,  name:'Kouba',                    city:'Kouba',                  wilaya:'Alger',      address:'Cité Serbat Bâtiment A9 Garidi, Kouba — Alger',                                     director:'Mr Lawachra',             type:'Main Agency',    services:['Auto','Habitation','Transport','Industrial'],  lat:36.730082, lng:3.061648},
  {id:2,  name:'Baraki',                   city:'Baraki',                 wilaya:'Alger',      address:'Cité 2004 Logements, Bâtiment 43 A et B, Baraki — Alger',                            director:'Mr Mezine Aissa',         type:'Main Agency',    services:['Auto','Habitation','Agricultural'],             lat:36.665377, lng:3.100241},
  {id:3,  name:'Hussein Dey',              city:'Hussein Dey',            wilaya:'Alger',      address:'Rue Bachir Aoun, Brossette, Hussein Dey — Alger',                                    director:'Mme Belaiadi Fouzia',     type:'Main Agency',    services:['Auto','Habitation','Claims'],                   lat:36.739471, lng:3.101946},
  {id:4,  name:'Rouiba',                   city:'Rouiba',                 wilaya:'Alger',      address:'31, Avenue du 1er Novembre, Rouiba — Alger',                                         director:'Mr Ourdache Mohamed',     type:'Main Agency',    services:['Auto','Industrial','Transport'],                lat:36.736302, lng:3.280987},
  {id:5,  name:'Cheraga',                  city:'Cheraga',                wilaya:'Alger',      address:'Centre Commercial El Qods, Cheraga — Alger',                                         director:'Meziane Mohamed',         type:'Main Agency',    services:['Auto','Habitation','Business'],                 lat:36.759842, lng:2.964191},
  {id:6,  name:'Bab Ezzouar',              city:'Bab Ezzouar',            wilaya:'Alger',      address:'Cité 2068 Logements N39/C N°34, Bab Ezzouar — Alger',                               director:'Mr Sidi Said Abdelghani', type:'Main Agency',    services:['Auto','Habitation'],                            lat:36.719245, lng:3.182567},
  {id:7,  name:'El Harrach',               city:'El Harrach',             wilaya:'Alger',      address:'2, Rue Frères Djelli, Boumati, El Harrach — Alger',                                  director:'Mr Mokrane Kamel',        type:'Main Agency',    services:['Auto','Habitation','Claims'],                   lat:36.718446, lng:3.139838},
  {id:8,  name:'Ain Naadja',               city:'Ain Naadja',             wilaya:'Alger',      address:'Cité 1516 Logements Bâtiment D6, Ain Naadja — Alger',                               director:'Mr Laib Mohamed',         type:'Main Agency',    services:['Auto','Habitation'],                            lat:36.693697, lng:3.064214},
  {id:9,  name:'Alger Centre Victor Hugo', city:'Alger Centre',           wilaya:'Alger',      address:'27, Boulevard Victor Hugo — Alger',                                                   director:'Mr Leslous Mansour',      type:'Main Agency',    services:['Auto','Habitation','Business','Transport'],     lat:36.766752, lng:3.053129},
  {id:10, name:'Bab Ezzouar 2',            city:'Bab Ezzouar',            wilaya:'Alger',      address:'Cité 208 Logements Lot N°38, Bab Ezzouar — Alger',                                  director:'Mr Benarous Ali',         type:'Main Agency',    services:['Auto','Habitation'],                            lat:36.717250, lng:3.186716},
  {id:11, name:'Mohammadia',               city:'Mohammadia',             wilaya:'Alger',      address:'Cité Mohammadia, Bâtiment N°26 Cage C — Alger',                                     director:'Mme Ababsa Leila',        type:'Main Agency',    services:['Auto','Habitation','Claims'],                   lat:36.732394, lng:3.143416},
  {id:12, name:'Rouiba 2',                 city:'Rouiba',                 wilaya:'Alger',      address:'Cité du Lycée Abdelmoumene, Rouiba — Alger',                                        director:'Mr Djaadoune',            type:'Main Agency',    services:['Auto','Industrial'],                            lat:36.741057, lng:3.286559},
  {id:13, name:'Alger Centre Menani',      city:'Alger Centre',           wilaya:'Alger',      address:'31, Rue du Capitaine Menani — Alger',                                                director:'Mr Morsli Seif El Islam', type:'Main Agency',    services:['Auto','Habitation','Business'],                 lat:36.763313, lng:3.049991},
  {id:14, name:'Alger Centre Didouche',    city:'Alger Centre',           wilaya:'Alger',      address:'53, Rue Didouche Mourad — Alger',                                                    director:'Mr Belkadi Mahmoud',      type:'Main Agency',    services:['Auto','Habitation','Transport','Claims'],       lat:36.766754, lng:3.052979},
  {id:15, name:'Bab Ezzouar 3',            city:'Bab Ezzouar',            wilaya:'Alger',      address:'Cité El Djorf Bat 57 CN°02, Bab Ezzouar — Alger',                                   director:'Mr Azroug Mohamed Amine', type:'Main Agency',    services:['Auto','Habitation'],                            lat:36.720311, lng:3.176529},
  {id:16, name:'Hussein Dey 2',            city:'Hussein Dey',            wilaya:'Alger',      address:'71, Rue Djnane Bendanoune, Hussein Dey — Alger',                                     director:'Mme Cherif Hakima',       type:'Main Agency',    services:['Auto','Claims'],                                lat:36.733654, lng:3.099907},
  {id:17, name:'Bab Ezzouar 4',            city:'Bab Ezzouar',            wilaya:'Alger',      address:'Cité 1577 Logements Bâtiment 15, Bab Ezzouar — Alger',                              director:'Mme Benferrah Meriem',    type:'Main Agency',    services:['Auto','Habitation'],                            lat:36.715662, lng:3.193213},
  {id:18, name:'Reghaia',                  city:'Reghaia',                wilaya:'Alger',      address:'Cité Ahmed Faoussi, Reghaia — Alger',                                                director:'Melle Boussaid Malika',   type:'Main Agency',    services:['Auto','Habitation','Agricultural'],             lat:36.738071, lng:3.356188},
  {id:19, name:'Belouizded',               city:'Belouizded',             wilaya:'Alger',      address:'23, Rue Mohamed Belouizded — Alger',                                                 director:'Mr Rouag El Moundir',     type:'Main Agency',    services:['Auto','Habitation','Business','Transport'],     lat:36.758606, lng:3.055839},
  {id:20, name:'Quartier Seghir',          city:'Quartier Seghir',        wilaya:'Bejaia',     address:'Bâtiment D11 et D12, Bvd de la Revolution — Bejaia',                                director:'Mr Hassani Laid',         type:'Regional Office',services:['Auto','Habitation','Transport'],                lat:36.748530, lng:5.055731},
  {id:21, name:'Krim Belkacem',            city:'Krim Belkacem',          wilaya:'Bejaia',     address:'Big Center Centre Affaires Krim Belkacem — Bejaia',                                  director:'Mr Zaidi Abd Salem',      type:'Regional Office',services:['Auto','Habitation','Business'],                 lat:36.744811, lng:5.048222},
  {id:22, name:'Frere Bouaouina',          city:'Bejaia Centre',          wilaya:'Bejaia',     address:'12, Boulevard Frere Bouaouina — Bejaia',                                             director:'Mr Taleb Zahir',          type:'Regional Office',services:['Auto','Claims'],                                lat:36.756511, lng:5.085508},
  {id:23, name:'Krim Belkacem 2',          city:'Krim Belkacem',          wilaya:'Bejaia',     address:'Cité Administrative Somacob, Bâtiment C2 — Bejaia',                                 director:'Mme Kadri Safia',         type:'Regional Office',services:['Auto','Habitation'],                            lat:36.744627, lng:5.049176},
  {id:24, name:'Akbou',                    city:'Akbou',                  wilaya:'Bejaia',     address:'Route Nationale N°26, Cité Bendjaoud Taharacht — Bejaia',                           director:'Mr Mohou Abdenacer',      type:'Regional Office',services:['Auto','Habitation','Agricultural'],             lat:36.481959, lng:4.557145},
  {id:25, name:'Lakhdaria',                city:'Lakhdaria',              wilaya:'Bouira',     address:'Cité des 39 Logements, Route Nationale N°05 — Bouira',                              director:'Mr Mokrani Said',         type:'Sub Agency',     services:['Auto','Habitation'],                            lat:36.564176, lng:3.596628},
  {id:26, name:'Axe Financier Bouira',     city:'Bouira',                 wilaya:'Bouira',     address:'Axe Financier à côté CNEP — Bouira',                                                director:'Mr Abdi Cherif',          type:'Sub Agency',     services:['Auto','Business'],                              lat:36.382931, lng:4.401990},
  {id:27, name:'Oued Tatareg',             city:'Oued Tatareg',           wilaya:'Boumerdes',  address:'Centre Commercial Oued Tatareg, Locaux 2&3 — Boumerdes',                            director:'Mr Amara Aghiles',        type:'Claims Center',  services:['Auto','Claims','Habitation'],                   lat:36.765068, lng:3.460068},
  {id:28, name:'Sidi Abbaz',               city:'Sidi Abbaz',             wilaya:'Ghardaia',   address:'BP 24, Sidi Abbaz — Ghardaia',                                                       director:'Mr Lakhoui Mohamed',      type:'Sub Agency',     services:['Auto','Habitation','Agricultural'],             lat:32.485676, lng:3.694851},
  {id:29, name:'Ouargla Centre',           city:'Ouargla',                wilaya:'Ouargla',    address:"Cité 460 Logements, Rue Larbi Ben M'hidi — Ouargla",                                 director:'Mme Kadi Karima',         type:'Sub Agency',     services:['Auto','Industrial'],                            lat:31.947023, lng:5.318237},
  {id:30, name:'Hassi Messaoud',           city:'Hassi Messaoud',         wilaya:'Ouargla',    address:'Cité El Haoues 1039, BP 257 — Ouargla',                                              director:'Mr Ouamer Mohand',        type:'Sub Agency',     services:['Auto','Industrial','Business'],                 lat:31.695729, lng:6.065720},
  {id:31, name:'Hassi Messaoud 2',         city:'Hassi Messaoud',         wilaya:'Ouargla',    address:'Cité 100 Logements AADL BP 548 — Ouargla',                                          director:'Mr Rezgui Bachir Eddine', type:'Sub Agency',     services:['Auto','Industrial'],                            lat:31.958203, lng:5.346406},
  {id:32, name:'Larbaa Nath Irathen',      city:'Larbaa Nath Irathen',    wilaya:'Tizi Ouzou', address:'Route du Lycée, Larbaa Nath Irathen — Tizi Ouzou',                                  director:'Mr Boulifa El Hachemi',   type:'Agency',         services:['Auto','Habitation','Agricultural'],             lat:36.642939, lng:4.201181},
  {id:33, name:'Azzazga',                  city:'Azzazga',                wilaya:'Tizi Ouzou', address:'Cité 300 Logements AADL, Azzazga — Tizi Ouzou',                                      director:'Mr Akir Ali',             type:'Agency',         services:['Auto','Habitation'],                            lat:36.747213, lng:4.359308},
  {id:34, name:'Nouvelle Ville',           city:'Tizi Ouzou',             wilaya:'Tizi Ouzou', address:'Cité 600 Logements Genie Sider Bat 5 Local 07 — Tizi Ouzou',                        director:'Mr Mihoubi Hamid',        type:'Agency',         services:['Auto','Habitation','Claims'],                   lat:36.700551, lng:4.050789},
  {id:35, name:'Tours-Villas',             city:'Tizi Ouzou',             wilaya:'Tizi Ouzou', address:'Route des Tours-Villas — Tizi Ouzou',                                                director:'Mr Medjbour Idir',        type:'Agency',         services:['Auto','Habitation'],                            lat:36.717122, lng:4.041346},
  {id:36, name:'Draa Ben Khedda',          city:'Draa Ben Khedda',        wilaya:'Tizi Ouzou', address:'06, Rue Kasseri Ahmed, Draa Ben Khedda — Tizi Ouzou',                               director:'Mme Boumrar Leila',       type:'Agency',         services:['Auto','Agricultural'],                          lat:36.732555, lng:3.966033},
  {id:37, name:'Nouvelle Ville 2',         city:'Tizi Ouzou',             wilaya:'Tizi Ouzou', address:'Boulevard des Freres Belhadj, Nouvelle Ville — Tizi Ouzou',                         director:'Mr Berraoui Kamel',       type:'Agency',         services:['Auto','Habitation'],                            lat:36.702103, lng:4.050065},
  {id:38, name:'Beni Douala',              city:'Beni Douala',            wilaya:'Tizi Ouzou', address:'Bâtiment N°06 Appartement N°04, Centre Beni Douala — Tizi Ouzou',                  director:'Mr Berraoui Kamel',       type:'Agency',         services:['Habitation','Agricultural'],                    lat:36.622719, lng:4.079689},
  {id:39, name:'Siege Social CAAR',        city:'Alger Centre',           wilaya:'Alger',      address:'48, Rue Didouche Mourad, Alger 16000',                                               director:'Direction Generale',      type:'Headquarters',   services:['Auto','Habitation','Business','Transport','Industrial','Agricultural','Claims'], lat:36.767043, lng:3.052792},
];

const HQ_AGENCY = AGENCIES.find(function(a) { return a.id === 39; });

const WILAYAS = [
  {name:'Adrar',               lat:27.874, lng:0.294,   zoom:10},
  {name:'Chlef',               lat:36.165, lng:1.330,   zoom:11},
  {name:'Laghouat',            lat:33.800, lng:2.865,   zoom:11},
  {name:'Oum El Bouaghi',      lat:35.875, lng:7.116,   zoom:11},
  {name:'Batna',               lat:35.556, lng:6.174,   zoom:11},
  {name:'Bejaia',              lat:36.752, lng:5.057,   zoom:12},
  {name:'Biskra',              lat:34.850, lng:5.728,   zoom:11},
  {name:'Bechar',              lat:31.617, lng:-2.217,  zoom:11},
  {name:'Blida',               lat:36.470, lng:2.833,   zoom:12},
  {name:'Bouira',              lat:36.370, lng:3.900,   zoom:11},
  {name:'Tamanrasset',         lat:22.785, lng:5.523,   zoom:10},
  {name:'Tebessa',             lat:35.404, lng:8.120,   zoom:11},
  {name:'Tlemcen',             lat:34.880, lng:-1.320,  zoom:11},
  {name:'Tiaret',              lat:35.370, lng:1.322,   zoom:11},
  {name:'Tizi Ouzou',          lat:36.712, lng:4.045,   zoom:11},
  {name:'Alger',               lat:36.752, lng:3.042,   zoom:12},
  {name:'Djelfa',              lat:34.670, lng:3.263,   zoom:11},
  {name:'Jijel',               lat:36.820, lng:5.766,   zoom:11},
  {name:'Setif',               lat:36.190, lng:5.412,   zoom:11},
  {name:'Saida',               lat:34.830, lng:0.150,   zoom:11},
  {name:'Skikda',              lat:36.876, lng:6.906,   zoom:11},
  {name:'Sidi Bel Abbes',      lat:35.190, lng:-0.630,  zoom:11},
  {name:'Annaba',              lat:36.900, lng:7.755,   zoom:12},
  {name:'Guelma',              lat:36.462, lng:7.431,   zoom:11},
  {name:'Constantine',         lat:36.365, lng:6.615,   zoom:12},
  {name:'Medea',               lat:36.264, lng:2.760,   zoom:11},
  {name:'Mostaganem',          lat:35.937, lng:0.089,   zoom:11},
  {name:'Msila',               lat:35.705, lng:4.543,   zoom:11},
  {name:'Mascara',             lat:35.395, lng:0.140,   zoom:11},
  {name:'Ouargla',             lat:31.947, lng:5.318,   zoom:11},
  {name:'Oran',                lat:35.699, lng:-0.635,  zoom:12},
  {name:'El Bayadh',           lat:33.683, lng:1.017,   zoom:11},
  {name:'Illizi',              lat:26.507, lng:8.483,   zoom:10},
  {name:'Bordj Bou Arreridj',  lat:36.074, lng:4.763,   zoom:11},
  {name:'Boumerdes',           lat:36.765, lng:3.460,   zoom:11},
  {name:'El Taref',            lat:36.767, lng:8.313,   zoom:11},
  {name:'Tindouf',             lat:27.674, lng:-8.147,  zoom:10},
  {name:'Tissemsilt',          lat:35.607, lng:1.812,   zoom:11},
  {name:'El Oued',             lat:33.357, lng:6.854,   zoom:11},
  {name:'Khenchela',           lat:35.426, lng:7.146,   zoom:11},
  {name:'Souk Ahras',          lat:36.280, lng:7.951,   zoom:11},
  {name:'Tipaza',              lat:36.589, lng:2.447,   zoom:11},
  {name:'Mila',                lat:36.452, lng:6.265,   zoom:11},
  {name:'Ain Defla',           lat:36.260, lng:1.970,   zoom:11},
  {name:'Naama',               lat:33.267, lng:-0.317,  zoom:11},
  {name:'Ain Temouchent',      lat:35.298, lng:-1.138,  zoom:11},
  {name:'Ghardaia',            lat:32.490, lng:3.674,   zoom:11},
  {name:'Relizane',            lat:35.739, lng:0.556,   zoom:11},
  {name:'Timimoun',            lat:29.263, lng:0.230,   zoom:10},
  {name:'Bordj Badji Mokhtar', lat:21.328, lng:0.942,   zoom:10},
  {name:'Ouled Djellal',       lat:34.418, lng:5.068,   zoom:11},
  {name:'Beni Abbes',          lat:30.128, lng:-2.168,  zoom:11},
  {name:'In Salah',            lat:27.196, lng:2.463,   zoom:10},
  {name:'In Guezzam',          lat:19.565, lng:5.769,   zoom:10},
  {name:'Touggourt',           lat:33.100, lng:6.067,   zoom:11},
  {name:'Djanet',              lat:24.554, lng:9.484,   zoom:10},
  {name:'El Mghair',           lat:33.953, lng:5.923,   zoom:11},
  {name:'El Menia',            lat:30.579, lng:2.881,   zoom:10},
];

/* ============================================================
   URL PARAMS
============================================================ */
const urlParams = new URLSearchParams(window.location.search);
const focusParam = urlParams.get('focus');

/* ============================================================
   FILTER STATE (source de vérité)
============================================================ */
const FILTERS = {
  wilaya: null,
  city: null,
  type: null,
  service: null,
  search: ''
};

/* ============================================================
   MAP STATE
============================================================ */
const MAP = {
  hero: null,
  filter: null,
  markers: {
    hero: {},
    filter: {}
  }
};
/* ============================================================
   STRING NORMALIZATION (search friendly)
============================================================ */
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .replace(/['’]/g, '')            // apostrophes
    .trim();
}

/* ============================================================
   ICON FACTORY (évite duplication)
============================================================ */
function createIcon(options) {
  return L.divIcon({
    className: '',
    html: options.html,
    iconSize: options.size,
    iconAnchor: options.anchor,
    popupAnchor: options.popupAnchor || [0, 0],
  });
}

/* ============================================================
   HERO ICONS
============================================================ */
function makeHeroDotIcon() {
  return createIcon({
    size: [10, 10],
    anchor: [5, 5],
    html: `
      <svg width="10" height="10">
        <circle cx="5" cy="5" r="4.5" fill="#E8761E" stroke="white" stroke-width="1"/>
      </svg>
    `
  });
}

function makeHQDotIcon() {
  return createIcon({
    size: [18, 18],
    anchor: [9, 9],
    html: `
      <svg width="18" height="18">
        <circle cx="9" cy="9" r="8" fill="#C9601A" stroke="white" stroke-width="2"/>
        <text x="9" y="13" text-anchor="middle" font-size="9" fill="white">★</text>
      </svg>
    `
  });
}

/* ============================================================
   FILTER MARKER ICON
============================================================ */
function makeFilterIcon(active) {
  var w = active ? 32 : 26;
  var h = active ? 42 : 34;
  var cx = w / 2;
  var cy = w / 2;

  var fill = active ? '#C9601A' : '#E8761E';

  return createIcon({
    size: [w, h],
    anchor: [cx, h],
    popupAnchor: [0, -h - 4],
    html: `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <path d="
          M${cx} 0
          C${cx * 0.455} 0 0 ${cy * 0.455} 0 ${cy}
          C0 ${cy * 1.75} ${cx} ${h} ${cx} ${h}
          S${w} ${cy * 1.75} ${w} ${cy}
          C${w} ${cy * 0.455} ${cx * 1.545} 0 ${cx} 0Z
        " fill="${fill}"/>
        <circle cx="${cx}" cy="${cy}" r="${w * 0.32}" fill="white"/>
        <text
          x="${cx}"
          y="${cy + w * 0.14}"
          text-anchor="middle"
          font-size="${w * 0.3}"
          font-weight="800"
          fill="${fill}"
          font-family="DM Sans,sans-serif"
        >C</text>
      </svg>
    `
  });
}
/* ============================================================
   HQ FILTER ICON (avec cache + factory)
============================================================ */
const ICON_CACHE = {};

function makeHQFilterIcon(active) {
  const key = active ? 'hq-active' : 'hq-default';
  if (ICON_CACHE[key]) return ICON_CACHE[key];

  const w = active ? 36 : 30;
  const h = active ? 46 : 38;
  const cx = w / 2;
  const cy = w / 2;

  const fill = active ? '#8B0000' : '#C9601A';

  const icon = createIcon({
    size: [w, h],
    anchor: [cx, h],
    popupAnchor: [0, -h - 4],
    html: `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <path d="
          M${cx} 0
          C${cx * 0.455} 0 0 ${cy * 0.455} 0 ${cy}
          C0 ${cy * 1.75} ${cx} ${h} ${cx} ${h}
          S${w} ${cy * 1.75} ${w} ${cy}
          C${w} ${cy * 0.455} ${cx * 1.545} 0 ${cx} 0Z
        " fill="${fill}"/>
        <circle cx="${cx}" cy="${cy}" r="${w * 0.36}" fill="white"/>
        <text
          x="${cx}"
          y="${cy + w * 0.2}"
          text-anchor="middle"
          font-size="${w * 0.36}"
          fill="${fill}"
        >★</text>
      </svg>
    `
  });

  ICON_CACHE[key] = icon;
  return icon;
}

/* ============================================================
   POPUP BUILDER (safe + clean)
============================================================ */
function makePopup(ag) {
  const isHQ = ag.type === 'hq';

  const hqBadge = isHQ
    ? `<span class="popup-badge">⭐ Headquarters</span>`
    : '';

  const callBtn = isHQ
    ? `<button class="popup-btn pbtn-call"
        onclick="window.location.href='tel:+213213410016'">
        📞 Call HQ
      </button>`
    : '';

  const contactLink = isHQ
    ? `<div class="popup-footer">
         <a href="contact.html">✉ Send a message instead →</a>
       </div>`
    : '';

  return `
    <div class="popup">
      
      <div class="popup-head">
        <div class="popup-head-code">
          ${TYPE_LABELS[ag.type] || ag.type} • ${ag.wilaya}
        </div>
        <div class="popup-head-name">
          ${ag.name}
        </div>
      </div>

      <div class="popup-body">

        ${hqBadge}

        <div class="popup-addr">
          ${ag.address}
        </div>

        <div class="popup-actions">
          <button class="popup-btn pbtn-dir"
            onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${ag.lat},${ag.lng}','_blank')">
            🧭 Directions
          </button>

          ${callBtn}
        </div>

        ${contactLink}

      </div>

    </div>
  `;
}
/* ============================================================
   HERO MAP
============================================================ */
function initHeroMap() {
  if (!document.getElementById('heroMap')) return;

  MAP.hero = L.map('heroMap', {
    center: [28.0339, 1.6596],
    zoom: 6,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(MAP.hero);

  setTimeout(() => MAP.hero.invalidateSize(), 150);

  const dotIcon = makeHeroDotIcon();
  const hqIcon  = makeHQDotIcon();

  AGENCIES.forEach(function (ag) {
    const isHQ = ag.type === 'hq';
    const icon = isHQ ? hqIcon : dotIcon;

    const marker = L.marker([ag.lat, ag.lng], { icon }).addTo(MAP.hero);

    marker.bindPopup(`
      <div class="hero-popup">
        <strong>${ag.name}</strong><br>
        <span>${ag.wilaya}</span>
        ${isHQ ? `<br><a href="contact.html">Contact us →</a>` : ''}
      </div>
    `, { maxWidth: 150, minWidth: 130 });

    MAP.markers.hero[ag.id] = marker;
  });

  /* Focus HQ */
  if (hasFocusHQ() && HQ_AGENCY) {
    setTimeout(function () {
      MAP.hero.flyTo([HQ_AGENCY.lat, HQ_AGENCY.lng], 15, {
        animate: true,
        duration: 1.8
      });
    }, 400);
  }
}function initFilterMap() {
  if (!document.getElementById('filterMap')) return;

  MAP.filter = L.map('filterMap', {
    center: [28.0339, 1.6596],
    zoom: 6,
    zoomControl: true,
    scrollWheelZoom: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(MAP.filter);

  setTimeout(() => MAP.filter.invalidateSize(), 150);

  /* ───────── MARKERS ───────── */
  AGENCIES.forEach(function (ag) {
    const isHQ = ag.type === 'hq';

    const marker = L.marker([ag.lat, ag.lng], {
      icon: isHQ ? makeHQFilterIcon(false) : makeFilterIcon(false)
    }).addTo(MAP.filter);

    marker.bindPopup(makePopup(ag), {
      maxWidth: 260,
      minWidth: 250
    });

    marker.on('click', function () {
      resetFilterIcons();

      marker.setIcon(
        isHQ ? makeHQFilterIcon(true) : makeFilterIcon(true)
      );

      highlightFilterCard(ag.id);

      setTimeout(() => marker.openPopup(), 80);
    });

    MAP.markers.filter[ag.id] = marker;
  });

  /* ───────── CARDS INIT ───────── */
  renderFilterCards(AGENCIES);

  /* ───────── FOCUS HQ ───────── */
  if (hasFocusHQ() && HQ_AGENCY) {
    setTimeout(focusOnHQ, 600);
  }
}

/* ============================================================
   FOCUS ON HQ
============================================================ */
/* ============================================================
   FOCUS ON HQ
============================================================ */
function focusOnHQ() {
  const banner = document.getElementById('focusBanner');
  const section = document.getElementById('filterSection');

  if (banner) banner.classList.add('show');
  if (!MAP.filter || !HQ_AGENCY) return;

  const marker = MAP.markers.filter[HQ_AGENCY.id];

  MAP.filter.flyTo([HQ_AGENCY.lat, HQ_AGENCY.lng], 15, {
    animate: true,
    duration: 1.5
  });

  resetFilterIcons();

  if (marker) {
    marker.setIcon(makeHQFilterIcon(true));

    setTimeout(() => marker.openPopup(), 1200);
  }

  highlightFilterCard(HQ_AGENCY.id);

  if (section) {
    setTimeout(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }
}

/* ============================================================
   DISMISS BANNER
============================================================ */
function dismissFocusBanner() {
  const banner = document.getElementById('focusBanner');
  if (banner) banner.classList.remove('show');
}

/* ============================================================
   RESET FILTER ICONS
============================================================ */
function resetFilterIcons() {
  Object.keys(MAP.markers.filter).forEach(function (id) {
    const ag = AGENCIES.find(a => a.id === Number(id));
    if (!ag) return;

    const marker = MAP.markers.filter[id];

    marker.setIcon(
      ag.type === 'hq'
        ? makeHQFilterIcon(false)
        : makeFilterIcon(false)
    );
  });
}

function renderFilterCards(list) {
  var container = document.getElementById('filterCardList');
  var noRes     = document.getElementById('filterNoResults');
  var countEl   = document.getElementById('filterCountNum');

  if (!container) return;

  /* ───────── compteur ───────── */
  if (countEl) countEl.textContent = list.length;

  /* ───────── aucun résultat ───────── */
  if (!list.length) {
    container.innerHTML = '';
    if (noRes) noRes.classList.add('show');
    return;
  }

  if (noRes) noRes.classList.remove('show');

  /* ───────── sécurité HTML ───────── */
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return {
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      }[m];
    });
  }

  /* ───────── génération HTML ───────── */
  container.innerHTML = list.map(function(ag) {

    var isHQ = ag.id === 39;

    var typeIcon = isHQ ? '⭐' :
      ag.type === 'Main Agency'     ? '🏢' :
      ag.type === 'Regional Office' ? '🏬' :
      ag.type === 'Claims Center'   ? '🗂' : '📍';

    var svcs = (ag.services || []).map(function(s) {
      return '<span class="fc-service-tag">' + escapeHTML(s) + '</span>';
    }).join('');

    var hqStyle = isHQ
      ? 'border-left-color:var(--hdr-orange);background:#fff8f2;'
      : '';

    return `
      <div class="filter-card" data-id="${ag.id}" style="${hqStyle}">
        
        <div class="fc-header">
          <div class="fc-name">
            CAAR — ${escapeHTML(ag.name)}
            ${isHQ ? '<span style="font-size:0.6rem;color:var(--hdr-orange);font-weight:700;">HQ</span>' : ''}
          </div>
          <div class="fc-code">${typeIcon}</div>
        </div>

        <div class="fc-wilaya">
          ${escapeHTML(ag.city)}, ${escapeHTML(ag.wilaya)}
        </div>

        ${ag.director ? `<div class="fc-director">👤 ${escapeHTML(ag.director)}</div>` : ''}

        <div class="fc-hours">
          Sunday to Thursday, 08:30 – 16:00
        </div>

        ${svcs ? `<div class="fc-services">${svcs}</div>` : ''}

        <div class="fc-btns">
          <button class="fc-btn fc-btn-map">View on map</button>
          <button class="fc-btn fc-btn-dir">Directions</button>
          <button class="fc-btn fc-btn-call">📞 Call</button>
        </div>

      </div>
    `;
  }).join('');

  /* ───────── EVENTS (IMPORTANT : pas de onclick inline) ───────── */
  container.querySelectorAll('.filter-card').forEach(function(card) {

    var id = parseInt(card.getAttribute('data-id'));

    /* click carte */
    card.addEventListener('click', function () {
      flyToFilterAgency(id);
    });

    /* boutons internes */
    var btnMap = card.querySelector('.fc-btn-map');
    var btnDir = card.querySelector('.fc-btn-dir');
    var btnCall = card.querySelector('.fc-btn-call');

    if (btnMap) {
      btnMap.addEventListener('click', function (e) {
        e.stopPropagation();
        flyToFilterAgency(id);
      });
    }

    if (btnDir) {
      btnDir.addEventListener('click', function (e) {
        e.stopPropagation();
        var ag = AGENCIES.find(function(a){ return a.id === id; });
        if (ag) {
          window.open(
            'https://www.google.com/maps/dir/?api=1&destination=' + ag.lat + ',' + ag.lng,
            '_blank'
          );
        }
      });
    }

    if (btnCall) {
      btnCall.addEventListener('click', function (e) {
        e.stopPropagation();
        window.location.href = 'tel:+213213410016';
      });
    }

  });

  /* ───────── synchro map ───────── */
  var filteredIds = {};
  list.forEach(function(a) { filteredIds[a.id] = true; });

  Object.keys(filterMarkerMap).forEach(function(id) {
    var m = filterMarkerMap[id];
    if (filteredIds[id]) {
      if (!filterMap.hasLayer(m)) m.addTo(filterMap);
    } else {
      if (filterMap.hasLayer(m)) filterMap.removeLayer(m);
    }
  });

  /* ───────── zoom intelligent ───────── */
  if (list.length > 0 && list.length < AGENCIES.length) {
    var group = L.featureGroup(
      list.map(function(ag) { return filterMarkerMap[ag.id]; })
    );
    filterMap.fitBounds(group.getBounds().pad(0.2));
  } else {
    filterMap.flyTo([28.0339, 1.6596], 6, {
      animate: true,
      duration: 1
    });
  }
}
function highlightFilterCard(id) {
  var cards = document.querySelectorAll('.filter-card');

  cards.forEach(function(c) {
    c.classList.remove('active');
  });

  var el = document.querySelector('.filter-card[data-id="' + id + '"]');

  if (el) {
    el.classList.add('active');

    el.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }
}

function flyToFilterAgency(id) {
  var ag = AGENCIES.find(function(a) {
    return a.id === id;
  });

  if (!ag || !filterMap) return;

  var marker = filterMarkerMap[id];
  if (!marker) return;

  /* ───────── déplacement carte ───────── */
  filterMap.flyTo([ag.lat, ag.lng], 15, {
    animate: true,
    duration: 1.2
  });

  /* ───────── reset icônes ───────── */
  resetFilterIcons();

  /* ───────── activer icône sélectionnée ───────── */
  var activeIcon = ag.id === 39
    ? makeHQFilterIcon(true)
    : makeFilterIcon(true);

  marker.setIcon(activeIcon);

  /* ───────── ouvrir popup après animation ───────── */
  setTimeout(function() {
    if (filterMap.hasLayer(marker)) {
      marker.openPopup();
    }
  }, 1200);

  /* ───────── highlight carte ───────── */
  highlightFilterCard(id);
}

/* ============================================================
   HERO SEARCH
============================================================ */
var autoItems = [];

var autoItems = [];

function onSearchInput(val) {
  var clearBtn = document.getElementById('sClear');
  if (clearBtn) {
    clearBtn.classList.toggle('vis', val.length > 0);
  }

  var q = normalize(val);

  if (q.length < 2) {
    closeAuto();
    return;
  }

  autoItems = [];
  var seen = {};

  /* ───────── wilayas ───────── */
  WILAYAS.forEach(function(w) {
    var key = normalize(w.name);

    if (key.indexOf(q) !== -1 && !seen['w:' + key]) {
      seen['w:' + key] = true;

      autoItems.push({
        type: 'wilaya',
        label: w.name,
        sub: 'Wilaya',
        lat: w.lat,
        lng: w.lng,
        zoom: w.zoom
      });
    }
  });

  /* ───────── agences ───────── */
  AGENCIES.forEach(function(ag) {

    var hit =
      normalize(ag.name).indexOf(q) !== -1 ||
      normalize(ag.city).indexOf(q) !== -1 ||
      normalize(ag.address).indexOf(q) !== -1 ||
      normalize(ag.wilaya).indexOf(q) !== -1;

    if (hit && !seen['a:' + ag.id]) {
      seen['a:' + ag.id] = true;

      autoItems.push({
        type: 'agency',
        id: ag.id,
        label: ag.name,
        sub: ag.address.substring(0, 46) + '...',
        lat: ag.lat,
        lng: ag.lng
      });
    }
  });

  /* limiter */
  autoItems = autoItems.slice(0, 8);

  renderAuto(autoItems);
}
function renderAuto(items) {
  var list = document.getElementById('autoList');
  if (!list) return;

  /* ───────── sécurité HTML ───────── */
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return {
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      }[m];
    });
  }

  if (!items.length) {
    list.classList.remove('open');
    list.innerHTML = '';
    return;
  }

  /* ───────── HTML sans onclick ───────── */
  list.innerHTML = items.map(function(it, i) {
    return `
      <div class="auto-item" data-index="${i}">
        <span class="auto-ico">
          ${it.type === 'wilaya' ? '🗺' : '📍'}
        </span>
        <div>
          <div class="auto-name">${escapeHTML(it.label)}</div>
          <div class="auto-sub">${escapeHTML(it.sub)}</div>
        </div>
      </div>
    `;
  }).join('');

  list.classList.add('open');

  /* ───────── EVENTS ───────── */
  list.querySelectorAll('.auto-item').forEach(function(el) {
    el.addEventListener('click', function() {
      var index = parseInt(this.getAttribute('data-index'));
      selectAuto(index);
    });
  });
}

function selectAuto(i) {
  var it = autoItems[i];
  if (!it || !heroMap) return;

  var input = document.getElementById('mapSearch');
  if (input) input.value = it.label;

  closeAuto();

  heroMap.flyTo([it.lat, it.lng], it.zoom || 12, {
    animate: true,
    duration: 1.5
  });
}

function onSearchKey(e) {
  if (!heroMap) return;

  var input = document.getElementById('mapSearch');
  var value = input ? input.value : '';
  var q = normalize(value || '');

  if (e.key === 'Enter') {

    /* ───────── recherche wilaya ───────── */
    var wMatch = WILAYAS.find(function(w) {
      return normalize(w.name).indexOf(q) !== -1;
    });

    if (wMatch) {
      heroMap.flyTo([wMatch.lat, wMatch.lng], wMatch.zoom || 10, {
        animate: true,
        duration: 1.2
      });
      closeAuto();
      return;
    }

    /* ───────── recherche agence ───────── */
    var ag = AGENCIES.find(function(a) {
      return (
        normalize(a.name).indexOf(q) !== -1 ||
        normalize(a.city).indexOf(q) !== -1 ||
        normalize(a.wilaya).indexOf(q) !== -1
      );
    });

    if (ag) {
      heroMap.flyTo([ag.lat, ag.lng], 14, {
        animate: true,
        duration: 1.2
      });
      closeAuto();
      return;
    }

    /* ───────── aucun résultat ───────── */
    closeAuto();
    console.warn('[Search] Aucun résultat pour:', value);
  }

  if (e.key === 'Escape') {
    closeAuto();
  }
}

function clearSearch() {
  var input = document.getElementById('mapSearch');
  if (input) input.value = '';

  var clearBtn = document.getElementById('sClear');
  if (clearBtn) clearBtn.classList.remove('vis');

  closeAuto();

  if (!heroMap) return;

  heroMap.flyTo([28.0339, 1.6596], 6, {
    animate: true,
    duration: 1.5
  });
}

function closeAuto() {
  var list = document.getElementById('autoList');
  if (!list) return;

  list.classList.remove('open');
  list.innerHTML = ''; // 🔥 important : clean DOM
}
document.addEventListener('click', function(e) {
  var searchWrap = document.querySelector('.search-wrap');

  if (!searchWrap) return;

  if (!e.target.closest('.search-wrap')) {
    closeAuto();
  }
});
var input = document.getElementById('mapSearch');

if (input) {
  input.addEventListener('blur', function () {
    setTimeout(closeAuto, 150);
  });
}

/* ============================================================
   FILTER DROPDOWNS
============================================================ */
var FILTER_DROPS = ['fd-wilaya', 'fd-city', 'fd-type', 'fd-service'];
function toggleDrop(id) {
  if (!id) return;

  FILTER_DROPS.forEach(function(d) {
    var el = document.getElementById(d);
    if (!el) return;

    if (d !== id) {
      el.classList.remove('open');
    }
  });

  var target = document.getElementById(id);
  if (!target) return;

  target.classList.toggle('open');
}
document.addEventListener('click', function(e) {

  var isInsideDropdown = e.target.closest('.filter-dropdown');
  var isInsideSearch   = e.target.closest('.fd-search-wrap');

  if (!isInsideDropdown && !isInsideSearch) {

    FILTER_DROPS.forEach(function(d) {
      var el = document.getElementById(d);
      if (el) el.classList.remove('open');
    });

  }
});
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;

  FILTER_DROPS.forEach(function(d) {
    var el = document.getElementById(d);
    if (el) el.classList.remove('open');
  });
});
document.querySelectorAll('.filter-dropdown').forEach(function(el) {
  el.addEventListener('click', function(e) {
    e.stopPropagation();
  });
});

/* ============================================================
   DROPDOWN TOGGLE
============================================================ */
function toggleDrop(id) {
  ['fd-wilaya', 'fd-city', 'fd-type', 'fd-service'].forEach(function(d) {
    var el = document.getElementById(d);
    if (el && d !== id) el.classList.remove('open');
  });

  var target = document.getElementById(id);
  if (target) target.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('.filter-dropdown') && !e.target.closest('.fd-search-wrap')) {
    ['fd-wilaya', 'fd-city', 'fd-type', 'fd-service'].forEach(function(d) {
      var el = document.getElementById(d);
      if (el) el.classList.remove('open');
    });
  }
});


/* ============================================================
   BUILD DROPDOWNS
============================================================ */
function buildWilayaDropdown() {
  var menu = document.getElementById('fdm-wilaya');
  if (!menu || typeof WILAYAS === 'undefined') return;

  var agencyWilayas = {};
  AGENCIES.forEach(function(a) {
    agencyWilayas[a.wilaya] = true;
  });

  var html = '<div class="fd-item fd-item-all active" onclick="setFilter(\'wilaya\',\'\',this)">🌍 All Wilayas</div>';

  WILAYAS.forEach(function(w) {
    var has = !!agencyWilayas[w.name];
    html += '<div class="fd-item' + (has ? ' fd-has-agency' : '') + '" onclick="setFilter(\'wilaya\',\'' + w.name + '\',this)">' +
      (has ? '📍' : '○') + ' ' + w.name +
    '</div>';
  });

  menu.innerHTML = html;
}


function buildCityDropdown(wilaya) {
  var menu = document.getElementById('fdm-city');
  if (!menu) return;

  var source = wilaya
    ? AGENCIES.filter(function(a) { return a.wilaya === wilaya; })
    : AGENCIES;

  var citySet = {};
  source.forEach(function(a) {
    citySet[a.city] = true;
  });

  var cities = Object.keys(citySet).sort();

  var html = '<div class="fd-item fd-item-all active" onclick="setFilter(\'city\',\'\',this)">All Cities</div>';

  cities.forEach(function(c) {
    html += '<div class="fd-item" onclick="setFilter(\'city\',\'' + c + '\',this)">' + c + '</div>';
  });

  menu.innerHTML = html;
}


/* ============================================================
   SET FILTER
============================================================ */
function setFilter(key, val, el) {
  activeFilters[key] = val;

  var labels = {
    wilaya: 'Wilaya',
    city: 'City',
    type: 'Agency Type',
    service: 'Services'
  };

  var lbl = document.getElementById('fdlbl-' + key);
  if (lbl) lbl.textContent = val || labels[key];

  var menu = document.getElementById('fdm-' + key);
  if (menu) {
    menu.querySelectorAll('.fd-item').forEach(function(i) {
      i.classList.remove('active');
    });
  }

  if (el) el.classList.add('active');

  var dropdown = document.getElementById('fd-' + key);
  if (dropdown) dropdown.classList.remove('open');

  /* ── CAS WILAYA ── */
  if (key === 'wilaya') {
    activeFilters.city = '';

    var cityLbl = document.getElementById('fdlbl-city');
    if (cityLbl) cityLbl.textContent = 'City';

    buildCityDropdown(val);

    if (val && typeof WILAYAS !== 'undefined') {
      var wc = WILAYAS.find(function(w) {
        return w.name === val;
      });

      if (wc && filterMap) {
        filterMap.flyTo([wc.lat, wc.lng], wc.zoom || 10, {
          animate: true,
          duration: 1.2
        });
      }
    }
  }

  applyFilters();
  updateFilterTags();
}


/* ============================================================
   APPLY FILTERS
============================================================ */
function applyFilters() {
  var list = AGENCIES.filter(function(a) {

    if (activeFilters.wilaya && a.wilaya !== activeFilters.wilaya) return false;
    if (activeFilters.city && a.city !== activeFilters.city) return false;
    if (activeFilters.type && a.type !== activeFilters.type) return false;

    if (activeFilters.service) {
      if (!a.services || a.services.indexOf(activeFilters.service) === -1) return false;
    }

    if (activeFilters.search) {
      var q = normalize(activeFilters.search);
      var hit =
        normalize(a.name).includes(q) ||
        normalize(a.city).includes(q) ||
        normalize(a.address).includes(q);

      if (!hit) return false;
    }

    return true;
  });

  renderFilterCards(list);
}


/* ============================================================
   FILTER TAGS (UI)
============================================================ */
function updateFilterTags() {
  var container = document.getElementById('filterTags');
  if (!container) return;

  var html = '';

  Object.keys(activeFilters).forEach(function(k) {
    var val = activeFilters[k];
    if (!val) return;

    html += '<span class="filter-tag">' +
      val +
      ' <button onclick="removeFilter(\'' + k + '\')">✕</button>' +
    '</span>';
  });

  container.innerHTML = html;
}


function removeFilter(key) {
  activeFilters[key] = '';

  var lbl = document.getElementById('fdlbl-' + key);
  if (lbl) {
    var defaults = {
      wilaya: 'Wilaya',
      city: 'City',
      type: 'Agency Type',
      service: 'Services'
    };
    lbl.textContent = defaults[key];
  }

  applyFilters();
  updateFilterTags();
}/* ============================================================
   SEARCH FILTER
============================================================ */
function setSearchFilter(val) {
  activeFilters.search = (val || '').trim().toLowerCase();

  var clr = document.getElementById('fdSearchClear');
  if (clr) clr.style.display = activeFilters.search ? 'block' : 'none';

  applyFilters();
  updateFilterTags();
}

function clearNameSearch() {
  var inp = document.getElementById('fdSearchInput');
  if (inp) inp.value = '';

  activeFilters.search = '';

  var clr = document.getElementById('fdSearchClear');
  if (clr) clr.style.display = 'none';

  applyFilters();
  updateFilterTags();
}


/* ============================================================
   APPLY FILTERS (SAFE VERSION)
============================================================ */
function applyFilters() {
  if (!Array.isArray(AGENCIES)) return;

  var result = AGENCIES.filter(function(ag) {

    /* ── Wilaya ── */
    if (activeFilters.wilaya && ag.wilaya !== activeFilters.wilaya) {
      return false;
    }

    /* ── City ── */
    if (activeFilters.city && ag.city !== activeFilters.city) {
      return false;
    }

    /* ── Type ── */
    if (activeFilters.type && ag.type !== activeFilters.type) {
      return false;
    }

    /* ── Service ── */
    if (activeFilters.service) {
      if (!ag.services || ag.services.indexOf(activeFilters.service) === -1) {
        return false;
      }
    }

    /* ── Search ── */
    if (activeFilters.search) {
      var q = activeFilters.search;

      var match =
        normalize(ag.name).includes(q) ||
        normalize(ag.city).includes(q) ||
        normalize(ag.wilaya).includes(q) ||
        normalize(ag.address).includes(q);

      if (!match) return false;
    }

    return true;
  });

  /* ── Render sécurisé ── */
  if (typeof renderFilterCards === 'function') {
    renderFilterCards(result);
  }
}
activeFilters.search = normalize(val || '');
/* ============================================================
   FILTER TAGS
============================================================ */
function updateFilterTags() {
  var row = document.getElementById('filterTagsRow');
  if (!row) return;

  var tags = [];

  if (activeFilters.wilaya) {
    tags.push({ key: 'wilaya', label: '📍 Wilaya: ' + activeFilters.wilaya });
  }

  if (activeFilters.city) {
    tags.push({ key: 'city', label: '🏙 City: ' + activeFilters.city });
  }

  if (activeFilters.type) {
    tags.push({ key: 'type', label: '🏢 Type: ' + activeFilters.type });
  }

  if (activeFilters.service) {
    tags.push({ key: 'service', label: '⚙ ' + activeFilters.service });
  }

  if (activeFilters.search) {
    tags.push({ key: 'search', label: '🔍 "' + activeFilters.search + '"' });
  }

  /* ── Aucun filtre ── */
  if (!tags.length) {
    row.innerHTML = '';
    row.style.display = 'none';
    return;
  }

  /* ── Affichage ── */
  row.style.display = 'flex';

  row.innerHTML = tags.map(function(t) {
    return (
      '<span class="filter-tag" onclick="clearTag(\'' + t.key + '\')">' +
        t.label +
        ' <span class="filter-tag-x">✕</span>' +
      '</span>'
    );
  }).join('');
}


/* ============================================================
   CLEAR SINGLE TAG
============================================================ */
function clearTag(key) {
  activeFilters[key] = '';

  var labels = {
    wilaya: 'Wilaya',
    city: 'City',
    type: 'Agency Type',
    service: 'Services'
  };

  /* ── Reset label dropdown ── */
  var lbl = document.getElementById('fdlbl-' + key);
  if (lbl) lbl.textContent = labels[key] || key;

  /* ── Cas SEARCH ── */
  if (key === 'search') {
    var inp = document.getElementById('fdSearchInput');
    if (inp) inp.value = '';

    var clr = document.getElementById('fdSearchClear');
    if (clr) clr.style.display = 'none';
  }

  /* ── Reset dropdown items ── */
  var menu = document.getElementById('fdm-' + key);
  if (menu) {
    menu.querySelectorAll('.fd-item').forEach(function(i) {
      i.classList.remove('active');
    });

    var all = menu.querySelector('.fd-item-all');
    if (all) all.classList.add('active');
  }

  /* ── Cas WILAYA (reset city lié) ── */
  if (key === 'wilaya') {
    activeFilters.city = '';

    var cityLbl = document.getElementById('fdlbl-city');
    if (cityLbl) cityLbl.textContent = 'City';

    if (typeof buildCityDropdown === 'function') {
      buildCityDropdown('');
    }
  }

  /* ── Re-apply ── */
  applyFilters();
  updateFilterTags();
}

/* ============================================================
   RESET ALL FILTERS (SAFE VERSION)
============================================================ */
function resetFilters() {

  /* ── Reset state ── */
  Object.keys(activeFilters).forEach(function(k) {
    activeFilters[k] = '';
  });

  /* ── Reset search input ── */
  var inp = document.getElementById('fdSearchInput');
  if (inp) inp.value = '';

  var clr = document.getElementById('fdSearchClear');
  if (clr) clr.style.display = 'none';

  /* ── Reset dropdown labels + items ── */
  var labels = {
    wilaya: 'Wilaya',
    city: 'City',
    type: 'Agency Type',
    service: 'Services'
  };

  ['wilaya', 'city', 'type', 'service'].forEach(function(key) {

    /* label */
    var lbl = document.getElementById('fdlbl-' + key);
    if (lbl) lbl.textContent = labels[key];

    /* dropdown items */
    var menu = document.getElementById('fdm-' + key);
    if (menu) {
      menu.querySelectorAll('.fd-item').forEach(function(i) {
        i.classList.remove('active');
      });

      var all = menu.querySelector('.fd-item-all');
      if (all) all.classList.add('active');
    }

    /* close dropdown */
    var drop = document.getElementById('fd-' + key);
    if (drop) drop.classList.remove('open');
  });

  /* ── Reset dependent dropdown (city) ── */
  if (typeof buildCityDropdown === 'function') {
    buildCityDropdown('');
  }

  /* ── Update UI ── */
  updateFilterTags();

  /* ── Re-render ── */
  if (typeof renderFilterCards === 'function') {
    renderFilterCards(AGENCIES);
  }

  /* ── Reset map ── */
  if (typeof filterMap !== 'undefined' && filterMap) {
    filterMap.flyTo([28.0339, 1.6596], 6, {
      animate: true,
      duration: 1
    });
  }

  /* ── Reset icons (important 🔥) ── */
  if (typeof resetFilterIcons === 'function') {
    resetFilterIcons();
  }
}
filterMap.flyTo([28.0339, 1.6596], 6, {
  animate: true,
  duration: 1.2,
  easeLinearity: 0.25
});

/* ============================================================
   GEOLOCATION
============================================================ */
function useMyLocation() {
  var btn = document.getElementById('locateBtn');
  if (!navigator.geolocation) {
    alert('Geolocation not supported.');
    return;
  }

  if (btn) {
    btn.classList.add('loading');
    var span = btn.querySelector('span');
    if (span) span.textContent = 'Locating…';
  }

  navigator.geolocation.getCurrentPosition(

    /* ── SUCCESS ── */
    function(pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;

      var nearest = null;
      var minDist = Infinity;

      /* ── Find nearest agency ── */
      AGENCIES.forEach(function(ag) {
        var d = Math.pow(ag.lat - lat, 2) + Math.pow(ag.lng - lng, 2);
        if (d < minDist) {
          minDist = d;
          nearest = ag;
        }
      });

      /* ── Reset button ── */
      if (btn) {
        btn.classList.remove('loading');
        var span = btn.querySelector('span');
        if (span) span.textContent = 'Use my location';
      }

      if (!nearest) return;

      /* ── Show user location ── */
      if (typeof heroMap !== 'undefined' && heroMap) {

        heroMap.flyTo([nearest.lat, nearest.lng], 13, {
          animate: true,
          duration: 1.5
        });

        /* remove old marker if exists */
        if (window.__userMarker) {
          heroMap.removeLayer(window.__userMarker);
        }

        window.__userMarker = L.circleMarker([lat, lng], {
          radius: 8,
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 1,
          weight: 3
        })
        .addTo(heroMap)
        .bindPopup('<strong>Your location</strong>')
        .openPopup();
      }

      /* ── Focus nearest agency ── */
      if (typeof flyToFilterAgency === 'function') {
        flyToFilterAgency(nearest.id);
      }

      /* ── Scroll to results ── */
      var section = document.getElementById('filterSection');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    },

    /* ── ERROR ── */
    function(err) {
      if (btn) {
        btn.classList.remove('loading');
        var span = btn.querySelector('span');
        if (span) span.textContent = 'Use my location';
      }

      console.warn('[Geo]', err);

      alert('Could not get your location. Please allow location access.');
    },

    /* ── OPTIONS ── */
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  );
}


/* ============================================================
   BOOT — SAFE INIT
============================================================ */
window.addEventListener('load', function() {

  /* ── Build dropdowns ── */
  if (typeof buildWilayaDropdown === 'function') {
    buildWilayaDropdown();
  }

  if (typeof buildCityDropdown === 'function') {
    buildCityDropdown('');
  }

  /* ── Init maps ── */
  if (typeof initHeroMap === 'function') {
    initHeroMap();
  }

  if (typeof initFilterMap === 'function') {
    initFilterMap();
  }
});
function getDistance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;

  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ══════════════════════════════════════════════════════════════
   ARTICLE PAGE — SCROLL REVEAL (SAFE & CLEAN)
══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  var sections = document.querySelectorAll('.article-section, .article-keypoints');
  if (!sections.length) return; // ⛔ seulement sur pages article

  var observer = new IntersectionObserver(function(entries, obs) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  });

  sections.forEach(function(el, i) {
    el.style.transitionDelay = (i * 0.06) + 's';
    observer.observe(el);
  });

});


/* ══════════════════════════════════════════════════════════════
   PAGE: NEWS & ARTICLES
══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  /* ===============================
     ADVICE SWITCH
  =============================== */

  var currentAdviceKey = 'road';

  window.switchAdvice = function (key, btn) {
    if (key === currentAdviceKey) return;

    var currentCard = document.getElementById('advice-' + currentAdviceKey);
    var nextCard    = document.getElementById('advice-' + key);

    if (!currentCard || !nextCard) return;

    // animation sortie
    currentCard.classList.add('is-leaving');
    currentCard.classList.remove('is-active');

    setTimeout(function() {

      currentCard.classList.remove('is-leaving');

      // reset boutons
      document.querySelectorAll('.advice-category-btn').forEach(function(b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });

      // activer bouton courant
      if (btn) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
      }

      // afficher nouvelle carte
      nextCard.classList.add('is-active');

      currentAdviceKey = key;

    }, 200);
  };

});


  document.addEventListener('DOMContentLoaded', function () {

  /* ===============================
     SCROLL REVEAL
  =============================== */
  var revealEls = document.querySelectorAll('.scroll-reveal, .scroll-reveal-group');

  if (revealEls.length) {
    var revealObserver = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(function(el) {
      revealObserver.observe(el);
    });
  }

  /* ===============================
     ARTICLES SYSTEM
  =============================== */

  var gridEl = document.getElementById('articles-grid');
  if (!gridEl) return; // 🚨 exécute seulement sur la page articles

  var articles = [
    {
      id: 'agency602',
      category: 'PRESS',
      title: 'Agency 602 Renovated – Didouche Mourad',
      excerpt: 'CAAR modernized Agency 602 in Didouche Mourad to enhance customer experience.',
      date: 'Sep 24, 2023',
      image: 'img/art1.png',
      emoji: '🏢',
      isLatest: false,
      content: '<p>Renovation completed with modern design and better service.</p>'
    },
    {
      id: 'agency228',
      category: 'PRESS',
      title: 'Agency 228 Renovated – Larbâa Nath Irathen',
      excerpt: 'Part of CAAR network modernization.',
      date: 'Sep 25, 2023',
      image: 'img/art2.png',
      emoji: '🏢',
      isLatest: false,
      content: '<p>Improved environment for customer service.</p>'
    },
    {
      id: 'bejaia',
      category: 'EVENT',
      title: 'CAAR Information Day in Béjaïa',
      excerpt: 'Event with regional partners.',
      date: 'Oct 4, 2023',
      image: 'img/art3.png',
      emoji: '📅',
      isLatest: false,
      content: '<p>Partners gathered for CAAR anniversary event.</p>'
    },
    {
      id: 'sada2025',
      category: 'PARTNERSHIP',
      title: 'CAAR at SADA 2025',
      excerpt: 'African Business Forum participation.',
      date: 'Apr 28, 2025',
      image: 'img/art4.png',
      emoji: '🤝',
      isLatest: false,
      content: '<p>Strengthened presence in Africa.</p>'
    },
    {
      id: 'tiziagri',
      category: 'EVENT',
      title: 'TIZI AGRI EXPO 2025',
      excerpt: 'Support for agriculture sector.',
      date: 'May 10, 2025',
      image: 'img/art5.png',
      emoji: '🌾',
      isLatest: true,
      content: '<p>Showcase of agricultural insurance products.</p>'
    }
  ];

  var PER_PAGE = 4;
  var currentPage = 1;
  var totalPages = Math.ceil(articles.length / PER_PAGE);

  var wrapEl       = gridEl.closest('.articles-grid-wrap');
  var paginationEl = document.getElementById('articles-pagination');
  var detailEl     = document.getElementById('article-detail');
  var listView     = document.getElementById('articles-list-view');

  /* ===============================
     RENDER ARTICLES
  =============================== */
  function renderArticles(page) {
    var start = (page - 1) * PER_PAGE;
    var pageItems = articles.slice(start, start + PER_PAGE);

    gridEl.innerHTML = pageItems.map(function(a) {
      return `
        <div class="article-card" onclick="openArticle('${a.id}')">
          <div class="article-img">
            <img src="${a.image}" alt="${a.title}">
          </div>
          <div class="article-body">
            <div class="article-meta">${a.emoji} ${a.category} • ${a.date}</div>
            <div class="article-title">${a.title}</div>
            <div class="article-excerpt">${a.excerpt}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ===============================
     PAGINATION
  =============================== */
  function renderPagination() {
    if (!paginationEl) return;

    paginationEl.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.textContent = i;
      btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');

      btn.addEventListener('click', function() {
        currentPage = i;
        renderArticles(currentPage);
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      paginationEl.appendChild(btn);
    }
  }

  /* ===============================
     OPEN ARTICLE
  =============================== */
  window.openArticle = function(id) {
    var article = articles.find(function(a) { return a.id === id; });
    if (!article || !detailEl || !listView) return;

    detailEl.innerHTML = `
      <div class="article-detail-inner">
        <button class="back-btn" onclick="closeArticle()">← Back</button>
        <h1>${article.title}</h1>
        <div class="article-meta">${article.emoji} ${article.category} • ${article.date}</div>
        <img src="${article.image}" alt="${article.title}">
        <div class="article-content">${article.content}</div>
      </div>
    `;

    listView.style.display = 'none';
    detailEl.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ===============================
     CLOSE ARTICLE
  =============================== */
  window.closeArticle = function() {
    if (!detailEl || !listView) return;

    detailEl.style.display = 'none';
    listView.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ===============================
     INIT
  =============================== */
  renderArticles(currentPage);
  renderPagination();

});
  document.addEventListener('DOMContentLoaded', function () {

  /* ===============================
     SCROLL REVEAL
  =============================== */
  var revealEls = document.querySelectorAll('.scroll-reveal, .scroll-reveal-group');

  if (revealEls.length) {
    var revealObserver = new IntersectionObserver(function(entries, obs) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(function(el) {
      revealObserver.observe(el);
    });
  }

  /* ===============================
     ARTICLES SYSTEM
  =============================== */

  var gridEl = document.getElementById('articles-grid');
  if (!gridEl) return; // 🚨 exécute seulement sur la page articles

  var articles = [
    {
      id: 'agency602',
      category: 'PRESS',
      title: 'Agency 602 Renovated – Didouche Mourad',
      excerpt: 'CAAR modernized Agency 602 in Didouche Mourad to enhance customer experience.',
      date: 'Sep 24, 2023',
      image: 'img/art1.png',
      emoji: '🏢',
      isLatest: false,
      content: '<p>Renovation completed with modern design and better service.</p>'
    },
    {
      id: 'agency228',
      category: 'PRESS',
      title: 'Agency 228 Renovated – Larbâa Nath Irathen',
      excerpt: 'Part of CAAR network modernization.',
      date: 'Sep 25, 2023',
      image: 'img/art2.png',
      emoji: '🏢',
      isLatest: false,
      content: '<p>Improved environment for customer service.</p>'
    },
    {
      id: 'bejaia',
      category: 'EVENT',
      title: 'CAAR Information Day in Béjaïa',
      excerpt: 'Event with regional partners.',
      date: 'Oct 4, 2023',
      image: 'img/art3.png',
      emoji: '📅',
      isLatest: false,
      content: '<p>Partners gathered for CAAR anniversary event.</p>'
    },
    {
      id: 'sada2025',
      category: 'PARTNERSHIP',
      title: 'CAAR at SADA 2025',
      excerpt: 'African Business Forum participation.',
      date: 'Apr 28, 2025',
      image: 'img/art4.png',
      emoji: '🤝',
      isLatest: false,
      content: '<p>Strengthened presence in Africa.</p>'
    },
    {
      id: 'tiziagri',
      category: 'EVENT',
      title: 'TIZI AGRI EXPO 2025',
      excerpt: 'Support for agriculture sector.',
      date: 'May 10, 2025',
      image: 'img/art5.png',
      emoji: '🌾',
      isLatest: true,
      content: '<p>Showcase of agricultural insurance products.</p>'
    }
  ];

  var PER_PAGE = 4;
  var currentPage = 1;
  var totalPages = Math.ceil(articles.length / PER_PAGE);

  var wrapEl       = gridEl.closest('.articles-grid-wrap');
  var paginationEl = document.getElementById('articles-pagination');
  var detailEl     = document.getElementById('article-detail');
  var listView     = document.getElementById('articles-list-view');

  /* ===============================
     RENDER ARTICLES
  =============================== */
  function renderArticles(page) {
    var start = (page - 1) * PER_PAGE;
    var pageItems = articles.slice(start, start + PER_PAGE);

    gridEl.innerHTML = pageItems.map(function(a) {
      return `
        <div class="article-card" onclick="openArticle('${a.id}')">
          <div class="article-img">
            <img src="${a.image}" alt="${a.title}">
          </div>
          <div class="article-body">
            <div class="article-meta">${a.emoji} ${a.category} • ${a.date}</div>
            <div class="article-title">${a.title}</div>
            <div class="article-excerpt">${a.excerpt}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ===============================
     PAGINATION
  =============================== */
  function renderPagination() {
    if (!paginationEl) return;

    paginationEl.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.textContent = i;
      btn.className = 'pagination-btn' + (i === currentPage ? ' active' : '');

      btn.addEventListener('click', function() {
        currentPage = i;
        renderArticles(currentPage);
        renderPagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      paginationEl.appendChild(btn);
    }
  }

  /* ===============================
     OPEN ARTICLE
  =============================== */
  window.openArticle = function(id) {
    var article = articles.find(function(a) { return a.id === id; });
    if (!article || !detailEl || !listView) return;

    detailEl.innerHTML = `
      <div class="article-detail-inner">
        <button class="back-btn" onclick="closeArticle()">← Back</button>
        <h1>${article.title}</h1>
        <div class="article-meta">${article.emoji} ${article.category} • ${article.date}</div>
        <img src="${article.image}" alt="${article.title}">
        <div class="article-content">${article.content}</div>
      </div>
    `;

    listView.style.display = 'none';
    detailEl.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ===============================
     CLOSE ARTICLE
  =============================== */
  window.closeArticle = function() {
    if (!detailEl || !listView) return;

    detailEl.style.display = 'none';
    listView.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ===============================
     INIT
  =============================== */
  renderArticles(currentPage);
  renderPagination();

});
/* =========================================
   HEADER (injecté dynamiquement)
========================================= */
(function () {
  var container = document.getElementById('site-header');
  if (!container) return; // sécurité

  container.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a href="index.html" class="logo">CAAR</a>
        <nav class="nav">
          <a href="index.html">Home</a>
          <a href="news.html">News</a>
          <a href="company.html">Company</a>
        </nav>
      </div>
    </header>
  `;
})();


/* =========================================
   SCROLL REVEAL (global safe version)
========================================= */
(function () {
  var elements = document.querySelectorAll(
    '.article-section, .article-keypoints, .scroll-reveal, .scroll-reveal-group'
  );

  if (!elements.length) return;

  var revealObserver = new IntersectionObserver(function(entries, obs) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible', 'is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  });

  elements.forEach(function(el, i) {
    el.style.transitionDelay = (i * 0.05) + 's';
    revealObserver.observe(el);
  });
})();


/* =========================================
   ADVICE SWITCH (news.html)
========================================= */
(function () {
  var firstCard = document.getElementById('advice-road');
  if (!firstCard) return; // run only on news page

  var currentAdviceKey = 'road';

  window.switchAdvice = function(key, btn) {
    if (key === currentAdviceKey) return;

    var currentCard = document.getElementById('advice-' + currentAdviceKey);
    var nextCard    = document.getElementById('advice-' + key);

    if (!currentCard || !nextCard) return; // sécurité

    // animation sortie
    currentCard.classList.add('is-leaving');
    currentCard.classList.remove('is-active');

    setTimeout(function () {
      currentCard.classList.remove('is-leaving');

      // reset boutons
      document.querySelectorAll('.advice-category-btn').forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });

      // activer bouton cliqué
      if (btn) {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
      }

      // afficher nouvelle carte
      nextCard.classList.add('is-active');
      currentAdviceKey = key;

    }, 200);
  };
})();
/* =========================================
   ARTICLES (news.html pagination + detail)
========================================= */
(function () {

  var gridEl = document.getElementById('articles-grid');
  if (!gridEl) return;

  var paginationEl = document.getElementById('articles-pagination');
  var detailEl = document.getElementById('article-detail');
  var listView = document.getElementById('articles-list-view');

  var articles = [
    {
      id: 'agency602',
      category: 'PRESS',
      title: 'Agency 602 Renovated – Didouche Mourad',
      excerpt: 'CAAR modernized Agency 602 to improve customer experience.',
      date: 'Sep 24, 2023',
      image: 'img/art1.png',
      emoji: '🏢',
      content: '<p>Renovation completed to improve services.</p>'
    },
    {
      id: 'agency228',
      category: 'PRESS',
      title: 'Agency 228 Renovated',
      excerpt: 'Modernization of Agency 228.',
      date: 'Sep 25, 2023',
      image: 'img/art2.png',
      emoji: '🏢',
      content: '<p>Better environment for customers.</p>'
    },
    {
      id: 'bejaia',
      category: 'EVENT',
      title: 'Information Day in Béjaïa',
      excerpt: 'Event with partners.',
      date: 'Oct 4, 2023',
      image: 'img/art3.png',
      emoji: '📅',
      content: '<p>CAAR met partners in Béjaïa.</p>'
    },
    {
      id: 'sada2025',
      category: 'PARTNERSHIP',
      title: 'SADA 2025 Forum',
      excerpt: 'Participation in African forum.',
      date: 'Apr 2025',
      image: 'img/art4.png',
      emoji: '🤝',
      content: '<p>International presence strengthened.</p>'
    }
  ];

  var PER_PAGE = 4;
  var currentPage = 1;

  /* ===============================
     RENDER PAGE
  =============================== */
  function renderPage(page) {
    currentPage = page;
    gridEl.innerHTML = '';

    var slice = articles.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    slice.forEach(function (art) {
      var card = document.createElement('div');
      card.className = 'article-card';

      card.innerHTML = `
        <div class="article-card__img-wrap">
          <img src="${art.image}" alt="${art.title}" class="article-card__img">
        </div>
        <div class="article-card__body">
          <span>${art.category}</span>
          <h3>${art.title}</h3>
          <p>${art.excerpt}</p>
          <button class="article-card__read-btn">Read article →</button>
        </div>
      `;

      // click bouton seulement (meilleure UX)
      var btn = card.querySelector('.article-card__read-btn');
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          openDetail(art);
        });
      }

      // click carte
      card.addEventListener('click', function () {
        openDetail(art);
      });

      gridEl.appendChild(card);
    });

    renderPagination();
  }

  /* ===============================
     PAGINATION
  =============================== */
  function renderPagination() {
    if (!paginationEl) return;

    paginationEl.innerHTML = '';

    var totalPages = Math.ceil(articles.length / PER_PAGE);

    for (let i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.textContent = i;
      btn.className = (i === currentPage) ? 'is-active' : '';

      btn.addEventListener('click', function () {
        renderPage(i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      paginationEl.appendChild(btn);
    }
  }

  /* ===============================
     DETAIL VIEW (PRO)
  =============================== */
  function openDetail(art) {
    if (!detailEl || !listView) {
      alert(art.title + "\n\n" + art.excerpt);
      return;
    }

    detailEl.innerHTML = `
      <div class="article-detail-inner">
        <button class="back-btn">← Back</button>
        <h1>${art.title}</h1>
        <div class="article-meta">${art.emoji} ${art.category} • ${art.date}</div>
        <img src="${art.image}" alt="${art.title}">
        <div class="article-content">${art.content}</div>
      </div>
    `;

    listView.style.display = 'none';
    detailEl.style.display = 'block';

    var backBtn = detailEl.querySelector('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', closeDetail);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeDetail() {
    if (!detailEl || !listView) return;

    detailEl.style.display = 'none';
    listView.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ===============================
     INIT
  =============================== */
  renderPage(1);

})();
/* ============================================================
   AGENCY DATA
   ============================================================ */
var AGENCIES = {
  '203': { name:'203 — ALGER (Belouizded)', addr:'23, Rue Mohamed Belouizded, ALGER', phone:'021 65 10 24 — 021 65 40 92', fax:'021 66 06 76' },
  '210': { name:'210 — ALGER (Kouba)',      addr:'Cité Serbat Bt A9 Garidi 1, Kouba', phone:'023 70 01 60',                  fax:'023 70 01 57' },
  '233': { name:'233 — ALGER (Ain Naadja)', addr:'Cité 1516 Logts Bt D6, Ain Naadja', phone:'023 53 00 28',                  fax:'023 53 00 27' },
  '601': { name:'601 — ALGER (El Djaouhara)',addr:'Cité El Djaouhara Bt 63, Belouizded', phone:'021 67 46 93',               fax:'021 67 46 92' },
  '602': { name:'602 — ALGER (Didouche)',   addr:'74, Rue Didouche Mourad, Alger',    phone:'023 50 49 65',                  fax:'023 50 49 90' },
};

/* ============================================================
   STATE
   ============================================================ */
var addedCoverages = { floods: false, storms: false, ground: false };
var ynState        = { commercial: 'no', notarial: 'no', seismic: 'no' };
var currentStep    = 1;
var premiumData    = { net: 0, tax: 0, total: 0 };
var countdownTimer = null;

/* ============================================================
   HEADER SEARCH
   ============================================================ */
document.getElementById('searchBtn').addEventListener('click', function() {
  document.getElementById('searchBar').classList.toggle('open');
});
document.getElementById('searchClose').addEventListener('click', function() {
  document.getElementById('searchBar').classList.remove('open');
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') document.getElementById('searchBar').classList.remove('open');
});
document.querySelectorAll('[data-lang]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('currentLang').textContent = this.getAttribute('data-lang');
  });
});

/* ============================================================
   SPINNER HELPERS
   ============================================================ */
function spinUp(id, step) {
  var el = document.getElementById(id);
  var v  = parseFloat(el.value) || 0;
  el.value = v + step;
  calculatePremium();
}
function spinDown(id, step) {
  var el  = document.getElementById(id);
  var min = parseFloat(el.min) || 0;
  var v   = parseFloat(el.value) || 0;
  el.value = Math.max(min, v - step);
  calculatePremium();
}

/* ============================================================
   YES / NO
   ============================================================ */
function setYN(key, val) {
  ynState[key] = val;
  var wrap = document.getElementById('yn-' + key);
  wrap.querySelectorAll('.yn-btn').forEach(function(b) { b.classList.remove('active'); });
  wrap.querySelector('.yn-' + val).classList.add('active');
  calculatePremium();
}

/* ============================================================
   COVERAGE TOGGLE
   ============================================================ */
function toggleCoverage(key, btn) {
  addedCoverages[key] = !addedCoverages[key];
  if (addedCoverages[key]) {
    btn.textContent = '&#10003; Added';
    btn.innerHTML   = '&#10003; Added';
    btn.classList.add('added');
  } else {
    btn.textContent = '+ Add';
    btn.classList.remove('added');
  }
  calculatePremium();
}

/* ============================================================
   PREMIUM CALCULATION — dynamic from Step 1 data
   Rates (simplified actuarial):
   - Base rate:  0.04% of declared value
   - Floods:     +0.015%
   - Storms:     +0.010%
   - Ground:     +0.012%
   - Commercial use discount/surcharge
   - Non-seismic surcharge: +10%
   - Tax: 19%
   ============================================================ */
function calculatePremium() {
  var value = parseFloat(document.getElementById('declared_value').value) || 0;
  if (value <= 0) {
    setDisplay(0, 0, 0);
    return;
  }

  var baseRate = 0.0004; // 0.04%
  var base = value * baseRate;

  // Optional coverages
  var extras = 0;
  if (addedCoverages.floods) extras += value * 0.00015;
  if (addedCoverages.storms) extras += value * 0.00010;
  if (addedCoverages.ground) extras += value * 0.00012;

  // Seismic non-compliance surcharge
  var seismicMultiplier = ynState.seismic === 'no' ? 1.10 : 1.0;

  // Commercial use surcharge
  var commercialMultiplier = ynState.commercial === 'yes' ? 1.15 : 1.0;

  var net   = (base + extras) * seismicMultiplier * commercialMultiplier;
  var tax   = net * 0.19;
  var total = net + tax;

  premiumData = { net: net, tax: tax, total: total };
  setDisplay(net, tax, total);
}

function setDisplay(net, tax, total) {
  document.getElementById('net-premium').textContent = formatDZD(net);
  document.getElementById('tax-fees').textContent    = formatDZD(tax);
  document.getElementById('total-pay').textContent   = formatDZD(total);
}

function formatDZD(n) {
  return n.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DZD';
}

/* ============================================================
   CONSTRUCTION TYPE CHANGE
   ============================================================ */
function onConstructionTypeChange() {
  calculatePremium();
}
function onWilayaChange() {
  // Could update municipality options dynamically — keeping simple for now
}

/* ============================================================
   DATE HELPERS
   ============================================================ */
function formatDate(d) {
  var dd   = String(d.getDate()).padStart(2, '0');
  var mm   = String(d.getMonth() + 1).padStart(2, '0');
  var yyyy = d.getFullYear();
  return dd + '/' + mm + '/' + yyyy;
}
function getStartDate() {
  var d = new Date();
  return d;
}
function getEndDate() {
  var d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setDate(d.getDate() - 1);
  return d;
}

/* ============================================================
   GENERATE POLICY REFERENCE
   ============================================================ */
function generatePolicyRef() {
  var now    = new Date();
  var y      = now.getFullYear();
  var m      = String(now.getMonth() + 1).padStart(2, '0');
  var d      = String(now.getDate()).padStart(2, '0');
  var rand   = Math.random().toString(36).substr(2, 4).toUpperCase();
  return 'POLA-' + y + m + d + '-' + rand;
}

/* ============================================================
   POPULATE STEP 2 SUMMARY from Step 1 data
   ============================================================ */
function populateStep2Summary() {
  var constr   = document.getElementById('construction_type').value || '—';
  var usage    = document.getElementById('usage_type').value || '—';
  var area     = document.getElementById('built_area').value;
  var year     = document.getElementById('year_construction').value;
  var dvalue   = document.getElementById('declared_value').value;
  var startD   = getStartDate();
  var endD     = getEndDate();

  // Summary sidebar
  document.getElementById('sum-constr').textContent  = constr;
  document.getElementById('sum-usage').textContent   = usage;
  document.getElementById('sum-area').textContent    = area ? area + ' m²' : '—';
  document.getElementById('sum-year').textContent    = year || '—';
  document.getElementById('sum-dvalue').textContent  = dvalue ? formatDZD(parseFloat(dvalue)) : '—';
  document.getElementById('sum-start').textContent   = formatDate(startD);
  document.getElementById('sum-end').textContent     = formatDate(endD);
  document.getElementById('sum-net').textContent     = formatDZD(premiumData.net);
  document.getElementById('sum-tax').textContent     = formatDZD(premiumData.tax);
  document.getElementById('sum-total').textContent   = formatDZD(premiumData.total);

  // Guarantees list
  var gList = document.getElementById('guarantees-list');
  var items = ['Earthquakes'];
  if (addedCoverages.floods) items.push('Floods &amp; Mudflows');
  if (addedCoverages.storms) items.push('Storms &amp; High Winds');
  if (addedCoverages.ground) items.push('Ground Movements');
  gList.innerHTML = items.map(function(i) { return '<li>' + i + '</li>'; }).join('');
}

/* ============================================================
   POPULATE REVIEW from all collected data
   ============================================================ */
function populateReview() {
  var constr  = document.getElementById('construction_type').value || '—';
  var usage   = document.getElementById('usage_type').value || '—';
  var floors  = document.getElementById('num_floors').options[document.getElementById('num_floors').selectedIndex].text;
  var area    = document.getElementById('built_area').value;
  var year    = document.getElementById('year_construction').value;
  var dvalue  = document.getElementById('declared_value').value;

  var title   = document.getElementById('title').value;
  var last    = document.getElementById('last_name').value;
  var first   = document.getElementById('first_name').value;
  var addr    = document.getElementById('address').value;
  var pol_w   = document.getElementById('policy_wilaya').options[document.getElementById('policy_wilaya').selectedIndex].text;
  var city    = document.getElementById('city').value;
  var email   = document.getElementById('email').value;
  var mob1    = document.getElementById('mobile_1').value;

  var propAddr  = document.getElementById('property_address').value;
  var propWilEl = document.getElementById('property_wilaya');
  var propWil   = propWilEl.options[propWilEl.selectedIndex].text;
  var propCity  = document.getElementById('property_city').value;

  var agencyVal = document.getElementById('agency').value;
  var agencyObj = AGENCIES[agencyVal] || {};

  var startD = getStartDate();
  var endD   = getEndDate();

  // Property
  document.getElementById('rv-constr').textContent  = constr;
  document.getElementById('rv-usage').textContent   = usage;
  document.getElementById('rv-floors').textContent  = floors;
  document.getElementById('rv-area').textContent    = area ? area + ' m²' : '—';
  document.getElementById('rv-year').textContent    = year || '—';
  document.getElementById('rv-dvalue').textContent  = dvalue ? formatDZD(parseFloat(dvalue)) : '—';

  // Policyholder
  document.getElementById('rv-name').textContent   = (title + ' ' + last + ' ' + first).trim() || '—';
  document.getElementById('rv-wilaya').textContent = pol_w;
  document.getElementById('rv-addr').textContent   = addr || '—';
  document.getElementById('rv-phone').textContent  = mob1 || '—';
  document.getElementById('rv-email').textContent  = email || '—';

  // Property location
  document.getElementById('rv-prop-addr').textContent  = propAddr || '—';
  document.getElementById('rv-prop-wilaya').textContent = propWil;
  document.getElementById('rv-prop-city').textContent   = propCity || '—';

  // Agency
  document.getElementById('rv-agency').textContent      = agencyObj.name || '—';
  document.getElementById('rv-agency-addr').textContent = agencyObj.addr || '—';

  // Contract & Pricing
  document.getElementById('rv-start').textContent = formatDate(startD);
  document.getElementById('rv-end').textContent   = formatDate(endD);
  document.getElementById('rv-net').textContent   = formatDZD(premiumData.net);
  document.getElementById('rv-tax').textContent   = formatDZD(premiumData.tax);
  document.getElementById('rv-total').textContent = formatDZD(premiumData.total);
}

/* ============================================================
   POPULATE PAYMENT from collected data
   ============================================================ */
function populatePayment() {
  document.getElementById('pay-amount').textContent = formatDZD(premiumData.total);
  document.getElementById('pay-ref').textContent    = 'New Contract — CATNAT';
  startCountdown(300); // 5 minutes
}

/* ============================================================
   COUNTDOWN TIMER
   ============================================================ */
function startCountdown(seconds) {
  clearInterval(countdownTimer);
  var remaining = seconds;
  function tick() {
    var m = Math.floor(remaining / 60);
    var s = remaining % 60;
    var el = document.getElementById('countdown');
    if (el) el.textContent = m + ':' + String(s).padStart(2, '0');
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      if (el) el.textContent = '0:00';
    }
    remaining--;
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* ============================================================
   AGENCY CARD UPDATE
   ============================================================ */
function updateAgencyCard() {
  var val = document.getElementById('agency').value;
  var ag  = AGENCIES[val];
  if (!ag) return;
  document.getElementById('agency-card-name').textContent  = 'Agency ' + ag.name;
  document.getElementById('agency-card-addr').textContent  = ag.addr;
  document.getElementById('agency-card-phone').textContent = ag.phone;
  document.getElementById('agency-card-fax').textContent   = 'Fax: ' + ag.fax;
}
function updateAgencyList() {
  // In a real app, filter by wilaya. Here we show all.
  updateAgencyCard();
}

/* ============================================================
   STEP NAVIGATION
============================================================ */
function goToStep(n) {
  if (n < 1 || n > 4) return;

  // Validation
  if (currentStep === 1 && n === 2) {
    if (!validateStep1()) return;
    populateStep2Summary();
  }
  if (currentStep === 2 && n === 3) {
    if (!validateStep2()) return;
    populatePayment();
  }

  var currentEl = document.getElementById('form-step-' + currentStep);
  if (currentEl) currentEl.classList.add('hidden');

  currentStep = n;

  var nextEl = document.getElementById('form-step-' + currentStep);
  if (nextEl) nextEl.classList.remove('hidden');

  // Indicators
  for (var i = 1; i <= 4; i++) {
    var ind = document.getElementById('step-indicator-' + i);
    if (!ind) continue;

    ind.classList.remove('active', 'done');

    if (i < currentStep) ind.classList.add('done');
    else if (i === currentStep) ind.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   VALIDATION
============================================================ */
function validateStep1() {
  var year  = parseInt(document.getElementById('year_construction')?.value);
  var area  = parseFloat(document.getElementById('built_area')?.value);
  var value = parseFloat(document.getElementById('declared_value')?.value);
  var terms = document.getElementById('terms-consent')?.checked;

  if (!year || year < 1900 || year > new Date().getFullYear()) {
    alert('Please enter a valid year of construction.');
    return false;
  }
  if (!area || area <= 0) {
    alert('Please enter the total built area in m².');
    return false;
  }
  if (!value || value <= 0) {
    alert('Please enter the declared value.');
    return false;
  }
  if (!terms) {
    alert('Please accept the general terms.');
    return false;
  }

  return true;
}

function validateStep2() {
  var last  = document.getElementById('last_name')?.value.trim() || '';
  var first = document.getElementById('first_name')?.value.trim() || '';
  var email = document.getElementById('email')?.value.trim() || '';
  var conf  = document.getElementById('confirm_email')?.value.trim() || '';
  var mob1  = document.getElementById('mobile_1')?.value.trim() || '';
  var addr  = document.getElementById('address')?.value.trim() || '';
  var paddr = document.getElementById('property_address')?.value.trim() || '';

  if (!last || !first) { alert('Enter full name'); return false; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { alert('Invalid email'); return false; }
  if (email !== conf) { alert('Emails do not match'); return false; }
  if (!mob1) { alert('Enter mobile number'); return false; }
  if (!addr) { alert('Enter address'); return false; }
  if (!paddr) { alert('Enter property address'); return false; }

  return true;
}

function validateReview() {
  if (!document.getElementById('confirm-info')?.checked) {
    alert('Please confirm info.');
    return false;
  }
  if (!document.getElementById('confirm-terms')?.checked) {
    alert('Please accept terms.');
    return false;
  }
  return true;
}

/* ============================================================
   REVIEW SWITCH
============================================================ */
function showReviewView() {
  if (!validateStep2()) return;

  populateReview();

  var form = document.getElementById('subscription-form-view');
  var rev  = document.getElementById('subscription-review-view');

  if (form) form.classList.add('hidden');
  if (rev)  rev.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSubscriptionForm() {
  var form = document.getElementById('subscription-form-view');
  var rev  = document.getElementById('subscription-review-view');

  if (rev)  rev.classList.add('hidden');
  if (form) form.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================
   PAYMENT
============================================================ */
function validatePayment() {
  var card = document.getElementById('card_number')?.value.replace(/\s/g, '') || '';
  var cvv  = document.getElementById('cvv2')?.value.trim() || '';
  var name = document.getElementById('cardholder_name')?.value.trim() || '';
  var month = document.getElementById('expiry_month')?.value;
  var year  = document.getElementById('expiry_year')?.value;

  if (card.length !== 16) return alert('Invalid card number');
  if (cvv.length < 3)     return alert('Invalid CVV');
  if (!month || !year)    return alert('Select expiry date');
  if (!name)              return alert('Enter cardholder name');

  clearInterval(countdownTimer);
  populateConfirmation();
  goToStep(4);
}

function formatCardNumber(input) {
  var val = input.value.replace(/\D/g, '').slice(0, 16);
  input.value = val.match(/.{1,4}/g)?.join(' ') || val;
}

/* ============================================================
   CONFIRMATION
============================================================ */
function populateConfirmation() {
  var ref = generatePolicyRef();
  var startD = getStartDate();
  var endD   = getEndDate();

  var agencyVal = document.getElementById('agency')?.value;
  var agencyObj = AGENCIES[agencyVal] || {};

  var elRef  = document.getElementById('confirm-policy-ref');
  var elDate = document.getElementById('confirm-dates');
  var elAmt  = document.getElementById('confirm-amount');
  var elMsg  = document.getElementById('confirm-agency-msg');

  if (elRef)  elRef.textContent  = ref;
  if (elDate) elDate.textContent = 'Issued: ' + formatDate(startD) + ' · Valid until: ' + formatDate(endD);
  if (elAmt)  elAmt.textContent  = formatDZD(premiumData.total);
  if (elMsg)  elMsg.textContent  =
    'Agency ' + (agencyObj.name || '') + ' will contact you within 48h.';
}

/* ============================================================
   INIT (SAFE)
============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof updateAgencyCard === 'function') updateAgencyCard();
  if (typeof calculatePremium === 'function') calculatePremium();
});
/* Init tabs */
/* ============================================================
   INIT COMPANY TABS
============================================================ */
function initCompanyTabs() {
  var panes = document.querySelectorAll('.tab-pane');
  if (!panes.length) return;

  panes.forEach(function (el) {
    el.style.display = 'none';
  });

  var first = document.getElementById('tab-overview');
  if (first) {
    first.style.display = 'block';
    first.classList.add('active');
  }
}

/* ============================================================
   LEADERSHIP TOGGLE
============================================================ */
window.toggleFullMessage = function () {
  var preview = document.getElementById('ld-preview');
  var full    = document.getElementById('ld-full-message');
  var readBtn = document.getElementById('ld-read-btn');

  if (!preview || !full || !readBtn) return;

  var isOpen = full.classList.contains('open');

  if (isOpen) {
    full.classList.remove('open');
    full.style.display = 'none';
    preview.style.display = '';
    readBtn.style.display = '';
  } else {
    full.classList.add('open');
    full.style.display = 'block';
    preview.style.display = 'none';
    readBtn.style.display = 'none';
  }
};

function resetLeadership() {
  var preview = document.getElementById('ld-preview');
  var full    = document.getElementById('ld-full-message');
  var readBtn = document.getElementById('ld-read-btn');

  if (!preview || !full || !readBtn) return;

  preview.style.display = '';
  full.classList.remove('open');
  full.style.display = 'none';
  readBtn.style.display = '';
}

initCompanyTabs();

/* ============================================================
   SUBSCRIPTION PAGE (FIXED VERSION)
============================================================ */
function initSubscription() {

  if (!document.getElementById('form-step-1')) return;

  var selectedPlan  = null;
  var selectedPrice = 0;
  var stepSub       = 1; // ✅ renommé pour éviter conflit
  var countdownTimerSub = null;

  /* PLAN */
  window.selectPlan = function(name, price) {
    selectedPlan  = name;
    selectedPrice = price;

    ['basic','plus','premium'].forEach(function(p) {
      var el = document.getElementById('plan-' + p);
      if (el) el.classList.remove('selected');

      var radio = document.querySelector('#plan-' + p + ' input[type="radio"]');
      if (radio) radio.checked = false;
    });

    var card = document.getElementById('plan-' + name.toLowerCase());
    if (card) {
      card.classList.add('selected');
      var radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    }

    updateSummary();
  };

  function formatDZDSub(n) {
    return n.toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) + ' DZD';
  }

  function updateSummary() {
    var planNameEl = document.getElementById('sum-plan-name');
    if (!planNameEl) return;

    var annualEl = document.getElementById('sum-annual');
    var totalEl  = document.getElementById('sum-total-step1');

    if (selectedPlan) {
      planNameEl.textContent = selectedPlan;
      annualEl.textContent   = formatDZDSub(selectedPrice);
      totalEl.textContent    = formatDZDSub(selectedPrice);
    } else {
      planNameEl.textContent = '— Select a plan above —';
    }
  }

  /* STEP NAV */
  window.goToStepSub = function(n) {
    if (n < 1 || n > 4) return;

    document.getElementById('form-step-' + stepSub)?.classList.add('hidden');
    stepSub = n;
    document.getElementById('form-step-' + stepSub)?.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* VALIDATION */
  function validateStep1Sub() {
    var plate = document.getElementById('license_plate')?.value.trim();

    if (!plate) {
      alert('Please enter your license plate number.');
      return false;
    }
    if (!selectedPlan) {
      alert('Please select a plan.');
      return false;
    }
    return true;
  }

  function validateStep2Sub() {
    var email = document.getElementById('email')?.value.trim();
    var conf  = document.getElementById('confirm_email')?.value.trim();

    if (!email) {
      alert('Enter email');
      return false;
    }
    if (email !== conf) {
      alert('Emails do not match');
      return false;
    }
    return true;
  }

  /* PAYMENT */
  window.validatePaymentSub = function() {
    var card = document.getElementById('card_number')?.value.replace(/\s/g,'');

    if (!card || card.length < 16) {
      alert('Invalid card');
      return;
    }

    goToStepSub(4);
  };

  /* INIT DEFAULT PLAN */
  window.selectPlan('Plus', 7900);
}

initSubscription();

/* ============================================================
   INSURANCE SIDEBAR (FIXED)
============================================================ */
function initInsuranceSidebar() {

  if (!document.getElementById('d-cpm')) return;

  var ids = ['cpm', 'it', 'car'];

  var labels = {
    'cpm': "Contractors' Plant & Machinery",
    'it':  'IT All Risks Insurance',
    'car': 'Construction & Erection All Risks'
  };

  window.showInsurance = function (k, btn) {

    ids.forEach(function(i) {
      var el = document.getElementById('d-' + i);
      if (el) el.classList.remove('on');
    });

    document.querySelectorAll('.sidebar-btn').forEach(function(b) {
      b.classList.remove('active');
    });

    var target = document.getElementById('d-' + k);
    if (target) target.classList.add('on');

    if (btn) btn.classList.add('active');

    var bc = document.getElementById('bc');
    if (bc && labels[k]) {
      bc.textContent = labels[k];
    }
  };
}

initInsuranceSidebar();