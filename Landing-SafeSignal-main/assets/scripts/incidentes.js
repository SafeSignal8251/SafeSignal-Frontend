var validationCount = 24;

function validateIncident(btn) {
  validationCount += 1;
  btn.textContent = 'Validar reporte (+1)';
  document.getElementById('validationCount').textContent = validationCount;
  showToast('Gracias por validar este incidente.');
}

function reportInconsistency() {
  showToast('Inconsistencia enviada a moderación.');
}

function postWitnessComment() {
  var input = document.getElementById('witnessInput');
  if (!input.value.trim()) {
    showToast('Escribe un testimonio antes de comentar.');
    return;
  }
  var feed = document.getElementById('witnessFeed');
  var row = document.createElement('div');
  row.className = 'witness-row';
  row.innerHTML = '<div class="witness-row__head"><strong>@sebastiancuray08 <span class="badge badge--gray">Tú</span></strong><span class="page-subtitle">Ahora</span></div><p class="page-subtitle"></p>';
  row.querySelector('p').textContent = input.value.trim();
  feed.appendChild(row);
  input.value = '';
  showToast('Testimonio publicado en el feed.');
}

function radarZoom(action) {
  var msg = action === 'in' ? 'Acercando radar…' : action === 'out' ? 'Alejando radar…' : 'Radar recentrado en el incidente';
  showToast(msg);
}

function traceAlternateRoute() {
  showToast('Calculando ruta alternativa segura…');
}
