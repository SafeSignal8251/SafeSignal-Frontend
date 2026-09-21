var REPORT_DATA = {
  rep0891: {
    id: '#REP-2026-0891', date: '· 16 Jun 2026, 14:15 hrs', mapTag: 'Punto de Asalto', district: 'Cuadrante 2 · Serenazgo Miraflores',
    riskLabel: 'Riesgo Alto', riskClass: 'status-pill--danger', verified: 'Verificado hace 18 min',
    title: 'Robo agravado con arma de fuego a transeúnte', address: 'Av. Angamos Este cruce con Petit Thouars, Miraflores',
    authorInitials: 'VV', authorName: '@vecino_vigilante', authorMeta: '14 reportes útiles · Miembro desde 2024',
    desc: 'Aproximadamente a las 14:10 hrs, dos sujetos masculinos en una motocicleta lineal de color negro sin placa visible amenazaron con arma de fuego a un joven peatón que transitaba frente a la botica. Le arrebataron su mochila y equipo celular de alta gama. Los atacantes huyeron a gran velocidad hacia el límite con Surquillo por la calle Los Negocios. El transeúnte se encuentra físicamente ileso pero en shock.',
    witness: [
      { author: 'Serenazgo Miraflores', badge: true, time: 'Hace 18 min', text: 'Unidad móvil 14 de Serenazgo y efectivo PNP acudieron al lugar. Se acordonó la zona para recojo de huellas y se ha solicitado apoyo al C4 para monitoreo de cámaras.' },
      { author: '@carlos_mira', time: 'Hace 12 min', text: 'Confirmo, se escucharon los gritos desde la ventana del tercer piso. La moto continuó rumbo este a gran velocidad. Tengan cuidado al cruzar Angamos.' }
    ]
  },
  rep0885: {
    id: '#REP-2026-0885', date: '· 16 Jun 2026, 14:15 hrs', mapTag: 'Lugar del Incidente', district: 'San Isidro · Cuadrante Financiero',
    riskLabel: 'Riesgo Medio', riskClass: 'status-pill--warning', verified: 'Verificado por la comunidad hace 1 hora',
    title: 'Arrebato de celular por falsos repartidores', address: 'Calle Las Begonias 450, San Isidro',
    authorInitials: 'SC', authorName: '@sebastiancuray08 (Tú)', authorMeta: 'Reporte propio · Miembro activo',
    desc: 'Falso delivery en bicicleta térmica naranja arrebató teléfono móvil mientras la persona esperaba en semáforo peatonal. Tomó rumbo hacia Vía Expresa. El atacante vestía casaca reflectiva sin placa ni logos identificables de operadora.',
    witness: [
      { author: 'Serenazgo San Isidro', badge: true, time: 'Hace 45 min', text: 'Patrullaje motorizado incrementado en eje Las Begonias. Se revisan grabaciones del centro de videovigilancia municipal.' },
      { author: '@laura_castillo13', time: 'Hace 30 min', text: 'Vi la misma bicicleta cerca de Dean Valdivia hace 20 minutos. El repartidor finge mirar el GPS.' }
    ]
  },
  rep0870: {
    id: '#REP-2026-0870', date: '· Hoy, hace 3 horas', mapTag: 'Zona Preventiva', district: 'Miraflores · Parque Tradiciones',
    riskLabel: 'Preventivo / Infraestructura', riskClass: 'status-pill--moderate', verified: 'Notificado a Municipio',
    title: 'Luminarias públicas apagadas y punto ciego peligroso', address: 'Parque Tradiciones, Miraflores',
    authorInitials: 'SU', authorName: '@seguridad_urbana', authorMeta: 'Miembro de la red vecinal',
    desc: 'Luminarias apagadas en el perímetro del parque generan un punto ciego nocturno. Vecinos solicitan revisión de la empresa concesionaria y mayor patrullaje preventivo en el sector.',
    witness: [
      { author: 'Municipalidad de Miraflores', badge: true, time: 'Hace 2 horas', text: 'Se programó la reparación de luminarias para las próximas 48 horas. Se reforzará el patrullaje preventivo mientras tanto.' },
      { author: '@vecina_parquetradiciones', time: 'Hace 1 hora', text: 'Gracias por la gestión, ya se nota más iluminado el sector norte del parque.' }
    ]
  },
  rep0740: {
    id: '#REP-2026-0740', date: '· Ayer, 19:30 hrs', mapTag: 'Punto de Vandalismo', district: 'Miraflores · Parque Tradiciones',
    riskLabel: 'Preventivo / Infraestructura', riskClass: 'status-pill--moderate', verified: 'En verificación por Serenazgo',
    title: 'Cámara vecinal dañada y falta de luminaria', address: 'Parque Tradiciones, Miraflores',
    desc: 'Poste sin iluminación y lente de domo con graffiti dificulta visión nocturna en la esquina con Av. Ricardo Palma. Se solicita mantenimiento correctivo y limpieza del lente.',
    witness: [
      { author: 'Serenazgo Miraflores', badge: true, time: 'Hace 3 horas', text: 'Unidad técnica programada para limpieza de lente y revisión de luminaria en las próximas 24 horas.' }
    ]
  },
  rep0512: {
    id: '#REP-2026-0512', date: '· Hace 3 días, 21:10 hrs', mapTag: 'Punto de Asalto', district: 'Miraflores · Cuadrante 2',
    riskLabel: 'Riesgo Alto', riskClass: 'status-pill--danger', verified: 'Resuelto / Archivada',
    title: 'Intento de asalto con arma blanca en paradero', address: 'Av. Angamos Este cruce con Petit Thouars, Miraflores',
    desc: 'Sujeto sospechoso amedrentó a pasajeros en paradero de transporte público con un arma blanca. Patrulla de Serenazgo intervino gracias a la alerta comunitaria y logró la reducción del sospechoso.',
    witness: [
      { author: 'Serenazgo Miraflores', badge: true, time: 'Hace 3 días', text: 'Sujeto reducido y trasladado a comisaría. Caso derivado a la PNP para las investigaciones correspondientes.' }
    ]
  }
};

