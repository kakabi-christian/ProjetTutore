import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/HomeContent.css';

// Importation des icônes corrigées
import { 
  LuPencilLine,   // Remplace LuFileEdit
  LuSearch, 
  LuShieldCheck, 
  LuCheck,        // Remplace LuCheckCircle
  LuPlay, 
  LuZap,
  LuShieldAlert,
  LuSmartphone,
  LuBot
} from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa6";

interface Step {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

const HomeContent: React.FC = () => {
  const steps: Step[] = [
    { 
      num: '01', 
      icon: <LuPencilLine />, 
      title: 'Créez votre annonce', 
      desc: 'Publiez une offre avec la devise et le taux souhaité.', 
      color: 'green' 
    },
    { 
      num: '02', 
      icon: <LuSearch />, 
      title: 'Matching automatique', 
      desc: 'Notre algorithme trouve votre contrepartie idéale.', 
      color: 'blue' 
    },
    { 
      num: '03', 
      icon: <LuShieldCheck />, 
      title: 'Escrow sécurisé', 
      desc: 'Les fonds sont bloqués sur un compte séquestre neutre.', 
      color: 'orange' 
    },
    { 
      num: '04', 
      icon: <LuCheck />, 
      title: 'Virement final', 
      desc: 'Les fonds sont libérés dès confirmation des deux dépôts.', 
      color: 'green' 
    }
  ];

  return (
    <div className="home-content-wrapper">
      {/* HERO SECTION */}
      <section className="container-fluid hero-container py-5">
        <div className="container">
          <div className="row align-items-center min-vh-100">
            
            {/* Colonne Gauche: Texte */}
            <div className="col-lg-6 hero-left">
              <h1 className="display-4 fw-bold mb-4">
                Échangez vos <span className="accent-green">devises</span><br />
                en toute <span className="accent-orange">confiance.</span>
              </h1>
              <p className="hero-sub mb-5">
                ExchaPay connecte directement acheteurs et vendeurs de devises FIAT en Afrique et dans le monde entier, 
                avec une sécurité escrow, le Mobile Money intégré et une IA assistante.
              </p>
              
              <div className="hero-actions d-flex flex-wrap gap-3 mb-5">
                <button className="btn btn-hero-primary shadow d-flex align-items-center gap-2">
                  Commencer l'échange <FaArrowRight />
                </button>
                <button className="btn btn-hero-secondary d-flex align-items-center gap-2">
                  <LuPlay /> Voir comment ça marche
                </button>
              </div>

              <div className="hero-stats d-flex align-items-center gap-4">
                <div className="stat-item text-center">
                  <div className="stat-number fw-bold">50+</div>
                  <div className="stat-label small text-muted">Devises</div>
                </div>
                <div className="divider-vr"></div>
                <div className="stat-item text-center">
                  <div className="stat-number fw-bold">0.5%</div>
                  <div className="stat-label small text-muted">Frais</div>
                </div>
                <div className="divider-vr"></div>
                <div className="stat-item text-center">
                  <div className="stat-number fw-bold">100%</div>
                  <div className="stat-label small text-muted">Escrow</div>
                </div>
              </div>
            </div>

            {/* Colonne Droite: Visuel */}
            <div className="col-lg-6 hero-visual position-relative mt-5 mt-lg-0">
              <div className="visual-background-animate">
                <div className="blob b-1"></div>
                <div className="blob b-2"></div>
                <div className="blob b-3"></div>
              </div>

              <div className="float-card left glass-effect d-flex align-items-center gap-2">
                <div className="float-card-label">MTN Mobile Money</div>
                <div className="float-card-val green">✓ Intégré</div>
              </div>

              <div className="phone-mockup shadow-2xl">
                <div className="phone-header d-flex justify-content-between align-items-center">
                  <div className="phone-logo fw-bold">ExchaPay</div>
                  <div className="phone-avatar">JD</div>
                </div>

                <div className="rate-card glass-card my-4">
                  <div className="rate-label small opacity-75">Taux en direct</div>
                  <div className="rate-value h4 fw-bold my-1">655,96 <span className="currency-unit small">FCFA</span></div>
                  <div className="rate-pair small text-success">EUR → XOF &nbsp;<span>↑ +0.3%</span></div>
                </div>

                <div className="offers-title small fw-bold mb-3">Offres disponibles</div>

                <div className="mini-offer d-flex justify-content-between align-items-center mb-2">
                  <div className="offer-user d-flex align-items-center">
                    <div className="offer-dot a">AB</div>
                    <div className="ms-2">
                      <div className="offer-name small fw-bold">Alpha Bah</div>
                      <div className="offer-sub x-small">★ 4.9</div>
                    </div>
                  </div>
                  <div className="offer-right text-end">
                    <div className="offer-amount small fw-bold">500 €</div>
                  </div>
                </div>

                <div className="mini-offer d-flex justify-content-between align-items-center mb-3">
                  <div className="offer-user d-flex align-items-center">
                    <div className="offer-dot b">FS</div>
                    <div className="ms-2">
                      <div className="offer-name small fw-bold">Fatou Sy</div>
                      <div className="offer-sub x-small">★ 4.7</div>
                    </div>
                  </div>
                  <div className="offer-right text-end">
                    <div className="offer-amount small fw-bold">250 €</div>
                  </div>
                </div>

                <button className="btn btn-match w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2">
                  <LuZap /> Matcher une offre
                </button>
              </div>

              <div className="float-card right glass-effect d-flex align-items-center gap-2">
                <div className="float-card-label">Escrow sécurisé</div>
                <div className="float-card-val orange d-flex align-items-center gap-1">
                  <LuShieldCheck /> Fonds protégés
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar bg-light border-top border-bottom py-4" id='security'>
        <div className="container d-flex flex-wrap justify-content-between align-items-center text-center">
          <div className="trust-item mx-2 d-flex align-items-center gap-2">
            <LuShieldAlert className="text-primary" /> Sécurité PCI-DSS
          </div>
          <div className="trust-item mx-2 d-flex align-items-center gap-2">
            <LuSmartphone className="text-primary" /> Mobile Money
          </div>
          <div className="trust-item mx-2 d-flex align-items-center gap-2">
            <LuBot className="text-primary" /> Assistant IA 24/7
          </div>
          <div className="trust-item mx-2 d-flex align-items-center gap-2">
            <LuZap className="text-primary" /> Transactions rapides
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="container section-padding py-5">
        <div className="text-center mb-5">
          <div className="section-label badge bg-soft-green text-success mb-2">Processus</div>
          <h2 className="section-title display-6 fw-bold">Échangez en 4 étapes simples</h2>
        </div>
        <div className="row g-4">
          {steps.map((step, i) => (
            <div className="col-md-6 col-lg-3" key={i}>
              <div className="step-card h-100 p-4 border-0 shadow-sm rounded-4 position-relative overflow-hidden">
                <div className="step-num-bg">{step.num}</div>
                <div className={`step-icon mb-3 fs-3 icon-${step.color}`}>{step.icon}</div>
                <h5 className="step-title fw-bold">{step.title}</h5>
                <p className="step-desc text-muted small mb-0">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="container my-5">
        <div className="cta-container-modern p-5 rounded-5 text-center text-white position-relative overflow-hidden shadow-lg">
          <div className="cta-content position-relative z-index-2">
            <h2 className="display-6 fw-bold mb-4">Prêt à échanger sans frais excessifs ?</h2>
            <button className="btn btn-light btn-lg px-5 py-3 fw-bold shadow text-danger">
              Créer mon compte gratuitement
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeContent;