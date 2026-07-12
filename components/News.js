'use client';

const NEWS_POSTS = [
  {
    date: 'July 10, 2026',
    title: 'New Single "Shakti Run" Releasing Next Month!',
    desc: 'Our upcoming fusion rock single is officially recorded. Featuring rapid electric violin overlays and heavy guitar solos.',
    tag: 'NEW RELEASE'
  },
  {
    date: 'June 28, 2026',
    title: 'Jam Arena Mumbai Show Sold Out!',
    desc: 'Thank you Mumbai! Tickets for our stadium gig sold out within 4 hours. Stay tuned for behind-the-scenes concert footage.',
    tag: 'SOLD OUT'
  }
];

export default function News() {
  return (
    <section id="news" className="section-padding news-section">
      <h2 className="section-title">Band News</h2>
      <p className="news-intro">Keep up with releases, announcements, and concert updates.</p>

      <div className="news-list">
        {NEWS_POSTS.map((post, idx) => (
          <div key={idx} className="glass-card news-card">
            <div className="news-header">
              <span className={`news-tag ${post.tag === 'SOLD OUT' ? 'tag-red' : 'tag-gold'}`}>
                {post.tag}
              </span>
              <span className="news-date">{post.date}</span>
            </div>
            
            <h3 className="news-title">{post.title}</h3>
            <p className="news-desc">{post.desc}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .news-section {
          background: linear-gradient(180deg, #0d0d12 0%, #070709 100%);
          border-bottom: 1px solid rgba(228, 166, 47, 0.05);
        }

        .news-intro {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin-bottom: 24px;
          margin-top: -12px;
        }

        .news-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .news-card {
          padding: 20px;
          border-radius: 12px;
          transition: var(--transition-smooth);
        }

        .news-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .news-tag {
          font-family: var(--font-family-title);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .tag-gold {
          background: rgba(228, 166, 47, 0.15);
          color: var(--color-gold-light);
          border: 1px solid rgba(228, 166, 47, 0.25);
        }

        .tag-red {
          background: rgba(255, 51, 51, 0.15);
          color: #ff6666;
          border: 1px solid rgba(255, 51, 51, 0.25);
        }

        .news-date {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .news-title {
          font-size: 1.1rem;
          color: #ffffff;
          line-height: 1.3;
          margin-bottom: 8px;
        }

        .news-desc {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          line-height: 1.5;
        }

        @media (min-width: 768px) {
          .news-list {
            flex-direction: row;
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .news-card {
            flex: 1;
          }
          .news-intro {
            text-align: center;
            max-width: 600px;
            margin: -12px auto 24px auto;
          }
        }
      
      `}</style>
    </section>
  );
}
