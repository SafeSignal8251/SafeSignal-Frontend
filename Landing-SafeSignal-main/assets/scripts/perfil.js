var profileSnapshot = null;

function setEditModeUI(editing) {
  var pageHeading = document.getElementById('pageHeading');
  var pageSubheading = document.getElementById('pageSubheading');
  var verifiedBadge = document.getElementById('verifiedBadge');
  var usernameLine = document.getElementById('profileUsernameLine');
  var cuentaActivaBadge = document.getElementById('cuentaActivaBadge');
  var avatarDot = document.getElementById('avatarDot');
  var modeLabel = document.getElementById('modeLabel');
  var btnChangePass = document.getElementById('btnChangePass');
  var btnCancelEdit = document.getElementById('btnCancelEdit');

  if (editing) {
    pageHeading.textContent = 'Editar perfil';
    pageSubheading.textContent = 'Gestiona tu identidad digital y contactos de emergencia.';
    verifiedBadge.style.display = 'none';
    usernameLine.style.display = 'none';
    cuentaActivaBadge.style.display = 'none';
    avatarDot.style.display = 'none';
    modeLabel.style.display = 'none';
    btnChangePass.style.display = 'none';
    btnCancelEdit.style.display = '';
  } else {
    pageHeading.textContent = 'Mi Perfil';
    pageSubheading.textContent = 'Consulta tu información de usuario, ubicación registrada y contactos de emergencia.';
    verifiedBadge.style.display = '';
    usernameLine.style.display = '';
    cuentaActivaBadge.style.display = 'inline-flex';
    avatarDot.style.display = '';
    modeLabel.style.display = '';
    modeLabel.textContent = 'Modo lectura';
    btnChangePass.style.display = '';
    btnCancelEdit.style.display = 'none';
  }
}

function snapshotFields() {
  var fields = document.querySelectorAll('.profile-field');
  var snap = {};
  fields.forEach(function (f) { snap[f.id] = f.value; });
  return snap;
}

function toggleEdit() {
  var fields = document.querySelectorAll('.profile-field');
  var btn = document.getElementById('btnEditToggle');
  var editing = btn.textContent.trim() === 'Guardar cambios';

  if (editing) {
    saveProfile();
    fields.forEach(function (f) { f.setAttribute('readonly', 'readonly'); });
    btn.textContent = 'Editar perfil';
    setEditModeUI(false);
    profileSnapshot = null;
  } else {
    profileSnapshot = snapshotFields();
    fields.forEach(function (f) { f.removeAttribute('readonly'); });
    btn.textContent = 'Guardar cambios';
    setEditModeUI(true);
  }
}

function cancelEdit() {
  var fields = document.querySelectorAll('.profile-field');
  if (profileSnapshot) {
    fields.forEach(function (f) { if (profileSnapshot.hasOwnProperty(f.id)) f.value = profileSnapshot[f.id]; });
  }
  fields.forEach(function (f) { f.setAttribute('readonly', 'readonly'); });
  document.getElementById('btnEditToggle').textContent = 'Editar perfil';
  setEditModeUI(false);
  profileSnapshot = null;
}

function saveProfile() {
  var user = JSON.parse(localStorage.getItem('safesignalUser') || '{}');
  user.nombre = (document.getElementById('pNombres').value + ' ' + document.getElementById('pApellidos').value).trim() || user.nombre;
  user.email = document.getElementById('pEmail').value || user.email;
  user.distrito = document.getElementById('pDistrito').value;
  localStorage.setItem('safesignalUser', JSON.stringify(user));
  document.getElementById('saveBar').style.display = 'flex';
  setTimeout(function () { document.getElementById('saveBar').style.display = 'none'; }, 3000);
}

function confirmDeleteAccountProfile() {
  closeModal('deleteModal');
  localStorage.removeItem('safesignalUser');
  window.location.href = 'login.html';
}

document.querySelectorAll('[data-modal]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.getElementById(btn.dataset.modal).style.display = 'flex';
  });
});

var user = JSON.parse(localStorage.getItem('safesignalUser') || '{}');
if (user.nombre) {
  var parts = user.nombre.split(' ');
  document.getElementById('pNombres').value = parts[0] || '';
  document.getElementById('pApellidos').value = parts.slice(1).join(' ') || '';
  document.getElementById('bigAvatar').textContent = (user.nombre[0] || 'U').toUpperCase();
}
if (user.email) document.getElementById('pEmail').value = user.email;
if (user.telefono) document.getElementById('pTel').value = user.telefono;
