'use strict';
var seconds = 0;
var timerEl = document.getElementById('segTimer');
var interval = setInterval(function () {
  seconds++;
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var s = seconds % 60;
  timerEl.textContent = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}, 1000);

window.stopTracking = function () {
  clearInterval(interval);
  if (confirm('¿Llegaste a tu destino con seguridad?')) window.location.href = 'historial-recorridos.html';
};

/* --- Mapa real del recorrido en vivo --- */
var ROUTE = [[-12.0954, -77.0428], [-12.1010, -77.0385], [-12.1075, -77.0350], [-12.1130, -77.0325], [-12.1180, -77.0305], [-12.1215, -77.0290]];
var segMap = L.map('map', { zoomControl: true }).setView([-12.1075, -77.0350], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(segMap);
L.polyline(ROUTE, { color: '#22c55e', weight: 5, opacity: .9, lineCap: 'round' }).addTo(segMap);
L.circleMarker(ROUTE[ROUTE.length - 1], { radius: 8, color: 'white', weight: 3, fillColor: '#C0392B', fillOpacity: 1 }).addTo(segMap).bindTooltip('Destino: Av. Larco 345', { permanent: false });
var meMarker = L.circleMarker(ROUTE[0], { radius: 9, color: 'white', weight: 3, fillColor: '#1A3A5C', fillOpacity: 1 }).addTo(segMap).bindTooltip('Tú');
var routeStep = 0;
setInterval(function () {
  routeStep = Math.min(routeStep + 0.01, ROUTE.length - 1);
  var i = Math.floor(routeStep), f = routeStep - i, a = ROUTE[i], b = ROUTE[Math.min(i + 1, ROUTE.length - 1)];
  meMarker.setLatLng([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
}, 1000);
