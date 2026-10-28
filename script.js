const STORAGE_KEY = "absenceFacileRecords";
const form = document.getElementById("absenceForm");
const nameInput = document.getElementById("studentName");
const dateInput = document.getElementById("absenceDate");
const typeInput = document.getElementById("absenceType");
const statusInput = document.getElementById("absenceStatus");
const reasonInput = document.getElementById("absenceReason");
const tableBody = document.getElementById("absenceTableBody");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const toast = document.getElementById("toast");

let absences = loadAbsences();
let toastTimeout;

document.getElementById("todayDate").textContent = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric"
}).format(new Date());

dateInput.value = new Date().toISOString().slice(0, 10);

function loadAbsences() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveAbsences() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(absences));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2500);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function statusClass(status) {
  if (status === "Justifiée") return "justified";
  if (status === "Non justifiée") return "unjustified";
  return "pending";
}

function renderStats() {
  document.getElementById("totalCount").textContent = absences.length;
  document.getElementById("pendingCount").textContent = absences.filter(item => item.status === "En attente").length;
  document.getElementById("justifiedCount").textContent = absences.filter(item => item.status === "Justifiée").length;
}

function renderAbsences() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase("fr");
  const selectedStatus = statusFilter.value;
  const filtered = absences.filter(item => {
    const matchesName = item.name.toLocaleLowerCase("fr").includes(searchTerm);
    const matchesStatus = !selectedStatus || item.status === selectedStatus;
    return matchesName && matchesStatus;
  });

  tableBody.innerHTML = filtered.map(item => `
    <tr>
      <td><strong>${escapeHTML(item.name)}</strong></td>
      <td>${formatDate(item.date)}</td>
      <td>${escapeHTML(item.type)}</td>
      <td><span class="status ${statusClass(item.status)}">${escapeHTML(item.status)}</span></td>
      <td>${escapeHTML(item.reason || "—")}</td>
      <td><button class="delete-btn" type="button" data-delete-id="${item.id}" aria-label="Supprimer l'absence de ${escapeHTML(item.name)}">Supprimer</button></td>
    </tr>
  `).join("");

  emptyMessage.hidden = filtered.length > 0;
  emptyMessage.textContent = absences.length === 0
    ? "Aucune absence enregistrée pour le moment."
    : "Aucun résultat pour cette recherche.";
  renderStats();
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    showToast("Veuillez saisir le nom du stagiaire.");
    return;
  }

  const absence = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    date: dateInput.value,
    type: typeInput.value,
    status: statusInput.value,
    reason: reasonInput.value.trim()
  };

  absences.unshift(absence);
  saveAbsences();
  renderAbsences();
  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  statusInput.value = "En attente";
  showToast("Absence ajoutée avec succès.");
  nameInput.focus();
});

tableBody.addEventListener("click", event => {
  const button = event.target.closest("[data-delete-id]");
  if (!button) return;
  const confirmed = window.confirm("Voulez-vous vraiment supprimer cette absence ?");
  if (!confirmed) return;

  absences = absences.filter(item => item.id !== button.dataset.deleteId);
  saveAbsences();
  renderAbsences();
  showToast("Absence supprimée.");
});

searchInput.addEventListener("input", renderAbsences);
statusFilter.addEventListener("change", renderAbsences);

renderAbsences();
