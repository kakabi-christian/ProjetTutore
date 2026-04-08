import { useEffect, useState, useCallback, useMemo } from 'react';
import KycService from '../../services/KycService';
import type { Kyc } from '../../models/Kyc';
import { toast } from 'react-toastify';
import { 
    MdChevronLeft, 
    MdChevronRight, 
    MdVisibility, 
    MdCheck, 
    MdClose, 
    MdSearch,
    MdFilterList 
} from 'react-icons/md';

export default function KycAdmin() {
    const [kycs, setKycs] = useState<Kyc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKyc, setSelectedKyc] = useState<Kyc | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // --- ÉTATS DE FILTRE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // --- ÉTATS DE PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchKycs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await KycService.getAllKycs();
            setKycs(response.data);
        } catch (error) {
            toast.error("Erreur lors de la récupération des dossiers");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKycs();
    }, [fetchKycs]);

    // --- LOGIQUE DE FILTRAGE ET PAGINATION ---
    const filteredKycs = useMemo(() => {
        return kycs.filter(kyc => {
            const matchesStatus = statusFilter === 'ALL' || kyc.status === statusFilter;
            const fullName = `${kyc.utilisateur?.firstname} ${kyc.utilisateur?.lastname}`.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                                 kyc.utilisateur?.email?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [kycs, searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredKycs.length / itemsPerPage);
    
    const currentItems = useMemo(() => {
        const lastIndex = currentPage * itemsPerPage;
        const firstIndex = lastIndex - itemsPerPage;
        return filteredKycs.slice(firstIndex, lastIndex);
    }, [filteredKycs, currentPage, itemsPerPage]);

    // Reset de la page quand on filtre
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleApprove = async (id: number) => {
        if (!window.confirm("Approuver ce dossier ?")) return;
        setProcessing(true);
        try {
            await KycService.approveKyc(id);
            toast.success("Dossier approuvé !");
            
            // Notification pour mettre à jour le compteur dans la Sidebar
            window.dispatchEvent(new Event('kyc-status-changed'));
            
            fetchKycs();
            setSelectedKyc(null);
        } catch (error) {
            toast.error("Erreur lors de l'approbation");
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (id: number) => {
        if (!rejectionReason.trim()) return toast.warning("Le motif est obligatoire");
        setProcessing(true);
        try {
            await KycService.rejectKyc(id, rejectionReason);
            toast.info("Dossier rejeté");
            
            // Notification pour mettre à jour le compteur dans la Sidebar
            window.dispatchEvent(new Event('kyc-status-changed'));
            
            fetchKycs();
            setSelectedKyc(null);
            setRejectionReason('');
        } catch (error) {
            toast.error("Erreur lors du rejet");
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'PENDING': { bg: 'rgba(255, 107, 43, 0.1)', color: 'var(--orange)', label: 'En attente' },
            'APPROVED': { bg: 'rgba(0, 200, 150, 0.1)', color: 'var(--green)', label: 'Approuvé' },
            'REJECTED': { bg: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', label: 'Rejeté' }
        };
        const style = styles[status] || { bg: '#eee', color: '#666', label: status };
        return (
            <span className="badge rounded-pill px-3 py-2 fw-bold" 
                  style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.color}40` }}>
                {style.label}
            </span>
        );
    };

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100" style={{ color: 'var(--blue)' }}>
            <div className="spinner-border me-2" role="status"></div>
            <span className="fw-bold">Chargement ExchaPay...</span>
        </div>
    );

    return (
        <div className="container-fluid py-4" style={{ backgroundColor: '#F8FFFE', minHeight: '100vh' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold" style={{ color: 'var(--blue)' }}>Validation des KYC</h2>
                <span className="badge shadow-sm px-3 py-2 border bg-white text-dark">
                    {filteredKycs.length} résultat(s)
                </span>
            </div>

            {/* --- BARRE DE FILTRES --- */}
            <div className="row g-3 mb-4">
                <div className="col-md-8">
                    <div className="input-group shadow-sm rounded-4 overflow-hidden border-0">
                        <span className="input-group-text bg-white border-0 ps-3">
                            <MdSearch size={22} color="var(--blue)" />
                        </span>
                        <input 
                            type="text" 
                            className="form-control border-0 py-2 shadow-none" 
                            placeholder="Rechercher un utilisateur (Nom, email...)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="input-group shadow-sm rounded-4 overflow-hidden border-0">
                        <span className="input-group-text bg-white border-0 ps-3">
                            <MdFilterList size={22} color="var(--blue)" />
                        </span>
                        <select 
                            className="form-select border-0 py-2 shadow-none"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tous les statuts</option>
                            <option value="PENDING">En attente</option>
                            <option value="APPROVED">Approuvés</option>
                            <option value="REJECTED">Rejetés</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: 'var(--blue)', color: 'white' }}>
                            <tr>
                                <th className="px-4 py-3 border-0">Utilisateur</th>
                                <th className="border-0">Pays d'émission</th>
                                <th className="border-0">Statut</th>
                                <th className="border-0">Date</th>
                                <th className="text-end px-4 border-0">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.length > 0 ? (
                                currentItems.map((kyc) => (
                                    <tr key={kyc.kyc_id} className="border-bottom">
                                        <td className="px-4 py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold me-3 shadow-sm" 
                                                     style={{ width: '40px', height: '40px', backgroundColor: 'var(--green)', color: 'white' }}>
                                                    {kyc.utilisateur?.firstname?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="fw-bold" style={{ color: 'var(--blue)' }}>
                                                        {kyc.utilisateur?.firstname} {kyc.utilisateur?.lastname}
                                                    </div>
                                                    <div className="text-muted small">{kyc.utilisateur?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-muted">
                                            {kyc.documents?.[0]?.country_of_issue || 'N/A'}
                                        </td>
                                        <td>{getStatusBadge(kyc.status)}</td>
                                        <td className="text-muted small">
                                            {new Date(kyc.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-end px-4">
                                            <button 
                                                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold shadow-sm"
                                                onClick={() => setSelectedKyc(kyc)}
                                            >
                                                <MdVisibility className="me-1" /> Examiner
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-5 text-muted">
                                        Aucun dossier ne correspond à votre recherche.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="card-footer bg-white border-top-0 p-3 d-flex justify-content-between align-items-center">
                    <div className="text-muted small fw-medium">
                        Page {currentPage} sur {totalPages || 1}
                    </div>
                    
                    <div className="d-flex align-items-center gap-3">
                        <select 
                            className="form-select form-select-sm border-0 bg-light" 
                            style={{ width: 'auto', cursor: 'pointer' }}
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); }}
                        >
                            <option value={5}>5 / page</option>
                            <option value={10}>10 / page</option>
                            <option value={20}>20 / page</option>
                        </select>

                        <nav>
                            <ul className="pagination pagination-sm mb-0 gap-1">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link rounded-circle border-0" onClick={() => handlePageChange(currentPage - 1)}>
                                        <MdChevronLeft size={20} />
                                    </button>
                                </li>
                                <li className="page-item active">
                                    <span className="page-link rounded-circle border-0 fw-bold" style={{ backgroundColor: 'var(--blue)' }}>
                                        {currentPage}
                                    </span>
                                </li>
                                <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                                    <button className="page-link rounded-circle border-0" onClick={() => handlePageChange(currentPage + 1)}>
                                        <MdChevronRight size={20} />
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* --- MODAL D'EXAMEN --- */}
            {selectedKyc && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(10, 37, 64, 0.85)', backdropFilter: 'blur(4px)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-header border-0 p-4 pb-0">
                                <h5 className="fw-bold" style={{ color: 'var(--blue)' }}>
                                    Examen : {selectedKyc.utilisateur?.firstname} {selectedKyc.utilisateur?.lastname}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setSelectedKyc(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="row g-3 mb-4">
                                    {selectedKyc.documents?.map((doc) => (
                                        <div key={doc.document_id} className="col-md-6">
                                            <div className="card h-100 border shadow-sm rounded-3 overflow-hidden">
                                                <div className="card-header bg-light small fw-bold d-flex justify-content-between border-0">
                                                    <span>{doc.type_document?.name || 'Document'}</span>
                                                    <span className="text-primary">{doc.country_of_issue}</span>
                                                </div>
                                                <div className="bg-dark d-flex align-items-center justify-content-center" style={{ height: '250px' }}>
                                                    <img 
                                                        src={`${import.meta.env.VITE_API_BASE_URL}/storage/${doc.file_url}`} 
                                                        alt="KYC Doc"
                                                        className="img-fluid h-100 object-fit-contain p-1"
                                                        onError={(e) => { (e.target as any).src = 'https://placehold.co/400x300?text=Image+Indisponible'; }}
                                                    />
                                                </div>
                                                <a href={`${import.meta.env.VITE_API_BASE_URL}/storage/${doc.file_url}`} 
                                                   target="_blank" rel="noreferrer" 
                                                   className="card-footer bg-white text-center text-decoration-none small fw-bold py-2">
                                                    AGRANDIR L'IMAGE
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedKyc.status === 'PENDING' && (
                                    <div className="p-3 rounded-4" style={{ backgroundColor: '#f1f5f9' }}>
                                        <label className="form-label fw-bold small text-muted text-uppercase">Motif du rejet</label>
                                        <textarea 
                                            className="form-control border-0 shadow-sm mb-3" 
                                            rows={2}
                                            placeholder="Ex: Image floue ou document expiré..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        ></textarea>
                                        <div className="d-flex gap-3">
                                            <button 
                                                className="btn btn-success flex-grow-1 py-2 fw-bold text-white shadow-sm"
                                                onClick={() => handleApprove(selectedKyc.kyc_id)}
                                                disabled={processing}
                                            >
                                                {processing ? '...' : <><MdCheck /> APPROUVER</>}
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger flex-grow-1 py-2 fw-bold"
                                                onClick={() => handleReject(selectedKyc.kyc_id)}
                                                disabled={processing || !rejectionReason.trim()}
                                            >
                                                <MdClose /> REJETER
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}