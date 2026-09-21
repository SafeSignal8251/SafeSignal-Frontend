document.getElementById('btnSend').addEventListener('click', function () {
  var email = document.getElementById('email').value.trim();
  var errorBox = document.getElementById('recoverError');
  var successBox = document.getElementById('successMsg');
  var input = document.getElementById('email');
  successBox.style.display = 'none';
  errorBox.style.display = 'none';
  input.classList.remove('input-error');

  if (!email || !email.includes('@')) {
    errorBox.style.display = 'block';
    input.classList.add('input-error');
    return;
  }
  // Demo: simula que solo cuentas registradas en localStorage existen
  var user = JSON.parse(localStorage.getItem('safesignalUser') || 'null');
  if (user && user.email && user.email.toLowerCase() !== email.toLowerCase()) {
    errorBox.style.display = 'block';
    input.classList.add('input-error');
    return;
  }
  successBox.style.display = 'flex';
  successBox.innerHTML += '<br><a href="#" id="simulateLink" class="form-link">Ya tengo el código, crear nueva contraseña →</a>';
  document.getElementById('simulateLink').addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector('.recover-card').style.display = 'none';
    document.getElementById('resetCard').style.display = 'block';
  });
});

document.getElementById('btnResetPass').addEventListener('click', function () {
  var p1 = document.getElementById('newPass').value;
  var p2 = document.getElementById('newPassConf').value;
  if (!p1 || p1.length < 8 || p1 !== p2) {
    showToastFallback('Revisa que ambas contraseñas coincidan y tengan al menos 8 caracteres.');
    return;
  }
  window.location.href = 'login.html';
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

function showToastFallback(msg) {
  if (typeof showToast === 'function') { showToast(msg); } else { alert(msg); }
}
