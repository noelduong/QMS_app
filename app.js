/* app.js for QMS Portal — Horizontal Top Nav */

const MODULES = {
  'inspection_final': {
    title: 'Final Result',
    url: 'placeholders/final_result.html'
  },
  'inspection_inline': {
    title: 'Inline Result',
    url: 'placeholders/inline_result.html'
  },
  'inspection_form': {
    title: 'Inspection Form',
    url: 'inspection_form/index.html'
  },
  'return': {
    title: 'Return Analysis',
    url: 'placeholders/return.html'
  },
  'feedback': {
    title: 'Feedback Rate',
    url: 'placeholders/feedback.html'
  },
  'plan': {
    title: 'Planning',
    url: 'placeholders/plan.html'
  },
  'overall': {
    title: 'Overall Dashboard',
    url: 'placeholders/overall.html'
  }
};

/* ---- Load Module ---- */
function loadModule(moduleId) {
  const mod = MODULES[moduleId];
  if (!mod) return;

  // Clear all active states
  document.querySelectorAll('.pill, .dropdown-item').forEach(el => {
    el.classList.remove('active');
  });

  // Set active on the clicked item
  const navItem = document.getElementById('nav-' + moduleId);
  if (navItem) {
    navItem.classList.add('active');

    // If it's a dropdown item, also activate its parent pill
    if (moduleId.startsWith('inspection_')) {
      document.getElementById('nav-inspection').classList.add('active');
    } else if (moduleId === 'return' || moduleId === 'feedback') {
      document.getElementById('nav-data-analysis').classList.add('active');
    }
  }

  // Update page title
  document.getElementById('page-title').textContent = mod.title;

  // Show loader
  const loader = document.getElementById('loader');
  const iframe = document.getElementById('main-frame');

  loader.classList.remove('opacity-0', 'pointer-events-none');

  // Load URL
  iframe.src = mod.url;

  // Hide loader when loaded
  iframe.onload = () => {
    loader.classList.add('opacity-0', 'pointer-events-none');
  };

  // Close any open dropdowns
  closeAllDropdowns();

  // Close mobile menu if open
  if (window.innerWidth <= 768) {
    document.querySelector('.topbar').classList.remove('mobile-open');
  }
}

/* ---- Dropdown Toggle ---- */
function toggleDropdown(id) {
  const group = document.getElementById('group-' + id);
  const isOpen = group.classList.contains('open');

  // Close all other dropdowns first
  closeAllDropdowns();

  if (!isOpen) {
    group.classList.add('open');
  }
}

function closeAllDropdowns() {
  document.querySelectorAll('.pill-group').forEach(g => {
    g.classList.remove('open');
  });
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.pill-group')) {
    closeAllDropdowns();
  }
});

/* ---- Topbar Toggle (Hide/Show) ---- */
function toggleTopbar() {
  const topbar = document.querySelector('.topbar');
  const floatBtn = document.getElementById('float-toggle');
  const icon = document.getElementById('toggle-icon');
  
  topbar.classList.toggle('collapsed');
  
  if (topbar.classList.contains('collapsed')) {
    icon.style.transform = 'rotate(180deg)';
    // Show floating toggle button
    setTimeout(() => {
      if (floatBtn) floatBtn.classList.add('visible');
    }, 300);
  } else {
    icon.style.transform = 'rotate(0deg)';
    if (floatBtn) floatBtn.classList.remove('visible');
  }
}

function showTopbar() {
  const topbar = document.querySelector('.topbar');
  const floatBtn = document.getElementById('float-toggle');
  const icon = document.getElementById('toggle-icon');
  
  topbar.classList.remove('collapsed');
  icon.style.transform = 'rotate(0deg)';
  if (floatBtn) floatBtn.classList.remove('visible');
}

/* ---- Create floating toggle button dynamically ---- */
(function createFloatToggle() {
  const btn = document.createElement('button');
  btn.id = 'float-toggle';
  btn.className = 'collapsed-toggle-float';
  btn.title = 'Hiện menu';
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  btn.onclick = showTopbar;
  document.body.appendChild(btn);
})();

/* ---- Mobile Menu Toggle ---- */
document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
  document.querySelector('.topbar').classList.toggle('mobile-open');
});
