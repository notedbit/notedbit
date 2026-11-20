document.documentElement.classList.add("js");

const header = document.querySelector("[data-header]");
if (header) {
  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();

const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]") || document.getElementById("primary-nav");

if (navToggle && nav) {
  const isOpen = () => navToggle.getAttribute("aria-expanded") === "true";
  const setOpen = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  };

  navToggle.addEventListener("click", () => setOpen(!isOpen()));

  nav.addEventListener("click", (event) => {
    if (isOpen() && event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      setOpen(false);
      navToggle.focus();
    }
  });

  window.matchMedia("(max-width: 760px)").addEventListener("change", (event) => {
    if (!event.matches && isOpen()) setOpen(false);
  });
}
