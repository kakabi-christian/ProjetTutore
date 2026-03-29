import { Outlet } from 'react-router-dom'
import SidebarUser from '../contents/SidebarUser'
export default function UserDashboard() {
  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <SidebarUser />

      {/* Contenu principal */}
      <div className="flex-grow-1 p-4" style={{ backgroundColor: '#f8f9fa' }}>
        <Outlet />
      </div>
    </div>  )
}
