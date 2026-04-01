// src/contents/user/MarketContent.tsx
import React, { useState } from 'react';
import MarketHeader from '../../components/MarketHeader';
import MarketHome from './tabs/MarketHome';
import MarketNetwork from './tabs/MarketNetwork';
import MarketMessages from './tabs/MarketMessages';
import MarketNotifications from './tabs/MarketNotifications';

export default function MarketContentPage() {
  const [activeTab, setActiveTab] = useState("accueil");

  const renderTabContent = () => {
    switch (activeTab) {
      case "accueil": return <MarketHome />;
      case "reseau": return <MarketNetwork />;
      case "messages": return <MarketMessages />;
      case "notifs": return <MarketNotifications />;
      default: return <MarketHome />;
    }
  };

  return (
    <div className="w-100 min-vh-100 whatsapp-bg">
      <MarketHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Suppression du .container et des colonnes centrées pour éviter le margin auto */}
      <main className="w-100 py-3 px-0 px-md-3">
        <div className="animate__animated animate__fadeIn">
           {renderTabContent()}
        </div>
      </main>

      <style>{`
        /* EFFET WHATSAPP BACKGROUND */
        .whatsapp-bg {
          background-color: #e5ddd5; /* La couleur de base WhatsApp */
          background-image: url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png");
          background-repeat: repeat;
          background-attachment: fixed;
          background-size: 400px;
          opacity: 1;
        }

        /* On ajoute un léger overlay pour que les icônes ne gênent pas la lecture */
        .whatsapp-bg::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(229, 221, 213, 0.7); /* Calque semi-transparent */
          z-index: 0;
        }

        main {
          position: relative;
          z-index: 1;
          min-height: calc(100vh - 70px);
        }

        /* On s'assure que MarketHome n'impose pas sa propre largeur max trop petite */
        .market-container {
          max-width: 100% !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}