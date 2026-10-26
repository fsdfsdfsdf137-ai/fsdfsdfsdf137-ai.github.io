const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = siteNav.querySelectorAll("a");

function setMenuState(isOpen) {
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
  siteNav.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("menu-open", isOpen);
}

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  setMenuState(!isOpen);
});

navLinks.forEach((link) => link.addEventListener("click", () => setMenuState(false)));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
    setMenuState(false);
    menuButton.focus();
  }
});

document.addEventListener("click", (event) => {
  if (menuButton.getAttribute("aria-expanded") === "true" && !siteNav.contains(event.target) && !menuButton.contains(event.target)) {
    setMenuState(false);
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 680) setMenuState(false);
});

const drinks = {
  espresso: {
    title: "Эспрессо",
    description: "Небольшая чашка с насыщенным вкусом и мягкой сладостью. Хороша сама по себе или как начало кофейного знакомства.",
    profile: "Тёмный шоколад · карамель",
    size: "30 мл · цена в макете 190 ₽"
  },
  "flat-white": {
    title: "Флэт уайт",
    description: "Двойной эспрессо соединяется с шелковистой микропеной. Крепкий кофейный вкус остаётся главным.",
    profile: "Какао · фундук · молочная сладость",
    size: "180 мл · цена в макете 320 ₽"
  },
  filter: {
    title: "Фильтр дня",
    description: "Зерно меняется вместе с сезоном. Завариваем вручную, чтобы сохранить чистый вкус и деликатную фруктовую кислотность.",
    profile: "Сезонные ягоды · цитрус",
    size: "250 мл · цена в макете 290 ₽"
  }
};

const drinkDialog = document.querySelector(".drink-dialog");
const dialogCloseButton = document.querySelector(".dialog-close");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const dialogProfile = document.querySelector("#dialog-profile");
const dialogSize = document.querySelector("#dialog-size");
let dialogTrigger = null;

function closeDrinkDialog() {
  if (!drinkDialog.open) return;
  drinkDialog.close();
  document.body.classList.remove("dialog-open");
  if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
}

document.querySelectorAll("[data-drink]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const drink = drinks[trigger.dataset.drink];
    if (!drink) return;

    dialogTrigger = trigger;
    dialogTitle.textContent = drink.title;
    dialogDescription.textContent = drink.description;
    dialogProfile.textContent = drink.profile;
    dialogSize.textContent = drink.size;
    drinkDialog.showModal();
    document.body.classList.add("dialog-open");
    dialogCloseButton.focus();
  });
});

dialogCloseButton.addEventListener("click", closeDrinkDialog);
drinkDialog.addEventListener("click", (event) => {
  if (event.target === drinkDialog) closeDrinkDialog();
});
drinkDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDrinkDialog();
});

const photoElements = document.querySelectorAll("img[data-photo]");
function loadPhoto(photoElement) {
  const remotePhoto = new Image();
  remotePhoto.fetchPriority = photoElement.fetchPriority || "auto";
  remotePhoto.addEventListener("load", () => {
    photoElement.src = remotePhoto.src;
    photoElement.classList.add("photo-loaded");
  });
  remotePhoto.addEventListener("error", () => {
    photoElement.alt = "Иллюстрация чашки кофе North Coffee — резервное изображение";
    photoElement.classList.add("photo-fallback");
  });
  remotePhoto.src = photoElement.dataset.photo;
}

if ("IntersectionObserver" in window) {
  const photoObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadPhoto(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "220px 0px" });

  photoElements.forEach((photoElement) => {
    if (photoElement.fetchPriority === "high") loadPhoto(photoElement);
    else photoObserver.observe(photoElement);
  });
} else {
  photoElements.forEach(loadPhoto);
}

const revealGroups = [
  document.querySelectorAll(".section-heading, .story-copy, .story-image, .visit-layout, .contact-inner"),
  document.querySelectorAll(".drink-card, .gallery-item")
];
const revealItems = [...revealGroups[0], ...revealGroups[1]];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (revealItems.length && !reducedMotion && "IntersectionObserver" in window) {
  revealGroups.forEach((group) => {
    group.forEach((item, index) => {
      item.classList.add("reveal");
      if (group.length > 1) item.style.setProperty("--reveal-delay", `${index * 90}ms`);
    });
  });

  document.body.classList.add("motion-ready");
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -28px 0px" });

  revealItems.forEach((item) => revealObserver.observe(item));
}