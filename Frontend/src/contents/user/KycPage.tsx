import React, { useEffect, useState } from 'react';
import KycService from '../../services/KycService';
import { typeDocumentService } from '../../services/TypeDocumentService';
import type { Kyc } from '../../models/Kyc';
import type { TypeDocument } from '../../models/Documents';
import { toast } from 'react-toastify';

// Liste simplifiée pour l'exemple
const COUNTRIES = ["Cameroun", "Gabon", "Congo", "Tchad", "Centrafrique", "Guinée Équatoriale", "France", "USA"];

export default function KycPage() {
    const [kycStatus, setKycStatus] = useState<Kyc | null>(null);
    const [types, setTypes] = useState<TypeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [country, setCountry] = useState('Cameroun');
    const [selectedFiles, setSelectedFiles] = useState<{ file: File; type_document_id: number }[]>([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [statusRes, typesRes] = await Promise.all([
                KycService.getMyKycStatus(),
                typeDocumentService.getAll()
            ]);
            setKycStatus(statusRes.data);
            setTypes(typesRes.data);
        } catch (error) {
            console.error("Erreur de chargement", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, typeId: number) => {
        if (e.target.files && e.target.files[0]) {
            const newFile = e.target.files[0];
            setSelectedFiles(prev => {
                const filtered = prev.filter(f => f.type_document_id !== typeId);
                return [...filtered, { file: newFile, type_document_id: typeId }];
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) return toast.error("Veuillez sélectionner au moins un document");

        setSubmitting(true);
        try {
            await KycService.submitKyc({ country_of_issue: country, documents: selectedFiles });
            toast.success("Dossier soumis avec succès !");
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur lors de la soumission");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-5 text-excha-green">Chargement de votre dossier...</div>;

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-7">
                    
                    {/* --- HEADER --- */}
                    <div className="mb-4 text-center">
                        <h2 className="fw-bold bg-excha-blue d-inline-block px-3 py-1 rounded">Vérification KYC</h2>
                        <p className="text-muted mt-2">Validez votre identité pour débloquer vos limites.</p>
                    </div>

                    {/* --- CONTENEUR PRINCIPAL SOMBRE --- */}
                    <div className="card border-0 shadow-lg p-4 p-lg-5" style={{ backgroundColor: '#0A2540', borderRadius: '20px' }}>
                        
                        {kycStatus && kycStatus.status !== 'REJECTED' ? (
                            /* --- AFFICHAGE STATUT --- */
                            <div className="text-center py-4">
                                {kycStatus.status === 'PENDING' ? (
                                    <>
                                        <div className="spinner-border text-excha-orange mb-3" style={{ width: '3rem', height: '3rem' }}></div>
                                        <h4 className="text-white">Dossier en attente</h4>
                                        <p style={{ color: '#8A9BB0' }}>Nos agents vérifient vos documents. Patience !</p>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-circle-fill text-excha-green display-2 mb-3"></i>
                                        <h4 className="text-white">Identité Confirmée</h4>
                                        <p style={{ color: '#8A9BB0' }}>Votre accès est désormais illimité.</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            /* --- FORMULAIRE --- */
                            <form onSubmit={handleSubmit}>
                                
                                {kycStatus?.status === 'REJECTED' && (
                                    <div className="alert alert-danger border-0 mb-4" style={{ backgroundColor: 'rgba(255,107,43,0.1)', color: '#FF6B2B' }}>
                                        <strong>Dossier refusé :</strong> {kycStatus.rejection_reason}
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="form-label text-white small fw-bold text-uppercase opacity-75">Pays d'émission</label>
                                    <select 
                                        className="form-select border-0 text-white" 
                                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', height: '50px' }}
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        required
                                    >
                                        {COUNTRIES.map(c => <option key={c} value={c} className="bg-excha-blue">{c}</option>)}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-white small fw-bold text-uppercase opacity-75 mb-3">Pièces justificatives</label>
                                    <div className="d-grid gap-3">
                                        {types.map((type) => (
                                            <div key={type.type_document_id} className="p-3 rounded-3" style={{ border: '1px dashed rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                                <div className="d-flex justify-content-between mb-2">
                                                    <span className="text-excha-green fw-bold">{type.name}</span>
                                                    {selectedFiles.some(f => f.type_document_id === type.type_document_id) && 
                                                        <span className="badge bg-success small">Sélectionné</span>
                                                    }
                                                </div>
                                                <input 
                                                    type="file" 
                                                    className="form-control form-control-sm bg-transparent border-0 text-white p-0"
                                                    onChange={(e) => handleFileChange(e, type.type_document_id)}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-excha-orange w-100 py-3 fw-bold shadow-sm"
                                    disabled={submitting || selectedFiles.length === 0}
                                >
                                    {submitting ? "Traitement en cours..." : "ENVOYER MON DOSSIER"}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="mt-4 text-center opacity-50">
                        <small className="text-dark">Sécurisé par ExchaPay Protocol</small>
                    </div>
                </div>
            </div>
        </div>
    );
}