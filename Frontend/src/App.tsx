import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About'; 
import Register from './pages/Register';
import Login from './pages/Login';
import VerifyOtp from './pages/Verify-otp';
import TypeDocumentPage from './contents/admin/TtpeDocument';
import AdminDashboard from './pages/AdminDashboard';
function App() {
  return (
    <Router>
   

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />

          {/* Routes Admin (avec enfants) */}
          <Route path="/admin/*" element={<AdminDashboard />}>
            <Route path="type-documents" element={<TypeDocumentPage />} />
          </Route>

        </Routes>


      </main>

    </Router>
  );
}

export default App;