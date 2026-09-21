'use strict';

var LIMA_CENTER = [-12.1211, -77.0295]; // Av. Larco, Miraflores
var DEFAULT_ZOOM = 14;

var map = L.map('map', { zoomControl: false }).setView(LIMA_CENTER, DEFAULT_ZOOM);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
}).addTo(map);

function pinIcon(cls, size) {
  size = size || 16;
  return L.divIcon({ className: '', html: '<div class="map-pin-icon ' + cls + '"></div>', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}
function tagIcon(cls, text, width) {
  return L.divIcon({ className: '', html: '<div class="map-zone-tag ' + cls + '">' + text + '</div>', iconSize: [width, 20], iconAnchor: [width / 2, 10] });
}

var incidents = [
  { lat: -12.0954, lng: -77.0428, type: 'robo', risk: 'alto', title: 'Robo a mano armada', desc: 'Av. Javier Prado Este 1500' },
  { lat: -12.1183, lng: -77.0243, type: 'recientes', risk: 'medio', title: 'Intento de acoso', desc: 'Las Begonias 450' },
  { lat: -12.0975, lng: -77.0323, type: 'recientes', risk: 'medio', title: 'Accidente de tránsito', desc: 'Av. Arequipa cdra. 22' },
  { lat: -12.1245, lng: -77.0270, type: 'recientes', risk: 'bajo', title: 'Vandalismo', desc: 'Parque Reducto' },
  { lat: -12.1319, lng: -77.0303, type: 'robo', risk: 'alto', title: 'Robo en tienda', desc: 'Centro Comercial Larcomar' },
  { lat: -12.1219, lng: -77.0297, type: 'recientes', risk: 'medio', title: 'Acoso verbal', desc: 'Parque Kennedy' },
  { lat: -12.1226, lng: -77.0301, type: 'recientes', risk: 'bajo', title: 'Choque menor', desc: 'Av. Diagonal' }
];

var incidentLayer = L.layerGroup().addTo(map);
incidents.forEach(function (inc) {
  var m = L.marker([inc.lat, inc.lng], { icon: pinIcon('map-pin-icon--' + inc.risk) });
  m.incType = inc.type;
  m.bindTooltip(inc.title + ' — ' + inc.desc);
  m.addTo(incidentLayer);
});

L.marker(LIMA_CENTER, { icon: pinIcon('map-pin-icon--user', 20), zIndexOffset: 1000 })
  .addTo(map)
  .bindTooltip('Estás aquí (Av. Larco)');

/* Capas de riesgo (zonas) */
L.circle([-12.1155, -77.0125], { radius: 300, color: '#f59e0b', weight: 1.5, fillColor: '#f59e0b', fillOpacity: .28 }).addTo(map);
L.circle([-12.1140, -77.0080], { radius: 320, color: '#ef4444', weight: 1.5, dashArray: '6 4', fillColor: '#ef4444', fillOpacity: .22 }).addTo(map);
L.circle([-12.1280, -77.0320], { radius: 350, color: '#22c55e', weight: 1.5, fillColor: '#22c55e', fillOpacity: .25 }).addTo(map);
L.marker([-12.1155, -77.0125], { icon: tagIcon('map-zone-tag--warn', 'Advertencia', 90), interactive: false }).addTo(map);
L.marker([-12.1140, -77.0080], { icon: tagIcon('map-zone-tag--danger', 'Zona crítica', 92), interactive: false }).addTo(map);
L.marker([-12.1280, -77.0320], { icon: tagIcon('map-zone-tag--safe', 'Corredor seguro', 112), interactive: false }).addTo(map);

window.zoomMap = function (dir) {
  if (dir > 0) map.zoomIn(); else map.zoomOut();
  showToast(dir > 0 ? 'Acercando mapa' : 'Alejando mapa');
};

window.recenterMap = function () {
  map.setView(LIMA_CENTER, DEFAULT_ZOOM);
  showToast('Mapa recentrado en tu ubicación');
};

window.filterMap = function (btn, type) {
  document.querySelectorAll('.map-filter-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  incidentLayer.eachLayer(function (m) {
    var el = m.getElement();
    if (el) el.style.display = (type === 'all' || m.incType === type) ? '' : 'none';
  });
};


/* --- Rutas seguras --- */
var ROUTES = {
  'Vía Circuito de Playas / Salaverry': [
    [-12.1216, -77.0295], [-12.1280, -77.0320], [-12.1200, -77.0400],
    [-12.1050, -77.0350], [-12.0950, -77.0150], [-12.0890, -76.9989]
  ],
  'Vía Expresa / Angamos': [
    [-12.1216, -77.0295], [-12.1183, -77.0243], [-12.1140, -77.0080],
    [-12.0950, -77.0050], [-12.0890, -76.9989]
  ]
};

var currentRoute = { name: 'Vía Circuito de Playas / Salaverry', time: '21 min', dist: '6.4 km', zonas: '0 zonas críticas', safety: '98' };
var routeLine = null;

window.selectRouteOption = function (el) {
  var list = el.closest('#comparativaCard').querySelectorAll('.report-item');
  list.forEach(function (item) { item.classList.remove('selected'); });
  el.classList.add('selected');
  currentRoute = {
    name: el.dataset.routeName,
    time: el.dataset.time,
    dist: el.dataset.dist,
    zonas: el.dataset.zonas,
    safety: el.dataset.safety
  };
  showToast('Ruta seleccionada: ' + currentRoute.name);
};

window.buscarRutas = function () {
  var dest = document.getElementById('destInput').value;
  if (!dest) { showToast('Ingresa un destino para calcular la ruta'); return; }
  document.getElementById('planCard').style.display = 'none';
  document.getElementById('comparativaCard').style.display = 'block';
  document.getElementById('warningBanner').style.display = 'block';
  document.getElementById('successBanner').style.display = 'none';
  var status = document.getElementById('mapStatusFloat');
  status.querySelector('.map-status-float__title').textContent = 'Ruta calculada';
  status.querySelector('.map-status-float__text').textContent = '2 opciones · Revisa la comparativa de rutas';
  if (!window.panToPlace(dest)) { showToast('Rutas seguras calculadas hacia ' + dest); }
};

window.aceptarRuta = function () {
  document.getElementById('warningBanner').style.display = 'none';
  document.getElementById('successBanner').style.display = 'block';
  document.getElementById('routeSearchPanel').style.display = 'none';
  document.getElementById('routeSelectedPanel').style.display = 'block';
  document.getElementById('mapFilterBar').style.display = 'none';
  document.getElementById('routeInfoBar').style.display = 'flex';

  document.getElementById('successBannerTitle').textContent = 'Ruta óptima seleccionada: ' + currentRoute.name;
  document.getElementById('routeSelectedName').textContent = currentRoute.name;
  document.getElementById('routeSelectedStats').textContent = '⏱ ' + currentRoute.time + ' · 📍 ' + currentRoute.dist + ' · ' + currentRoute.zonas;
  document.getElementById('routeSelectedSafety').textContent = currentRoute.safety + '% Seguro';

  var status = document.getElementById('mapStatusFloat');
  status.classList.add('map-status-float--active');
  status.querySelector('.map-status-float__title').textContent = 'Ruta activa · ' + currentRoute.safety + '% seguro';
  status.querySelector('.map-status-float__text').textContent = currentRoute.name + ' · ' + currentRoute.time + ' · ' + currentRoute.dist;

  if (routeLine) { map.removeLayer(routeLine); }
  var coords = ROUTES[currentRoute.name] || ROUTES['Vía Circuito de Playas / Salaverry'];
  routeLine = L.polyline(coords, { color: '#22c55e', weight: 5, opacity: .9, lineCap: 'round' }).addTo(map);
  map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

  showToast('Ruta segura aceptada: ' + currentRoute.name);
};

window.modificarDestino = function () {
  document.getElementById('successBanner').style.display = 'none';
  document.getElementById('warningBanner').style.display = 'none';
  document.getElementById('comparativaCard').style.display = 'none';
  document.getElementById('planCard').style.display = 'block';
  document.getElementById('routeSearchPanel').style.display = 'block';
  document.getElementById('routeSelectedPanel').style.display = 'none';
  document.getElementById('mapFilterBar').style.display = 'flex';
  document.getElementById('routeInfoBar').style.display = 'none';
  var status = document.getElementById('mapStatusFloat');
  status.classList.remove('map-status-float--active');
  status.querySelector('.map-status-float__title').textContent = 'Monitoreo en vivo';
  status.querySelector('.map-status-float__text').textContent = 'Cobertura activa en tu radio · Ingresa un destino para trazar ruta';

  var options = document.querySelectorAll('#comparativaCard .report-item');
  options.forEach(function (item) { item.classList.remove('selected'); });
  if (options[0]) { options[0].classList.add('selected'); }
  currentRoute = { name: 'Vía Circuito de Playas / Salaverry', time: '21 min', dist: '6.4 km', zonas: '0 zonas críticas', safety: '98' };

  if (routeLine) { map.removeLayer(routeLine); routeLine = null; }
  map.setView(LIMA_CENTER, DEFAULT_ZOOM);
};

/* --- Ubicar un lugar y centrar el mapa automáticamente en él (coordenadas reales de Lima) --- */
var MAP_PLACES = {
  'upc': { lat: -12.0774, lng: -77.0916, label: 'UPC San Miguel' },
  'san miguel': { lat: -12.0768, lng: -77.0925, label: 'San Miguel' },
  'la victoria': { lat: -12.0654, lng: -77.0119, label: 'La Victoria' },
  'magdalena': { lat: -12.0925, lng: -77.0745, label: 'Magdalena del Mar' },
  'san isidro': { lat: -12.0931, lng: -77.0465, label: 'San Isidro' },
  'san borja': { lat: -12.1019, lng: -76.9975, label: 'San Borja' },
  'surquillo': { lat: -12.1116, lng: -77.0128, label: 'Surquillo' },
  'miraflores': { lat: -12.1211, lng: -77.0295, label: 'Miraflores' },
  'barranco': { lat: -12.1494, lng: -77.0206, label: 'Barranco' },
  'callao': { lat: -12.0621, lng: -77.1181, label: 'Callao' },
  'javier prado': { lat: -12.0908, lng: -77.0130, label: 'Av. Javier Prado' },
  'angamos': { lat: -12.1183, lng: -77.0243, label: 'Av. Angamos' },
  'larco': { lat: -12.1216, lng: -77.0295, label: 'Av. Larco' }
};

function normalizePlaceQuery(str) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function findPlace(query) {
  if (!query) return null;
  var q = normalizePlaceQuery(query);
  var bestKey = null;
  Object.keys(MAP_PLACES).forEach(function (key) {
    if (q.indexOf(key) !== -1 && (!bestKey || key.length > bestKey.length)) bestKey = key;
  });
  return bestKey ? MAP_PLACES[bestKey] : null;
}

window.panToPlace = function (query) {
  var place = findPlace(query);
  if (!place) return false;
  map.flyTo([place.lat, place.lng], 15, { duration: 1.1 });
  showToast('Mapa centrado en ' + place.label);
  return true;
};

/* --- Guardar ruta --- */
window.guardarRuta = function () {
  var origin = document.querySelector('#routeSearchPanel .form-input').value || 'Av. Larco 740, Miraflores';
  var dest = document.getElementById('destInput').value;
  var name = dest ? (origin.split(',')[0] + ' → ' + dest.split(',')[0] + ' (' + currentRoute.name + ')') : currentRoute.name;

  document.getElementById('saveRouteNameInput').value = name;
  document.getElementById('saveRouteOrigin').value = origin;
  document.getElementById('saveRouteDest').value = dest || currentRoute.name;
  document.getElementById('saveRouteStats').textContent = currentRoute.safety + '% Seguro · Evita ' + currentRoute.zonas + ' · ' + currentRoute.time + ' · ' + currentRoute.dist;

  openModal('saveRouteModal');
};

window.confirmSaveRoute = function () {
  var name = document.getElementById('saveRouteNameInput').value.trim() || currentRoute.name;
  var el = document.getElementById('savedRouteNew');
  if (el) {
    var nameEl = el.querySelector('strong');
    var metaEl = el.querySelector('.page-subtitle');
    nameEl.textContent = name;
    metaEl.textContent = currentRoute.dist + ' · ' + currentRoute.safety + '% seguro · ' + currentRoute.zonas;
    el.style.display = 'flex';
  }
  closeModal('saveRouteModal');
  showToast('Ruta agregada a tus Rutas Frecuentes');
};

window.usarRutaGuardada = function (btn) {
  showToast('Cargando ruta guardada…');
};
