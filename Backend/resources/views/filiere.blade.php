<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Gestion des Filières</title>
    <!-- Bootstrap -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light">

<div class="container mt-5">

    <h2 class="text-center mb-4">Liste des Filières</h2>

    <!-- Barre de recherche -->
    {{-- <div class="input-group mb-4">
        <input type="text" id="search" class="form-control" placeholder="Rechercher une filière..." onkeyup="searchFiliere()">
        <button class="btn btn-primary" onclick="searchFiliere()">Rechercher</button>
    </div> --}}

    <!-- Formulaire d'ajout -->
    <div class="card mb-4">
        <div class="card-header">Ajouter une Filière</div>
        <div class="card-body">
            <form id="addForm" onsubmit="event.preventDefault(); addFiliere();">
                <div class="mb-3">
                    <label>Code Filière</label>
                    <input type="text" class="form-control" id="code_filiere" required>
                </div>

                <div class="mb-3">
                    <label>Libellé Filière</label>
                    <input type="text" class="form-control" id="label_filiere" required>
                </div>

                <div class="mb-3">
                    <label>Description</label>
                    <textarea class="form-control" id="desc_filiere"></textarea>
                </div>

                <button type="submit" class="btn btn-success">Ajouter</button>
            </form>
        </div>
    </div>

    <!-- Tableau -->
    <table class="table table-striped table-bordered">
        <thead class="table-dark">
        <tr>
            <th>Code</th>
            <th>Libellé</th>
            <th>Description</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody id="filiereTable">
        </tbody>
    </table>
</div>

<!-- Modale pour modifier -->
<div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="editModalLabel">Modifier Filière</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
      </div>
      <div class="modal-body">
        <form id="editForm">
            <input type="hidden" id="edit_code_filiere">
            <div class="mb-3">
                <label>Libellé Filière</label>
                <input type="text" class="form-control" id="edit_label_filiere" required>
            </div>
            <div class="mb-3">
                <label>Description</label>
                <textarea class="form-control" id="edit_desc_filiere"></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Modifier</button>
        </form>
      </div>
    </div>
  </div>
</div>

<!-- Modale pour confirmation suppression -->
<div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="deleteModalLabel">Confirmer la suppression</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
      </div>
      <div class="modal-body">
        Voulez-vous vraiment supprimer cette filière ?
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Supprimer</button>
      </div>
    </div>
  </div>
</div>

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

<script>
const BASE_URL = "/api/filieres";
let deleteCode = null;
let searchTimeout;
let editModal = new bootstrap.Modal(document.getElementById('editModal'));
let deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

document.addEventListener('DOMContentLoaded', loadFilieres);

// Charger la liste
function loadFilieres() {
    fetch(BASE_URL)
        .then(res => res.json())
        .then(data => displayFilieres(data))
        .catch(err => console.error("Erreur API :", err));
}

// Affichage dans tableau
function displayFilieres(list) {
    const tbody = document.getElementById("filiereTable");
    tbody.innerHTML = "";
    
    list.forEach(f => {
        const tr = document.createElement('tr');
        
        const tdCode = document.createElement('td');
        tdCode.textContent = f.code_filiere;
        
        const tdLabel = document.createElement('td');
        tdLabel.textContent = f.label_filiere;
        
        const tdDesc = document.createElement('td');
        tdDesc.textContent = f.desc_filiere || '';
        
        const tdActions = document.createElement('td');
        const btnModifier = document.createElement('button');
        btnModifier.className = 'btn btn-warning btn-sm me-2';
        btnModifier.textContent = 'Modifier';
        btnModifier.onclick = () => openEditModal(f.code_filiere, f.label_filiere, f.desc_filiere || '');
        
        const btnSupprimer = document.createElement('button');
        btnSupprimer.className = 'btn btn-danger btn-sm';
        btnSupprimer.textContent = 'Supprimer';
        btnSupprimer.onclick = () => openDeleteModal(f.code_filiere);
        
        tdActions.appendChild(btnModifier);
        tdActions.appendChild(btnSupprimer);
        
        tr.appendChild(tdCode);
        tr.appendChild(tdLabel);
        tr.appendChild(tdDesc);
        tr.appendChild(tdActions);
        
        tbody.appendChild(tr);
    });
}

// Ajouter une filière
function addFiliere() {
    let data = {
        code_filiere: document.getElementById("code_filiere").value,
        label_filiere: document.getElementById("label_filiere").value,
        desc_filiere: document.getElementById("desc_filiere").value,
    };

    fetch(BASE_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        document.getElementById("addForm").reset();
        loadFilieres();
    })
    .catch(err => console.error("Erreur POST :", err));
}

// Ouvrir modale modification
function openEditModal(code, label, desc) {
    document.getElementById('edit_code_filiere').value = code;
    document.getElementById('edit_label_filiere').value = label;
    document.getElementById('edit_desc_filiere').value = desc;
    editModal.show();
}

// Soumettre modification
document.getElementById('editForm').addEventListener('submit', function(e) {
    e.preventDefault();
    let code = document.getElementById('edit_code_filiere').value;
    let data = {
        label_filiere: document.getElementById('edit_label_filiere').value,
        desc_filiere: document.getElementById('edit_desc_filiere').value
    };

    fetch(`${BASE_URL}/${code}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
      
        editModal.hide();
        loadFilieres();
    })
    .catch(err => console.error("Erreur PUT :", err));
});

// Ouvrir modale suppression
function openDeleteModal(code) {
    deleteCode = code;
    deleteModal.show();
}

// Confirmer suppression
document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
    fetch(`${BASE_URL}/${deleteCode}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(res => {
      
        deleteModal.hide();
        loadFilieres();
    })
    .catch(err => console.error("Erreur DELETE :", err));
});

// Recherche (avec délai pour éviter trop de requêtes)
function searchFiliere() {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        let q = document.getElementById("search").value.trim();
        if (!q) return loadFilieres();

        fetch(`/api/filieres/search?q=${q}`)
            .then(res => res.json())
            .then(data => {
                if (data.message) {
                    displayFilieres([]);
                } else {
                    displayFilieres(data);
                }
            })
            .catch(err => console.error("Erreur SEARCH :", err));
    }, 300); // Attendre 300ms avant de chercher
}
</script>

</body>
</html>
