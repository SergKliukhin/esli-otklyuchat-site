(function () {
  'use strict';

  function initMobileMenu() {
    var header = document.querySelector('.site-header');
    var nav = document.querySelector('.main-nav');
    if (!header || !nav || header.querySelector('.menu-toggle')) return;

    if (!nav.id) nav.id = 'mainNav';
    var button = document.createElement('button');
    button.className = 'menu-toggle';
    button.type = 'button';
    button.setAttribute('aria-controls', nav.id);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Открыть меню');
    button.innerHTML = '<span></span><span></span><span></span>';
    header.querySelector('.header-inner').appendChild(button);

    function setOpen(open) {
      document.body.classList.toggle('nav-open', open);
      nav.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    }

    button.addEventListener('click', function () {
      setOpen(button.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setOpen(false);
    });

    document.addEventListener('click', function (event) {
      if (button.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setOpen(false);
    });
  }

  function initPwa() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('./service-worker.js').catch(function () {});
      });
    }
  }

  function initContactLinks() {
    document.querySelectorAll('[data-contact-email]').forEach(function (link) {
      var email = link.getAttribute('data-contact-email');
      var subject = link.getAttribute('data-contact-subject') || 'ЕСЛИ ОТКЛЮЧАТ – обратная связь';
      link.setAttribute('href', 'mailto:' + email + '?subject=' + encodeURIComponent(subject));
    });
  }

  initMobileMenu();
  initPwa();
  initContactLinks();
})();
