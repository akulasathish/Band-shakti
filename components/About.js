'use client';

const MEMBERS = [
  {
    name: 'Vikram Shakthi',
    role: 'Lead Vocals / Frontman',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400&auto=format&fit=crop',
    bio: 'The powerhouse voice of the band, bringing pure energy and crowd connection to every single gig.'
  },
  {
    name: 'Arjun Iyer',
    role: 'Lead Guitarist',
    image: 'https://images.unsplash.com/photo-1525201548982-be346cae56a7?q=80&w=400&auto=format&fit=crop',
    bio: 'Fusing classical runs with heavy electric blues solos. Shreds guitar riffs that define the Shakthi sound.'
  },
  {
    name: 'Neha Sen',
    role: 'Bass / Backing Vocals',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop',
    bio: 'The grooving heartbeat of the band. Lays down heavy basslines while backing the vocals with harmonies.'
  },
  {
    name: 'Karan Mehta',
    role: 'Drums / Percussions',
    image: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?q=80&w=400&auto=format&fit=crop',
    bio: 'A rhythm powerhouse. Sets the tempo with explosive rock drumming and customized beats.'
  }
];

export default function About() {
  return (
    <section id="about" className="section-padding about-section">
      <div className="about-wrapper">
        <h2 className="section-title">About the Band</h2>
        <p className="about-text">
          Born out of a shared passion for high-energy music, <span className="highlight-gold">Band Shakthi</span> has been electrifying crowd venues across the country. We specialize in explosive live sets that blend classical elements with hard rock, pop, and fusion rhythms.
        </p>
        <p className="about-text">
          Whether we are playing in packed pubs, outdoor arenas, or private corporate gatherings, our goal remains the same: <span className="highlight-red">To ignite the stage and deliver an unforgettable musical run.</span>
        </p>
      </div>

      <div id="band" className="members-wrapper">
        <h2 className="section-title">The Band Members</h2>
        
        <div className="members-grid">
          {MEMBERS.map((member, idx) => (
            <div key={idx} className="member-card">
              <div 
                className="member-img" 
                style={{ backgroundImage: `url(${member.image})` }}
              >
                <div className="member-gradient-overlay"></div>
              </div>
              
              <div className="member-info">
                <p className="member-role">{member.role}</p>
                <h3 className="member-name">{member.name}</h3>
                <p className="member-bio">{member.bio}</p>
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

        /* Members Card Grid - Mobile Stack */
        .members-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 16px;
        }

        .member-card {
          position: relative;
          height: 280px;
          border-radius: 16px;
          overflow: hidden;
          border: var(--border-glass);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .member-card:hover {
          border-color: var(--color-gold-main);
          box-shadow: var(--shadow-gold-glow);
        }

        .member-img {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          filter: grayscale(100%);
          transition: var(--transition-smooth);
        }

        .member-card:hover .member-img {
          filter: grayscale(20%);
          transform: scale(1.05);
        }

        .member-gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(360deg, #070709 10%, rgba(7, 7, 9, 0.4) 50%, rgba(7, 7, 9, 0) 100%);
          z-index: 1;
        }

        .member-info {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 20px;
          z-index: 2;
          transform: translateY(35px); /* Hide bio initially, show on hover */
          transition: var(--transition-smooth);
        }

        .member-card:hover .member-info {
          transform: translateY(0);
        }

        .member-role {
          font-family: var(--font-family-title);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-gold-main);
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .member-name {
          font-size: 1.3rem;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .member-bio {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          line-height: 1.4;
          opacity: 0;
          transition: var(--transition-smooth);
        }

        .member-card:hover .member-bio {
          opacity: 1;
        }
      `}</style>
    </section>
  );
}
