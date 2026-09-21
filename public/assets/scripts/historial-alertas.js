// Historial de Alertas — lógica de selección de fila y filtros (vanilla JS)
(function () {
  var ALERTS = {
    'ALT-9042': {
      title: 'Alerta SOS Sonora (Crítica)',
      coord: '-12.1221, -77.0289',
      legend: 'Punto SOS: Calle Las Gardenias 450, Miraflores',
      dispositivo: 'Web Chrome (Desktop)',
      tiempo: '2.4 min (Serenazgo)',
      bateria: '84% (Carga AC)',
      cifrado: 'AES-256 GCM',
      contactos: [
        { initial: 'M', bg: 'var(--navy)', color: '#fff', nombre: 'María Álvarez', meta: 'Madre · SMS &amp; WhatsApp', estado: 'Entregado 14:28', color2: 'text-stable' },
        { initial: 'C', bg: 'var(--soft-bg)', color: 'var(--navy)', nombre: 'Carlos Ramírez', meta: 'Hermano · Notificación Push', estado: 'Leído 14:29', color2: 'text-stable' },
        { initial: 'S', bg: '#fff0f0', color: 'var(--sos)', nombre: 'Central Serenazgo', meta: 'Base Miraflores Cuadrante 4', estado: 'Despachado', color2: '', colorStyle: 'color:var(--accent);' }
      ]
    },
    'ALT-8819': {
      title: 'Alerta Silenciosa (US09)',
      coord: '-12.0886, -77.0032',
      legend: 'Activación silenciosa: Av. Javier Prado Este 2100, San Borja',
      dispositivo: 'App Móvil Android (Acceso Rápido)',
      tiempo: '4.1 min (Serenazgo)',
      bateria: '52% (Batería)',
      cifrado: 'AES-256 GCM',
      contactos: [
        { initial: 'C', bg: 'var(--soft-bg)', color: 'var(--navy)', nombre: 'Carlos Ramírez', meta: 'Hermano · Notificación Push', estado: 'Leído 21:16', color2: 'text-stable' },
        { initial: 'S', bg: '#fff0f0', color: 'var(--sos)', nombre: 'Central Serenazgo', meta: 'Base San Borja Cuadrante 2', estado: 'Patrulla Nº 14 despachada', color2: '', colorStyle: 'color:var(--accent);' }
      ]
    },
    'ALT-8705': {
      title: 'Compartir Ruta (US10)',
      coord: '-12.1191, -77.0281',
      legend: 'Ruta finalizada: Av. Alfredo Benavides 1250, Miraflores',
      dispositivo: 'App Móvil iOS (Tracking en vivo)',
      tiempo: 'Sin incidencia (32 min de tracking)',
      bateria: '91% (Batería)',
      cifrado: 'AES-256 GCM',
      contactos: [
        { initial: 'M', bg: 'var(--navy)', color: '#fff', nombre: 'María Álvarez', meta: 'Madre · Tracking en vivo', estado: 'Ruta finalizada segura', color2: '', colorStyle: 'color:var(--accent);' },
        { initial: 'C', bg: 'var(--soft-bg)', color: 'var(--navy)', nombre: 'Carlos Ramírez', meta: 'Hermano · Tracking en vivo', estado: 'Ruta finalizada segura', color2: '', colorStyle: 'color:var(--accent);' }
      ]
    }
  };

  function selectAlert(row) {
    document.querySelectorAll('#auditTable tbody tr').forEach(function (r) { r.classList.remove('selected'); });
    row.classList.add('selected');

    var id = row.getAttribute('data-alert');
    var data = ALERTS[id];
    if (!data) return;

    document.getElementById('alertDetailTitle').textContent = data.title;
    document.getElementById('alertEmptyState').style.display = 'none';
    var detail = document.getElementById('alertDetailState');
    detail.style.display = 'block';

    document.getElementById('telemetryCoord').textContent = data.coord;
    document.getElementById('telemetryLegend').textContent = data.legend;
    document.getElementById('fieldDispositivo').textContent = data.dispositivo;
    document.getElementById('fieldTiempo').textContent = data.tiempo;
    document.getElementById('fieldBateria').textContent = data.bateria;
    document.getElementById('fieldCifrado').textContent = data.cifrado;
    document.getElementById('contactsLabel').textContent = 'Contactos notificados (' + data.contactos.length + ')';

    var list = document.getElementById('contactsList');
    list.innerHTML = data.contactos.map(function (c) {
      var statusMarkup = c.colorStyle
        ? '<span class="text-sm" style="' + c.colorStyle + '">' + c.estado + '</span>'
        : '<span class="' + c.color2 + ' text-sm">' + c.estado + '</span>';
      return '<div class="notify-row"><div class="notify-avatar" style="background:' + c.bg + ';color:' + c.color + ';">' + c.initial + '</div><div class="notify-info"><strong>' + c.nombre + '</strong><div class="notify-meta">' + c.meta + '</div></div>' + statusMarkup + '</div>';
    }).join('');
  }

  function applyFilters() {
    var search = (document.getElementById('historySearch').value || '').toLowerCase().trim();
    var estado = document.getElementById('filterEstado').value;
    var periodo = document.getElementById('filterPeriodo').value; // días
    var rows = document.querySelectorAll('#auditTable tbody tr');
    var visible = 0;

    rows.forEach(function (row) {
      var text = row.textContent.toLowerCase();
      var matchesSearch = !search || text.indexOf(search) !== -1;
      var matchesEstado = !estado || text.indexOf(estado.toLowerCase()) !== -1;
      var matchesPeriodo = true;
      if (periodo) {
        var fechaCell = row.querySelector('td:nth-child(2)');
        var fechaText = fechaCell ? fechaCell.textContent : '';
        var match = fechaText.match(/(\d{1,2})\s+(\w{3})\s+(\d{4})/);
        if (match) {
          var meses = { Ene: 0, Feb: 1, Mar: 2, Abr: 3, May: 4, Jun: 5, Jul: 6, Ago: 7, Sep: 8, Oct: 9, Nov: 10, Dic: 11 };
          var mesIdx = meses[match[2]];
          if (mesIdx !== undefined) {
            var fecha = new Date(parseInt(match[3], 10), mesIdx, parseInt(match[1], 10));
            var refDate = new Date(2024, 9, 24); // referencia: evento más reciente del historial
            var diffDias = (refDate - fecha) / (1000 * 60 * 60 * 24);
            matchesPeriodo = diffDias <= parseInt(periodo, 10);
          }
        }
      }
      var show = matchesSearch && matchesEstado && matchesPeriodo;
      row.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    var countLabel = document.getElementById('historyCount');
    if (countLabel) countLabel.textContent = 'Mostrando ' + visible + ' de ' + rows.length + ' eventos';
  }

  function resetFilters() {
    document.getElementById('historySearch').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterPeriodo').value = '';
    applyFilters();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var search = document.getElementById('historySearch');
    var estado = document.getElementById('filterEstado');
    var periodo = document.getElementById('filterPeriodo');
    var resetBtn = document.getElementById('btnResetFilters');

    if (search) search.addEventListener('input', applyFilters);
    if (estado) estado.addEventListener('change', applyFilters);
    if (periodo) periodo.addEventListener('change', applyFilters);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);
  });

  window.selectAlert = selectAlert;
})();
