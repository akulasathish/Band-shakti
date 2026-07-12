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

          <nav className="desktop-nav-links">
            <button className="desktop-nav-link" onClick={() => handleNavClick('home')}>Home</button>
            <button className="desktop-nav-link" onClick={() => handleNavClick('about')}>About</button>
            <button className="desktop-nav-link" onClick={() => handleNavClick('band')}>Members</button>
            <button className="desktop-nav-link" onClick={() => handleNavClick('gallery')}>Gallery</button>
            <button className="desktop-nav-link" onClick={() => handleNavClick('news')}>News</button>
            <button className="desktop-nav-link" onClick={() => handleNavClick('contact')}>Contact</button>
          </nav>
          
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
    </>
  );
}
