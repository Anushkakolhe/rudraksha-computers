/* ============================================================
   Rudraksha Computers – Shared UI Utilities
   Toast · Spinner · Dark Mode · Hamburger · Logout
   ============================================================ */

/* ---------- Toast ---------- */
function showToast(message, type = "success", duration = 3000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || "🔔"}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    toast.style.transition = "all .3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ---------- Spinner ---------- */
function showSpinner() {
  let overlay = document.getElementById("spinner-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "spinner-overlay";
    overlay.className = "spinner-overlay";
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
  overlay.classList.add("visible");
}

function hideSpinner() {
  const overlay = document.getElementById("spinner-overlay");
  if (overlay) overlay.classList.remove("visible");
}

/* ---------- Dark Mode ---------- */
function initDarkMode() {
  const saved = localStorage.getItem("darkMode");
  if (saved === "true") document.documentElement.classList.add("dark");

  document.querySelectorAll(".dark-toggle").forEach(btn => {
    btn.textContent = document.documentElement.classList.contains("dark") ? "☀️" : "🌙";
    btn.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("darkMode", isDark);
      btn.textContent = isDark ? "☀️" : "🌙";
    });
  });
}

/* ---------- Hamburger / Sidebar ---------- */
function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const sidebar   = document.querySelector(".sidebar");
  const overlay   = document.getElementById("sidebar-overlay");

  if (!hamburger || !sidebar) return;

  function openSidebar() {
    sidebar.classList.add("open");
    if (overlay) overlay.classList.add("visible");
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("visible");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  }

  hamburger.addEventListener("click", () => {
    sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
  });

  if (overlay) overlay.addEventListener("click", closeSidebar);

  // Close on nav link click (mobile)
  sidebar.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });
}

/* ---------- Logout ---------- */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  window.location.href = "stud_login.html";
}

function ownerLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

/* ---------- Init on DOM ready ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  initHamburger();
});
