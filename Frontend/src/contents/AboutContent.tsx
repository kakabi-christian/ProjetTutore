import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/AboutContent.css';
import '../theme.css';
import img from '../assets/Logo Appli.png'
export default function AboutContent() {
  return (
    <div className="about-wrapper bg-white text-dark py-5">
      <div className="container">
        
        {/* SECTION ENTÊTE 📢 */}
        <div className="row justify-content-center text-center mb-5 pt-4">
          <div className="col-lg-8">
            <h6 className="text-excha-green text-uppercase fw-bold mb-3">Notre Histoire 📖</h6>
            <h1 className="display-4 fw-bold mb-4 text-dark">Connecter l'Afrique au reste du monde 🌍</h1>
            <p className="lead text-muted">
              ExchaPay est né d'une vision simple : rendre l'échange de devises accessible, 
              rapide et totalement sécurisé pour chaque individu, peu importe sa situation géographique.
            </p>
          </div>
        </div>

        {/* SECTION VALEURS (GRILLE BOOTSTRAP) 💎 */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="p-4 rounded-4 border-0 shadow-sm h-100 bg-light card-hover">
              <div className="fs-1 mb-3">🛡️</div>
              <h4 className="fw-bold text-dark">Sécurité Maximale</h4>
              <p className="small text-muted mb-0">
                Grâce à notre système d'Escrow, vos fonds sont bloqués sur un compte neutre jusqu'à la fin de la transaction.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-4 rounded-4 border-0 shadow-sm h-100 bg-light card-hover">
              <div className="fs-1 mb-3">⚡</div>
              <h4 className="fw-bold text-dark">Rapidité Éclatante</h4>
              <p className="small text-muted mb-0">
                Notre algorithme de matching automatique vous connecte instantanément à la meilleure offre disponible.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-4 rounded-4 border-0 shadow-sm h-100 bg-light card-hover">
              <div className="fs-1 mb-3">🤝</div>
              <h4 className="fw-bold text-dark">Transparence Totale</h4>
              <p className="small text-muted mb-0">
                Pas de frais cachés. Vous voyez exactement le taux appliqué et le montant final avant de valider.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION MISSION ET VISION 🎯 */}
        <div className="row align-items-center py-5">
          <div className="col-lg-6 mb-4 mb-lg-0">
            <div className="rounded-5 overflow-hidden shadow-sm border bg-light d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <div className="text-center p-5">
                   <span className="display-1 d-block mb-3 animate-float"><img src={img} alt="ExchaPay Logo" /></span>
                   <p className="text-uppercase fw-bold text-excha-green small tracking-widest">Innovation P2P</p>
                </div>
            </div>
          </div>
          
          <div className="col-lg-6 ps-lg-5">
            <h2 className="fw-bold mb-4 text-dark">
              Notre Mission 🎯</h2>
            <p className="text-muted mb-4">
              Nous croyons que la barrière des devises ne devrait pas freiner l'entrepreneuriat ou les échanges personnels. 
              Notre mission est de créer un écosystème où la confiance est garantie par la technologie.
            </p>
            
            <div className="mission-list">
              <div className="d-flex mb-3 align-items-start">
                <div className="bg-soft-green p-2 rounded-circle me-3">
                  <span className="text-excha-green fw-bold">✓</span>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Inclusion Financière</h6>
                  <p className="small text-muted mb-0">Permettre à chaque citoyen d'accéder aux marchés internationaux.</p>
                </div>
              </div>

              <div className="d-flex mb-3 align-items-start">
                <div className="bg-soft-green p-2 rounded-circle me-3">
                  <span className="text-excha-green fw-bold">✓</span>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Économie Transfrontalière</h6>
                  <p className="small text-muted mb-0">Soutenir les commerçants dans leurs transactions quotidiennes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION CHIFFRES 📈 */}
        <div className="row text-center py-5 border-top mt-5">
          <div className="col-md-4">
            <h2 className="fw-bold text-excha-green mb-0">10k+</h2>
            <p className="text-muted">Utilisateurs actifs</p>
          </div>
          <div className="col-md-4">
            <h2 className="fw-bold text-excha-green mb-0">50+</h2>
            <p className="text-muted">Devises supportées</p>
          </div>
          <div className="col-md-4">
            <h2 className="fw-bold text-excha-green mb-0">0.5%</h2>
            <p className="text-muted">Frais maximum</p>
          </div>
        </div>

      </div>
    </div>
  );
}