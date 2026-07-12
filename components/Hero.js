'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

const DEFAULT_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop',
    title: 'WELCOME TO BAND SHAKTHI',
    subtitle: 'THE ULTIMATE LIVE EXPERIENCE',
    desc: 'HIGH-ENERGY POP & ROCK GIGS IN PUBS, FESTIVALS, AND EVENTS',
    type: 'HERO_BANNER_1'
  },
  {
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
    title: 'FEEL THE ELECTRIC VIBE',
    subtitle: 'JAM ARENA 2026',
    desc: 'WITNESS CAPTIVATING MUSICAL RUNS & CROWD-PULSING RHYTHMS',
    type: 'HERO_BANNER_2'
  }
];

export default function Hero() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Fetch custom slide backgrounds from database on load
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery_assets')
          .select('*')
          .in('type', ['HERO_BANNER_1', 'HERO_BANNER_2']);

        if (data && data.length > 0) {
          const updatedSlides = [...DEFAULT_SLIDES];
          data.forEach(item => {
            if (item.type === 'HERO_BANNER_1') {
              updatedSlides[0].image = item.url;
            } else if (item.type === 'HERO_BANNER_2') {
              updatedSlides[1].image = item.url;
            }
          });
          setSlides(updatedSlides);
        }
      } catch (err) {
        console.error("Failed to load banners:", err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides]);

  const openVideoModal = () => setIsVideoOpen(true);
  const closeVideoModal = () => setIsVideoOpen(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="hero-section">
      {/* Slider Backgrounds */}
      {slides.map((slide, idx) => (
        <div 
          key={idx} 
          className={`hero-slide ${idx === currentSlide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          {/* Dark Overlay with subtle tint */}
          <div className="hero-overlay"></div>
          
          {/* Banner Contents */}
          <div className="hero-content">
            <span className="live-badge">
              <span className="live-indicator"></span> LIVE GIGS ON DEMAND
            </span>
            <p className="hero-subtitle">{slide.subtitle}</p>
            <h1 className="hero-title">{slide.title}</h1>
            <p className="hero-desc">{slide.desc}</p>
            
            <div className="hero-buttons">
              <button className="btn-gold" onClick={() => scrollToSection('booking')}>
                Book Tickets
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Central Red-Border Play Button Box */}
      <div className="play-button-centerpiece" onClick={openVideoModal}>
        <div className="play-border-box">
          <button className="play-btn" aria-label="Watch Live Performance Video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
        <span className="watch-prompt">Watch Concert</span>
      </div>

      {/* Slider Navigation Dots */}
      <div className="slider-dots">
        {slides.map((_, idx) => (
          <button 
            key={idx} 
            className={`dot ${idx === currentSlide ? 'active' : ''}`}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          ></button>
        ))}
      </div>

      {/* Video Modal (Popup) */}
      {isVideoOpen && (
        <div className="video-modal" onClick={closeVideoModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeVideoModal}>×</button>
            <div className="video-wrapper">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" 
                title="Band Shakthi Live Performance Compilation" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hero-section {
          position: relative;
          height: calc(100vh - 64px);
          width: 100%;
          overflow: hidden;
          background: #070709;
        }

        .hero-slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 1s ease-in-out, visibility 1s ease-in-out;
          display: flex;
          align-items: center;
          padding: 30px 20px;
        }

        .hero-slide.active {
          opacity: 1;
          visibility: visible;
          z-index: 1;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, rgba(7,7,9,0.5) 0%, rgba(7,7,9,0.85) 90%), 
                      rgba(7, 7, 9, 0.45);
          z-index: 2;
        }

        .hero-content {
          position: relative;
          z-index: 3;
          width: 100%;
          text-align: center;
          margin-top: -40px;
        }

        .live-badge {
          background: rgba(255, 51, 51, 0.15);
          border: 1px solid rgba(255, 51, 51, 0.3);
          color: #ff6666;
          font-family: var(--font-family-title);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 6px 12px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 20px;
        }

        .hero-subtitle {
          font-family: var(--font-family-title);
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: var(--color-gold-main);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .hero-title {
          font-size: 2.1rem;
          line-height: 1.15;
          text-transform: uppercase;
          margin-bottom: 16px;
          letter-spacing: 0.02em;
          background: var(--gold-text-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin-bottom: 28px;
          max-width: 90%;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-buttons {
          display: flex;
          justify-content: center;
        }

        /* Central Play Button Piece */
        .play-button-centerpiece {
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .play-border-box {
          border: 1.5px solid var(--color-red-accent);
          padding: 10px;
          border-radius: 8px;
          transition: var(--transition-smooth);
          box-shadow: var(--shadow-red-glow);
          background: rgba(7, 7, 9, 0.5);
        }

        .play-button-centerpiece:hover .play-border-box {
          border-color: var(--color-gold-main);
          box-shadow: var(--shadow-gold-glow);
          transform: scale(1.05);
        }

        .play-btn {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid #ffffff;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .play-button-centerpiece:hover .play-btn {
          background: #ffffff;
          color: #070709;
        }

        .play-btn svg {
          margin-left: 2px;
        }

        .watch-prompt {
          font-family: var(--font-family-title);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #ffffff;
        }

        /* Dots */
        .slider-dots {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 5;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: transparent;
          border: 1.5px solid #ffffff;
          cursor: pointer;
          transition: var(--transition-smooth);
          padding: 0;
        }

        .dot.active {
          background: #ffffff;
          width: 24px;
          border-radius: 4px;
        }

        /* Popup Video Modal */
        .video-modal {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          height: 100vh;
          background: rgba(7, 7, 9, 0.95);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          position: relative;
          width: 100%;
          background: #000;
          border: 1px solid var(--color-gold-main);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: var(--shadow-gold-glow);
        }

        .close-modal-btn {
          position: absolute;
          top: 10px;
          right: 15px;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 2rem;
          cursor: pointer;
          z-index: 201;
          line-height: 1;
        }

        .video-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
        }

        .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </section>
  );
}
