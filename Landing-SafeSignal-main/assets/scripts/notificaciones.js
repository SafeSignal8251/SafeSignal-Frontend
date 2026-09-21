function toggleChannel(el) { el.classList.toggle('active'); showSave(); }
function showSave() { document.getElementById('saveBar').classList.add('visible'); }
function hideSave() { document.getElementById('saveBar').classList.remove('visible'); }
function saveSettings() { hideSave(); }
function toggleSilent() {
  var show = document.getElementById('silentToggle').checked;
  document.getElementById('silentTimes').style.display = show ? 'block' : 'none';
  showSave();
}
