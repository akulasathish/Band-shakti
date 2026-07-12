'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

const DEFAULT_MEMBERS = [
  {
    name: 'Vikram Shakthi',
    role: 'Lead Vocals / Frontman',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400&auto=format&fit=crop',
    bio: 'The powerhouse voice of the band, bringing pure energy and crowd connection to every single gig.',
    type: 'MEMBER_1'
  },
  {
    name: 'Arjun Iyer',
    role: 'Lead Guitarist',
    image: 'https://images.unsplash.com/photo-1525201548982-be346cae56a7?q=80&w=400&auto=format&fit=crop',
    bio: 'Fusing classical runs with heavy electric blues solos. Shreds guitar riffs that define the Shakthi sound.',
    type: 'MEMBER_2'
  },
  {
    name: 'Neha Sen',
    role: 'Bass / Backing Vocals',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
    bio: 'The grooving heartbeat of the band. Lays down heavy basslines while backing the vocals with harmonies.',
    type: 'MEMBER_3'
  },
  {
    name: 'Karan Mehta',
    role: 'Drums / Percussions',
    image: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?q=80&w=400&auto=format&fit=crop',
    bio: 'A rhythm powerhouse. Sets the tempo with explosive rock drumming and customized beats.',
    type: 'MEMBER_4'
  }
];

export default function About() {
  const [members, setMembers] = useState(DEFAULT_MEMBERS);

  // Fetch custom member profile photos from database on load
  useEffect(() => {
    const fetchMemberImages = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery_assets')
          .select('*')
          .in('type', ['MEMBER_1', 'MEMBER_2', 'MEMBER_3', 'MEMBER_4']);

        if (data && data.length > 0) {
          const updatedMembers = [...DEFAULT_MEMBERS];
          data.forEach(item => {
            const idx = updatedMembers.findIndex(m => m.type === item.type);
            if (idx !== -1) {
              updatedMembers[idx].image = item.url;
            }
          });
          setMembers(updatedMembers);
        }
      } catch (err) {
        console.error("Failed to load member profile photos:", err);
      }
    };
    fetchMemberImages();
  }, []);

  return (
    <section id="about" className="section-padding about-section">
      {/* Biography Introduction */}
      <div className="about-wrapper">
        <h2 className="section-title">About the Band</h2>
        <p className="about-text">
          Born out of a shared passion for high-energy music, <span className="highlight-gold">Band Shakthi</span> has been electrifying crowd venues across the country. We specialize in explosive live sets that blend classical elements with hard rock, pop, and fusion rhythms.
        </p>
        <p className="about-text">
          Whether we are playing in packed pubs, outdoor arenas, or private corporate gatherings, our goal remains the same: <span className="highlight-red">To ignite the stage and deliver an unforgettable musical run.</span>
        </p>
      </div>

      {/* Band Members Grid (Styled exactly like the requested image) */}
      <div id="band" className="members-wrapper">
        <div className="title-center-container">
          <h2 className="members-section-title">Band Members</h2>
        </div>
        
        <div className="members-grid">
          {members.map((member, idx) => (
            <div key={idx} className="member-card">
              {/* Photo Box - Sharp corners */}
              <div 
                className="member-img" 
                style={{ backgroundImage: `url(${member.image})` }}
              ></div>
              
              {/* Solid Coral Red Info Banner at the bottom */}
              <div className="member-info">
                <h3 className="member-name">{member.name}</h3>
                <p className="member-role">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .about-section {
          background: linear-gradient(180deg, #070709 0%, #0d0d12 100%);
          border-bottom: 1px solid rgba(228, 166, 47, 0.05);
        }

        .about-wrapper {
          margin-bottom: 48px;
        }

        .about-text {
          font-size: 0.95rem;
          color: var(--color-text-muted);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .highlight-gold {
          color: var(--color-gold-main);
          font-weight: 600;
        }

        .highlight-red {
          color: #ff5555;
          font-weight: 600;
        }

        .members-wrapper {
          margin-top: 24px;
        }

        /* Centered Header with Under-highlight */
        .title-center-container {
          text-align: center;
          margin-bottom: 36px;
        }

        .members-section-title {
          font-family: var(--font-family-title);
          font-size: 1.8rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #ffffff;
          display: inline-block;
          position: relative;
          letter-spacing: 0.08em;
          z-index: 5;
        }

        /* Thick coral red highlights line under the text (retro rock vibe) */
        .members-section-title::after {
          content: '';
          position: absolute;
          left: -8px;
          bottom: 2px;
          width: calc(100% + 16px);
          height: 10px;
          background-color: #ff5252; /* Coral red */
          z-index: -1;
        }

        /* Members Card Grid - Stacks on mobile with vertical spacing */
        .members-grid {
          display: flex;
          flex-direction: column;
          gap: 28px;
          margin-top: 16px;
        }

        /* Sharp Corners, flex column layout */
        .member-card {
          display: flex;
          flex-direction: column;
          border-radius: 0; /* Sharp 90deg corners */
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: #0d0d12;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
          transition: var(--transition-smooth);
        }

        .member-card:hover {
          border-color: #ff5252;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 82, 82, 0.15);
        }

        .member-img {
          width: 100%;
          aspect-ratio: 1.1; /* Rectangular aspect ratio for photo */
          background-size: cover;
          background-position: center;
          border-radius: 0;
          transition: var(--transition-smooth);
        }

        .member-card:hover .member-img {
          transform: scale(1.03);
        }

        /* Static Coral-Red Details Banner */
        .member-info {
          background-color: #ff5252;
          padding: 18px 12px;
          text-align: center;
          color: #ffffff;
          border-radius: 0;
          z-index: 2;
        }

        .member-name {
          font-family: var(--font-family-title);
          font-size: 1.2rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #ffffff;
          margin-bottom: 4px;
          letter-spacing: 0.05em;
        }

        .member-role {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          margin: 0;
        }
      `}</style>
    </section>
  );
}
