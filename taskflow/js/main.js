(() => {
  'use strict';

  const STORAGE_KEY = 'taskflow.tasks.v1';
  const state = { tasks: [], filter: 'all', query: '', storageAvailable: true, editingId: null };
  const elements = {
    form: document.querySelector('#add-task-form'),
    input: document.querySelector('#new-task-input'),
    formMessage: document.querySelector('#form-message'),
    list: document.querySelector('#task-list'),
    empty: document.querySelector('#empty-state'),
    emptyTitle: document.querySelector('#empty-title'),
    emptyDescription: document.querySelector('#empty-description'),
    emptyAction: document.querySelector('#empty-action'),
    search: document.querySelector('#search-input'),
    total: document.querySelector('#total-count'),
    allCount: document.querySelector('#all-count'),
    activeCount: document.querySelector('#active-count'),
    completedCount: document.querySelector('#completed-count'),
    mobileAll: document.querySelector('#mobile-all-count'),
    mobileActive: document.querySelector('#mobile-active-count'),
    mobileCompleted: document.querySelector('#mobile-completed-count'),
    visible: document.querySelector('#visible-count'),
    remaining: document.querySelector('#remaining-summary'),
    progress: document.querySelector('#progress-track'),
    progressBar: document.querySelector('#progress-bar'),
    progressLabel: document.querySelector('#progress-label'),
    storage: document.querySelector('#storage-status'),
    clearCompleted: document.querySelector('#clear-completed'),
    today: document.querySelector('#today-date')
  };

  function validTask(task) {
    return task && typeof task.id === 'string' && task.id &&
      typeof task.title === 'string' && task.title.trim() &&
      typeof task.completed === 'boolean' &&
      typeof task.createdAt === 'string' && Number.isFinite(Date.parse(task.createdAt));
  }

  function loadTasks() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === null) return;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.some((task) => !validTask(task))) {
        state.storageAvailable = false;
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      state.tasks = parsed.map((task) => ({
        id: task.id,
        title: task.title.trim(),
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : task.createdAt
      }));
    } catch {
      state.storageAvailable = false;
      state.tasks = [];
      try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }

  function saveTasks() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
      state.storageAvailable = true;
    } catch {
      state.storageAvailable = false;
    }
    elements.storage.textContent = state.storageAvailable
      ? 'Изменения сохраняются только в этом браузере.'
      : 'Хранилище браузера недоступно: изменения останутся до закрытия страницы.';
  }

  function makeButton(label, action, symbol, extraClass = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `task-action ${extraClass}`.trim();
    button.dataset.action = action;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.textContent = symbol;
    return button;
  }

  function createTaskElement(task) {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' is-completed' : ''}`;
    item.dataset.id = task.id;

    const checkbox = document.createElement('button');
    checkbox.type = 'button';
    checkbox.className = 'task-check';
    checkbox.dataset.action = 'toggle';
    checkbox.setAttribute('aria-label', task.completed ? `Вернуть задачу «${task.title}» в активные` : `Отметить задачу «${task.title}» выполненной`);
    checkbox.setAttribute('aria-pressed', String(task.completed));
    checkbox.textContent = task.completed ? '✓' : '';
    item.append(checkbox);

    if (state.editingId === task.id) {
      const form = document.createElement('form');
      form.className = 'edit-form';
      form.dataset.editForm = '';
      const input = document.createElement('input');
      input.className = 'edit-input';
      input.name = 'title';
      input.maxLength = 120;
      input.value = task.title;
      input.setAttribute('aria-label', 'Новое название задачи');
      const save = document.createElement('button');
      save.className = 'edit-save'; save.type = 'submit'; save.textContent = 'Сохранить';
      const cancel = document.createElement('button');
      cancel.className = 'edit-cancel'; cancel.type = 'button'; cancel.dataset.action = 'cancel-edit'; cancel.textContent = 'Отмена';
      form.append(input, save, cancel);
      item.append(form);
      requestAnimationFrame(() => { input.focus(); input.select(); });
      return item;
    }

    const copy = document.createElement('div'); copy.className = 'task-copy';
    const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
    const date = document.createElement('time'); date.className = 'task-date'; date.dateTime = task.createdAt;
    date.textContent = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(task.createdAt));
    copy.append(title, date); item.append(copy);

    const actions = document.createElement('div'); actions.className = 'task-actions';
    actions.append(makeButton('Редактировать задачу', 'edit', '✎'), makeButton('Удалить задачу', 'delete', '×', 'delete'));
    item.append(actions);
    return item;
  }

  function getVisibleTasks() {
    const normalizedQuery = state.query.trim().toLocaleLowerCase('ru');
    return state.tasks.filter((task) => {
      const matchesFilter = state.filter === 'all' ||
        (state.filter === 'active' && !task.completed) ||
        (state.filter === 'completed' && task.completed);
      return matchesFilter && task.title.toLocaleLowerCase('ru').includes(normalizedQuery);
    });
  }

  function render() {
    const completed = state.tasks.filter((task) => task.completed).length;
    const active = state.tasks.length - completed;
    const visibleTasks = getVisibleTasks();
    elements.list.replaceChildren(...visibleTasks.map(createTaskElement));
    elements.total.textContent = String(state.tasks.length);
    elements.allCount.textContent = String(state.tasks.length);
    elements.activeCount.textContent = String(active);
    elements.completedCount.textContent = String(completed);
    elements.mobileAll.textContent = String(state.tasks.length);
    elements.mobileActive.textContent = String(active);
    elements.mobileCompleted.textContent = String(completed);
    elements.visible.textContent = `${visibleTasks.length} ${pluralize(visibleTasks.length, ['задача', 'задачи', 'задач'])}`;
    elements.clearCompleted.hidden = completed === 0;
    const progress = state.tasks.length ? Math.round(completed / state.tasks.length * 100) : 0;
    elements.progress.setAttribute('aria-valuenow', String(progress));
    elements.progressBar.style.width = `${progress}%`;
    elements.progressLabel.textContent = `${progress}%`;
    elements.remaining.textContent = active ? `${active} ${pluralize(active, ['задача ждёт', 'задачи ждут', 'задач ждут'])} внимания` : 'Нет задач, которые ждут внимания';

    const hasSearch = Boolean(state.query.trim());
    const noTasksAtAll = state.tasks.length === 0;
    elements.empty.hidden = visibleTasks.length > 0;
    elements.emptyAction.hidden = !hasSearch;
    if (noTasksAtAll) {
      elements.emptyTitle.textContent = 'Пока здесь тихо';
      elements.emptyDescription.textContent = 'Добавьте первую задачу — и она появится в вашем списке.';
    } else if (hasSearch) {
      elements.emptyTitle.textContent = 'Ничего не найдено';
      elements.emptyDescription.textContent = 'Попробуйте изменить поисковый запрос или сбросить поиск.';
    } else {
      elements.emptyTitle.textContent = 'В этом списке пока пусто';
      elements.emptyDescription.textContent = 'Задачи не потерялись — выберите другой фильтр.';
    }
    document.querySelectorAll('[data-filter]').forEach((button) => {
      const selected = button.dataset.filter === state.filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function focusTaskAction(taskId, action) {
    const item = [...elements.list.querySelectorAll('[data-id]')]
      .find((taskElement) => taskElement.dataset.id === taskId);
    const control = item?.querySelector(`[data-action="${action}"]`);
    (control || elements.input).focus();
  }

  function pluralize(number, forms) {
    const mod100 = number % 100;
    const mod10 = number % 10;
    if (mod100 >= 11 && mod100 <= 14) return forms[2];
    if (mod10 === 1) return forms[0];
    if (mod10 >= 2 && mod10 <= 4) return forms[1];
    return forms[2];
  }

  function announce(message) { elements.formMessage.textContent = message; }

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = elements.input.value.trim();
    if (!title) { announce('Введите название задачи.'); elements.input.focus(); return; }
    if (title.length > 120) { announce('Название должно быть короче 120 символов.'); return; }
    const now = new Date().toISOString();
    state.tasks.unshift({ id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`, title, completed: false, createdAt: now, updatedAt: now });
    elements.input.value = ''; announce('Задача добавлена.');
    state.filter = 'all'; state.query = ''; elements.search.value = '';
    saveTasks(); render(); elements.input.focus();
  });

  elements.list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const item = button.closest('[data-id]');
    const task = state.tasks.find((entry) => entry.id === item?.dataset.id);
    if (!task) return;
    switch (button.dataset.action) {
      case 'toggle':
        task.completed = !task.completed; task.updatedAt = new Date().toISOString(); saveTasks(); render(); focusTaskAction(task.id, 'toggle'); break;
      case 'edit':
        state.editingId = task.id; render(); break;
      case 'cancel-edit':
        state.editingId = null; render(); focusTaskAction(task.id, 'edit'); break;
      case 'delete': {
        const taskIndex = state.tasks.findIndex((entry) => entry.id === task.id);
        state.tasks = state.tasks.filter((entry) => entry.id !== task.id);
        const nextTask = state.tasks[Math.min(taskIndex, state.tasks.length - 1)];
        saveTasks(); render();
        if (nextTask) focusTaskAction(nextTask.id, 'toggle');
        else elements.input.focus();
        break;
      }
    }
  });

  elements.list.addEventListener('submit', (event) => {
    const form = event.target.closest('[data-edit-form]');
    if (!form) return;
    event.preventDefault();
    const task = state.tasks.find((entry) => entry.id === form.closest('[data-id]')?.dataset.id);
    const title = new FormData(form).get('title').trim();
    if (!title) { form.elements.title.setCustomValidity('Введите название задачи.'); form.elements.title.reportValidity(); return; }
    if (task && title.length <= 120) { task.title = title; task.updatedAt = new Date().toISOString(); }
    state.editingId = null; saveTasks(); render(); focusTaskAction(task?.id, 'edit');
  });

  elements.list.addEventListener('input', (event) => {
    if (event.target.matches('.edit-input')) event.target.setCustomValidity('');
  });
  elements.search.addEventListener('input', () => { state.query = elements.search.value; render(); });
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    state.filter = button.dataset.filter; state.editingId = null; render();
  }));
  elements.clearCompleted.addEventListener('click', () => {
    const count = state.tasks.filter((task) => task.completed).length;
    if (!count || !window.confirm(`Удалить выполненные задачи (${count})?`)) return;
    state.tasks = state.tasks.filter((task) => !task.completed); saveTasks(); render();
  });
  elements.emptyAction.addEventListener('click', () => { state.query = ''; elements.search.value = ''; render(); elements.search.focus(); });
  elements.search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.search.value) { elements.search.value = ''; state.query = ''; render(); }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault(); elements.search.focus();
    }
    if (event.key === 'Escape' && state.editingId) {
      const editingId = state.editingId;
      state.editingId = null;
      render();
      focusTaskAction(editingId, 'edit');
    }
  });

  loadTasks();
  elements.today.textContent = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  elements.storage.textContent = state.storageAvailable
    ? 'Изменения сохраняются только в этом браузере.'
    : 'Повреждённые данные очищены. Можно продолжить работу.';
  render();
})();
