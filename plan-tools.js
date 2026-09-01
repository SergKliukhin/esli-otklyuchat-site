(function () {
  'use strict';

  var AUDIT_KEY = 'esli_otkluchat_audit_v1';
  var CHECKLIST_KEY = 'esli_otkluchat_checklist_v1';
  var FORMAT = 'esli-otklyuchat-plan-b';
  var VERSION = 1;
  var FEEDBACK_EMAIL = 'iot37@yandex.ru';

  var ACTION_TARGETS = {
    '1': 'base-water',
    '2': 'base-food',
    '3': 'base-powerbank',
    '4': 'base-flashlight',
    '5': 'base-stove',
    '6': 'business-ups',
    '7': 'base-cash',
    '8': 'base-firstaid',
    '9': 'base-docs',
    '10': 'base-contacts',
    '11': 'family-home-point',
    '12': 'family-relay',
    '13': 'family-maps',
    '14': 'business-team-comms',
    '15': 'business-backup',
    '16': 'business-keys',
    '17': 'business-critical',
    '18': 'business-roles',
    '19': 'business-cushion',
    '20': 'family-discuss'
  };

  function readJson(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, value) {
    if (value === null || typeof value === 'undefined') {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  function exportPlan() {
    var payload = {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      audit: readJson(AUDIT_KEY),
      checklist: readJson(CHECKLIST_KEY)
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'moy-plan-b-' + stamp + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importPlan(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var data;
      try {
        data = JSON.parse(reader.result);
      } catch (e) {
        alert('Не удалось прочитать файл: это не корректный JSON.');
        return;
      }
      if (!data || data.format !== FORMAT || data.version !== VERSION) {
        alert('Файл не является совместимым экспортом «Мой План Б».');
        return;
      }
      if (!confirm('Импорт заменит текущие результаты аудита и отметки чек-листа. Продолжить?')) return;
      try {
        writeJson(AUDIT_KEY, data.audit || null);
        writeJson(CHECKLIST_KEY, data.checklist || null);
        alert('«Мой План Б» восстановлен. Страница будет обновлена.');
        location.reload();
      } catch (e) {
        alert('Не удалось сохранить импортированные данные в браузере.');
      }
    };
    reader.onerror = function () { alert('Не удалось прочитать выбранный файл.'); };
    reader.readAsText(file, 'utf-8');
  }

  function injectPlanTools() {
    var page = location.pathname.split('/').pop() || 'index.html';
    if (page !== 'audit.html' && page !== 'checklist.html') return;
    var note = document.querySelector('.note');
    if (!note || document.getElementById('planDataTools')) return;

    var box = document.createElement('div');
    box.id = 'planDataTools';
    box.className = 'progress-card plan-data-card';
    box.innerHTML =
      '<div class="progress-info">' +
        '<h3>Мой План Б</h3>' +
        '<p class="progress-stats">Сохраните результаты аудита и чек-лист одним файлом. Его можно перенести на другой компьютер или восстановить после очистки браузера.</p>' +
      '</div>' +
      '<div class="plan-tools">' +
        '<button type="button" class="btn btn-primary" id="exportPlanBtn">Экспорт JSON</button>' +
        '<label class="btn btn-ghost" for="importPlanInput">Импорт JSON</label>' +
        '<input type="file" id="importPlanInput" accept="application/json,.json" hidden>' +
      '</div>';
    note.insertAdjacentElement('afterend', box);

    document.getElementById('exportPlanBtn').addEventListener('click', exportPlan);
    document.getElementById('importPlanInput').addEventListener('change', function () {
      if (this.files && this.files[0]) importPlan(this.files[0]);
      this.value = '';
    });
  }

  function injectAuditCategoryProfile() {
    var scoreCard = document.querySelector('.audit-score-card');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.audit-q[data-cat]'));
    if (!scoreCard || !cards.length || document.getElementById('categoryProfileSection')) return;

    var scoreSection = scoreCard.closest('.section');
    if (!scoreSection || !scoreSection.parentNode) return;

    var section = document.createElement('section');
    section.className = 'section category-profile-section';
    section.id = 'categoryProfileSection';
    section.hidden = true;
    section.setAttribute('aria-live', 'polite');
    section.innerHTML =
      '<div class="container">' +
        '<header class="section-head">' +
          '<span class="section-tag">Профиль устойчивости</span>' +
          '<h2>Сильные и слабые зоны</h2>' +
          '<p class="section-intro">Сравнение готовности по категориям аудита. Сначала показаны зоны, которые требуют большего внимания.</p>' +
        '</header>' +
        '<div class="category-profile-summary" id="categoryProfileSummary"></div>' +
        '<div class="category-profile-list" id="categoryProfileList"></div>' +
        '<p class="category-profile-note">Процент показывает долю готовности по вашим ответам внутри категории. Это не прогноз вероятности отключения или чрезвычайной ситуации.</p>' +
      '</div>';
    scoreSection.parentNode.insertBefore(section, scoreSection.nextSibling);

    var summary = document.getElementById('categoryProfileSummary');
    var list = document.getElementById('categoryProfileList');
    var WEIGHTS = { 'да': 1, 'частично': 0.5, 'нет': 0 };

    function escapeText(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function selectedValue(card) {
      var pressed = card.querySelector('.q-opt[aria-pressed="true"]');
      return pressed ? pressed.getAttribute('data-value') : null;
    }

    function bandFor(score) {
      if (score <= 40) return { key: 'weak', label: 'Слабая зона' };
      if (score <= 75) return { key: 'watch', label: 'Требует внимания' };
      return { key: 'strong', label: 'Сильная зона' };
    }

    function formatNames(names) {
      if (names.length <= 3) return names.join(', ');
      return names.slice(0, 3).join(', ') + ' и ещё ' + (names.length - 3);
    }

    function renderProfile() {
      var answered = 0;
      var categories = {};
      var order = 0;

      cards.forEach(function (card) {
        var name = card.getAttribute('data-cat') || 'Прочее';
        if (!categories[name]) {
          categories[name] = {
            name: name,
            order: order++,
            sum: 0,
            total: 0,
            yes: 0,
            partial: 0,
            no: 0
          };
        }

        var category = categories[name];
        var value = selectedValue(card);
        category.total += 1;
        if (!value) return;

        answered += 1;
        category.sum += WEIGHTS.hasOwnProperty(value) ? WEIGHTS[value] : 0;
        if (value === 'да') category.yes += 1;
        if (value === 'частично') category.partial += 1;
        if (value === 'нет') category.no += 1;
      });

      if (answered !== cards.length) {
        section.hidden = true;
        summary.innerHTML = '';
        list.innerHTML = '';
        return;
      }

      var rows = Object.keys(categories).map(function (name) {
        var item = categories[name];
        item.score = item.total ? Math.round(item.sum / item.total * 100) : 0;
        item.band = bandFor(item.score);
        return item;
      });

      rows.sort(function (a, b) {
        if (a.score !== b.score) return a.score - b.score;
        return a.order - b.order;
      });

      section.hidden = false;

      var weakest = rows[0].score;
      var strongest = rows[rows.length - 1].score;
      if (weakest === strongest) {
        summary.innerHTML = '<strong>Все категории сейчас на одном уровне:</strong> ' + weakest + '%.';
      } else {
        var weakNames = rows.filter(function (row) { return row.score === weakest; }).map(function (row) { return row.name; });
        var strongNames = rows.filter(function (row) { return row.score === strongest; }).map(function (row) { return row.name; });
        summary.innerHTML = '<strong>Приоритет для улучшения:</strong> ' + escapeText(formatNames(weakNames)) +
          '. <strong>Сильнее всего:</strong> ' + escapeText(formatNames(strongNames)) + '.';
      }

      var html = '';
      rows.forEach(function (row) {
        html += '<div class="category-profile-row is-' + row.band.key + '">';
        html += '<div class="category-profile-head"><span class="category-profile-name">' + escapeText(row.name) +
          '</span><strong class="category-profile-score">' + row.score + '%</strong></div>';
        html += '<div class="category-profile-track" role="progressbar" aria-label="' + escapeText(row.name) +
          ': ' + row.score + '%" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + row.score + '">';
        html += '<span class="category-profile-fill" style="width:' + row.score + '%"></span></div>';
        html += '<div class="category-profile-meta"><span class="category-profile-status">' + row.band.label +
          '</span><span>Да: ' + row.yes + ' · Частично: ' + row.partial + ' · Нет: ' + row.no + '</span></div>';
        html += '</div>';
      });
      list.innerHTML = html;
    }

    cards.forEach(function (card) {
      Array.prototype.slice.call(card.querySelectorAll('.q-opt')).forEach(function (button) {
        button.addEventListener('click', renderProfile);
      });
    });

    var reset = document.getElementById('resetBtn');
    if (reset) reset.addEventListener('click', renderProfile);
    renderProfile();
  }

  function linkAuditRecommendations() {
    var container = document.getElementById('recContainer');
    if (!container) return;

    function enhance() {
      var cards = Array.prototype.slice.call(document.querySelectorAll('.audit-q[data-q][data-rec]'));
      var items = Array.prototype.slice.call(container.querySelectorAll('.rec-item'));
      items.forEach(function (item) {
        if (item.querySelector('.action-link')) return;
        var text = item.textContent || '';
        var card = cards.find(function (candidate) {
          var rec = candidate.getAttribute('data-rec') || '';
          return rec && text.indexOf(rec) !== -1;
        });
        if (!card) return;
        var target = ACTION_TARGETS[card.getAttribute('data-q')];
        if (!target) return;
        var link = document.createElement('a');
        link.className = 'action-link';
        link.href = 'checklist.html#' + target;
        link.textContent = 'Перейти к действию →';
        item.appendChild(link);
      });
    }

    enhance();
    new MutationObserver(enhance).observe(container, { childList: true, subtree: true });
  }

  function highlightChecklistTarget() {
    if (!location.hash || location.pathname.indexOf('checklist') === -1) return;
    var target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    var item = target.closest('.check-item');
    if (item) item.classList.add('action-target');
    setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  }

  function injectFeedback() {
    var footer = document.querySelector('.site-footer .container');
    if (!footer || footer.querySelector('.feedback-row')) return;
    var row = document.createElement('div');
    row.className = 'feedback-row';
    var subject = encodeURIComponent('ЕСЛИ ОТКЛЮЧАТ – обратная связь');
    row.innerHTML = '<a class="action-link" href="mailto:' + FEEDBACK_EMAIL + '?subject=' + subject + '">Написать автору</a>' +
      '<button type="button" class="feedback-copy">Скопировать адрес</button>';
    footer.appendChild(row);
    row.querySelector('.feedback-copy').addEventListener('click', function () {
      var btn = this;
      function done() {
        var old = btn.textContent;
        btn.textContent = 'Адрес скопирован';
        setTimeout(function () { btn.textContent = old; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(FEEDBACK_EMAIL).then(done).catch(function () {});
      }
    });
  }

  injectPlanTools();
  injectAuditCategoryProfile();
  linkAuditRecommendations();
  highlightChecklistTarget();
  injectFeedback();
})();