import React, { useState, useEffect } from 'react';
import { 
    MdPayments, 
    MdAdd, 
    MdDeleteOutline, 
    MdAccountBalance, 
    MdSmartphone,
    MdWarning
} from 'react-icons/md';
import { paymentMethodService } from '../../services/PaymentMethodService';
import type { CreatePaymentMethodPayload } from '../../services/PaymentMethodService';
import type { MethodPayment, AvailableProvider } from '../../models/MehodPayment';
import type { User } from '../../models/Utilisateur';

export default function MethodPaymentUser() {
    const [myMethods, setMyMethods] = useState<MethodPayment[]>([]);
    const [availableProviders, setAvailableProviders] = useState<{ mobile_networks: AvailableProvider[], banks: AvailableProvider[] }>({ mobile_networks: [], banks: [] });
    const [loading, setLoading] = useState(true);
    
    // Modales
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState<{show: boolean, id: number | null}>({ show: false, id: null });

    const [formData, setFormData] = useState<CreatePaymentMethodPayload>({
        type: '' as any, 
        provider: '',
        account_number: '',
        account_name: '',
        currency: 'XAF',
        bank_code: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const res = await paymentMethodService.getUserMethods();
            setMyMethods(res.data || []);

            const userData = localStorage.getItem('user_data');
            if (userData) {
                const user: User = JSON.parse(userData);
                const country = user.country_code || 'CM';

                const rawProviders = await paymentMethodService.getAvailableProviders(country);
                
                const mobileKeywords = ['orangemoney', 'MTN', 'YUP', 'EUMOBILE'];
                
                const extractedMobile = rawProviders.banks.filter(p => 
                    (p.code && mobileKeywords.includes(p.code)) || 
                    p.name.toLowerCase().includes('money')
                );

                const extractedBanks = rawProviders.banks.filter(p => 
                    (!p.code || !mobileKeywords.includes(p.code)) && 
                    !p.name.toLowerCase().includes('money')
                );

                setAvailableProviders({
                    mobile_networks: extractedMobile,
                    banks: extractedBanks
                });
                
                if (extractedMobile.length > 0) {
                    setFormData(prev => ({ ...prev, type: 'MOBILE_MONEY' }));
                } else if (extractedBanks.length > 0) {
                    setFormData(prev => ({ ...prev, type: 'BANK' }));
                }
            }
        } catch (error) {
            console.error("Erreur chargement:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMethod = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await paymentMethodService.storeMethod(formData);
            setShowAddModal(false);
            setFormData({ ...formData, provider: '', account_number: '', account_name: '', bank_code: '' });
            fetchInitialData();
        } catch (error) {
            alert("Erreur lors de l'ajout.");
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfig.id) return;
        try {
            await paymentMethodService.deleteMethod(deleteConfig.id);
            setDeleteConfig({ show: false, id: null });
            fetchInitialData();
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold text-excha-blue">
                    <MdPayments className="me-2 text-excha-orange" /> Mes Comptes de Paiement
                </h4>
                <button className="btn btn-excha-orange text-white fw-bold shadow-sm" onClick={() => setShowAddModal(true)}>
                    <MdAdd size={20} /> Ajouter un compte
                </button>
            </div>

            <div className="row">
                {loading ? (
                    <div className="text-center p-5"><div className="spinner-border text-excha-orange"></div></div>
                ) : myMethods.length === 0 ? (
                    <div className="text-center p-5 text-muted">Aucun compte enregistré pour le moment.</div>
                ) : (
                    myMethods.map((method) => (
                        <div key={method.method_payment_id} className="col-md-4 mb-3">
                            <div className="card border-0 shadow-sm p-3 position-relative" style={{ borderRadius: '15px' }}>
                                <div className="d-flex align-items-center mb-2">
                                    {method.type === 'MOBILE_MONEY' ? <MdSmartphone className="text-excha-orange me-2" /> : <MdAccountBalance className="text-excha-blue me-2" />}
                                    <span className="fw-bold">{method.provider}</span>
                                </div>
                                <h5 className="mb-1 fw-bold text-excha-blue">{method.account_number}</h5>
                                <p className="text-muted small mb-0">{method.account_name}</p>
                                <button 
                                    onClick={() => setDeleteConfig({ show: true, id: method.method_payment_id })} 
                                    className="btn btn-link text-danger position-absolute top-0 end-0 mt-2 p-1"
                                >
                                    <MdDeleteOutline size={22} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODALE D'AJOUT */}
            {showAddModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow" style={{ borderRadius: '20px' }}>
                            <form onSubmit={handleAddMethod}>
                                <div className="modal-header border-0">
                                    <h5 className="fw-bold">Ajouter un nouveau compte</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Type de transaction</label>
                                        <select 
                                            className="form-select border-2" 
                                            value={formData.type}
                                            onChange={(e) => setFormData({...formData, type: e.target.value as any, provider: '', bank_code: ''})}
                                        >
                                            <option value="">Sélectionnez le type...</option>
                                            {availableProviders.mobile_networks.length > 0 && <option value="MOBILE_MONEY">Mobile Money / Portefeuille</option>}
                                            {availableProviders.banks.length > 0 && <option value="BANK">Compte Bancaire</option>}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Opérateur ou Banque</label>
                                        <select 
                                            className="form-select border-2" 
                                            required
                                            value={formData.provider}
                                            onChange={(e) => {
                                                const list = formData.type === 'MOBILE_MONEY' ? availableProviders.mobile_networks : availableProviders.banks;
                                                const selected = list.find(p => p.name === e.target.value);
                                                setFormData({ ...formData, provider: e.target.value, bank_code: selected?.code || '' });
                                            }}
                                        >
                                            <option value="">-- Choisir dans la liste --</option>
                                            {(formData.type === 'MOBILE_MONEY' ? availableProviders.mobile_networks : availableProviders.banks).map(p => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Numéro ou RIB</label>
                                        <input type="text" className="form-control border-2" required value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Nom du titulaire</label>
                                        <input type="text" className="form-control border-2" required value={formData.account_name} onChange={(e) => setFormData({...formData, account_name: e.target.value})} />
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="submit" className="btn btn-excha-orange text-white fw-bold w-100 py-3 shadow-sm">Enregistrer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALE DE CONFIRMATION DE SUPPRESSION (Propre) */}
            {deleteConfig.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content border-0 shadow text-center p-3" style={{ borderRadius: '25px' }}>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <MdWarning size={50} className="text-danger" />
                                </div>
                                <h5 className="fw-bold text-excha-blue">Supprimer ce compte ?</h5>
                                <p className="text-muted small">Cette action est irréversible. Toutes les transactions liées ne seront plus possibles vers ce compte.</p>
                                
                                <div className="d-grid gap-2">
                                    <button onClick={confirmDelete} className="btn btn-danger fw-bold py-2 shadow-sm" style={{ borderRadius: '12px' }}>
                                        Oui, supprimer
                                    </button>
                                    <button onClick={() => setDeleteConfig({ show: false, id: null })} className="btn btn-light fw-bold py-2" style={{ borderRadius: '12px' }}>
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}