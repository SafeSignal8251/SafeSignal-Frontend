var regRole = 'cliente';
var texts = {
  cliente: {
    title: 'Crear cuenta',
    sub: 'Únete a la red de seguridad ciudadana más confiable de Lima.',
    email: 'Correo electrónico institucional o personal', emailPh: 'usuario@ejemplo.com',
    id: 'DNI', idPh: 'Ej. 74581290',
    phone: 'Teléfono móvil', phonePh: 'Ej. 987 654 321',
    entity: 'Distrito de residencia',
    entityPh: 'Selecciona tu distrito (Lima)',
    entityOptions: ['Miraflores', 'San Isidro', 'Barranco', 'Surco', 'San Borja', 'La Molina', 'Jesús María', 'Lince', 'Magdalena', 'Pueblo Libre', 'Cercado de Lima', 'Callao', 'Los Olivos', 'San Martín de Porres', 'Otro']
  },
  admin: {
    title: 'Crear cuenta de Administrador',
    sub: 'Registro oficial para personal de supervisión, Serenazgo y C5.',
    email: 'Correo electrónico institucional', emailPh: 'supervisor@serenazgo.gob.pe o c5@seguridad.gob.pe',
    id: 'Código de Placa / CIP / ID Operativo', idPh: 'Ej. CIP-849201',
    phone: 'Teléfono institucional / de turno', phonePh: 'Ej. 987 654 321',
    entity: 'Entidad, Municipalidad o Central de Monitoreo',
    entityPh: 'Selecciona tu entidad o municipalidad',
    entityOptions: ['Serenazgo Miraflores', 'Serenazgo San Isidro', 'Serenazgo Surquillo', 'Serenazgo San Borja', 'Serenazgo Barranco', 'Central C5 Lima', 'Municipalidad de Lima', 'Otro']
  }
};

function applyRegisterTexts(role) {
  var t = texts[role];
  document.getElementById('registerTitle').textContent = t.title;
  document.getElementById('registerSub').textContent = t.sub;
  document.getElementById('emailLabel').textContent = t.email;
  document.getElementById('email').placeholder = t.emailPh;
  document.getElementById('idLabel').textContent = t.id;
  document.getElementById('docId').placeholder = t.idPh;
  document.getElementById('phoneLabel').textContent = t.phone;
  document.getElementById('telefono').placeholder = t.phonePh;
  document.getElementById('entityLabel').textContent = t.entity;
  var select = document.getElementById('distrito');
  var current = select.value;
  select.innerHTML = '<option value="">' + t.entityPh + '</option>' +
    t.entityOptions.map(function (opt) { return '<option>' + opt + '</option>'; }).join('');
  if (t.entityOptions.indexOf(current) !== -1) { select.value = current; }
}

document.querySelectorAll('.role-toggle__btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.role-toggle__btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    regRole = btn.dataset.role;
    applyRegisterTexts(regRole);
  });
});

document.getElementById('btnRegister').addEventListener('click', function () {
  var nombres = document.getElementById('nombres').value.trim();
  var email = document.getElementById('email').value.trim();
  var pass = document.getElementById('pass').value;
  var passConf = document.getElementById('passConf').value;
  var errorEl = document.getElementById('registerError');
  if (!nombres || !email || !pass || pass.length < 8 || pass !== passConf) {
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';
  localStorage.setItem('safesignalUser', JSON.stringify({
    email: email, nombre: nombres, distrito: document.getElementById('distrito').value || 'Lima, PE', rol: regRole
  }));
  window.location.href = regRole === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
});

document.querySelectorAll('.form-eye-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var input = document.getElementById(btn.dataset.target);
    var show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    var slash = btn.querySelector('.eye-slash');
    if (slash) { slash.style.display = show ? 'block' : 'none'; }
    btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
});
