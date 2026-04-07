// src/contents/user/MarketContent.tsx
import React, { useState } from 'react';
import MarketHeader from '../../components/MarketHeader';
import MarketHome from './tabs/MarketHome';
import MarketNetwork from './tabs/MarketNetwork';
import MarketNotifications from './tabs/MarketNotifications';
import MarketPublication from './tabs/MarketPublication';

export default function MarketContentPage() {
  // État initial sur l'accueil
  const [activeTab, setActiveTab] = useState("accueil");

  // Rendu conditionnel des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case "accueil": 
        return <MarketHome />;
      case "reseau": 
        return <MarketNetwork />;
      case "publications": // 🔄 Mis à jour pour correspondre au Header
        return <MarketPublication />;
      case "notifs": 
        return <MarketNotifications />;
      default: 
        return <MarketHome />;
    }
  };

  return (
    <div className="w-100 min-vh-100 whatsapp-bg">
      {/* Le Header pilote l'état activeTab */}
      <MarketHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="w-100 py-3 px-0 px-md-3">
        <div className="animate__animated animate__fadeIn">
           {renderTabContent()}
        </div>
      </main>

      <style>{`
        /* EFFET WHATSAPP BACKGROUND */
        .whatsapp-bg {
          background-color: #e5ddd5;
          background-image: url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png");
          background-repeat: repeat;
          background-attachment: fixed;
          background-size: 400px;
        }

        /* Overlay pour améliorer la lisibilité du contenu sur le pattern */
        .whatsapp-bg::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(229, 221, 213, 0.8); 
          z-index: 0;
        }

        main {
          position: relative;
          z-index: 1;
          min-height: calc(100vh - 70px);
        }

        .market-container {
          max-width: 100% !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}