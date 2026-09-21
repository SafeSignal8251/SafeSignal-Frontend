'use strict';

function selectDevice(el) {
  document.querySelectorAll('#pairModal .report-item').forEach(function (x) {
    x.classList.remove('selected');
    var btn = x.querySelector('button');
    if (btn) { btn.className = 'btn-secondary btn-xs'; btn.textContent = 'Vincular'; }
  });
  el.classList.add('selected');
  var btn = el.querySelector('button');
  if (btn) { btn.className = 'btn-primary btn-xs'; btn.textContent = 'Vincular'; }
}

// Simula el resultado de la vinculación: alterna éxito/error para mostrar ambos estados
var pairAttempt = 0;
function pairDevice(e, el) {
  if (e) e.stopPropagation();
  var item = el ? el.closest('.report-item') : null;
  var name = (item && item.getAttribute('data-device-name')) || 'Dispositivo';
  var type = (item && item.getAttribute('data-device-type')) || '—';
  var linkId = (item && item.getAttribute('data-link-id')) || '—';
  closeModal('pairModal');
  pairAttempt++;
  if (pairAttempt % 2 === 1) {
    setText('pairedDeviceName', name);
    setText('pairedDeviceLabel', name + ' (Personal)');
    setText('pairedDeviceType', type);
    setText('pairedDeviceId', linkId);
    openModal('pairSuccessModal');
  } else {
    setText('failedDeviceName', name);
    setText('pairAttemptNum', String(Math.min(pairAttempt, 3)));
    openModal('pairErrorModal');
  }
}

function setText(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Prueba de señal desde el modal de éxito
function testDeviceSignal() {
  showToast('Señal recibida correctamente · Latencia: 180 ms');
}

// Reintenta la vinculación desde el modal de error
function retryPairing() {
  closeModal('pairErrorModal');
  openModal('pairModal');
}

// Reconecta un dispositivo desconectado
function reconnectDevice(btn) {
  var card = btn.closest('.device-card');
  var badge = card.querySelector('.badge');
  badge.className = 'badge badge--green';
  badge.textContent = 'Conectado';

  var icon = card.querySelector('.device-icon');
  icon.className = 'device-icon device-icon--blue';

  var fill = card.querySelector('.batt-fill');
  fill.style.width = '100%';
  fill.className = 'batt-fill batt-fill--good';

  var metaLines = card.querySelectorAll('.page-subtitle');
  metaLines[metaLines.length - 1].textContent = '100% · Reconectado ahora';

  var actions = btn.parentElement;
  var buttons = actions.querySelectorAll('button');
  buttons[0].textContent = 'Configurar';
  buttons[0].setAttribute('onclick', 'configureDevice(this)');
  buttons[1].textContent = 'Desvincular';
  buttons[1].setAttribute('onclick', 'unlinkDevice(this)');
}

// Elimina el dispositivo de la lista (Eliminar / Desvincular)
function removeDeviceCard(btn) {
  var card = btn.closest('.device-card');
  card.remove();
  showToast('Dispositivo desvinculado.');
}

function removeDevice(btn) { removeDeviceCard(btn); }
function unlinkDevice(btn) { removeDeviceCard(btn); }

// Panel simple de configuración del dispositivo (renombrar)
function configureDevice(btn) {
  var card = btn.closest('.device-card');
  showToast('Abriendo configuración de ' + (card.dataset.device || 'dispositivo') + '…');
}
