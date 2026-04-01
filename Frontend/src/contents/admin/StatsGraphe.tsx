import React, { useEffect, useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
    MdPeople, MdTrendingUp, MdAccountBalanceWallet, 
    MdCheckCircle, MdTimeline, MdPieChart
} from 'react-icons/md';
import StatisticService from '../../services/StatisticService';
import type { AdminStatistics } from '../../services/StatisticService';

// Couleurs officielles ExchaPay
const EXCHA_COLORS = {
    GREEN: '#25963F',
    BLUE: '#1E90FF',
    ORANGE: '#FF6B2B',
    LIGHT_GRAY: '#f8f9fa'
};

export default function StatsAdmin() {
    const [stats, setStats] = useState<AdminStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await StatisticService.getAdminStats('', '');
            setStats(data);
        } catch (error) {
            console.error("Erreur stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading || !stats) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border" style={{ color: EXCHA_COLORS.ORANGE }} role="status"></div>
            </div>
        );
    }

    // Données simulées pour la courbe (à remplacer par stats.history si disponible)
    const chartData = [
        { name: 'Lun', volume: stats.transactions.volume * 0.1, revenue: stats.transactions.revenue * 0.12 },
        { name: 'Mar', volume: stats.transactions.volume * 0.15, revenue: stats.transactions.revenue * 0.1 },
        { name: 'Mer', volume: stats.transactions.volume * 0.25, revenue: stats.transactions.revenue * 0.22 },
        { name: 'Jeu', volume: stats.transactions.volume * 0.2, revenue: stats.transactions.revenue * 0.18 },
        { name: 'Ven', volume: stats.transactions.volume * 0.3, revenue: stats.transactions.revenue * 0.38 },
    ];

    const pieData = [
        { name: 'Vérifiés', value: stats.users.verified_users, color: EXCHA_COLORS.GREEN },
        { name: 'Non-vérifiés', value: stats.users.total_users - stats.users.verified_users, color: EXCHA_COLORS.ORANGE },
    ];

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: EXCHA_COLORS.LIGHT_GRAY, minHeight: '100vh' }}>
            
            {/* 1. CARTES DE KPI ÉPURÉES */}
            <div className="row g-4 mb-5">
                {[
                    { label: "Utilisateurs", val: stats.users.total_users, icon: <MdPeople/>, col: EXCHA_COLORS.BLUE },
                    { label: "Volume Total", val: `${stats.transactions.volume} $`, icon: <MdAccountBalanceWallet/>, col: EXCHA_COLORS.GREEN },
                    { label: "Revenus (Com)", val: `${stats.transactions.revenue} $`, icon: <MdTrendingUp/>, col: EXCHA_COLORS.ORANGE },
                    { label: "Taux de Succès", val: `${stats.transactions.success_rate}%`, icon: <MdCheckCircle/>, col: EXCHA_COLORS.GREEN }
                ].map((item, i) => (
                    <div key={i} className="col-md-3">
                        <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '15px' }}>
                            <div className="d-flex align-items-center">
                                <div className="p-3 rounded-circle me-3" style={{ backgroundColor: `${item.col}20`, color: item.col, fontSize: '1.5rem' }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-muted mb-0 small fw-bold">{item.label.toUpperCase()}</p>
                                    <h4 className="mb-0 fw-bold">{item.val}</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* 2. GRAPHIQUE D'ÉVOLUTION (AREA CHART) */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
                        <h5 className="fw-bold mb-4 d-flex align-items-center">
                            <MdTimeline className="me-2" color={EXCHA_COLORS.BLUE}/> Évolution du Volume & Revenus
                        </h5>
                        <div style={{ width: '100%', height: 350 }}>
                            <ResponsiveContainer>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={EXCHA_COLORS.BLUE} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={EXCHA_COLORS.BLUE} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} 
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="volume" 
                                        stroke={EXCHA_COLORS.BLUE} 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorVol)" 
                                        name="Volume ($)"
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke={EXCHA_COLORS.ORANGE} 
                                        strokeWidth={3}
                                        fill="none" 
                                        name="Revenus ($)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 3. RÉPARTITION DES UTILISATEURS (PIE CHART) */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '20px', height: '100%' }}>
                        <h5 className="fw-bold mb-4 d-flex align-items-center">
                            <MdPieChart className="me-2" color={EXCHA_COLORS.ORANGE}/> Statut des Utilisateurs
                        </h5>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={70}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="text-center mt-3">
                            <p className="small text-muted">Total: <strong>{stats.users.total_users}</strong> membres</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}