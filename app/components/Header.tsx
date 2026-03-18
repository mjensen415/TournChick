'use client'

export default function Header() {
  const scrollToRegion = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  return (
    <header className="fixed-header">
      <nav className="navbar">
        <h1 className="brand text-gradient">Tournament <span className="text-gradient-accent">Madness</span></h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="/admin" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>
            Admin Login
          </a>
        </div>
      </nav>

      <div className="region-tabs-container">
        <button className="region-tab-btn" onClick={() => scrollToRegion('region-audrey')}>Audrey Hepburn</button>
        <button className="region-tab-btn" onClick={() => scrollToRegion('region-bo')}>Bo Derek</button>
        <button className="region-tab-btn" onClick={() => scrollToRegion('region-marilyn')}>Marilyn Monroe</button>
        <button className="region-tab-btn" onClick={() => scrollToRegion('region-pamela')}>Pamela Anderson</button>
      </div>
    </header>
  )
}
