/* Umbrales de Riesgo — alterna entre el estado "por definir" (valores vacíos, calibración manual)
   y el estado "con datos" (umbrales ya calculados sobre una ubicación buscada). */
(function () {
  function displayFor(el) {
    if (el.classList.contains('badge')) return 'inline-flex';
    if (el.classList.contains('page-header__row')) return 'flex';
    return 'block';
  }

  function setMode(mode) {
    var isFilled = mode === 'filled';
    document.querySelectorAll('[data-state="filled"]').forEach(function (el) {
      el.style.display = isFilled ? displayFor(el) : 'none';
    });
    document.querySelectorAll('[data-state="empty"]').forEach(function (el) {
      el.style.display = isFilled ? 'none' : displayFor(el);
    });

    var grid = document.getElementById('umbralesGrid');
    if (grid) grid.classList.toggle('is-empty-state', !isFilled);

    var slider = document.getElementById('calibSlider');
    if (slider) slider.style.width = isFilled ? '50%' : '0%';

    var search = document.getElementById('umbralSearch');
    if (search) {
      if (isFilled) {
        if (!search.value) search.value = 'Av. Perú 30';
      } else {
        search.value = '';
      }
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setMode('filled');

    var btnReset = document.getElementById('btnResetUmbrales');
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        document.querySelectorAll('.threshold-input-box__field').forEach(function (f) { f.value = ''; });
        setMode('empty');
        if (typeof showToast === 'function') showToast('Valores restablecidos. Define nuevamente los umbrales por ubicación.');
      });
    }

    var btnGuardar = document.getElementById('btnGuardarUmbrales');
    if (btnGuardar) {
      btnGuardar.addEventListener('click', function () {
        setMode('filled');
        if (typeof showToast === 'function') showToast('Cambios guardados correctamente.');
      });
    }

    var search = document.getElementById('umbralSearch');
    if (search) {
      search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && search.value.trim() !== '') {
          e.preventDefault();
          setMode('filled');
          if (typeof showToast === 'function') showToast('Umbrales recalculados para "' + search.value.trim() + '".');
        }
      });
    }
  });
})();
