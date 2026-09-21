function showConfigSaveBar() {
  var bar = document.getElementById('cfgSaveBar');
  if (bar) bar.style.display = 'flex';
}

// --- Mensaje de emergencia SOS ---
function updateCharCount() {
  var ta = document.getElementById('sosMsgInput');
  var counter = document.getElementById('sosCharCount');
  var preview = document.getElementById('sosPreviewText');
  if (!ta || !counter) return;
  var len = ta.value.length;
  counter.textContent = len + ' / 200 caracteres';
  if (preview) preview.textContent = ta.value;
}

function saveSosMsg() {
  var badge = document.getElementById('sosSavedBadge');
  if (badge) {
    badge.style.display = 'inline-flex';
    clearTimeout(window.__sosBadgeTimer);
    window.__sosBadgeTimer = setTimeout(function () { badge.style.display = 'none'; }, 2500);
  }
  if (typeof showToast === 'function') showToast('Mensaje de alerta SOS actualizado.');
}

// --- Tiempo estimado de monitoreo ---
function updateTimeConfigured() {
  var h = parseInt(document.getElementById('monHoras').value, 10) || 0;
  var m = parseInt(document.getElementById('monMinutos').value, 10) || 0;
  var label = document.getElementById('timeConfiguredLabel');
  if (!label) return;
  var text = 'Tiempo configurado: ';
  text += h > 0 ? (h + ' h ' + m + ' min') : (m + ' min');
  label.textContent = text;
}

function saveTime() {
  updateTimeConfigured();
  if (typeof showToast === 'function') showToast('Tiempo de monitoreo guardado.');
}

function saveSensors() {
  if (typeof showToast === 'function') showToast('Configuración de sensores guardada.');
}

function saveAnomalies() {
  if (typeof showToast === 'function') showToast('Reglas de detección de anomalías guardadas.');
}
