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
  linkAuditRecommendations();
  highlightChecklistTarget();
  injectFeedback();
})();
