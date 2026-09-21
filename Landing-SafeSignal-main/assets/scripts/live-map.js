/* Mapas reales (Leaflet + OpenStreetMap) para los paneles que antes usaban una imagen.
   Uso: <div data-live-map data-lat="-12.12" data-lng="-77.03" data-zoom="15"> ... </div>
   Se elimina el <img> del contenedor; el resto de hijos quedan como capas superpuestas. */
(function () {
  'use strict';
  var maps = new WeakMap();

  function mount(host) {
    if (maps.has(host) || typeof L === 'undefined') return maps.get(host);
    var img = host.querySelector(':scope > img');
    if (img) img.remove();

    var canvas = document.createElement('div');
    canvas.className = 'live-map-canvas';
    host.insertBefore(canvas, host.firstChild);

    var lat = parseFloat(host.dataset.lat), lng = parseFloat(host.dataset.lng);
    var map = L.map(canvas, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: host.dataset.wheel === '1'
    }).setView([lat, lng], parseInt(host.dataset.zoom || '15', 10));
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    maps.set(host, map);
    return map;
  }

  window.LiveMap = {
    mount: mount,
    get: function (host) { return maps.get(host); },
    setView: function (host, lat, lng, zoom) {
      var m = maps.get(host);
      if (m) m.setView([lat, lng], zoom || m.getZoom());
    }
  };

  document.querySelectorAll('[data-live-map]').forEach(mount);
})();
