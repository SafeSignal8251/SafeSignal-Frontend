'use strict';
var sosActive = false;
var sosInterval = null;
var sosSeconds = 0;

window.activateSOS = function () {
  if (sosActive) return;
  sosActive = true;
  document.getElementById('sosRing').classList.add('sos-ring--active');
  document.getElementById('btnSOS').style.background = '#a82828';
  document.getElementById('sosHint').textContent = '🔴 Alerta SOS enviada. Contactos notificados.';
  document.getElementById('activePanel').style.display = 'block';
  sosInterval = setInterval(function () {
    sosSeconds++;
    var m = Math.floor(sosSeconds / 60);
    var s = sosSeconds % 60;
    document.getElementById('sosTimer').textContent = (m < 10 ? '0'+m : m) + ':' + (s < 10 ? '0'+s : s);
  }, 1000);
};

window.cancelSOS = function () {
  if (!confirm('¿Estás seguro de cancelar la alerta SOS?')) return;
  clearInterval(sosInterval);
  sosActive = false;
  sosSeconds = 0;
  document.getElementById('sosTimer').textContent = '00:00';
  document.getElementById('activePanel').style.display = 'none';
  document.getElementById('btnSOS').style.background = '';
  document.getElementById('sosHint').textContent = 'Mantén presionado 3 segundos para activar la alerta de emergencia';
  window.location.href = 'reporte-post-emergencia.html';
};
