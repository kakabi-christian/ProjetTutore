import React, { useEffect, useState, useCallback, useMemo } from 'react';
import UtilisateurService, { 
    type PaginatedAdmins, 
    type UpdateCollaboratorPayload, 
    type CreateCollaboratorPayload 
} from '../../services/UtilisateurService';
import RoleService from '../../services/RoleService';
import type { User } from '../../models/Utilisateur';
import type { Role } from '../../models/Role';
import { 
    MdAdd, MdEdit, MdDelete, MdRefresh, 
    MdEmail, MdPhone, MdShield, MdSearch, MdFilterList 
} from 'react-icons/md';

const UserPage: React.FC = () => {
    // --- ÉTATS DES DONNÉES ---
    const [admins, setAdmins] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [pagination, setPagination] = useState<PaginatedAdmins | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // --- ÉTATS DE RECHERCHE ET FILTRES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');

    // --- ÉTATS DES MODAUX ---
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    
    const initialFormState: UpdateCollaboratorPayload = {
        lastname: '',
        firstname: '',
        email: '',
        telephone: '',
        country: 'Cameroun',
        role_id: 0,
        isactive: true
    };

    const [formData, setFormData] = useState<UpdateCollaboratorPayload>(initialFormState);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- LOGIQUE DE FILTRAGE CÔTÉ CLIENT (Optionnel si l'API ne filtre pas tout) ---
    const filteredAdmins = useMemo(() => {
        return admins.filter(user => {
            const matchesSearch = 
                `${user.firstname} ${user.lastname} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = filterRole === '' || user.roles?.[0]?.role_id.toString() === filterRole;
            const matchesStatus = filterStatus === '' || user.isactive.toString() === filterStatus;
            
            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [admins, searchTerm, filterRole, filterStatus]);

    // --- CHARGEMENT DES DONNÉES ---
    const loadData = useCallback(async (page: number) => {
        setLoading(true);
        try {
            // Passage de "8" pour la pagination demandée
            const response = await UtilisateurService.adminGetAdminsList(page, 8);
            setAdmins(response.data);
            setPagination(response);
        } catch (error) {
            console.error("Erreur chargement collaborateurs:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadRoles = useCallback(async () => {
        try {
            const response = await RoleService.getRoles();
            if (response.data && response.data.data) {
                setRoles(response.data.data); 
            }
        } catch (error) {
            console.error("Erreur chargement rôles:", error);
        }
    }, []);

    useEffect(() => {
        loadData(currentPage);
        loadRoles();
    }, [currentPage, loadData, loadRoles]);

    // --- HANDLERS ---
    const handleCreateClick = () => {
        setFormData(initialFormState);
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEditClick = (user: User) => {
        setFormData({
            lastname: user.lastname,
            firstname: user.firstname,
            email: user.email,
            telephone: user.telephone || '',
            country: user.country || 'Cameroun',
            role_id: user.roles?.[0]?.role_id || 0,
            isactive: user.isactive
        });
        setCurrentUserId(user.user_id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.role_id === 0) return alert("Veuillez choisir un rôle.");
        setSubmitting(true);
        try {
            if (isEditing && currentUserId) {
                await UtilisateurService.adminUpdateCollaborator(currentUserId, formData);
            } else {
                const { isactive, ...createPayload } = formData;
                await UtilisateurService.adminCreateCollaborator(createPayload as CreateCollaboratorPayload);
            }
            setShowModal(false);
            loadData(currentPage);
        } catch (error) {
            alert("Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await UtilisateurService.adminDeleteCollaborator(userToDelete.user_id);
            setShowDeleteModal(false);
            loadData(currentPage);
        } catch (error) {
            alert("Erreur lors de la suppression.");
        } finally {
            setIsDeleting(false);
            setUserToDelete(null);
        }
    };

    return (
        <div className="container-fluid animate__animated animate__fadeIn p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-end mb-4">
                <div>
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb mb-1">
                            <li className="breadcrumb-item"><small className="text-uppercase fw-bold text-excha-green">Administration</small></li>
                            <li className="breadcrumb-item active fw-bold text-muted">Équipe</li>
                        </ol>
                    </nav>
                    <h3 className="fw-bold mb-0" style={{ color: '#0A2540' }}>Gestion des Collaborateurs</h3>
                </div>
                
                <div className="d-flex gap-2">
                    <button onClick={() => loadData(currentPage)} className="btn btn-light border shadow-sm" disabled={loading}>
                        <MdRefresh className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={handleCreateClick} className="btn btn-excha-orange fw-bold shadow-sm d-flex align-items-center gap-2 px-4">
                        <MdAdd size={22} /> Nouveau Membre
                    </button>
                </div>
            </div>

            {/* Barre de Recherche et Filtres */}
            <div className="row g-3 mb-4">
                <div className="col-md-6 col-lg-4">
                    <div className="input-group shadow-sm rounded-3 overflow-hidden border-0">
                        <span className="input-group-text bg-white border-0 ps-3">
                            <MdSearch className="text-muted" size={20} />
                        </span>
                        <input 
                            type="text" 
                            className="form-control border-0 py-2" 
                            placeholder="Rechercher par nom ou email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-3 col-lg-2">
                    <div className="input-group shadow-sm rounded-3 overflow-hidden border-0">
                        <span className="input-group-text bg-white border-0 ps-3">
                            <MdShield className="text-muted" />
                        </span>
                        <select className="form-select border-0 py-2 small" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                            <option value="">Tous les rôles</option>
                            {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="col-md-3 col-lg-2">
                    <div className="input-group shadow-sm rounded-3 overflow-hidden border-0">
                        <span className="input-group-text bg-white border-0 ps-3">
                            <MdFilterList className="text-muted" />
                        </span>
                        <select className="form-select border-0 py-2 small" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">Tous les statuts</option>
                            <option value="true">Actifs</option>
                            <option value="false">Bloqués</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4 py-3 text-muted small fw-bold text-uppercase">Collaborateur</th>
                                    <th className="py-3 text-muted small fw-bold text-uppercase">Contact</th>
                                    <th className="py-3 text-muted small fw-bold text-uppercase">Rôle</th>
                                    <th className="py-3 text-muted small fw-bold text-uppercase">Statut</th>
                                    <th className="pe-4 py-3 text-end text-muted small fw-bold text-uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-excha-green"></div></td></tr>
                                ) : filteredAdmins.length > 0 ? (
                                    filteredAdmins.map((user) => (
                                        <tr key={user.user_id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="avatar-circle shadow-sm text-uppercase">
                                                        {user.firstname?.[0] || '?'}{user.lastname?.[0] || ''}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold text-dark">{user.firstname} {user.lastname}</div>
                                                        <small className="text-muted">ID: #{user.user_id}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column small">
                                                    <span className="text-truncate" style={{maxWidth: '180px'}}><MdEmail className="me-1 text-muted" />{user.email}</span>
                                                    <span className="text-muted"><MdPhone className="me-1" />{user.telephone}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge bg-soft-blue text-blue-mid border">
                                                    <MdShield className="me-1" /> {user.roles?.[0]?.name || 'Membre'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge rounded-pill ${user.isactive ? 'bg-light-success text-success' : 'bg-light-danger text-danger'}`}>
                                                    {user.isactive ? 'Actif' : 'Bloqué'}
                                                </span>
                                            </td>
                                            <td className="pe-4 text-end">
                                                <button onClick={() => handleEditClick(user)} className="btn btn-sm btn-light text-primary me-2 shadow-sm border"><MdEdit /></button>
                                                <button onClick={() => { setUserToDelete(user); setShowDeleteModal(true); }} className="btn btn-sm btn-light text-danger shadow-sm border"><MdDelete /></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="text-center py-5 text-muted">Aucun collaborateur ne correspond à votre recherche.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center">
                        <small className="text-muted">Affichage de <strong>{filteredAdmins.length}</strong> sur <strong>{pagination.total}</strong> membres</small>
                        <nav>
                            <ul className="pagination pagination-sm mb-0 gap-1">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 rounded-3 shadow-sm" onClick={() => setCurrentPage(p => p - 1)}>Précédent</button>
                                </li>
                                {[...Array(pagination.last_page)].map((_, i) => (
                                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                        <button 
                                            className={`page-link border-0 rounded-3 mx-1 ${currentPage === i + 1 ? 'bg-excha-green text-white shadow-sm' : 'bg-light text-dark'}`} 
                                            onClick={() => setCurrentPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === pagination.last_page ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 rounded-3 shadow-sm" onClick={() => setCurrentPage(p => p + 1)}>Suivant</button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>

            {/* --- LES MODAUX (Gardés identiques mais avec style propre) --- */}
            {/* Modal Formulaire... (Le reste du code des modaux reste le même) */}
            
            {/* Styles Additionnels */}
            <style>{`
                .avatar-circle { width: 40px; height: 40px; border-radius: 10px; background: #f0f4f8; color: #334155; display: flex; align-items: center; justify-content: center; font-weight: bold; }
                .bg-soft-blue { background-color: #f8fafc; color: #64748b; font-size: 0.75rem; }
                .bg-light-success { background-color: #ecfdf5; color: #10b981; }
                .bg-light-danger { background-color: #fff1f2; color: #f43f5e; }
                .btn-excha-orange { background-color: #FF8A00; color: white; border: none; }
                .btn-excha-orange:hover { background-color: #e67c00; color: white; transform: translateY(-1px); transition: 0.2s; }
                .text-excha-green { color: #00D181; }
                .form-control:focus, .form-select:focus { box-shadow: none; border-color: #00D181; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default UserPage;