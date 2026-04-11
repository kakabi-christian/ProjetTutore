import React, { useEffect, useState, useCallback } from 'react';
import RoleService from "../../services/RoleService";
import type { Role, RolePayload } from "../../models/Role";
import PermissionService from '../../services/PermissionService';
import type { Permission } from "../../models/Permission";
import { 
  MdShield, 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdRefresh, 
  MdWarning,
  MdVpnKey,
  MdCheckCircle,
  MdChevronLeft,
  MdChevronRight
} from "react-icons/md";

const RolePage: React.FC = () => {
    // --- ÉTATS DES DONNÉES ---
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [pagination, setPagination] = useState({ current: 1, last: 1, total: 0 });

    // --- ÉTATS FORMULAIRE ---
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);
    const [formData, setFormData] = useState<RolePayload>({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    // --- ÉTATS SUPPRESSION ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- ÉTATS PERMISSIONS ---
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [assigning, setAssigning] = useState(false);

    // --- ÉTATS FEEDBACK ---
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // --- LOGIQUE DE CHARGEMENT ---
    const loadData = useCallback(async (page: number = 1) => {
        setLoading(true);
        try {
            const response = await RoleService.getRoles(page);
            setRoles(response.data.data);
            setPagination({
                current: response.data.current_page,
                last: response.data.last_page,
                total: response.data.total
            });
        } catch (error) {
            console.error("Erreur chargement rôles:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(pagination.current);
    }, [loadData, pagination.current]);

    // --- HANDLERS PERMISSIONS ---
    const handlePermissionClick = async (role: Role) => {
        setCurrentRoleId(role.role_id);
        setShowPermissionModal(true);
        setLoadingPermissions(true);
        try {
            const allPermsRes = await PermissionService.getAllPermissions(1, 100);
            setAllPermissions(allPermsRes.data);

            const currentPermsRes = await PermissionService.getPermissionsByRole(role.role_id);
            const currentIds = currentPermsRes.data.map((p: Permission) => p.permission_id);
            setSelectedPermissions(currentIds);
        } catch (error) {
            console.error("Erreur récupération permissions:", error);
        } finally {
            setLoadingPermissions(false);
        }
    };

    const togglePermission = (id: number) => {
        setSelectedPermissions(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSavePermissions = async () => {
        if (!currentRoleId) return;
        setAssigning(true);
        try {
            await PermissionService.assignPermissions({
                role_id: currentRoleId,
                permissions: selectedPermissions
            });
            setShowPermissionModal(false);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Erreur assignation permissions:", error);
        } finally {
            setAssigning(false);
        }
    };

    // --- HANDLERS CRUD RÔLES ---
    const handleCreateClick = () => {
        setFormData({ name: '', description: '' });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEditClick = (role: Role) => {
        setFormData({ name: role.name, description: role.description });
        setCurrentRoleId(role.role_id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing && currentRoleId) {
                await RoleService.updateRole(currentRoleId, formData);
            } else {
                await RoleService.createRole(formData);
            }
            setShowModal(false);
            loadData(pagination.current);
        } catch (error) {
            console.error("Erreur enregistrement rôle:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (role: Role) => {
        setRoleToDelete(role);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;
        setIsDeleting(true);
        try {
            await RoleService.deleteRole(roleToDelete.role_id);
            setShowDeleteModal(false);
            setRoleToDelete(null);
            loadData(1); // Retour page 1 après suppression
        } catch (error) {
            console.error("Erreur suppression rôle:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="container-fluid animate__animated animate__fadeIn p-4">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <nav>
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item">
                            <small className="text-uppercase fw-bold text-excha-green">Configuration</small>
                        </li>
                        <li className="breadcrumb-item active fw-bold text-muted small text-uppercase">Accès</li>
                    </ol>
                    <h3 className="fw-bold mt-2" style={{ color: 'var(--blue)' }}>
                        <MdShield className="me-2 text-excha-green" />
                        Gestion des Rôles
                    </h3>
                </nav>
                
                <div className="d-flex gap-2">
                    <button 
                        onClick={() => loadData(pagination.current)} 
                        className="btn border shadow-sm bg-white rounded-3" 
                        style={{ color: 'var(--blue)' }}
                        disabled={loading}
                    >
                        <MdRefresh className={loading ? 'spin-anim' : ''} />
                    </button>
                    <button onClick={handleCreateClick} className="btn btn-excha-orange fw-bold shadow-sm d-flex align-items-center gap-2 px-4 rounded-3">
                        <MdAdd size={20} /> Nouveau Rôle
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="card shadow-sm border-0 bg-white mb-4" style={{ borderRadius: '15px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#F8FAFC' }}>
                                <tr>
                                    <th className="py-3 px-4 small fw-bold text-muted text-uppercase">Nom du rôle</th>
                                    <th className="py-3 small fw-bold text-muted text-uppercase">Description</th>
                                    <th className="py-3 text-end px-4 small fw-bold text-muted text-uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-5">
                                            <div className="spinner-border text-excha-green"></div>
                                            <p className="mt-2 text-muted small">Chargement des rôles...</p>
                                        </td>
                                    </tr>
                                ) : roles.length > 0 ? (
                                    roles.map((role) => (
                                        <tr key={role.role_id}>
                                            <td className="px-4">
                                                <span className="badge p-2 px-3 fw-bold" style={{ backgroundColor: "rgba(0, 200, 150, 0.1)", color: "var(--green)", borderRadius: "8px" }}>
                                                    {role.name}
                                                </span>
                                            </td>
                                            <td className="text-muted small">{role.description || "Aucune description fournie."}</td>
                                            <td className="text-end px-4">
                                                <div className="btn-group">
                                                    <button 
                                                        onClick={() => handlePermissionClick(role)} 
                                                        className="btn btn-sm me-2 border-0 shadow-sm rounded-2" 
                                                        style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}
                                                        title="Gérer les permissions"
                                                    >
                                                        <MdVpnKey />
                                                    </button>
                                                    <button onClick={() => handleEditClick(role)} className="btn btn-sm me-2 border-0 shadow-sm rounded-2" style={{ backgroundColor: '#E0F2FE', color: '#0284c7' }}><MdEdit /></button>
                                                    <button onClick={() => handleDeleteClick(role)} className="btn btn-sm border-0 shadow-sm rounded-2" style={{ backgroundColor: '#FEE2E2', color: '#dc2626' }}><MdDelete /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="text-center py-5 text-muted">Aucun rôle disponible.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Pagination Footer */}
                <div className="card-footer bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center">
                    <small className="text-muted">Total : <strong>{pagination.total}</strong> rôles</small>
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-sm btn-light rounded-circle" 
                            disabled={pagination.current === 1}
                            onClick={() => setPagination(p => ({...p, current: p.current - 1}))}
                        >
                            <MdChevronLeft size={20} />
                        </button>
                        <span className="align-self-center small fw-bold">Page {pagination.current} sur {pagination.last}</span>
                        <button 
                            className="btn btn-sm btn-light rounded-circle" 
                            disabled={pagination.current === pagination.last}
                            onClick={() => setPagination(p => ({...p, current: p.current + 1}))}
                        >
                            <MdChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL PERMISSIONS --- */}
            {showPermissionModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                            <div className="modal-header border-0 p-4 bg-white">
                                <div className="d-flex align-items-center">
                                    <div className="p-3 rounded-4 me-3" style={{ backgroundColor: '#FEF3C7' }}>
                                        <MdVpnKey size={28} className="text-warning" />
                                    </div>
                                    <div>
                                        <h5 className="modal-title fw-bolder mb-0" style={{ color: '#1e293b' }}>Privilèges d'accès</h5>
                                        <p className="mb-0 text-muted small">Configuration des droits pour : <span className="fw-bold text-excha-green">{roles.find(r => r.role_id === currentRoleId)?.name}</span></p>
                                    </div>
                                </div>
                                <button type="button" className="btn-close bg-light rounded-circle p-2" onClick={() => setShowPermissionModal(false)}></button>
                            </div>

                            <div className="modal-body p-4 bg-light" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                                {loadingPermissions ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-grow text-excha-green" role="status"></div>
                                        <p className="mt-3 text-muted fw-bold">Synchronisation des permissions...</p>
                                    </div>
                                ) : (
                                    <div className="row g-3">
                                        {allPermissions.map((perm) => {
                                            const isSelected = selectedPermissions.includes(perm.permission_id);
                                            return (
                                                <div className="col-md-6" key={perm.permission_id}>
                                                    <div 
                                                        onClick={() => togglePermission(perm.permission_id)}
                                                        className="card border-0 h-100 shadow-sm transition-all"
                                                        style={{ 
                                                            borderRadius: '16px', 
                                                            cursor: 'pointer',
                                                            border: isSelected ? '2px solid var(--green)' : '2px solid transparent',
                                                            backgroundColor: isSelected ? '#F0FDF4' : 'white'
                                                        }}
                                                    >
                                                        <div className="card-body p-3 d-flex align-items-center">
                                                            <div className="flex-grow-1">
                                                                <h6 className={`mb-1 fw-bold ${isSelected ? 'text-excha-green' : 'text-dark'}`}>
                                                                    {perm.name}
                                                                </h6>
                                                                <p className="mb-0 text-muted small" style={{ fontSize: '0.8rem' }}>
                                                                    {perm.description || "Droit d'accès spécifique au module."}
                                                                </p>
                                                            </div>
                                                            <div className="ms-3">
                                                                {isSelected ? 
                                                                    <MdCheckCircle className="text-excha-green" size={24} /> : 
                                                                    <div className="border-2 border rounded-circle" style={{ width: '22px', height: '22px', borderColor: '#e2e8f0' }}></div>
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer border-0 p-4 bg-white justify-content-between">
                                <div className="text-muted small">
                                    <strong>{selectedPermissions.length}</strong> sélectionnés
                                </div>
                                <div className="d-flex gap-2">
                                    <button className="btn fw-bold text-muted" onClick={() => setShowPermissionModal(false)}>Annuler</button>
                                    <button 
                                        className="btn btn-excha-green fw-bold px-4 py-2 shadow-sm rounded-pill d-flex align-items-center gap-2"
                                        onClick={handleSavePermissions}
                                        disabled={assigning}
                                    >
                                        {assigning ? <span className="spinner-border spinner-border-sm"></span> : 'Mettre à jour les droits'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL FORMULAIRE RÔLE --- */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(10, 37, 64, 0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold">
                                    {isEditing ? 'Modifier le Rôle' : 'Créer un Nouveau Rôle'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-muted text-uppercase">Nom du rôle</label>
                                        <input 
                                            type="text" 
                                            className="form-control border-0 bg-light p-3" 
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            placeholder="Ex: Manager, Support..."
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-muted text-uppercase">Description</label>
                                        <textarea 
                                            className="form-control border-0 bg-light p-3" 
                                            rows={3} 
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Détaillez les responsabilités..."
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn fw-bold px-4 text-muted" onClick={() => setShowModal(false)}>Annuler</button>
                                    <button type="submit" className="btn btn-excha-orange fw-bold px-5 py-2 shadow-sm rounded-pill" disabled={submitting}>
                                        {submitting ? <span className="spinner-border spinner-border-sm"></span> : (isEditing ? 'Enregistrer' : 'Confirmer')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL SUPPRESSION --- */}
            {showDeleteModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(10, 37, 64, 0.6)', zIndex: 1050 }}>
                     <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-body p-4 text-center">
                                <div className="bg-light-danger rounded-circle d-inline-block p-3 mb-3">
                                    <MdWarning size={40} className="text-danger" />
                                </div>
                                <h5 className="fw-bold">Suppression</h5>
                                <p className="text-muted small">Voulez-vous supprimer le rôle <br/><strong>{roleToDelete?.name}</strong> ?</p>
                                <div className="d-grid gap-2 mt-4">
                                    <button className="btn btn-danger fw-bold py-2 rounded-pill shadow-sm" onClick={confirmDelete} disabled={isDeleting}>
                                        {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
                                    </button>
                                    <button className="btn btn-light fw-bold py-2 rounded-pill" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Annuler</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL SUCCÈS (AUTO-HIDE POSSIBLE) --- */}
            {showSuccessModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg animate__animated animate__zoomIn" style={{ borderRadius: '25px' }}>
                            <div className="modal-body p-5 text-center">
                                <div className="mb-4 d-inline-block p-3 rounded-circle" style={{ backgroundColor: '#DCFCE7' }}>
                                    <MdCheckCircle size={60} className="text-excha-green" />
                                </div>
                                <h4 className="fw-bolder mb-2">Mis à jour !</h4>
                                <p className="text-muted mb-4 small">L'opération s'est déroulée avec succès.</p>
                                <button className="btn btn-excha-green w-100 fw-bold py-2 shadow-sm rounded-pill" onClick={() => setShowSuccessModal(false)}>
                                    Continuer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Styles inline pour l'animation de refresh */}
            <style>{`
                .spin-anim { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .transition-all { transition: all 0.2s ease-in-out; }
                .transition-all:hover { transform: translateY(-2px); }
                .bg-light-danger { backgroundColor: #FEE2E2; }
            `}</style>
        </div>
    );
};

export default RolePage;