import React, { useEffect, useState, useCallback } from 'react';
import { typeDocumentService, type PaginationMeta } from '../../services/TypeDocumentService';
import type { TypeDocument, CreateTypeDocument } from '../../models/TypeDocument';
import { MdAdd, MdEdit, MdDelete, MdRefresh, MdWarning } from 'react-icons/md';

const TypeDocumentPage: React.FC = () => {
    // États pour les données
    const [documents, setDocuments] = useState<TypeDocument[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // États pour le Modal Formulaire (Ajout/Edition)
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentDocId, setCurrentDocId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CreateTypeDocument>({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);

    // États pour le Modal de Suppression
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [docToDelete, setDocToDelete] = useState<TypeDocument | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Charger les données
    const loadData = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const response = await typeDocumentService.getAll(page, 5);
            setDocuments(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error("Erreur chargement:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(currentPage);
    }, [currentPage, loadData]);

    // Handlers pour le Formulaire
    const handleCreateClick = () => {
        setFormData({ name: '', description: '' });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleEditClick = (doc: TypeDocument) => {
        setFormData({ name: doc.name, description: doc.description });
        setCurrentDocId(doc.type_document_id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing && currentDocId) {
                await typeDocumentService.update(currentDocId, formData);
            } else {
                await typeDocumentService.create(formData);
            }
            setShowModal(false);
            loadData(currentPage);
        } catch (error) {
            alert("Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    // Handlers pour la Suppression
    const handleDeleteClick = (doc: TypeDocument) => {
        setDocToDelete(doc);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!docToDelete) return;
        setIsDeleting(true);
        try {
            await typeDocumentService.delete(docToDelete.type_document_id);
            setShowDeleteModal(false);
            setDocToDelete(null);
            loadData(currentPage);
        } catch (error) {
            alert("Erreur lors de la suppression.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="container-fluid animate__animated animate__fadeIn p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <nav>
                    <ol className="breadcrumb mb-0">
                        <li className="breadcrumb-item"><small className="text-uppercase fw-bold text-excha-green">Admin</small></li>
                        <li className="breadcrumb-item active fw-bold text-muted">Gestion des documents</li>
                    </ol>
                    <h3 className="fw-bold mt-2" style={{ color: 'var(--blue)' }}>Types de Documents</h3>
                </nav>
                
                <div className="d-flex gap-2">
                    <button 
                        onClick={() => loadData(currentPage)} 
                        className="btn border shadow-sm" 
                        style={{ backgroundColor: 'var(--white)', color: 'var(--blue)' }}
                        disabled={loading}
                    >
                        <MdRefresh className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={handleCreateClick} className="btn btn-excha-orange fw-bold shadow-sm d-flex align-items-center gap-2 px-4">
                        <MdAdd size={20} /> Nouveau Type
                    </button>
                </div>
            </div>

            {/* Table Card */}
            <div className="card shadow-sm border-0" style={{ backgroundColor: 'white', borderRadius: '15px', overflow: 'hidden' }}>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#F1F5F9' }}>
                                <tr>
                                    <th className="py-3 small fw-bold" style={{ color: 'var(--gray)' }}>NOM DU DOCUMENT</th>
                                    <th className="py-3 small fw-bold" style={{ color: 'var(--gray)' }}>DESCRIPTION</th>
                                    <th className="py-3 text-end px-4 small fw-bold" style={{ color: 'var(--gray)' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center py-5"><div className="spinner-border text-excha-green"></div></td></tr>
                                ) : documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <tr key={doc.type_document_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td className="fw-bold" style={{ color: 'var(--blue-mid)' }}>{doc.name}</td>
                                            <td className="text-muted text-truncate" style={{ maxWidth: '350px' }}>{doc.description}</td>
                                            <td className="text-end px-4">
                                                <button onClick={() => handleEditClick(doc)} className="btn btn-sm me-2 border-0" style={{ backgroundColor: '#E0F2FE', color: 'var(--blue-light)' }}><MdEdit /></button>
                                                <button onClick={() => handleDeleteClick(doc)} className="btn btn-sm border-0" style={{ backgroundColor: '#FEE2E2', color: 'var(--orange)' }}><MdDelete /></button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={4} className="text-center py-5 text-muted">Aucun document trouvé.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {pagination && documents.length > 0 && (
                    <div className="card-footer bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center border-top">
                        <span className="small text-muted">Affichage de <strong>{pagination.from}</strong> à <strong>{pagination.to}</strong> sur <strong>{pagination.total}</strong></span>
                        <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className="page-link border-0 shadow-none" onClick={() => setCurrentPage(prev => prev - 1)}>Précédent</button>
                            </li>
                            {[...Array(pagination.last_page)].map((_, i) => (
                                <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                                    <button 
                                        className="page-link border-0 mx-1 rounded shadow-none" 
                                        style={currentPage === i + 1 ? { backgroundColor: 'var(--green)', color: 'white' } : { color: 'var(--blue)' }}
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === pagination.last_page ? 'disabled' : ''}`}>
                                <button className="page-link border-0 shadow-none" onClick={() => setCurrentPage(prev => prev + 1)}>Suivant</button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Note Information */}
            <div className="mt-4 p-3 rounded shadow-sm border-start border-excha-green border-4" style={{ backgroundColor: 'white' }}>
                <small className="text-muted">
                    <strong className="text-excha-green">Note :</strong> Ces types définissent les pièces justificatives 
                    demandées aux utilisateurs d'ExchaPay.
                </small>
            </div>

            {/* --- MODAL DE FORMULAIRE (AJOUT / EDIT) --- */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(10, 37, 64, 0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="modal-title fw-bold" style={{ color: 'var(--blue)' }}>
                                    {isEditing ? 'Modifier le Type' : 'Nouveau Type de Document'}
                                </h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-muted">NOM DU DOCUMENT</label>
                                        <input 
                                            type="text" 
                                            className="form-control border-0 bg-light p-3 shadow-none" 
                                            style={{ borderRadius: '10px' }}
                                            placeholder="Ex: Carte Nationale d'Identité(CNI)"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-muted">DESCRIPTION / INSTRUCTIONS</label>
                                        <textarea 
                                            className="form-control border-0 bg-light p-3 shadow-none" 
                                            style={{ borderRadius: '10px' }}
                                            placeholder="(Optionnel)"
                                            rows={4} 
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0">
                                    <button type="button" className="btn fw-bold px-4" style={{ color: 'var(--gray)' }} onClick={() => setShowModal(false)} disabled={submitting}>Annuler</button>
                                    <button type="submit" className="btn btn-excha-orange fw-bold px-5 py-2 shadow-sm" disabled={submitting}>
                                        {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : (isEditing ? 'Mettre à jour' : 'Créer le type')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL DE CONFIRMATION DE SUPPRESSION --- */}
            {showDeleteModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(10, 37, 64, 0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                            <div className="modal-body p-4 text-center">
                                <div className="mb-3 text-danger">
                                    <MdWarning size={50} />
                                </div>
                                <h5 className="fw-bold mb-2">Confirmation</h5>
                                <p className="text-muted small">
                                    Voulez-vous vraiment supprimer le type <strong>{docToDelete?.name}</strong> ? Cette action est irréversible.
                                </p>
                            </div>
                            <div className="modal-footer border-0 p-4 pt-0 d-flex justify-content-center gap-2">
                                <button 
                                    type="button" 
                                    className="btn btn-light fw-bold px-4 shadow-sm" 
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-danger fw-bold px-4 shadow-sm"
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <span className="spinner-border spinner-border-sm"></span> : 'Supprimer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TypeDocumentPage;