function renderWitnessFeed(containerId, witnessList) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = witnessList.map(function (w) {
    return '<div class="witness-row"><div class="witness-row__head"><strong>' + w.author + (w.badge ? ' <span class="badge-pill badge-pill--blue">OFICIAL</span>' : '') + '</strong><span class="page-subtitle">' + w.time + '</span></div><p class="page-subtitle">' + w.text + '</p></div>';
  }).join('');
}

function renderReportDetail(id, panel) {
  var data = REPORT_DATA[id];
  if (!data) return;

  if (panel === 'all') {
    document.getElementById('rdaId').textContent = data.id;
    document.getElementById('rdaDate').textContent = data.date;
    document.getElementById('rdaMapTag').textContent = data.mapTag;
    document.getElementById('rdaDistrict').textContent = data.district;
    var riskBadge = document.getElementById('rdaRiskBadge');
    riskBadge.className = 'status-pill ' + data.riskClass;
    riskBadge.textContent = data.riskLabel;
    document.getElementById('rdaVerified').textContent = data.verified;
    document.getElementById('rdaTitle').textContent = data.title;
    document.getElementById('rdaAddress').textContent = data.address;
    document.getElementById('rdaAuthorInitials').textContent = data.authorInitials;
    document.getElementById('rdaAuthorName').textContent = data.authorName;
    document.getElementById('rdaAuthorMeta').textContent = data.authorMeta;
    document.getElementById('rdaDesc').textContent = data.desc;
    renderWitnessFeed('rdaWitnessFeed', data.witness);
  } else {
    document.getElementById('rdmId').textContent = data.id;
    document.getElementById('rdmDate').textContent = data.date;
    document.getElementById('rdmMapTag').textContent = data.mapTag;
    document.getElementById('rdmDistrict').textContent = data.district;
    var riskBadgeM = document.getElementById('rdmRiskBadge');
    riskBadgeM.className = 'status-pill ' + data.riskClass;
    riskBadgeM.textContent = data.riskLabel;
    document.getElementById('rdmVerified').textContent = data.verified;
    document.getElementById('rdmTitle').textContent = data.title;
    document.getElementById('rdmAddress').textContent = data.address;
    document.getElementById('rdmDesc').textContent = data.desc;
    renderWitnessFeed('rdmWitnessFeed', data.witness);
  }
}
function switchReportTab(btn, tab) {
  document.querySelectorAll('.tab-row .tab-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  document.getElementById('tabPanelAll').style.display = tab === 'all' ? 'block' : 'none';
  document.getElementById('tabPanelMine').style.display = tab === 'mine' ? 'block' : 'none';
  document.getElementById('reportDetailAll').style.display = tab === 'all' ? 'block' : 'none';
  document.getElementById('reportDetailMine').style.display = tab === 'mine' ? 'block' : 'none';
  showToast(tab === 'mine' ? 'Mostrando tus reportes emitidos' : 'Mostrando todos los reportes comunitarios');
  applyReportFilters();
}

function selectReport(el) {
  var list = el.closest('.report-item-list');
  if (list) { list.querySelectorAll('.report-item').forEach(function (x) { x.classList.remove('selected'); }); }
  el.classList.add('selected');
  var id = el.dataset.reportId;
  var panel = el.dataset.panel;
  if (id && panel) {
    renderReportDetail(id, panel);
    showToast('Visualizando: ' + el.querySelector('.report-item__title').textContent.trim());
  }
}

function switchSubTab(btn) {
  var group = btn.closest('.subtab-row');
  group.querySelectorAll('.subtab-pill').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  applyReportFilters();
}

function toggleSortLink(el) {
  var row = el.closest('.sort-row');
  row.querySelectorAll('.sort-link').forEach(function (a) { a.classList.remove('active'); });
  el.classList.add('active');
  showToast('Ordenando por: ' + el.textContent.trim());
}

function clearDistrictFilter(btn, event) {
  if (event) { event.stopPropagation(); }
  var wrap = btn.closest('.filter-distrito');
  wrap.querySelector('.filter-distrito__text').textContent = 'Distrito: Todos';
  wrap.dataset.active = 'false';
  showToast('Filtro de distrito removido');
  applyReportFilters();
}

function getActiveReportList() {
  var allPanel = document.getElementById('tabPanelAll');
  var visible = allPanel.style.display !== 'none';
  return document.getElementById(visible ? 'reportsListAll' : 'reportsListMine');
}

function applyReportFilters() {
  var list = getActiveReportList();
  if (!list) return;

  var subtabBtn = list.parentElement.querySelector('.subtab-pill.active');
  var status = subtabBtn ? subtabBtn.dataset.statusFilter : 'all';
  var tipo = document.getElementById('filterTipo').value;
  var riesgo = document.getElementById('filterRiesgo').value;
  var periodo = document.getElementById('filterPeriodo').value;
  var soloVerificados = document.getElementById('filterVerificados').checked;
  var searchTerm = document.getElementById('filterSearch').value.trim().toLowerCase();
  var districtChip = document.getElementById('filterDistritoChip');
  var districtActive = districtChip.dataset.active !== 'false';

  var visibleCount = 0;
  list.querySelectorAll('.report-item').forEach(function (item) {
    var okStatus = (status === 'all') || (item.dataset.status === status);
    var okTipo = (tipo === 'all') || (item.dataset.type === tipo);
    var okRiesgo = (riesgo === 'all') || (item.dataset.risk === riesgo);
    var okPeriodo = (periodo === 'all') || (item.dataset.period === periodo) || (periodo === 'semana' && item.dataset.period === 'hoy');
    var okVerificados = !soloVerificados || item.dataset.status === 'verified';
    var okDistrict = !districtActive || item.dataset.district === 'miraflores' || item.dataset.district === 'sanisidro';
    var okSearch = !searchTerm || item.textContent.toLowerCase().indexOf(searchTerm) !== -1;
    var show = okStatus && okTipo && okRiesgo && okPeriodo && okVerificados && okDistrict && okSearch;
    item.style.display = show ? '' : 'none';
    if (show) visibleCount++;
  });

  var emptyMsg = list.querySelector('.filter-empty-msg');
  if (visibleCount === 0) {
    if (!emptyMsg) {
      emptyMsg = document.createElement('p');
      emptyMsg.className = 'page-subtitle filter-empty-msg';
      emptyMsg.textContent = 'Ningún reporte coincide con los filtros seleccionados.';
      list.appendChild(emptyMsg);
    }
  } else if (emptyMsg) {
    emptyMsg.remove();
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('filterDistritoChip').dataset.active = 'true';
});
