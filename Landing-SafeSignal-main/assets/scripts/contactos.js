'use strict';

var editingCard = null;
var deleteTargetCard = null;

function initials(name) {
  var parts = name.trim().split(/\s+/);
  var letters = parts[0] ? parts[0][0] : '';
  if (parts[1]) letters += parts[1][0];
  return letters.toUpperCase();
}

var priorityBadgeClass = ['badge--red', 'badge--blue', 'badge--gray'];
var editIconSvg = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M11 2L14 5L6 13H3V10L11 2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
var trashIconSvg = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 4.5H13M6.5 4.5V2.8C6.5 2.4 6.8 2 7.2 2H8.8C9.2 2 9.5 2.4 9.5 2.8V4.5M4.5 4.5L5 13C5 13.5 5.4 14 6 14H10C10.6 14 11 13.5 11 13L11.5 4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
var phoneIconSvg = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2.5H5.5L6.5 5.5L5 6.5C5.5 8 7 9.5 8.5 10L9.5 8.5L12.5 9.5V12C12.5 12.6 12 13 11.5 13C6.5 13 3 9.5 3 4.5C3 3.9 3 2.5 3 2.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';
var checkIconSvg = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.3 8L7.2 9.8L10.7 6.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function buildContactCard(name, phone, relation, priorityIndex) {
  var card = document.createElement('div');
  card.className = 'card mb-8';
  card.dataset.name = name;
  card.dataset.phone = phone;
  card.dataset.relation = relation;
  card.dataset.priority = priorityIndex + 1;

  card.innerHTML =
    '<div class="flex-gap-10" style="align-items:center;justify-content:space-between;">' +
      '<div class="flex-gap-10" style="align-items:center;">' +
        '<div class="contact-initials">' + initials(name) + '</div>' +
        '<div>' +
          '<div class="flex-gap-10" style="align-items:center;">' +
            '<strong style="color:var(--navy);">' + name + '</strong>' +
            '<span class="badge ' + priorityBadgeClass[priorityIndex % 3] + ' badge-caps">Prioridad ' + (priorityIndex + 1) + '</span>' +
            '<span class="badge badge--gray">' + relation + '</span>' +
          '</div>' +
          '<div class="contact-phone-row">' + phoneIconSvg + phone + '</div>' +
          '<span class="status-ok text-sm">' + checkIconSvg + 'SMS &amp; WhatsApp</span>' +
        '</div>' +
      '</div>' +
      '<div class="row-gap-8">' +
        '<button class="icon-btn" title="Editar contacto" onclick="editContact(this)">' + editIconSvg + '</button>' +
        '<button class="icon-btn icon-btn--danger" title="Eliminar contacto" data-modal="deleteContactModal" onclick="prepDelete(this)">' + trashIconSvg + '</button>' +
      '</div>' +
    '</div>';
  return card;
}

function resetContactModal() {
  document.getElementById('contactName').value = '';
  document.getElementById('contactPhone').value = '';
  document.getElementById('contactRelation').value = '';
  document.getElementById('contactModalTitle').textContent = 'Agregar contacto de confianza';
  editingCard = null;
}

function saveContact() {
  var name = document.getElementById('contactName').value.trim();
  var phone = document.getElementById('contactPhone').value.trim();
  var relation = document.getElementById('contactRelation').value.trim() || 'Contacto de confianza';

  if (!name || !phone) {
    showToast('Completa al menos el nombre y el teléfono del contacto.');
    return;
  }

  var list = document.getElementById('contactsList');

  if (editingCard) {
    editingCard.dataset.name = name;
    editingCard.dataset.phone = phone;
    editingCard.dataset.relation = relation;
    editingCard.querySelector('strong').textContent = name;
    editingCard.querySelector('.contact-initials').textContent = initials(name);
    editingCard.querySelector('.contact-phone-row').innerHTML = phoneIconSvg + phone;
    editingCard.querySelector('.badge--gray').textContent = relation;
  } else {
    var count = list.children.length;
    if (count >= 5) {
      showToast('Ya registraste el máximo de 5 contactos de confianza.');
      return;
    }
    list.appendChild(buildContactCard(name, phone, relation, count));
  }

  resetContactModal();
  closeModal('addContactModal');
  showToast('Contacto guardado correctamente.');
}

function editContact(btn) {
  var card = btn.closest('.card');
  editingCard = card;
  document.getElementById('contactName').value = card.dataset.name;
  document.getElementById('contactPhone').value = card.dataset.phone;
  document.getElementById('contactRelation').value = card.dataset.relation;
  document.getElementById('contactModalTitle').textContent = 'Editar contacto de confianza';
  openModal('addContactModal');
}

function prepDelete(btn) {
  deleteTargetCard = btn.closest('.card');
  var name = deleteTargetCard.dataset.name || 'este contacto';
  var relation = deleteTargetCard.dataset.relation || 'Contacto de confianza';
  var phone = deleteTargetCard.dataset.phone || '';
  var priority = deleteTargetCard.dataset.priority || '1';
  var priorityIndex = (parseInt(priority, 10) || 1) - 1;

  document.getElementById('deleteContactName').textContent = name;
  document.getElementById('deleteContactMeta').textContent = '(Prioridad ' + priority + ' - ' + relation + ')';
  document.getElementById('deleteContactInitials').textContent = initials(name);
  document.getElementById('deleteContactNamePreview').textContent = name;
  document.getElementById('deleteContactRelationPreview').textContent = relation;
  document.getElementById('deleteContactPhonePreview').textContent = phone;

  var priorityBadge = document.getElementById('deleteContactPriorityPreview');
  priorityBadge.textContent = 'Prioridad ' + priority;
  priorityBadge.className = 'badge ' + priorityBadgeClass[priorityIndex % 3];
}

function confirmDeleteContact() {
  if (deleteTargetCard) {
    deleteTargetCard.remove();
    deleteTargetCard = null;
  }
  closeModal('deleteContactModal');
  showToast('Contacto eliminado.');
}
