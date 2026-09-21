var currentRole = 'cliente';
document.querySelectorAll('.role-toggle__btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.role-toggle__btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    currentRole = btn.dataset.role;
    document.getElementById('emailLabel').textContent = currentRole === 'admin'
      ? 'Correo electrónico institucional'
      : 'Correo electrónico institucional o personal';
  });
});

document.getElementById('btnLogin').addEventListener('click', function () {
  var email = document.getElementById('email').value.trim();
  var pass = document.getElementById('password').value;
  var errorEl = document.getElementById('loginError');
  if (!email || !pass) {
    errorEl.textContent = 'Completa todos los campos para continuar.';
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';
  localStorage.setItem('safesignalUser', JSON.stringify({
    email: email,
    nombre: email.split('@')[0],
    distrito: 'Lima, PE',
    rol: currentRole
  }));
  window.location.href = currentRole === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
});

document.getElementById('toggleLoginPass').addEventListener('click', function () {
  var input = document.getElementById('password');
  var show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  var slash = this.querySelector('.eye-slash');
  if (slash) { slash.style.display = show ? 'block' : 'none'; }
  this.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
});
