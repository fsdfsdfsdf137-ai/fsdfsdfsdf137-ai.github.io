(() => {
  'use strict';

  const PRICING = {
    currency: 'RUB',
    locale: 'ru-RU',
    quantity: { min: 1, max: 60 },
    projects: {
      block: { label: 'Небольшой блок или секция', base: 3800, unitPrice: 1200, unitSingular: 'блок', unitFew: 'блока', unitPlural: 'блоков', hint: 'Укажите число блоков или секций.' },
      landing: { label: 'Лендинг', base: 12000, unitPrice: 1800, unitSingular: 'секция', unitFew: 'секции', unitPlural: 'секций', hint: 'Оценка лендинга рассчитывается по количеству секций.' },
      multipage: { label: 'Многостраничный сайт', base: 18000, unitPrice: 6500, unitSingular: 'страница', unitFew: 'страницы', unitPlural: 'страниц', hint: 'Укажите число внутренних страниц сайта.' }
    },
    complexity: {
      basic: { label: 'Базовая сложность', factor: 1 },
      standard: { label: 'Стандартная сложность', factor: 1.22 },
      advanced: { label: 'Расширенная сложность', factor: 1.48 }
    },
    features: {
      form: { label: 'Форма обратной связи', price: 2500 },
      modal: { label: 'Модальное окно', price: 1800 },
      animation: { label: 'Анимация элементов', price: 3200 },
      gallery: { label: 'Галерея изображений', price: 2700 }
    },
    urgency: {
      standard: { label: 'Стандартный срок', factor: 1 },
      express: { label: 'Ускоренный срок', factor: 1.35 }
    }
  };

  const currency = new Intl.NumberFormat(PRICING.locale, {
    style: 'currency', currency: PRICING.currency, maximumFractionDigits: 0
  });
  const elements = {
    form: document.querySelector('#cost-form'),
    project: document.querySelector('#project-type'),
    quantity: document.querySelector('#quantity'),
    quantityLabel: document.querySelector('#quantity-label'),
    quantityHint: document.querySelector('#quantity-hint'),
    quantityError: document.querySelector('#quantity-error'),
    complexity: document.querySelector('#complexity'),
    total: document.querySelector('#estimate-total'),
    error: document.querySelector('#estimate-error'),
    breakdown: document.querySelector('#breakdown-list'),
    typeHint: document.querySelector('#type-hint')
  };

  function pluralize(value, singular, few, plural) {
    const mod100 = value % 100;
    const mod10 = value % 10;
    if (mod100 >= 11 && mod100 <= 14) return plural;
    if (mod10 === 1) return singular;
    return mod10 >= 2 && mod10 <= 4 ? few : plural;
  }

  function createBreakdownRow(label, amount, isTotal = false) {
    const item = document.createElement('li');
    if (isTotal) item.className = 'total-row';
    const name = document.createElement('span');
    name.textContent = label;
    const value = document.createElement('strong');
    value.textContent = amount === null ? '—' : currency.format(amount);
    item.append(name, value);
    return item;
  }

  function selectedFeatures() {
    return Array.from(elements.form.querySelectorAll('input[name="feature"]:checked'))
      .map((input) => PRICING.features[input.value])
      .filter(Boolean);
  }

  function updateQuantityCopy(project) {
    elements.quantityLabel.textContent = `Количество ${project.unitPlural}`;
    elements.quantityHint.textContent = `Укажите целое число от ${PRICING.quantity.min} до ${PRICING.quantity.max} ${project.unitPlural}.`;
    elements.typeHint.textContent = project.hint;
  }

  function showInvalidQuantity(message) {
    elements.quantity.setAttribute('aria-invalid', 'true');
    elements.quantityError.textContent = message;
    elements.total.textContent = '—';
    elements.total.classList.add('is-placeholder');
    elements.error.textContent = 'Проверьте количество: оно должно быть целым числом от 1 до 60.';
    elements.error.hidden = false;
    elements.breakdown.replaceChildren(createBreakdownRow('Оценка недоступна', null));
  }

  function recalculate() {
    const project = PRICING.projects[elements.project.value];
    if (!project) return;
    updateQuantityCopy(project);

    const rawValue = elements.quantity.value.trim();
    const quantity = elements.quantity.valueAsNumber;
    if (rawValue === '') {
      showInvalidQuantity('Укажите количество.');
      return;
    }
    if (!Number.isInteger(quantity)) {
      showInvalidQuantity('Введите целое число, без дробной части.');
      return;
    }
    if (quantity < PRICING.quantity.min || quantity > PRICING.quantity.max) {
      showInvalidQuantity(`Количество должно быть от ${PRICING.quantity.min} до ${PRICING.quantity.max}.`);
      return;
    }

    elements.quantity.removeAttribute('aria-invalid');
    elements.quantityError.textContent = '';
    elements.error.hidden = true;
    const complexity = PRICING.complexity[elements.complexity.value];
    const urgencyKey = elements.form.querySelector('input[name="urgency"]:checked')?.value;
    const urgency = PRICING.urgency[urgencyKey] || PRICING.urgency.standard;
    const features = selectedFeatures();
    const quantityCost = quantity * project.unitPrice;
    const featuresCost = features.reduce((sum, feature) => sum + feature.price, 0);
    const baseSubtotal = project.base + quantityCost + featuresCost;
    const complexityTotal = Math.round(baseSubtotal * complexity.factor);
    const complexityIncrease = complexityTotal - baseSubtotal;
    const finalTotal = Math.round(complexityTotal * urgency.factor);
    const urgencyIncrease = finalTotal - complexityTotal;

    const rows = [
      createBreakdownRow(`Базовая стоимость · ${project.label}`, project.base),
      createBreakdownRow(`${quantity} ${pluralize(quantity, project.unitSingular, project.unitFew, project.unitPlural)} × ${currency.format(project.unitPrice)}`, quantityCost)
    ];
    features.forEach((feature) => rows.push(createBreakdownRow(feature.label, feature.price)));
    rows.push(createBreakdownRow(`Надбавка: ${complexity.label.toLocaleLowerCase(PRICING.locale)} · ${complexity.factor.toLocaleString(PRICING.locale)}×`, complexityIncrease));
    rows.push(createBreakdownRow(`Надбавка: ${urgency.label.toLocaleLowerCase(PRICING.locale)} · ${urgency.factor.toLocaleString(PRICING.locale)}×`, urgencyIncrease));
    rows.push(createBreakdownRow('Предварительная оценка', finalTotal, true));

    elements.breakdown.replaceChildren(...rows);
    elements.total.textContent = currency.format(finalTotal);
    elements.total.classList.remove('is-placeholder');
  }

  elements.form.addEventListener('input', recalculate);
  elements.form.addEventListener('change', recalculate);
  elements.form.addEventListener('reset', () => window.setTimeout(recalculate, 0));
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    recalculate();
    if (elements.quantity.getAttribute('aria-invalid') === 'true') elements.quantity.focus();
  });

  recalculate();
})();