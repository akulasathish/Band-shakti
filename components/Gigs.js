'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function Gigs() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3); // Show 3 gigs initially

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });

        if (error) throw error;
        if (data) {
          // Filter out the active event since it's displayed in the ticket booking section
          const inactiveGigs = data.filter(gig => !gig.is_active);
          setGigs(inactiveGigs);
        }
      } catch (err) {
        console.error("Error fetching gigs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
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
    setVisibleCount(prev => Math.min(prev + 6, gigs.length)); // Load 6 more at a time
  };

  const handleShowLess = () => {
    setVisibleCount(3); // Reset back to 3
    const element = document.getElementById('gigs');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
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
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

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
                {isPast && (
                  <p className="gig-attendance">
                    🔥 Attended by <b style={{ color: 'var(--color-gold-main)' }}>{gig.total_capacity}+</b> fans
                  </p>
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
              <span>Show More Shows ({gigs.length - visibleCount} remaining)</span>
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
        }

        .gig-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(228, 166, 47, 0.05);
        }

        .gig-card.past-gig {
          border-color: rgba(255, 255, 255, 0.05);
          opacity: 0.85;
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
          margin: 0 0 8px 0;
        }

        .gig-attendance {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          padding-top: 8px;
          margin-top: 8px;
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
      `}</style>
    </section>
  );
}
