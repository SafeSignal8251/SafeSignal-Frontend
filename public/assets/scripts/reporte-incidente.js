function selectType(el) {
  document.querySelectorAll('.incident-type-card').forEach(function (b) { b.classList.remove('selected'); });
  el.classList.add('selected');
}

function selectRiskLevel(el) {
  document.querySelectorAll('.risk-level-card').forEach(function (b) { b.classList.remove('selected'); });
  el.classList.add('selected');
}

function updateCharCounter() {
  var textarea = document.getElementById('incDesc');
  var counter = document.getElementById('charCounter');
  if (!textarea || !counter) return;
  counter.textContent = textarea.value.length + ' / 500 caracteres';
}

function useGPS() {
  if (typeof showToast === 'function') showToast('Ubicación actualizada mediante GPS');
}

function submitReport() {
  document.getElementById('reportPageContent').innerHTML = '<div style="text-align:center;padding:60px 20px;"><div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M6 14L11 19L22 9" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h2 style="font-size:20px;font-weight:800;color:var(--navy);margin-bottom:8px;">¡Reporte publicado y comunidad alertada!</h2><p style="font-size:13.5px;color:var(--muted);max-width:380px;margin:0 auto 24px;line-height:1.65;">Tu reporte ha sido registrado y notificado a tu cuadrante de Serenazgo. Gracias por contribuir a la seguridad de tu zona.</p><div style="display:flex;gap:12px;justify-content:center;"><a href="reportes-comunidad.html" class="btn-secondary" style="text-decoration:none;">Ver reportes comunitarios</a><a href="dashboard.html" class="btn-primary" style="width:auto;text-decoration:none;">Ir al dashboard</a></div></div>';
}
