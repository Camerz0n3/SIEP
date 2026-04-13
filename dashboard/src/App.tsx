import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { HQ } from './pages/HQ'
import { Tasks } from './pages/Tasks'
import { Calendar } from './pages/Calendar'
import { Emails } from './pages/Emails'
import { Briefings } from './pages/Briefings'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <div className="crt-overlay" />
      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-characters">
              <div className="pixel-character boss" title="Cameron — The Boss">
                🎩
              </div>
              <div className="pixel-character siep" title="S.I.E.P — Right Hand">
                🤖
              </div>
            </div>
            <div className="sidebar-title">S.I.E.P</div>
            <div className="sidebar-subtitle">The Family Business</div>
          </div>

          <div className="sidebar-nav">
            <NavLink to="/" end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">🏠</span>
              <span>HQ</span>
            </NavLink>
            <NavLink to="/calendar" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📅</span>
              <span>Calendar</span>
            </NavLink>
            <NavLink to="/tasks" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📋</span>
              <span>Tasks</span>
            </NavLink>
            <NavLink to="/emails" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📧</span>
              <span>Emails</span>
            </NavLink>
            <NavLink to="/briefings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📰</span>
              <span>Briefings</span>
            </NavLink>
          </div>

          <div className="status-bar">
            <span className="status-dot" />
            <span className="status-online">SIEP ONLINE</span>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HQ />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/emails" element={<Emails />} />
            <Route path="/briefings" element={<Briefings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
