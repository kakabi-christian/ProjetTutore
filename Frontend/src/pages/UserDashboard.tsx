import { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import SidebarUser from '../contents/SidebarUser';
import TopBarUser from '../components/TopBarUser';

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeSlideLeft: Variants = {
  hidden:  { x: -40, opacity: 0 },
  visible: { x: 0,   opacity: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeSlideDown: Variants = {
  hidden:  { y: -20, opacity: 0 },
  visible: { y: 0,   opacity: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeSlideUp: Variants = {
  hidden:  { y: 16, opacity: 0 },
  visible: { y: 0,  opacity: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;
const SIDEBAR_EXPANDED  = 280;
const SIDEBAR_COLLAPSED = 80;

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth <= MOBILE_BREAKPOINT);

  const location   = useLocation();
  const isMarket   = location.pathname.includes('/user/market');

  // ── Responsive handler ──
  const handleResize = useCallback(() => {
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    setIsMobile(mobile);
    if (mobile) setIsCollapsed(true);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // ── Derived values ──
  const marginLeft    = isMobile ? '0' : `${isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED}px`;
  const toggleSidebar = () => setIsCollapsed(prev => !prev);

  return (
    <motion.div
      className="dashboard-root"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* ── Mobile Backdrop ── */}
      <AnimatePresence>
        {!isCollapsed && isMobile && (
          <motion.div
            className="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setIsCollapsed(true)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside
        className={`sidebar-wrapper${isMobile ? ' is-mobile' : ''}`}
        variants={fadeSlideLeft}
        style={isMobile ? { left: isCollapsed ? -SIDEBAR_EXPANDED : 0 } : undefined}
      >
        <SidebarUser isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </motion.aside>

      {/* ── Main Area ── */}
      <div
        className="main-area"
        style={{
          marginLeft,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* TopBar */}
        {!isMarket && (
          <motion.div variants={fadeSlideDown}>
            <TopBarUser onMenuClick={toggleSidebar} />
          </motion.div>
        )}

        {/* Content */}
        <motion.main
          variants={fadeSlideUp}
          className={isMarket ? 'p-0' : 'main-content'}
        >
          <div className="container-fluid p-0">
            <Outlet context={{ toggleSidebar }} />
          </div>
        </motion.main>

        {/* Footer */}
        {!isMarket && (
          <motion.footer
            className="dashboard-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            &copy; {new Date().getFullYear()}{' '}
            <strong>ExchaPay</strong> — Plateforme sécurisée.
          </motion.footer>
        )}
      </div>

      {/* ── Scoped Styles ── */}
      <style>{`
        /* Root */
        .dashboard-root {
          display: flex;
          min-height: 100vh;
          background-color: #f4f6f9;
          overflow-x: hidden;
        }

        /* Backdrop */
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(8, 28, 52, 0.55);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          z-index: 1500;
          cursor: pointer;
        }

        /* Sidebar wrapper */
        .sidebar-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          z-index: 2000;
          transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: left;
        }

        .sidebar-wrapper.is-mobile > div {
          width: ${SIDEBAR_EXPANDED}px !important;
        }

        /* Main area */
        .main-area {
          display: flex;
          flex-direction: column;
          flex: 1 1 0%;
          min-height: 100vh;
          width: 100%;
          will-change: margin-left;
        }

        /* Main content padding */
        .main-content {
          flex: 1;
          padding: 1.25rem;
        }

        @media (min-width: 768px) {
          .main-content {
            padding: 1.75rem 2rem;
          }
        }

        /* Footer */
        .dashboard-footer {
          padding: 0.85rem 1.5rem;
          text-align: center;
          font-size: 0.82rem;
          color: #8a97a8;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          letter-spacing: 0.01em;
        }

        .dashboard-footer strong {
          color: #4a6fa5;
          font-weight: 600;
        }

        /* Global */
        body {
          overflow-x: hidden;
        }
      `}</style>
    </motion.div>
  );
}