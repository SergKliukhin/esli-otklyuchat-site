(function () {
  'use strict';

  var PUBLIC_BASE = 'https://sergkliukhin.github.io/esli-otklyuchat-site/';

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

  function pageName() {
    var name = location.pathname.split('/').pop();
    return name || 'index.html';
  }

  function setMeta(property, content) {
    var selector = 'meta[property="' + property + '"]';
    var meta = document.querySelector(selector);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  function setNamedMeta(name, content) {
    var meta = document.querySelector('meta[name="' + name + '"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }

  function initPublicMetadata() {
    var page = pageName();
    var canonicalUrl = page === 'index.html' ? PUBLIC_BASE : PUBLIC_BASE + page;
    var descriptionNode = document.querySelector('meta[name="description"]');
    var description = descriptionNode ? descriptionNode.getAttribute('content') : '';

    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    if (!document.querySelector('link[rel="icon"]')) {
      var icon = document.createElement('link');
      icon.rel = 'icon';
      icon.href = 'icon.svg';
      icon.type = 'image/svg+xml';
      document.head.appendChild(icon);
    }

    setMeta('og:type', 'website');
    setMeta('og:title', document.title);
    setMeta('og:url', canonicalUrl);
    if (description) setMeta('og:description', description);
    setNamedMeta('twitter:card', 'summary');
  }

  function initPrivacyLink() {
    var footer = document.querySelector('.site-footer .container');
    if (!footer || footer.querySelector('.footer-legal')) return;
    var line = document.createElement('p');
    line.className = 'footer-legal';
    line.innerHTML = '<a href="privacy.html">Конфиденциальность</a>';
    footer.appendChild(line);
  }

  function findCard(sectionSelector, heading) {
    return Array.prototype.slice.call(document.querySelectorAll(sectionSelector + ' .card')).find(function (card) {
      var h3 = card.querySelector('h3');
      return h3 && h3.textContent.trim() === heading;
    });
  }

  function setCardText(sectionSelector, heading, text) {
    var card = findCard(sectionSelector, heading);
    var p = card && card.querySelector('p');
    if (p) p.textContent = text;
  }

  function setStepText(sectionSelector, heading, text) {
    Array.prototype.slice.call(document.querySelectorAll(sectionSelector + ' .steps li')).forEach(function (item) {
      var h3 = item.querySelector('h3');
      var p = item.querySelector('p');
      if (h3 && p && h3.textContent.trim() === heading) p.textContent = text;
    });
  }

  function addNoteOnce(container, text, key) {
    if (!container || document.querySelector('[data-launch-note="' + key + '"]')) return;
    var note = document.createElement('p');
    note.className = 'note';
    note.setAttribute('data-launch-note', key);
    note.textContent = text;
    container.appendChild(note);
  }

  function patchIndex() {
    if (pageName() !== 'index.html') return;

    setCardText('#what', 'Интернет и связь', 'При сбое сети могут стать временно недоступны мессенджеры, банковские приложения, онлайн-карты, навигация и облачные сервисы. Мобильная связь тоже может работать нестабильно.');
    setCardText('#what', 'Платёжные системы', 'Терминалы и банкоматы зависят от связи и электричества. Поэтому полезно заранее иметь резервный способ оплаты.');
    setCardText('#prepare', 'Вода и еда', 'Для аварийного питьевого запаса ориентируйтесь примерно на 3 л воды на человека в сутки; для приготовления пищи и гигиены потребуется дополнительная вода. Храните нескоропортящиеся продукты и регулярно обновляйте запас.');
    setCardText('#prepare', 'Питание и свет', 'Основной резерв света — фонарики и запас батареек. Держите заряженные повербанки. Свечи используйте только как дополнительный вариант с соблюдением пожарной безопасности; портативные газовые горелки — только на открытом воздухе и по инструкции.');
    setCardText('#prepare', 'Наличные', 'Небольшой резерв наличных мелкими и средними купюрами может помочь, если эквайринг или банкоматы временно недоступны.');
    setCardText('#prepare', 'Аптечка и лекарства', 'Домашняя аптечка, расходные материалы и запас необходимых препаратов, назначенных врачом, с учётом условий хранения и правил отпуска.');
    setCardText('#business', 'Резервное питание', 'ИБП, инвертор или другой резерв подбирайте по мощности и пусковым токам критичных устройств. Генератор при необходимости размещают вне помещений и эксплуатируют строго по инструкции.');
    setCardText('#business', 'Приём оплаты', 'Продумайте резерв при сбое эквайринга. При расчётах соблюдайте требования к применению ККТ: отсутствие интернета само по себе не отменяет формирование кассового чека.');
    setStepText('#family', 'Ближайшая помощь', 'Заранее знайте адреса ближайших больниц и аптек, а также официальные каналы, где при чрезвычайной ситуации публикуют адреса пунктов обогрева или временного размещения.');

    var businessIntro = document.querySelector('#business .section-intro');
    if (businessIntro) businessIntro.textContent = 'Цель — пережить перебой без потери данных, клиентов и доверия. Один из полезных показателей готовности — сколько часов критичные процессы способны работать автономно.';

    addNoteOnce(document.querySelector('#prepare .container'), 'Безопасность важнее автономности: не используйте переносные генераторы или походные газовые горелки в жилых, гаражных и других закрытых помещениях. Всегда следуйте инструкции производителя и правилам пожарной безопасности.', 'fuel-safety');
  }

  function setCheckLabel(id, text) {
    var input = document.getElementById(id);
    var label = input && input.closest('.check-item');
    var span = label && label.querySelector('.check-label');
    if (span) span.textContent = text;
  }

  function patchChecklist() {
    if (pageName() !== 'checklist.html') return;
    setCheckLabel('base-candles', 'Свечи — только дополнительный резерв света; использовать под постоянным присмотром');
    setCheckLabel('base-stove', 'Портативная газовая горелка — только для использования на открытом воздухе по инструкции');
    setCheckLabel('base-meds', 'Запас необходимых назначенных врачом лекарств с учётом правил отпуска и хранения');
    setCheckLabel('family-warm', 'Известно, где проверять официальные адреса пунктов обогрева или временного размещения при их открытии');
    setCheckLabel('business-ups', 'Резервное питание критичных систем подобрано по мощности и пусковым токам');
    setCheckLabel('business-gen', 'Генератор при необходимости — с безопасным размещением вне помещений по инструкции');
    setCheckLabel('business-keys', 'Защищённая офлайн-копия ключей доступа и паролей');
    setCheckLabel('business-cash', 'Продуман приём наличных и законный учёт продаж при сбое эквайринга');
  }

  function patchResources() {
    if (pageName() !== 'resources.html') return;

    var targets = {
      'Запасные каналы связи': 'index.html#family',
      'Повербанки и зарядка': 'checklist.html#base-powerbank',
      'Запас питьевой воды': 'checklist.html#base-water',
      'Аптечка первой помощи': 'checklist.html#base-firstaid',
      'Офлайн-карты': 'checklist.html#family-maps',
      'Бумажные копии документов': 'checklist.html#base-docs',
      'Финансовая подушка': 'checklist.html#business-cushion',
      'Газовая горелка и баллоны': 'checklist.html#base-stove',
      'Точка сбора семьи': 'checklist.html#family-home-point',
      'Печать контактов': 'checklist.html#base-contacts',
      'ИБП для дома и офиса': 'checklist.html#business-ups',
      'Чек-лист готовности': 'checklist.html'
    };

    Array.prototype.slice.call(document.querySelectorAll('.card.resource')).forEach(function (card) {
      var titleLink = card.querySelector('h3 a');
      var moreLink = card.querySelector('.card-link');
      var title = titleLink ? titleLink.textContent.trim() : '';
      if (targets[title]) {
        titleLink.href = targets[title];
        if (moreLink) moreLink.href = targets[title];
      }

      var desc = card.querySelector('.card-desc');
      if (!desc) return;
      if (title === 'Запасные каналы связи') {
        desc.textContent = 'Дублирующие способы связи: второй оператор или eSIM в другой сети, SMS при недоступности мобильного интернета и заранее согласованные точки встречи.';
      }
      if (title === 'Аптечка первой помощи') {
        desc.textContent = 'Базовая аптечка, расходные материалы и необходимые препараты, назначенные врачом. Учитывайте сроки годности, условия хранения и правила отпуска.';
      }
      if (title === 'Газовая горелка и баллоны') {
        desc.textContent = 'Резерв для приготовления пищи без электричества. Походную газовую горелку используют только на открытом воздухе и строго по инструкции; баллоны хранят с соблюдением требований производителя.';
      }
      if (title === 'ИБП для дома и офиса') {
        desc.textContent = 'Резервное питание подбирают под фактическую мощность и пусковые токи устройств. Для роутера, сервера и холодильного оборудования требования могут заметно различаться.';
      }
    });
  }

  function patchAbout() {
    if (pageName() !== 'about.html') return;

    Array.prototype.slice.call(document.querySelectorAll('.steps li')).forEach(function (item) {
      var h3 = item.querySelector('h3');
      var p = item.querySelector('p');
      if (!h3 || !p) return;
      if (h3.textContent.trim() === 'Практичность') {
        p.textContent = 'Большинство базовых советов можно выполнить без специальных знаний и больших бюджетов; для сложного оборудования мы рекомендуем следовать документации и привлекать специалистов.';
      }
      if (h3.textContent.trim() === 'Достоверность') {
        p.textContent = 'Рекомендации сверяются с официальными правилами безопасности, эксплуатационными требованиями и действующими нормами. Спорные советы уточняются по первичным источникам.';
      }
      if (h3.textContent.trim() === 'Локальная независимость') {
        p.textContent = 'После первого успешного открытия основные страницы сохраняются для офлайн-доступа в поддерживаемом браузере. Проект не зависит от внешних библиотек и аналитики.';
      }
    });

    var role = document.querySelector('.profile-role');
    if (role) role.textContent = 'Медиолог. Социальный психолог. Автор проекта «ЕСЛИ ОТКЛЮЧАТ»';
  }

  function updateAuditCard(id, title, recommendation) {
    var card = document.querySelector('.audit-q[data-q="' + id + '"]');
    if (!card) return;
    if (recommendation) card.setAttribute('data-rec', recommendation);
    var titleNode = card.querySelector('.q-title');
    if (titleNode && title) titleNode.textContent = title;
  }

  function replaceTextNodes(root, replacements) {
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var value = node.nodeValue;
      replacements.forEach(function (pair) {
        if (value.indexOf(pair[0]) !== -1) value = value.split(pair[0]).join(pair[1]);
      });
      node.nodeValue = value;
    }
  }

  function cleanVisibleText(root) {
    if (!root) return '';
    var clone = root.cloneNode(true);
    Array.prototype.slice.call(clone.querySelectorAll('button, .plan-actions, .plan-btn')).forEach(function (node) { node.remove(); });
    return (clone.innerText || clone.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  }

  function copyText(text, button) {
    function done() {
      if (!button) return;
      var old = button.textContent;
      button.textContent = 'Скопировано';
      setTimeout(function () { button.textContent = old; }, 1500);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {});
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    ta.remove();
  }

  function interceptAuditCopyButtons() {
    if (pageName() !== 'audit.html') return;
    document.addEventListener('click', function (event) {
      var button = event.target.closest('#copyPlanBtn, #copyTop5Btn');
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      var isPlan = button.id === 'copyPlanBtn';
      var root = document.getElementById(isPlan ? 'planBody' : 'top5Body');
      var title = isPlan ? 'МОЙ ПЛАН Б' : 'МОИ 5 ПЕРВЫХ ДЕЙСТВИЙ';
      copyText(title + '\n\n' + cleanVisibleText(root) + '\n\n— Сформировано на сайте «ЕСЛИ ОТКЛЮЧАТ»', button);
    }, true);
  }

  function patchAudit() {
    if (pageName() !== 'audit.html') return;

    updateAuditCard('4', 'Есть фонарики; свечи, если используются, хранятся как дополнительный резерв.', 'Используйте фонарики как основной резерв света. Свечи держите только как дополнительный вариант и не оставляйте открытый огонь без присмотра.');
    updateAuditCard('5', 'Есть безопасный резервный способ приготовить пищу без электричества.', 'Если используете портативную газовую горелку, применяйте её только на открытом воздухе и строго по инструкции производителя.');
    updateAuditCard('6', 'Резервное питание критичных устройств подобрано по мощности и пусковым токам.', 'Подберите ИБП или другое резервное питание под фактическую мощность и пусковые токи устройств; для генератора заранее определите безопасное размещение вне помещений.');
    updateAuditCard('7', 'Дома есть разумный резерв наличных мелкими и средними купюрами.', 'Держите разумный резерв наличных мелкими и средними купюрами на случай временной недоступности эквайринга или банкоматов.');
    updateAuditCard('8', 'Есть аптечка и запас необходимых назначенных врачом лекарств.', 'Соберите аптечку и запас необходимых препаратов, назначенных врачом, с учётом сроков годности, условий хранения и правил отпуска.');
    updateAuditCard('14', 'Есть дублирующий заранее проверенный канал связи.', 'Добавьте дублирующий канал связи: например, второго оператора или другой заранее проверенный способ связи.');
    updateAuditCard('16', 'Есть защищённая офлайн-копия ключей доступа и паролей.', 'Храните защищённую офлайн-копию ключей и паролей: в офлайн-менеджере с шифрованием или на бумаге в физически защищённом месте.');

    var replacements = [
      ['Портативная газовая горелка с запасом баллонов позволит готовить и кипятить воду без электричества.', 'Если используете портативную газовую горелку, применяйте её только на открытом воздухе и строго по инструкции производителя.'],
      ['Приобретите портативную газовую горелку с запасом баллонов.', 'Подготовьте безопасный резервный способ приготовления пищи; портативную газовую горелку используйте только на открытом воздухе по инструкции.'],
      ['Пополните запас баллонов для горелки.', 'Проверьте запас топлива и правила безопасного уличного использования горелки.'],
      ['Подготовьте ИБП для критичных устройств (роутер, холодильник).', 'Подберите резервное питание критичных устройств по мощности и пусковым токам.'],
      ['Держите дома наличные мелкими и средними купюрами — при сбое терминалов это единственный способ оплаты.', 'Держите разумный резерв наличных на случай временной недоступности эквайринга или банкоматов.'],
      ['Соберите домашнюю аптечку и запас необходимых лекарств.', 'Соберите аптечку и запас назначенных врачом лекарств с учётом правил отпуска и хранения.'],
      ['Подключите дублирующий канал связи (второй оператор, рация).', 'Подключите дублирующий заранее проверенный канал связи, например второго оператора.'],
      ['Сохраните ключи доступа и пароли в офлайн-виде.', 'Сделайте защищённую офлайн-копию ключей доступа и паролей.']
    ];

    var targets = ['recContainer', 'top5Body', 'planBody'];
    targets.forEach(function (id) {
      var root = document.getElementById(id);
      if (!root) return;
      var apply = function () { replaceTextNodes(root, replacements); };
      apply();
      new MutationObserver(apply).observe(root, { childList: true, subtree: true });
    });
  }

  initMobileMenu();
  initPwa();
  initContactLinks();
  initPublicMetadata();
  initPrivacyLink();
  patchIndex();
  patchChecklist();
  patchResources();
  patchAbout();
  patchAudit();
  interceptAuditCopyButtons();
})();
