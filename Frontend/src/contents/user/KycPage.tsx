import React, { useEffect, useRef, useState } from 'react';
import KycService from '../../services/KycService';
import { typeDocumentService } from '../../services/TypeDocumentService';
import type { Kyc } from '../../models/Kyc';
import type { TypeDocument } from '../../models/Documents';
import { toast } from 'react-toastify';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
    MdCloudUpload, MdCheckCircle, MdPublic, MdArrowForward, 
    MdArrowBack, MdVerifiedUser, MdSecurity, MdShield, MdStars 
} from "react-icons/md";

const COUNTRIES = ["Cameroun", "Gabon", "Congo", "Tchad", "Centrafrique", "Guinée Équatoriale", "France", "USA", "Autre"];

// ─── Composant feux d'artifice (canvas plein écran, 2 secondes) ───────────────
function FireworksCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const colors = ['#FF7A00','#2ecc71','#f1c40f','#e74c3c','#9b59b6','#3498db','#FF6B6B','#4ECDC4','#fff'];

        type Particle = {
            x: number; y: number;
            vx: number; vy: number;
            color: string; alpha: number;
            radius: number; gravity: number; decay: number;
            isConfetti?: boolean; rotation?: number; rotationSpeed?: number;
            width?: number; height?: number;
        };

        const particles: Particle[] = [];

        const createBurst = (x: number, y: number) => {
            // particules rondes
            for (let i = 0; i < 60; i++) {
                const angle = (Math.PI * 2 / 60) * i;
                const speed = 3 + Math.random() * 6;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1,
                    radius: 3 + Math.random() * 3,
                    gravity: 0.15,
                    decay: 0.018 + Math.random() * 0.01,
                });
            }
            // confettis rectangulaires
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 5;
                particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1,
                    radius: 0,
                    gravity: 0.12,
                    decay: 0.016 + Math.random() * 0.01,
                    isConfetti: true,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.3,
                    width: 8 + Math.random() * 6,
                    height: 4 + Math.random() * 3,
                });
            }
        };

        // Séquence de tirs : 6 explosions étalées sur 1.4s
        const W = canvas.width;
        const H = canvas.height;
        const bursts: [number, number, number][] = [
            [W * 0.2, H * 0.3, 0],
            [W * 0.8, H * 0.25, 150],
            [W * 0.5, H * 0.2, 300],
            [W * 0.3, H * 0.5, 500],
            [W * 0.75, H * 0.45, 700],
            [W * 0.5, H * 0.35, 950],
        ];
        const timers: ReturnType<typeof setTimeout>[] = [];
        bursts.forEach(([x, y, delay]) => {
            timers.push(setTimeout(() => createBurst(x, y), delay));
        });

        const startTime = Date.now();
        let animId: number;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > 2000 && particles.length === 0) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animId);
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.alpha -= p.decay;
                if (p.alpha <= 0) { particles.splice(i, 1); continue; }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;

                if (p.isConfetti) {
                    p.rotation! += p.rotationSpeed!;
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation!);
                    ctx.fillRect(-p.width! / 2, -p.height! / 2, p.width!, p.height!);
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            animId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            timers.forEach(clearTimeout);
            cancelAnimationFrame(animId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0, left: 0,
                width: '100vw', height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999,
            }}
        />
    );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function KycPage() {
    const [kycStatus, setKycStatus] = useState<Kyc | null>(null);
    const [types, setTypes] = useState<TypeDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showFireworks, setShowFireworks] = useState(false);
    
    const [currentStep, setCurrentStep] = useState(0);
    const [country, setCountry] = useState('Cameroun');
    const [selectedFiles, setSelectedFiles] = useState<{ file: File; type_document_id: number; preview: string }[]>([]);

    useEffect(() => {
        AOS.init({ duration: 800, once: false });
        fetchInitialData();
    }, []);

    useEffect(() => {
        AOS.refresh();
    }, [currentStep]);

    // Lance les feux d'artifice dès que le statut devient APPROVED
    useEffect(() => {
        if (kycStatus?.status === 'APPROVED') {
            setShowFireworks(true);
            const t = setTimeout(() => setShowFireworks(false), 2000);
            return () => clearTimeout(t);
        }
    }, [kycStatus]);

    const fetchInitialData = async () => {
        try {
            const [statusRes, typesRes] = await Promise.all([
                KycService.getMyKycStatus(),
                typeDocumentService.getAll()
            ]);
            setKycStatus(statusRes.data);
            setTypes(typesRes.data);
        } catch (error) {
            console.error("Erreur", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, typeId: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const maxSizeInBytes = 2 * 1024 * 1024; 
            if (file.size > maxSizeInBytes) {
                toast.error(`Le fichier "${file.name}" est trop lourd. La limite est de 2 Mo.`);
                e.target.value = ""; 
                return;
            }
            const preview = URL.createObjectURL(file);
            setSelectedFiles(prev => {
                const filtered = prev.filter(f => f.type_document_id !== typeId);
                return [...filtered, { file, type_document_id: typeId, preview }];
            });
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await KycService.submitKyc({ 
                country_of_issue: country, 
                documents: selectedFiles.map(({file, type_document_id}) => ({file, type_document_id})) 
            });
            toast.success("Dossier soumis avec succès !");
            fetchInitialData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Erreur de soumission");
        } finally {
            setSubmitting(false);
        }
    };

    const renderContent = () => {
        // --- INTERFACE DE COMPTE APPROUVÉ ---
        if (kycStatus && kycStatus.status === 'APPROVED') {
            return (
                <div className="verified-container text-center py-4">
                    <div className="verified-card shadow-lg p-4 p-md-5 mx-auto" style={{maxWidth: '550px', borderRadius: '30px', background: '#fff'}}>
                        <div className="badge-verified-wrapper mb-3">
                            <div className="verified-glow"></div>
                            <MdCheckCircle className="text-success position-relative" size={90} />
                            <MdStars className="star-icon text-warning" size={30} />
                        </div>
                        <h2 className="fw-bold text-dark mb-2">Félicitations !</h2>
                        <h5 className="text-excha-orange fw-bold mb-3">Identité certifiée</h5>
                        <p className="text-secondary mb-4 px-md-3">
                            Votre compte est désormais sécurisé. Toutes les limites de transactions ont été levées.
                        </p>
                        <div className="row g-2 mb-4">
                            <div className="col-4">
                                <div className="p-2 rounded-3 bg-light border">
                                    <MdShield className="text-success mb-1" size={20} />
                                    <p className="extra-small mb-0 fw-bold">Sécurité</p>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="p-2 rounded-3 bg-light border">
                                    <MdArrowForward className="text-success mb-1" size={20} />
                                    <p className="extra-small mb-0 fw-bold">Illimité</p>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="p-2 rounded-3 bg-light border">
                                    <MdVerifiedUser className="text-success mb-1" size={20} />
                                    <p className="extra-small mb-0 fw-bold">Priorité</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => window.location.href = '/user/market'} className="btn btn-excha-orange btn-lg w-100 rounded-pill py-3 fw-bold">
                            ACCÉDER AU Marché des echanges
                        </button>
                    </div>
                </div>
            );
        }

        // --- INTERFACE EN ATTENTE (PENDING) ---
        if (kycStatus && kycStatus.status === 'PENDING') {
            return (
                <div className="status-hero text-center py-5" data-aos="fade-up">
                    <div className="icon-wrapper mb-4 d-flex justify-content-center">
                        <div className="spinner-glow" />
                    </div>
                    <h1 className="display-6 fw-bold text-dark">Vérification en cours</h1>
                    <p className="text-secondary mt-3 mx-auto" style={{maxWidth: '500px'}}>
                        Nos experts examinent vos pièces. Vous recevrez une notification dès validation.
                    </p>
                    <button className="btn btn-outline-secondary rounded-pill px-5 mt-4" disabled>Traitement en cours...</button>
                </div>
            );
        }

        // --- ÉTAPE 0 : INTRODUCTION ---
        if (currentStep === 0) {
            return (
                <div className="row align-items-center min-vh-75 g-5">
                    <div className="col-lg-6" data-aos="fade-right">
                        <div className="badge bg-soft-orange text-excha-orange mb-3 p-2 px-3 rounded-pill fw-bold">KYC & COMPLIANCE</div>
                        <h1 className="display-4 fw-bold text-dark mb-4">Certifiez votre identité sur <span className="text-excha-orange">ExchaPay</span></h1>
                        <p className="fs-5 text-secondary mb-5">
                            Procédure simple et sécurisée pour débloquer tout votre potentiel de transaction.
                        </p>
                        <button onClick={() => setCurrentStep(1)} className="btn btn-excha-orange btn-lg px-5 py-3 rounded-pill fw-bold shadow-orange">
                            LANCER LA PROCÉDURE <MdArrowForward className="ms-2" />
                        </button>
                    </div>
                    <div className="col-lg-6 text-center" data-aos="zoom-in">
                        <div className="kyc-hero-art shadow-soft">
                            <MdVerifiedUser size={150} className="text-excha-orange opacity-10" />
                        </div>
                    </div>
                </div>
            );
        }

        const currentType = types[currentStep - 1];
        const fileData = selectedFiles.find(f => f.type_document_id === currentType?.type_document_id);
        const isLastStep = currentStep === types.length;

        // --- ÉTAPES D'UPLOAD ---
        return (
            <div className="row justify-content-center align-items-center">
                <div className="col-xl-6 col-lg-8" data-aos="fade-up">
                    <div className="wizard-card shadow-lg bg-white">
                        <div className="card-body p-4 p-md-5">
                            <div className="d-flex justify-content-between align-items-start mb-4">
                                <div>
                                    <h6 className="text-excha-orange fw-bold text-uppercase small">Étape {currentStep} sur {types.length}</h6>
                                    <h2 className="text-dark fw-bold">{currentType?.name}</h2>
                                </div>
                                <button onClick={() => setCurrentStep(currentStep - 1)} className="btn-icon-back">
                                    <MdArrowBack size={20} />
                                </button>
                            </div>

                            {currentStep === 1 && (
                                <div className="mb-4">
                                    <label className="text-secondary mb-2 small fw-bold d-block text-uppercase">Pays d'émission</label>
                                    <div className="row g-2">
                                        {COUNTRIES.map(c => (
                                            <div className="col-md-3 col-6" key={c}>
                                                <div className={`country-pill ${country === c ? 'active' : ''}`} onClick={() => setCountry(c)}>
                                                    {c}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={`mega-upload-box ${fileData ? 'success' : ''}`}>
                                <input type="file" id="kyc-file" className="d-none" onChange={(e) => handleFileChange(e, currentType.type_document_id)} accept="image/*,.pdf" />
                                <label htmlFor="kyc-file" className="upload-trigger">
                                    {fileData ? (
                                        <div className="preview-layout d-flex align-items-center gap-3">
                                            {fileData.file.type.startsWith('image/') ? 
                                                <img src={fileData.preview} className="preview-thumb" alt="KYC" /> : 
                                                <div className="pdf-thumb">PDF</div>}
                                            <div className="text-start">
                                                <h6 className="text-dark mb-1 fw-bold">Document prêt !</h6>
                                                <p className="text-success small mb-0">Modifier</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="placeholder-layout py-3 text-center">
                                            <MdCloudUpload size={40} className="text-excha-orange opacity-25 mb-2" />
                                            <h5 className="text-dark fw-bold">Sélectionnez un fichier</h5>
                                            <p className="text-muted small mb-0">Max 2 Mo</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="d-grid mt-4">
                                <button 
                                    onClick={isLastStep ? handleSubmit : () => setCurrentStep(currentStep + 1)}
                                    disabled={!fileData || submitting}
                                    className="btn btn-excha-orange btn-lg rounded-pill py-3 fw-bold"
                                >
                                    {submitting ? "Traitement..." : isLastStep ? "FINALISER MA DEMANDE" : "CONTINUER"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="kyc-immersive-container light">
            {/* ✅ Feux d'artifice : monté uniquement pendant 2s quand statut = APPROVED */}
            {showFireworks && <FireworksCanvas />}

            <nav className="navbar navbar-light py-3 px-md-5">
                <div className="container-fluid">
                    <span className="navbar-brand fw-bold text-dark">EXCHA<span className="text-excha-orange">PAY</span></span>
                    {currentStep > 0 && !kycStatus?.status && (
                        <div className="step-dots d-flex gap-2">
                            {types.map((_, i) => (
                                <div key={i} className={`dot ${currentStep > i ? 'active' : ''}`}></div>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            <div className="container py-3">
                {loading ? <div className="text-center py-5"><div className="spinner-glow m-auto" /></div> : renderContent()}
            </div>

            <style>{`
                .kyc-immersive-container.light { background: #F8FAFC; min-height: 100vh; color: #333; font-family: 'Inter', sans-serif; }
                .text-excha-orange { color: #FF7A00 !important; }
                .bg-soft-orange { background-color: rgba(255, 122, 0, 0.1) !important; }
                .extra-small { font-size: 0.75rem; }
                .kyc-hero-art { width: 280px; height: 280px; background: #fff; border-radius: 50px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #eee; }
                .wizard-card { border: none; border-radius: 24px; }
                .btn-icon-back { background: #f8f9fa; border: none; color: #333; width: 40px; height: 40px; border-radius: 10px; }
                .country-pill { padding: 8px; background: #fff; border: 1px solid #eee; border-radius: 10px; text-align: center; cursor: pointer; font-size: 0.8rem; }
                .country-pill.active { background: #FF7A00; border-color: #FF7A00; color: white; }
                .mega-upload-box { background: #fafafa; border: 2px dashed #ddd; border-radius: 16px; }
                .mega-upload-box.success { border: 2px solid #2ecc71; background: rgba(46, 204, 113, 0.02); }
                .upload-trigger { width: 100%; padding: 20px; cursor: pointer; }
                .preview-thumb { width: 70px; height: 70px; object-fit: cover; border-radius: 12px; }
                .pdf-thumb { width: 70px; height: 70px; background: #e74c3c; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
                .btn-excha-orange { background: #FF7A00; color: white; border: none; }
                .badge-verified-wrapper { position: relative; display: inline-block; }
                .verified-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 110px; height: 110px; background: rgba(46, 204, 113, 0.2); border-radius: 50%; filter: blur(15px); animation: pulse 2s infinite; }
                .star-icon { position: absolute; bottom: 0; right: 0; }
                .dot { width: 6px; height: 6px; background: #ddd; border-radius: 50%; }
                .dot.active { background: #FF7A00; width: 15px; border-radius: 10px; }
                .spinner-glow { width: 50px; height: 50px; border: 3px solid #eee; border-top-color: #FF7A00; border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); } }
            `}</style>
        </div>
    );
}