import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About'; 
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyOtp from './pages/Verify-otp';
import TypeDocumentPage from './contents/admin/TtpeDocument';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import KycPage from './contents/user/KycPage';
import NotificationUser from './contents/user/NotificationUser';
import KycAdmin from './contents/admin/KycAdmin';
import NotificationAdmin from './contents/admin/NotificationAdmin';
import FeedbackPage from './contents/user/FeedbackPage';
import ProfilePage from './components/ProfilePage';
import RolePage from './contents/admin/RolePage';
import UserPage from './contents/admin/UserPage';
import MarketContentPage from './contents/user/MarketContent';
import StatsAdmin from './contents/admin/StatsAdmin';
import MethodPaymentUser from './contents/user/MethodPaymentUser';
import StatsGraphe from './contents/admin/StatsGraphe';
import HowItWork from './pages/HowItWork';
import Annonce from './pages/Annonce';
import PaymentCallbackPage from './pages/Paymentcallbackpage';

function App() {
  return (
    <Router>
      <main>
        <Routes>
          {/* Routes Publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/how-it-work" element={<HowItWork />} />
          <Route path="/annonces" element={<Annonce />} />
          
          {/* Route Callback Paiement (Flutterwave) */}
          <Route path="/payment/callback" element={<PaymentCallbackPage />} />

          {/* Routes Admin (avec enfants) */}
          <Route path="/admin/*" element={<AdminDashboard />}>
            <Route path="type-documents" element={<TypeDocumentPage />} />
            <Route path="notifications-admin" element={<NotificationAdmin />} />
            <Route path="kyc" element={<KycAdmin />} />
            <Route path="profile-admin" element={<ProfilePage />} />
            <Route path="roles" element={<RolePage />} />
            <Route path="users-list" element={<UserPage />} />
            <Route path="stats" element={<StatsAdmin />} />
            <Route path="stats-graphe" element={<StatsGraphe />} />
          </Route>

          {/* Routes User (avec enfants) */}
          <Route path="/user/*" element={<UserDashboard />}>
            <Route path="kyc" element={<KycPage />} />
            <Route path="notifications-user" element={<NotificationUser />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="profile-user" element={<ProfilePage />} />
            <Route path="market" element={<MarketContentPage />} />
            <Route path="method-payment" element={<MethodPaymentUser />} />
          </Route>
        </Routes>
      </main>
    </Router>
  );
}

export default App;