document.addEventListener('DOMContentLoaded', function () {
  var page = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.sidebar__link[href]').forEach(function (link) {
    if (link.getAttribute('href') === page) link.classList.add('active');
  });

  var user = JSON.parse(localStorage.getItem('safesignalUser') || 'null');
  if (user) {
    var nameEl = document.getElementById('sidebarUserName');
    var roleEl = document.getElementById('sidebarUserRole');
    var avatarEl = document.getElementById('sidebarAvatar');
    var logoutNameEl = document.getElementById('logoutModalName');
    var logoutAvatarEl = document.getElementById('logoutModalAvatar');
    if (nameEl) nameEl.textContent = user.nombre || 'Usuario';
    if (roleEl) roleEl.textContent = user.distrito || 'Lima, PE';
    if (avatarEl) avatarEl.textContent = (user.nombre || 'U')[0].toUpperCase();
    if (logoutNameEl) logoutNameEl.textContent = user.nombre || 'Usuario';
    if (logoutAvatarEl) logoutAvatarEl.textContent = (user.nombre || 'U')[0].toUpperCase();
  }

  var logoutBtn = document.getElementById('btnLogout');
  if (logoutBtn && !document.getElementById('logoutModal')) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('safesignalUser');
      window.location.href = 'login.html';
    });
  }

  document.querySelectorAll('[data-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var target = document.getElementById(trigger.dataset.modal);
      if (target) target.style.display = 'flex';
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var modal = btn.closest('.modal-overlay');
      if (modal) modal.style.display = 'none';
    });
  });
});

// Helpers globales reutilizados por todas las páginas internas
function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}
function showToast(message, ms) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function () { toast.classList.remove('show'); }, ms || 3000);
}
document.addEventListener('click', function (e) {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
});
