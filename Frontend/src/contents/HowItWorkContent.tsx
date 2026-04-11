import React, { useEffect } from 'react';
import '../styles/HowItWork.Content.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
  LuUserPlus, 
  LuSearch, 
  LuShieldCheck, 
  LuArrowRightLeft, 
  LuSmartphone, 
  LuCircleCheck 
} from "react-icons/lu";

const HowItWorkContent: React.FC = () => {
  useEffect(() => {
    AOS.init({ 
      duration: 800, 
      once: false, 
      mirror: true 
    });
  }, []);

  const steps = [
    {
      id: "step-register", // ✅ Ajout d'un ID unique
      icon: <LuUserPlus />,
      title: "Inscription & Profil",
      desc: "Créez votre compte en quelques secondes et validez votre identité pour garantir la sécurité de la communauté.",
      color: "blue"
    },
    {
      id: "step-search",
      icon: <LuSearch />,
      title: "Trouvez une offre",
      desc: "Parcourez les annonces disponibles ou publiez la vôtre avec votre devise (EUR, XAF, USD...) et votre taux.",
      color: "green"
    },
    {
      id: "step-escrow",
      icon: <LuShieldCheck />,
      title: "Escrow Sécurisé",
      desc: "Une fois le match trouvé, ExchaPay bloque les fonds. Personne ne perd son argent, la transaction est protégée.",
      color: "orange"
    },
    {
      id: "step-exchange",
      icon: <LuArrowRightLeft />,
      title: "Échange & Validation",
      desc: "Les parties procèdent à l'échange via Mobile Money ou virement. Dès confirmation, les fonds escrow sont libérés.",
      color: "blue"
    }
  ];

  return (
    <div className="how-it-work-wrapper">
      {/* Hero Section */}
      <section className="how-hero text-center text-white">
        <div className="container" data-aos="zoom-in">
          <span className="badge rounded-pill bg-excha-green mb-3">SIMPLICITÉ & SÉCURITÉ</span>
          <h1 className="display-4 fw-bold">Comment fonctionne <span className="text-excha-orange">ExchaPay</span> ?</h1>
          <p className="lead opacity-75 mx-auto" style={{maxWidth: '700px'}}>
            Découvrez comment nous révolutionnons l'échange de devises en Afrique grâce au P2P sécurisé.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="container py-5">
        <div className="row g-5 align-items-center">
          <div className="col-lg-6" data-aos="fade-right">
            <div className="steps-timeline">
              {/* ✅ CORRECTION LIGNE 70 : Utilisation de step.id au lieu de index */}
              {steps.map((step) => (
                <div className="step-item d-flex gap-4 mb-5" key={step.id}>
                  <div className={`step-icon-wrapper icon-${step.color}`}>
                    {step.icon}
                  </div>
                  <div className="step-text">
                    <h4 className="fw-bold text-excha-blue">{step.title}</h4>
                    <p className="text-muted">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="col-lg-6 d-none d-lg-block" data-aos="fade-left">
             <div className="how-visual-box p-5 rounded-5 shadow-lg bg-white text-center">
                <LuSmartphone className="display-1 text-excha-green mb-4 animate-bounce" />
                <h3 className="fw-bold mb-3">L'échange au bout des doigts</h3>
                <p className="text-muted">Une interface intuitive pensée pour les utilisateurs de Mobile Money au Cameroun et partout ailleurs.</p>
                <div className="d-flex justify-content-center gap-2 mt-4">
                    <LuCircleCheck className="text-excha-green" /> Sécurisé par Escrow
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorkContent;