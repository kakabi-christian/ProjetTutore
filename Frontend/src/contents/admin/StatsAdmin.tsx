import React, { useEffect, useState } from 'react';
import StatisticService from '../../services/StatisticService';
import type { AdminStatistics } from '../../services/StatisticService'; 

import { 
    MdPeople, MdTrendingUp, MdAccountBalanceWallet, 
    MdCheckCircle, MdShowChart, MdHistory, MdFilterList
} from 'react-icons/md';

export default function StatsAdmin() {
    const [stats, setStats] = useState<AdminStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState({ start: '', end: '' });

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await StatisticService.getAdminStats(period.start, period.end);
            setStats(data);
        } catch (error) {
            console.error("Erreur stats:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour gérer les filtres rapides
    const handleQuickFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (!value) return;

        const end = new Date();
        let start = new Date();

        switch (value) {
            case '7days':
                start.setDate(end.getDate() - 7);
                break;
            case '30days':
                start.setDate(end.getDate() - 30);
                break;
            case '6months':
                start.setMonth(end.getMonth() - 6);
                break;
            case '1year':
                start.setFullYear(end.getFullYear() - 1);
                break;
            default:
                return;
        }

        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        const newPeriod = { start: formatDate(start), end: formatDate(end) };
        setPeriod(newPeriod);
        
        // On déclenche la recherche immédiatement après le changement de select
        StatisticService.getAdminStats(newPeriod.start, newPeriod.end).then(setStats);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-excha-orange" role="status"></div>
            </div>
        );
    }

    const mainCards = [
        { title: "Utilisateurs Totaux", value: stats.users.total_users, sub: `${stats.users.new_users_period} nouveaux`, Icon: MdPeople, color: "#1E90FF" },
        { title: "Volume d'échanges", value: `${stats.transactions.volume} $`, sub: "Total cumulé", Icon: MdAccountBalanceWallet, color: "#25963F" },
        { title: "Revenus Plateforme", value: `${stats.transactions.revenue} $`, sub: "Commissions nettes", Icon: MdTrendingUp, color: "#FF6B2B" },
        { title: "Taux de Réussite", value: `${stats.transactions.success_rate}%`, sub: "Transactions validées", Icon: MdCheckCircle, color: "#25963F" },
    ];

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            
            {/* Header & Filtres Avancés */}
            <div className="row mb-4 align-items-center">
                <div className="col-lg-4">
                    <h2 className="fw-bold mb-0" style={{ color: 'var(--blue)' }}>Statistiques Globales</h2>
                    <p className="text-muted small">Analyse des performances ExchaPay</p>
                </div>
                
                <div className="col-lg-8">
                    <div className="d-flex gap-2 justify-content-lg-end flex-wrap">
                        {/* Sélecteur Rapide */}
                        <div className="input-group input-group-sm shadow-sm w-auto">
                            <span className="input-group-text bg-white border-0"><MdFilterList /></span>
                            <select className="form-select border-0 fw-bold" style={{ width: '180px' }} onChange={handleQuickFilter}>
                                <option value="">Période personnalisée</option>
                                <option value="7days">Une semaine</option>
                                <option value="30days">30 derniers jours</option>
                                <option value="6months">6 derniers mois</option>
                                <option value="1year">Par année (12 mois)</option>
                            </select>
                        </div>

                        {/* Sélecteurs de dates manuelles */}
                        <div className="d-flex gap-2 align-items-center bg-white p-1 px-2 shadow-sm rounded-3">
                            <input type="date" value={period.start} className="form-control form-control-sm border-0" onChange={(e) => setPeriod({...period, start: e.target.value})} />
                            <span className="text-muted small">au</span>
                            <input type="date" value={period.end} className="form-control form-control-sm border-0" onChange={(e) => setPeriod({...period, end: e.target.value})} />
                            <button className="btn btn-excha-orange btn-sm fw-bold px-3" onClick={fetchStats}>Filtrer</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grille des indicateurs principaux */}
            <div className="row g-3 mb-4">
                {mainCards.map((card, idx) => (
                    <div className="col-md-3" key={idx}>
                        <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: '15px' }}>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div className="p-3 rounded-3" style={{ backgroundColor: `${card.color}15`, color: card.color }}>
                                    <card.Icon size={28} />
                                </div>
                            </div>
                            <h6 className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>{card.title}</h6>
                            <h3 className="fw-bold my-1">{card.value}</h3>
                            <div className="d-flex align-items-center gap-1">
                                <span className="badge rounded-pill" style={{ backgroundColor: '#25963F20', color: '#25963F', fontSize: '0.65rem' }}>
                                    {card.sub}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Section Détails chiffrés */}
            <div className="row g-4">
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
                        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                            <MdShowChart className="text-excha-blue" /> Activité des Utilisateurs
                        </h5>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-light">
                                <span className="text-muted">Utilisateurs vérifiés (KYC)</span>
                                <span className="fw-bold fs-5 text-excha-green">{stats.users.verified_users}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-light">
                                <span className="text-muted">Inscriptions sur la période</span>
                                <span className="fw-bold fs-5">{stats.users.new_users_period}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-0">
                                <span className="text-muted">Annonces actives en ligne</span>
                                <span className="badge p-2 px-3 fs-6" style={{ backgroundColor: 'var(--blue)', color: 'white' }}>
                                    {stats.listings.active_listings} / {stats.listings.total_listings_period}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
                        <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                            <MdHistory className="text-excha-orange" /> Performance Transactions
                        </h5>
                        <div className="row g-3">
                            <div className="col-6">
                                <div className="p-3 rounded-3 bg-light border-start border-4 border-excha-blue">
                                    <small className="text-muted d-block">Transactions totales</small>
                                    <span className="fw-bold fs-4">{stats.transactions.total}</span>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-3 rounded-3 bg-light border-start border-4 border-excha-green">
                                    <small className="text-muted d-block">Transactions complétées</small>
                                    <span className="fw-bold fs-4">{stats.transactions.completed}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-3 rounded-3 border d-flex justify-content-between align-items-center" style={{ backgroundColor: '#fcfcfc' }}>
                            <div>
                                <h6 className="mb-0 fw-bold">Conversion moyenne</h6>
                                <small className="text-muted">Efficacité du matching</small>
                            </div>
                            <div className="text-end">
                                <span className="fs-3 fw-bold text-excha-orange">{stats.transactions.success_rate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 text-end">
                <button 
                    className="btn btn-outline-secondary fw-bold px-4 shadow-sm" 
                    style={{ borderRadius: '10px' }}
                    onClick={() => window.print()}
                >
                    Générer un rapport texte
                </button>
            </div>
        </div>
    );
}