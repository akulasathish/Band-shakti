'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavClick = (id) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Sticky Header Top Bar */}
      <header className="sticky-nav">
        <div className="nav-container">
          <div className="logo-wrapper" onClick={() => handleNavClick('home')}>
            <Image 
              src="/logo.png" 
              alt="Band Shakthi Logo" 
              width={140} 
              height={50} 
              priority
              className="logo-img"
            />
          </div>
          
          <div className="nav-actions">
            {/* Quick Ticket CTA */}
            <button 
              className="ticket-cta-btn" 
              onClick={() => handleNavClick('booking')}
              aria-label="Book Tickets"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6H20V8H4V6M4 11H20V13H4V11M4 16H20V18H4V16Z" style={{display: 'none'}} />
                <path d="M22,10V6a2,2,0,0,0-2-2H4A2,2,0,0,0,2,6v4a2,2,0,0,1,0,4v4a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V14a2,2,0,0,1,0-4M20,8.5a1.5,1.5,0,0,0-3,0,1.5,1.5,0,0,0,3,0M7,8.5A1.5,1.5,0,1,0,8.5,10,1.5,1.5,0,0,0,7,8.5M17,15.5a1.5,1.5,0,1,0,1.5,1.5,1.5,1.5,0,0,0-1.5-1.5M7,15.5a1.5,1.5,0,1,0,1.5,1.5,1.5,1.5,0,0,0-1.5-1.5" />
              </svg>
              <span>Tickets</span>
            </button>

            {/* Hamburger Button */}
            <button 
              className={`hamburger ${isOpen ? 'open' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle Navigation Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Down Mobile Menu Overlay */}
      <div className={`menu-overlay ${isOpen ? 'active' : ''}`}>
        <nav className="overlay-nav">
          <button className="nav-link" onClick={() => handleNavClick('home')}>Home</button>
          <button className="nav-link" onClick={() => handleNavClick('about')}>About</button>
          <button className="nav-link" onClick={() => handleNavClick('band')}>Band</button>
          <button className="nav-link" onClick={() => handleNavClick('gallery')}>Gallery</button>
          <button className="nav-link" onClick={() => handleNavClick('news')}>News</button>
          <button className="nav-link" onClick={() => handleNavClick('contact')}>Contact</button>
        </nav>

        {/* Footer info inside menu */}
        <div className="menu-footer">
          <p className="menu-email">booking@bandshakti.com</p>
          <div className="menu-socials">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">Instagram</a>
            <span className="dot-divider">•</span>
            <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="social-link">WhatsApp</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sticky-nav {
          position: sticky;
          top: 0;
          left: 0;
          width: 100%;
          z-index: 100;
          background: rgba(7, 7, 9, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(228, 166, 47, 0.1);
          transition: var(--transition-smooth);
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          height: 64px;
        }

        .logo-wrapper {
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .logo-img {
          object-fit: contain;
          filter: drop-shadow(0 0 4px rgba(228, 166, 47, 0.2));
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Glowing Ticket CTA */
        .ticket-cta-btn {
          background: transparent;
          border: 1px solid var(--color-gold-main);
          color: var(--color-gold-main);
          border-radius: 20px;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-family: var(--font-family-title);
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 0 8px rgba(228, 166, 47, 0.1);
          transition: var(--transition-smooth);
        }

        .ticket-cta-btn:hover {
          background: var(--gold-gradient);
          color: #070709;
          box-shadow: var(--shadow-gold-glow);
        }

        /* Hamburger Trigger */
        .hamburger {
          width: 30px;
          height: 24px;
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2px 0;
          z-index: 101;
        }

        .hamburger span {
          display: block;
          height: 2px;
          width: 100%;
          background-color: #ffffff;
          border-radius: 2px;
          transition: var(--transition-smooth);
        }

        .hamburger.open span:nth-child(1) {
          transform: translateY(8px) rotate(45deg);
          background-color: var(--color-gold-main);
        }

        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.open span:nth-child(3) {
          transform: translateY(-8px) rotate(-45deg);
          background-color: var(--color-gold-main);
        }

        /* Slide-Down Menu Overlay */
        .menu-overlay {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          height: 100vh;
          background-color: rgba(7, 7, 9, 0.98);
          z-index: 99;
          opacity: 0;
          visibility: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 100px 30px 40px 30px;
        }

        .menu-overlay.active {
          opacity: 1;
          visibility: visible;
        }

        .overlay-nav {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .nav-link {
          background: transparent;
          border: none;
          color: #ffffff;
          font-family: var(--font-family-title);
          font-size: 1.8rem;
          font-weight: 800;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: var(--transition-smooth);
          display: block;
          width: fit-content;
        }

        .nav-link:hover {
          background: var(--gold-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          transform: translateX(8px);
        }

        .menu-footer {
          border-top: 1px solid rgba(228, 166, 47, 0.1);
          padding-top: 24px;
        }

        .menu-email {
          color: var(--color-gold-light);
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .menu-socials {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          color: var(--color-text-muted);
        }

        .social-link {
          transition: var(--transition-smooth);
        }

        .social-link:hover {
          color: #ffffff;
        }

        .dot-divider {
          color: var(--color-gold-dark);
        }
       style-jsx-placeholder-1`}</style>
    </>
  );
}
