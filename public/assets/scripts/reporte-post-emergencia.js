function selectEstado(el) {
  document.querySelectorAll('.estado-btn').forEach(function (e) { e.classList.remove('estado-btn--active'); });
  el.classList.add('estado-btn--active');
}

function selectScale(btn) {
  document.querySelectorAll('.scale-btn').forEach(function (b) { b.classList.remove('sel'); });
  btn.classList.add('sel');
}

function submitPostReport() {
  alert('Reporte post-emergencia enviado. Gracias por completarlo.');
  window.location.href = 'historial-alertas.html';
}
