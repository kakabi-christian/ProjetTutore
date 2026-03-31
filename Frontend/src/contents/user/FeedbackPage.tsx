import React, { useState, useEffect } from 'react';
import { MdStar, MdSend, MdRateReview, MdCheckCircle } from 'react-icons/md';
import type { User } from '../../models/Utilisateur';
import FeedbackService from '../../services/FeedbacService';
import TopBarUser from '../../components/TopBarUser';

export default function FeedbackPage() {
  // États pour l'utilisateur et le formulaire
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les infos de l'utilisateur au montage
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const storedUser = localStorage.getItem('user_data');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Erreur parsing user_data", e);
        }
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Veuillez sélectionner une note avant d'envoyer.");
      return;
    }

    if (!user?.user_id) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await FeedbackService.submitFeedback({
        user_id: user.user_id, 
        comment: comment,
        note: rating
      });
      setSubmitted(true);
    } catch (err: any) {
      // Capture l'erreur 422 de Laravel ou les erreurs réseaux
      const serverMessage = err.response?.data?.message || "Une erreur est survenue lors de l'envoi.";
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container-fluid d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
        <TopBarUser />
        <div className="text-center p-5 shadow-lg" style={{ backgroundColor: 'var(--blue)', borderRadius: '20px', maxWidth: '500px' }}>
          <MdCheckCircle size={80} className="text-excha-green mb-4" />
          <h2 className="fw-bold text-white mb-3">Merci pour votre avis !</h2>
          <p style={{ color: 'var(--gray)' }}>Votre retour nous aide à améliorer ExchaPay pour toute la communauté.</p>
          <button 
            className="btn btn-excha-orange px-4 mt-3 fw-bold" 
            onClick={() => {
                setSubmitted(false);
                setRating(0);
                setComment('');
            }}
            style={{ borderRadius: '10px' }}
          >
            Modifier mon avis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          
          <div className="mb-4 d-flex align-items-center">
            <div className="p-3 bg-white shadow-sm rounded-3 me-3">
              <MdRateReview size={32} className="text-excha-orange" />
            </div>
            <div>
              <h2 className="fw-bold mb-0" style={{ color: 'var(--blue)' }}>Votre avis compte</h2>
              <p className="text-muted mb-0">Partagez votre expérience sur ExchaPay</p>
            </div>
          </div>

          <div className="card border-0 shadow-sm" style={{ borderRadius: '15px', overflow: 'hidden' }}>
            <div className="card-body p-4 p-md-5">
              <form onSubmit={handleSubmit}>
                
                <div className="mb-5 text-center">
                  <h5 className="fw-bold mb-3" style={{ color: 'var(--blue)' }}>Quelle note nous donnez-vous ?</h5>
                  <div className="d-flex justify-content-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="btn border-0 p-0 bg-transparent"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                      >
                        <MdStar
                          size={48}
                          style={{ 
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            transform: (hover || rating) >= star ? 'scale(1.1)' : 'scale(1)'
                          }}
                          color={(hover || rating) >= star ? 'var(--orange)' : '#D1D9E6'}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <div className="mt-3 animate__animated animate__fadeIn">
                       <span className="badge bg-excha-orange px-3 py-2" style={{ fontSize: '0.9rem' }}>
                        {rating === 5 ? 'Excellent ! 😍' : rating === 4 ? 'Très bien 👍' : rating === 3 ? 'Satisfaisant 🙂' : 'À améliorer 🛠️'}
                       </span>
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold" style={{ color: 'var(--blue)' }}>Votre retour détaillé</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    placeholder="Qu'est-ce qui vous a plu ? Que pouvons-nous simplifier ?"
                    style={{ 
                      borderRadius: '12px', 
                      backgroundColor: '#F8FAFC',
                      border: '1.5px solid #E2E8F0',
                      resize: 'none',
                      padding: '15px'
                    }}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  ></textarea>
                </div>

                {error && (
                  <div className="alert alert-danger border-0 mb-4 d-flex align-items-center" style={{ borderRadius: '10px' }}>
                    <small className="fw-bold">{error}</small>
                  </div>
                )}

                <div className="d-grid mt-2">
                  <button
                    type="submit"
                    className="btn btn-excha-orange py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                    disabled={loading}
                    style={{ borderRadius: '12px', fontSize: '1.1rem' }}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <>
                        <MdSend size={22} />
                        Envoyer mon feedback
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

          <div className="text-center mt-4" style={{ color: 'var(--gray)' }}>
            <small>Votre avis aide la communauté **ExchaPay** à grandir.</small>
          </div>
        </div>
      </div>
    </div>
  );
}