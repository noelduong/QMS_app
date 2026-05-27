/* app.js - Sidebar Routing and Shell Logic */

const MODULES = {
  'overall': {
    title: 'OVERALL DASHBOARD',
    url: 'placeholders/overall.html'
  },
  'inspection_final': {
    title: 'FINAL RESULT ANALYTICS',
    url: 'placeholders/final_result.html'
  },
  'inspection_inline': {
    title: 'INLINE INSPECTION RESULTS',
    url: 'placeholders/inline_result.html'
  },
  'inspection_form': {
    title: 'DIRECT QC INSPECTION FORM',
    url: 'inspection_form/index.html'
  },
  'return': {
    title: 'RETURN ANALYSIS INSIGHTS',
    url: 'placeholders/return.html'
  },
  'feedback': {
    title: 'CUSTOMER FEEDBACK ANALYTICS',
    url: 'placeholders/feedback.html'
  },
  'materials_approval': {
    title: 'FABRIC TESTING LOGS',
    url: 'placeholders/fabric_testing.html'
  },
  'plan': {
    title: 'PRODUCTION WORK PLANNING',
    url: 'placeholders/plan.html'
  }
};

/* ---- Core Module Loader ---- */
function loadModule(moduleId) {
  const mod = MODULES[moduleId];
  if (!mod) return;

  // Remove active class from all sidebar links
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.remove('active');
  });

  // Activate the correct sidebar element
  const navItem = document.getElementById('nav-' + moduleId);
  if (navItem) {
    navItem.classList.add('active');
  }

  // Update shell header page title
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    titleEl.textContent = mod.title;
  }

  // Handle workspace dynamic loader animation
  const loader = document.getElementById('loader');
  const iframe = document.getElementById('main-frame');

  if (loader) {
    loader.classList.remove('opacity-0', 'pointer-events-none');
  }

  // Load target iframe URL
  if (iframe) {
    iframe.src = mod.url;
    iframe.onload = () => {
      if (loader) {
        loader.classList.add('opacity-0', 'pointer-events-none');
      }
    };
  }

  // Automatically close sidebar on mobile navigation
  if (window.closeSidebarMobile) {
    window.closeSidebarMobile();
  }
}

/* ---- Mobile Sidebar Toggle Logic ---- */
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const openBtn = document.getElementById('open-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  function openSidebar() {
    if (sidebar && sidebarBackdrop) {
      sidebar.classList.remove('-translate-x-full');
      sidebarBackdrop.classList.remove('opacity-0', 'pointer-events-none');
      sidebarBackdrop.classList.add('opacity-100');
    }
  }

  function closeSidebar() {
    if (sidebar && sidebarBackdrop) {
      sidebar.classList.add('-translate-x-full');
      sidebarBackdrop.classList.remove('opacity-100');
      sidebarBackdrop.classList.add('opacity-0', 'pointer-events-none');
    }
  }

  if (openBtn) openBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

  // Expose closeSidebar globally so it can be called when a module is loaded
  window.closeSidebarMobile = closeSidebar;
});
