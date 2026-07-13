'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

const DUMMY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
    alt: 'Band Shakthi crowd energy'
  },
  {
    src: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=600&auto=format&fit=crop',
    alt: 'Guitar solo live runs'
  },
  {
    src: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop',
    alt: 'Drummer in full speed'
  },
  {
    src: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600&auto=format&fit=crop',
    alt: 'Neon concert lighting'
  },
  {
    src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    alt: 'Singer vocal performance'
  },
  {
    src: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=600&auto=format&fit=crop',
    alt: 'Crowd putting hands up'
  }
];

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [activeIdx, setActiveIdx] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const mapped = data.map(item => ({
          src: item.url,
          alt: item.description || 'Band Shakthi Gig'
        }));
        setImages(mapped);
      } else {
        setImages(DUMMY_IMAGES);
      }
    } catch (err) {
      console.error("Error loading gallery assets:", err);
      setImages(DUMMY_IMAGES);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  const openLightbox = (idx) => setActiveIdx(idx);
  const closeLightbox = () => setActiveIdx(null);

  const prevImage = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="gallery" className="section-padding gallery-section">
      <h2 className="section-title">Live Gallery</h2>
      <p className="gallery-intro">Moments captured live on stage from our recent concert runs.</p>

      {/* Grid Layout - 2 Columns on Mobile */}
      <div className="gallery-grid">
        {(showAll ? images : images.slice(0, 6)).map((img, idx) => (
          <div key={idx} className="gallery-item" onClick={() => openLightbox(idx)}>
            <div 
              className="gallery-thumbnail" 
              style={{ backgroundImage: `url(${img.src})` }}
            >
              <div className="gallery-hover-overlay">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More / Show Less Button */}
      {images.length > 6 && (
        <div className="show-more-btn-container">
          <button 
            className="btn-show-more" 
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : 'Show More'}
          </button>
        </div>
      )}

      {/* Lightbox Overlay */}
      {activeIdx !== null && images[activeIdx] && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="close-lightbox" onClick={closeLightbox}>×</button>
          
          <button className="lightbox-nav-btn prev-btn" onClick={prevImage} aria-label="Previous image">
            ‹
          </button>
          
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={images[activeIdx].src} 
              alt={images[activeIdx].alt} 
              className="lightbox-img" 
            />
            <p className="lightbox-caption">{images[activeIdx].alt}</p>
          </div>
          
          <button className="lightbox-nav-btn next-btn" onClick={nextImage} aria-label="Next image">
            ›
          </button>
        </div>
      )}

      <style jsx>{`
        .gallery-section {
          background: #0d0d12;
          border-bottom: 1px solid rgba(228, 166, 47, 0.05);
        }

        .gallery-intro {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin-bottom: 20px;
          margin-top: -12px;
        }

        /* 2 Column Mobile Grid */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 16px;
        }

        .gallery-item {
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          border: var(--border-glass);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .gallery-item:hover {
          border-color: var(--color-gold-main);
          box-shadow: var(--shadow-gold-glow);
        }

        .gallery-thumbnail {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          position: relative;
          transition: var(--transition-smooth);
        }

        .gallery-item:hover .gallery-thumbnail {
          transform: scale(1.06);
        }

        .gallery-hover-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(228, 166, 47, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          color: #ffffff;
          transition: var(--transition-smooth);
        }

        .gallery-item:hover .gallery-hover-overlay {
          opacity: 1;
        }

        /* Lightbox */
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          height: 100vh;
          background: rgba(7, 7, 9, 0.97);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .close-lightbox {
          position: absolute;
          top: 20px;
          right: 25px;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 2.5rem;
          cursor: pointer;
          z-index: 302;
        }

        .lightbox-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(18, 18, 24, 0.6);
          border: 1px solid rgba(228, 166, 47, 0.2);
          color: #ffffff;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 301;
          transition: var(--transition-smooth);
          padding-bottom: 4px;
        }

        .lightbox-nav-btn:hover {
          border-color: var(--color-gold-main);
          box-shadow: var(--shadow-gold-glow);
          background: var(--color-bg-card);
        }

        .prev-btn { left: 16px; }
        .next-btn { right: 16px; }

        .lightbox-content {
          text-align: center;
          max-width: 90%;
        }

        .lightbox-img {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
          border-radius: 8px;
          border: var(--border-glass-active);
          box-shadow: var(--shadow-gold-glow);
        }

        .lightbox-caption {
          margin-top: 14px;
          color: var(--color-gold-light);
          font-size: 0.9rem;
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        @media (min-width: 768px) {
          .gallery-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            max-width: 1200px;
            margin: 16px auto 0 auto;
          }
          .gallery-intro {
            text-align: center;
            max-width: 600px;
            margin: -12px auto 20px auto;
          }
        }

        .show-more-btn-container {
          display: flex;
          justify-content: center;
          margin-top: 36px;
          width: 100%;
        }

        .btn-show-more {
          background: transparent;
          border: 1px solid var(--color-gold-main);
          color: var(--color-gold-main);
          padding: 10px 24px;
          font-family: var(--font-family-title);
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          border-radius: 4px;
          transition: var(--transition-smooth);
        }

        .btn-show-more:hover {
          background: var(--gold-gradient);
          color: #070709;
          box-shadow: var(--shadow-gold-glow);
        }
      `}</style>
    </section>
  );
}
