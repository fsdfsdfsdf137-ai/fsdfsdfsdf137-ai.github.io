
const themeButton = document.querySelector(".theme-toggle");
const themePreference = window.matchMedia("(prefers-color-scheme: dark)");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function getSavedTheme() {
  try {
    return localStorage.getItem("portfolio-theme");
  } catch {
    return null;
  }
}

function applyTheme(theme, savePreference = false) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeButton.setAttribute("aria-pressed", String(isDark));
  themeButton.setAttribute("aria-label", String.fromCharCode(...(isDark ? [1042,1082,1083,1102,1095,1080,1090,1100,32,1089,1074,1077,1090,1083,1091,1102,32,1090,1077,1084,1091] : [1042,1082,1083,1102,1095,1080,1090,1100,32,1090,1105,1084,1085,1091,1102,32,1090,1077,1084,1091])));
  themeColorMeta.setAttribute("content", isDark ? "#171b18" : "#f7f8f6");

  if (savePreference) {
    try {
      localStorage.setItem("portfolio-theme", theme);
    } catch {
      return;
    }
  }
}

const savedTheme = getSavedTheme();
applyTheme(savedTheme || (themePreference.matches ? "dark" : "light"));

themeButton.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
});

themePreference.addEventListener("change", (event) => {
  if (!getSavedTheme()) applyTheme(event.matches ? "dark" : "light");
});

const menuButton = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navLinks = siteNav.querySelectorAll("a");

function setMenuState(isOpen) {
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "\u0417\u0430\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e" : "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0435\u043d\u044e");
  siteNav.classList.toggle("is-open", isOpen);
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
  if (window.innerWidth > 620) setMenuState(false);
});


const revealGroups = [
  document.querySelectorAll(".section-heading, .process-intro, .about-copy, .about-mark, .contact-panel"),
  document.querySelectorAll(".service-card, .project-card, .process-step")
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
