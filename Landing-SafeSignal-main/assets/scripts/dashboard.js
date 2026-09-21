document.getElementById('btnLogout').addEventListener('click', function (e) {
  e.preventDefault();
  openModal('logoutModal');
});
document.getElementById('confirmLogout').addEventListener('click', function () {
  localStorage.removeItem('safesignalUser');
  window.location.href = 'login.html';
});

// Activar Monitoreo
document.getElementById('btnActivarMonitoreo').addEventListener('click', function () {
  var btn = this;
  var active = btn.classList.toggle('btn-sos--active');
  btn.lastChild.textContent = active ? 'Monitoreo Activo' : 'Activar Monitoreo';
  showToast(active ? 'Monitoreo de trayecto activado.' : 'Monitoreo desactivado.');
});

// Alarma silenciosa -> abre confirmación SOS con cuenta regresiva
var sosTimer = null, sosSeconds = 5;
document.getElementById('btnActivarSOS').addEventListener('click', function () {
  sosSeconds = 5;
  document.getElementById('sosCountdown').textContent = sosSeconds;
  document.getElementById('sosCountdownFill').style.width = '100%';
  openModal('sosConfirmModal');
  sosTimer = setInterval(function () {
    sosSeconds--;
    document.getElementById('sosCountdown').textContent = Math.max(sosSeconds, 0);
    document.getElementById('sosCountdownFill').style.width = (sosSeconds / 5 * 100) + '%';
    if (sosSeconds <= 0) {
      clearInterval(sosTimer);
      closeModal('sosConfirmModal');
      showToast('Alerta SOS enviada a tus contactos y a Serenazgo.');
    }
  }, 1000);
});
document.getElementById('sosCancelBtn').addEventListener('click', function () {
  clearInterval(sosTimer);
  closeModal('sosConfirmModal');
});
document.getElementById('sosConfirmBtn').addEventListener('click', function () {
  clearInterval(sosTimer);
  closeModal('sosConfirmModal');
  showToast('Alerta SOS enviada a tus contactos y a Serenazgo.');
});

// Estoy bien -> descarta el banner de anomalía
document.getElementById('btnEstoyBien').addEventListener('click', function () {
  var banner = document.getElementById('anomalyBanner');
  if (banner) banner.style.display = 'none';
  showToast('Gracias por confirmar. Se registró que estás bien.');
});

// Compartir ubicación
document.getElementById('btnCompartirUbicacion').addEventListener('click', function () {
  openModal('shareLocationModal');
});
document.getElementById('shareLocationConfirmBtn').addEventListener('click', function () {
  closeModal('shareLocationModal');
  showToast('Ubicación en tiempo real compartida con tus contactos.');
});

// Cancelar alerta activa (si el dashboard se abre en estado "alerta en curso")
var cancelBtn = document.getElementById('cancelAlertConfirmBtn');
if (cancelBtn) {
  cancelBtn.addEventListener('click', function () {
    closeModal('cancelAlertModal');
    showToast('Alerta cancelada. Se notificó a tus contactos y a Serenazgo.');
  });
}
