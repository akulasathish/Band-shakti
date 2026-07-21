'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function Gigs() {
  const [gigs, setGigs] = useState([]);
  const [gigAssets, setGigAssets] = useState({});
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3); // Show 3 gigs initially

  // Lightbox slideshow state
  const [activeMediaList, setActiveMediaList] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    const fetchGigsAndAssets = async () => {
      try {
        // Fetch all events sorted by date
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });

        if (eventsError) throw eventsError;
        
        if (events) {
          // Filter out the active event since it's displayed in the ticket booking section
          const inactiveGigs = events.filter(gig => !gig.is_active);
          setGigs(inactiveGigs);
        }

        // Fetch all gallery assets with an associated event_id
        const { data: assets, error: assetsError } = await supabase
          .from('gallery_assets')
          .select('*')
          .not('event_id', 'is', null);

        if (!assetsError && assets) {
          const assetsMap = {};
          assets.forEach(asset => {
            if (!assetsMap[asset.event_id]) {
              assetsMap[asset.event_id] = [];
            }
            assetsMap[asset.event_id].push(asset);
          });
          setGigAssets(assetsMap);
        }
      } catch (err) {
        console.error("Error fetching gigs data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGigsAndAssets();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)', background: '#070709' }}>
        <span className="spinner-mini" style={{ display: 'inline-block', marginRight: '8px' }}></span>
        Loading Tour History...
      </div>
    );
  }

  if (gigs.length === 0) return null;

  const visibleGigs = gigs.slice(0, visibleCount);
  const hasMore = gigs.length > visibleCount;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, gigs.length)); // Load 10 more at a time
  };

  const handleShowLess = () => {
    setVisibleCount(3); // Reset back to 3
    const element = document.getElementById('gigs');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openLightbox = (assets) => {
    setActiveMediaList(assets);
    setActiveMediaIndex(0);
    // Lock document scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setActiveMediaList(null);
    document.body.style.overflow = '';
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    if (!activeMediaList) return;
    setActiveMediaIndex((prev) => (prev + 1) % activeMediaList.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    if (!activeMediaList) return;
    setActiveMediaIndex((prev) => (prev - 1 + activeMediaList.length) % activeMediaList.length);
  };

  return (
    <section id="gigs" className="section-padding gigs-section">
      <h2 className="section-title">Tour History & Past Gigs</h2>
      <p className="gigs-intro">Take a look at where Band Shakthi has performed recently.</p>

      <div className="gigs-container">
        <div className="gigs-grid">
          {visibleGigs.map((gig) => {
            const dateObj = new Date(gig.event_date);
            const isPast = dateObj < new Date();
            const formattedDate = dateObj.toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            const assets = gigAssets[gig.id] || [];

            return (
              <div key={gig.id} className={`glass-card gig-card ${isPast ? 'past-gig' : ''}`}>
                <div className="gig-badge-row">
                  <span className={`gig-status-badge ${isPast ? 'badge-past' : 'badge-upcoming'}`}>
                    {isPast ? 'Completed' : 'Upcoming'}
                  </span>
                  <span className="gig-date">{formattedDate}</span>
                </div>
                
                <h3 className="gig-title">{gig.title}</h3>
                <p className="gig-venue">📍 {gig.venue}</p>

                {gig.description && (
                  <p className="gig-desc" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: '8px 0 12px 0', lineHeight: '1.4' }}>
                    "{gig.description}"
                  </p>
                )}

                {isPast && (
                  <div className="gig-footer-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '10px', marginTop: '10px' }}>
                    <p className="gig-attendance" style={{ margin: 0, padding: 0, border: 'none' }}>
                      🔥 Attended: <b style={{ color: 'var(--color-gold-main)' }}>{gig.total_capacity}+</b> fans
                    </p>

                    {assets.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => openLightbox(assets)}
                        className="btn-view-gallery"
                        style={{
                          background: 'rgba(228, 166, 47, 0.1)',
                          border: '1px solid rgba(228, 166, 47, 0.25)',
                          color: 'var(--color-gold-light)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '15px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 5H5l3.5-3.5z"/>
                        </svg>
                        <span>View Gig Media ({assets.length})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Load More Pagination Controls */}
        <div className="gigs-controls" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '30px' }}>
          {hasMore && (
            <button 
              type="button" 
              className="btn-gold" 
              style={{ fontSize: '0.75rem', padding: '10px 20px', borderRadius: '25px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleLoadMore}
            >
              <span>Show More ({Math.min(10, gigs.length - visibleCount)} remaining)</span>
            </button>
          )}
          {visibleCount > 3 && (
            <button 
              type="button" 
              className="btn-outline" 
              style={{ fontSize: '0.75rem', padding: '10px 20px', borderRadius: '25px' }}
              onClick={handleShowLess}
            >
              Show Less
            </button>
          )}
        </div>
      </div>

      {/* STUNNING LIGHTBOX MEDIA SLIDESHOW OVERLAY */}
      {activeMediaList && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>×</button>
          
          <button className="lightbox-arrow prev" onClick={prevSlide}>
            ‹
          </button>
          
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {activeMediaList[activeMediaIndex].type === 'VIDEO' ? (
              <video 
                src={activeMediaList[activeMediaIndex].url} 
                controls 
                autoPlay 
                playsInline
                className="lightbox-media"
                style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: '8px', boxShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
              />
            ) : (
              <img 
                src={activeMediaList[activeMediaIndex].url} 
                alt={activeMediaList[activeMediaIndex].description || "Concert gallery image"} 
                className="lightbox-media"
                style={{ maxHeight: '80vh', maxWidth: '90vw', borderRadius: '8px', objectFit: 'contain', boxShadow: '0 4px 30px rgba(0,0,0,0.8)' }}
              />
            )}
            
            {activeMediaList[activeMediaIndex].description && (
              <div className="lightbox-caption">
                {activeMediaList[activeMediaIndex].description}
              </div>
            )}
            
            <div className="lightbox-counter">
              {activeMediaIndex + 1} of {activeMediaList.length}
            </div>
          </div>
          
          <button className="lightbox-arrow next" onClick={nextSlide}>
            ›
          </button>
        </div>
      )}

      <style jsx>{`
        .gigs-section {
          background: #070709;
          border-bottom: 1px solid rgba(228, 166, 47, 0.05);
          position: relative;
        }

        .gigs-intro {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin-bottom: 30px;
          margin-top: -12px;
        }

        .gigs-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .gigs-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .gig-card {
          padding: 20px;
          border-radius: 12px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid rgba(228, 166, 47, 0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .gig-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(228, 166, 47, 0.05);
        }

        .gig-card.past-gig {
          border-color: rgba(255, 255, 255, 0.05);
          opacity: 0.95;
        }

        .gig-badge-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .gig-status-badge {
          font-family: var(--font-family-title);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .badge-past {
          background: rgba(255, 255, 255, 0.05);
          color: #aaa;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .badge-upcoming {
          background: rgba(228, 166, 47, 0.15);
          color: var(--color-gold-light);
          border: 1px solid rgba(228, 166, 47, 0.25);
        }

        .gig-date {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .gig-title {
          font-size: 1.1rem;
          color: #ffffff;
          margin: 0 0 6px 0;
          font-weight: 600;
        }

        .gig-venue {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          margin: 0;
        }

        .btn-view-gallery:hover {
          background: rgba(228, 166, 47, 0.2) !important;
          color: #fff !important;
          border-color: var(--color-gold-main) !important;
        }

        /* LIGHTBOX STYLES */
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.25s ease-out;
        }

        .lightbox-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          max-width: 90vw;
        }

        .lightbox-close {
          position: absolute;
          top: 24px;
          right: 24px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 2.5rem;
          cursor: pointer;
          z-index: 10001;
          transition: transform 0.2s;
        }

        .lightbox-close:hover {
          transform: scale(1.1);
          color: var(--color-gold-main);
        }

        .lightbox-arrow {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
          font-size: 2.5rem;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          user-select: none;
          position: absolute;
          z-index: 10002;
        }

        .lightbox-arrow:hover {
          background: var(--color-gold-main);
          color: #000;
          border-color: var(--color-gold-main);
        }

        .lightbox-arrow.prev {
          left: 24px;
        }

        .lightbox-arrow.next {
          right: 24px;
        }

        .lightbox-caption {
          color: #eee;
          font-size: 0.85rem;
          margin-top: 14px;
          text-align: center;
          max-width: 600px;
          line-height: 1.4;
          letter-spacing: 0.02em;
        }

        .lightbox-counter {
          color: var(--color-text-muted);
          font-size: 0.75rem;
          margin-top: 8px;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (min-width: 768px) {
          .gigs-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .gigs-intro {
            text-align: center;
            max-width: 600px;
            margin: -12px auto 30px auto;
          }
        }

        @media (min-width: 1024px) {
          .gigs-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 767px) {
          .lightbox-arrow {
            bottom: 24px;
            width: 48px;
            height: 48px;
            font-size: 2rem;
          }
          .lightbox-arrow.prev {
            left: 30%;
          }
          .lightbox-arrow.next {
            right: 30%;
          }
          .lightbox-close {
            top: 16px;
            right: 16px;
            font-size: 2rem;
          }
        }
      `}</style>
    </section>
  );
}
