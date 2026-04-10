import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/AboutContent.css';
import img from '../assets/Logo Appli.png';
import { 
  MdSecurity, 
  MdFlashOn, 
  MdHandshake, 
  MdTrendingUp, 
  MdPublic, 
  MdAccountBalanceWallet,
  MdVerifiedUser,
  MdLock
} from 'react-icons/md';

export default function AboutContent() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      easing: 'ease-out-back',
    });
  }, []);

  return (
    <div className="about-wrapper">
      
      {/* --- HERO SECTION (Harmonisée avec HowItWork) --- */}
      <section className="about-hero text-center text-white">
        <div className="container" data-aos="zoom-in">
          <span className="badge rounded-pill bg-excha-green mb-3">NOTRE HISTOIRE & VISION</span>
          <h1 className="display-4 fw-bold">Connecter l'Afrique au <span className="text-excha-orange">monde</span> 🌍</h1>
          <p className="lead opacity-75 mx-auto" style={{ maxWidth: '750px' }}>
            ExchaPay rend l'échange de devises accessible et sécurisé pour tous, en connectant directement les utilisateurs à travers un réseau de confiance.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-4">
            <button className="btn btn-excha-orange px-4 py-2 rounded-pill fw-bold border-0">Démarrer l'expérience</button>
          </div>
        </div>
      </section>

      {/* --- LOGO & INTRODUCTION --- */}
      <section className="container py-5">
        <div className="row align-items-center g-5">
          <div className="col-lg-5 text-center" data-aos="fade-right">
            <div className="position-relative d-inline-block">
              <div className="position-absolute top-50 start-50 translate-middle bg-excha-green opacity-10 rounded-circle" style={{width: '120%', height: '120%', filter: 'blur(40px)'}}></div>
              <img src={img} alt="ExchaPay Logo" className=" position-relative" style={{ maxHeight: '280px' }} />
            </div>
          </div>
          <div className="col-lg-7" data-aos="fade-left">
            <h6 className="text-excha-orange fw-bold text-uppercase mb-2">À propos d'ExchaPay</h6>
            <h2 className="fw-bold text-excha-blue mb-3">La révolution du P2P en Afrique</h2>
            <p className="text-muted fs-5">
              Né d'un besoin de simplification des transferts transfrontaliers, ExchaPay n'est pas qu'une plateforme, c'est un écosystème conçu pour briser les barrières financières continentales.
            </p>
          </div>
        </div>
      </section>

      {/* --- VALUES SECTION --- */}
      <section className="py-5" style={{ backgroundColor: '#f8fffe' }}>
        <div className="container">
          <div className="text-center mb-5" data-aos="fade-up">
            <h3 className="fw-bold text-excha-blue">Nos Piliers de Confiance</h3>
            <div className="mx-auto mt-2" style={{ height: '4px', width: '40px', backgroundColor: 'var(--excha-orange)', borderRadius: '10px' }}></div>
          </div>

          <div className="row g-4">
            {[
              { icon: <MdSecurity />, title: "Sécurité", desc: "Escrow robuste pour protéger vos fonds.", delay: 100, color: '#00c896' },
              { icon: <MdFlashOn />, title: "Rapidité", desc: "Matching intelligent et instantané.", delay: 200, color: '#ff8c00' },
              { icon: <MdHandshake />, title: "Transparence", desc: "Zéro frais cachés, taux garantis.", delay: 300, color: '#3498db' }
            ].map((item, index) => (
              <div className="col-md-4" key={index} data-aos="fade-up" data-aos-delay={item.delay}>
                <div className="p-4 rounded-4 shadow-sm h-100 bg-white text-center border-0 transition-all hover-up">
                  <div className="fs-1 mb-3" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <h5 className="fw-bold text-excha-blue">{item.title}</h5>
                  <p className="text-muted mb-0 small">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SÉCURITÉ & CONFORMITÉ --- */}
      <section className="py-5">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-lg-6" data-aos="fade-right">
              <div className="p-4 bg-white rounded-5 shadow-lg border-start border-5 border-excha-green">
                <h4 className="fw-bold text-excha-blue mb-4">Sécurité de niveau bancaire 🛡️</h4>
                <div className="d-flex flex-column gap-4">
                  <div className="d-flex align-items-start gap-3">
                    <MdLock className="text-excha-green fs-3" />
                    <div>
                      <h6 className="fw-bold mb-1 text-excha-blue">Chiffrement AES-256</h6>
                      <p className="small text-muted mb-0">Vos données et transactions sont protégées par les plus hauts standards de sécurité mondiaux.</p>
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-3">
                    <MdVerifiedUser className="text-excha-green fs-3" />
                    <div>
                      <h6 className="fw-bold mb-1 text-excha-blue">Vérification KYC</h6>
                      <p className="small text-muted mb-0">Chaque membre est vérifié pour assurer une communauté d'échange saine et fiable.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 text-center text-lg-start ps-lg-5" data-aos="fade-left">
              <h3 className="fw-bold text-excha-blue mb-3">Ils propulsent nos échanges</h3>
              <p className="text-muted mb-4">Nous collaborons avec les leaders du paiement mobile pour assurer la fluidité de vos transactions.</p>
              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-4 opacity-50">
                <span className="fw-bold h5 text-secondary">MTN MoMo</span>
                <span className="fw-bold h5 text-secondary">Orange Money</span>
                <span className="fw-bold h5 text-secondary">Flutterwave</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- MISSION --- */}
      <section className="py-5 bg-excha-blue text-white text-center mt-4">
        <div className="container" data-aos="fade-up">
           <h2 className="fw-bold mb-4">Notre Mission 🎯</h2>
           <p className="lead mx-auto mb-5" style={{maxWidth: '800px'}}>
             "La barrière des devises ne doit plus être un frein à vos ambitions continentales. Nous construisons le pont financier de l'Afrique de demain."
           </p>
           <div className="row g-3 justify-content-center">
             {[
               { title: "Inclusion", icon: <MdPublic /> },
               { title: "Croissance", icon: <MdTrendingUp /> },
               { title: "Liberté", icon: <MdAccountBalanceWallet /> }
             ].map((task, i) => (
               <div className="col-6 col-md-2" key={i}>
                 <div className="p-3 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
                   <div className="text-excha-green fs-2 mb-2">{task.icon}</div>
                   <h6 className="fw-bold mb-0">{task.title}</h6>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </section>

    </div>
  );
}