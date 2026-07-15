'use client';
import { useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/utils/supabaseClient';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('Booking');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .insert([
          { 
            name, 
            email, 
            inquiry_type: inquiryType, 
            message 
          }
        ]);

      if (error) throw error;

      alert(`Thank you ${name}! Your booking inquiry has been submitted. Our team will contact you back via ${email} shortly.`);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error("Failed to submit contact inquiry:", err);
      alert("Failed to send message: " + err.message);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="contact" className="section-padding contact-section">
      <h2 className="section-title">Get in Touch</h2>
      <p className="contact-intro">Book Band Shakthi for private events, corporate gigs, pub shows, or weddings.</p>

      {/* Grid container for Info Card and Booking Form */}
      <div className="contact-grid">
        
        {/* Contact Info Card */}
        <div className="glass-card contact-info-card">
          <h3>Contact Channels</h3>
          <p className="info-intro">Reach out to us directly for bookings, gigs, or collaborations.</p>
          
          <div className="contact-methods">
            {/* Email Method */}
            <a href="mailto:bookings@bandshakti.com" className="method-item">
              <div className="method-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div className="method-details">
                <span className="method-label">Business Email</span>
                <span className="method-value">bookings@bandshakti.com</span>
              </div>
            </a>

            {/* WhatsApp Method */}
            <a 
              href="https://wa.me/918897963589?text=Hi%20Band%20Shakthi,%20I%20would%20like%20to%20inquire%20about%20booking%20your%20live%20band!" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="method-item"
            >
              <div className="method-icon" style={{ borderColor: '#25d366', color: '#25d366' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.008 0C5.397 0 .06 5.348.06 12.008c-.001 2.097.546 4.142 1.587 5.946L0 24l6.284-1.646c1.751.955 3.719 1.456 5.724 1.457 6.613 0 11.949-5.34 11.953-11.997.002-3.204-1.239-6.216-3.505-8.484C18.22 1.246 15.21.001 12.008 0zm6.97 15.344c-.242.678-1.402 1.294-1.958 1.378-.5.075-1.13.105-1.823-.115-2.9-1.258-4.795-4.18-4.94-4.373-.144-.194-1.182-1.57-1.182-2.994 0-1.425.748-2.127 1.014-2.417.265-.29.579-.362.772-.362.193 0 .386.002.556.01.178.01.417-.067.653.502.242.581.823 2.007.895 2.152.072.146.121.314.024.507-.097.193-.145.313-.29.483-.145.168-.305.379-.435.508-.145.143-.297.3-.127.59.169.29.752 1.242 1.616 2.013 1.111.992 2.05 1.3 2.34 1.445.29.144.46.12.63-.073.17-.193.724-.847.917-1.137.193-.29.387-.241.653-.145.267.096 1.693.799 1.983.944.29.146.483.218.556.34.07.12.07.701-.17 1.379z"/>
                </svg>
              </div>
              <div className="method-details">
                <span className="method-label">WhatsApp Bookings</span>
                <span className="method-value">+91 88979 63589</span>
              </div>
            </a>

            {/* Instagram Method */}
            <a 
              href="https://www.instagram.com/band_shakthi?utm_source=qr&igsh=azE4ZGVkZzdueDN1" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="method-item"
            >
              <div className="method-icon" style={{ borderColor: '#e1306c', color: '#e1306c' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </div>
              <div className="method-details">
                <span className="method-label">Official Instagram</span>
                <span className="method-value">@band_shakthi</span>
              </div>
            </a>
          </div>
        </div>

        {/* Booking Form Card */}
        <div className="glass-card contact-card">
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="input-group">
              <label htmlFor="contact-name">Name</label>
              <input 
                id="contact-name"
                type="text" 
                placeholder="Your Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="contact-email">Email Address</label>
              <input 
                id="contact-email"
                type="email" 
                placeholder="name@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-group">
              <label htmlFor="inquiry-type">Inquiry Type</label>
              <select 
                id="inquiry-type"
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="select-input"
              >
                <option value="Booking">Pub / Event Booking</option>
                <option value="Wedding">Wedding / Private Gig</option>
                <option value="Sponsorship">Sponsorship / Press</option>
                <option value="General">General Inquiry</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="contact-message">Message</label>
              <textarea 
                id="contact-message"
                placeholder="Tell us about your event (Date, Location, Venue details)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="4"
                required
              ></textarea>
            </div>

            <button type="submit" className="submit-contact-btn">
              SEND MESSAGE
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: 'rotate(-45deg)', marginLeft: '2px' }}>
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>

      </div>

      {/* Floating WhatsApp Widget (Pulsing and sticky in bottom-right) */}
      <a 
        href="https://wa.me/918897963589?text=Hi%20Band%20Shakthi,%20I%20would%20like%20to%20inquire%20about%20booking%20your%20live%20band!"
        target="_blank" 
        rel="noopener noreferrer" 
        className="whatsapp-float-btn"
        aria-label="Chat with Band Shakthi on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963-1.862-1.862-4.336-2.883-6.97-2.884-5.437 0-9.86 4.37-9.864 9.797-.001 1.677.452 3.313 1.312 4.737L1.882 19.3l4.765-1.246zm11.722-6.505c-.29-.145-1.716-.848-1.983-.944-.266-.096-.46-.145-.653.145-.193.29-.747.944-.917 1.137-.17.193-.341.217-.63.073-.29-.145-1.229-.453-2.34-1.445-.864-.771-1.447-1.723-1.616-2.013-.17-.29-.018-.447.127-.59.13-.129.29-.34.435-.508.145-.17.193-.29.29-.483.097-.193.048-.361-.024-.507-.072-.145-.653-1.571-.895-2.152-.236-.569-.475-.492-.653-.502-.17-.008-.363-.01-.556-.01-.193 0-.507.072-.772.361-.266.29-1.014.992-1.014 2.417s1.038 2.8 1.182 2.994c.145.193 2.04 3.115 4.94 4.373.69.299 1.228.479 1.648.612.693.22 1.324.19 1.823.115.556-.084 1.716-.7 1.958-1.378.24-.677.24-1.258.17-1.378-.073-.122-.266-.194-.556-.34z"/>
        </svg>
      </a>

      {/* Styled Footer */}
      <footer className="contact-footer">
        <div className="footer-logo" onClick={handleScrollToTop}>
          <Image 
            src="/logo.png" 
            alt="Band Shakthi Footer Logo" 
            width={120} 
            height={44} 
            className="footer-logo-img"
          />
        </div>
        
        {/* Footer Social Icons */}
        <div className="footer-socials">
          <a href="https://www.instagram.com/band_shakthi?utm_source=qr&igsh=azE4ZGVkZzdueDN1" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          <a href="https://wa.me/918897963589?text=Hi%20Band%20Shakthi,%20I%20would%20like%20to%20inquire%20about%20booking%20your%20live%20band!" target="_blank" rel="noopener noreferrer" className="social-icon-link" aria-label="WhatsApp">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963-1.862-1.862-4.336-2.883-6.97-2.884-5.437 0-9.86 4.37-9.864 9.797-.001 1.677.452 3.313 1.312 4.737L1.882 19.3l4.765-1.246zm11.722-6.505c-.29-.145-1.716-.848-1.983-.944-.266-.096-.46-.145-.653.145-.193.29-.747.944-.917 1.137-.17.193-.341.217-.63.073-.29-.145-1.229-.453-2.34-1.445-.864-.771-1.447-1.723-1.616-2.013-.17-.29-.018-.447.127-.59.13-.129.29-.34.435-.508.145-.17.193-.29.29-.483.097-.193.048-.361-.024-.507-.072-.145-.653-1.571-.895-2.152-.236-.569-.475-.492-.653-.502-.17-.008-.363-.01-.556-.01-.193 0-.507.072-.772.361-.266.29-1.014.992-1.014 2.417s1.038 2.8 1.182 2.994c.145.193 2.04 3.115 4.94 4.373.69.299 1.228.479 1.648.612.693.22 1.324.19 1.823.115.556-.084 1.716-.7 1.958-1.378.24-.677.24-1.258.17-1.378-.073-.122-.266-.194-.556-.34z"/>
            </svg>
          </a>
          <a href="mailto:bookings@bandshakti.com" className="social-icon-link" aria-label="Email">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </a>
        </div>

        {/* Footer Regulatory Policy Links */}
        <div className="footer-links">
          <a href="/terms">Terms & Conditions</a>
          <span className="separator">•</span>
          <a href="/privacy">Privacy Policy</a>
          <span className="separator">•</span>
          <a href="/refunds">Cancellation & Refund Policy</a>
        </div>

        <p className="footer-copyright">© 2026 BAND SHAKTHI. ALL RIGHTS RESERVED.</p>
        <p className="footer-credit">JAM ARENA PRODUCTION</p>
      </footer>

      <style jsx>{`
        .contact-section {
          background: #070709;
          position: relative;
        }

        .contact-intro {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin-bottom: 30px;
          margin-top: -12px;
        }

        .contact-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        /* Contact Details Card */
        .contact-info-card {
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-left: 2px solid var(--color-gold-main);
        }

        .contact-info-card h3 {
          font-size: 1.25rem;
          color: #ffffff;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: var(--font-family-title);
        }

        .info-intro {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin: 0 0 10px 0;
          line-height: 1.4;
        }

        .contact-methods {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .method-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          text-decoration: none;
          transition: var(--transition-smooth);
        }

        .method-item:hover {
          background: rgba(228, 166, 47, 0.04);
          border-color: rgba(228, 166, 47, 0.2);
          transform: translateX(4px);
        }

        .method-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(228, 166, 47, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-gold-main);
          flex-shrink: 0;
          background: rgba(228, 166, 47, 0.03);
        }

        .method-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .method-label {
          font-size: 0.65rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .method-value {
          font-size: 0.85rem;
          color: #ffffff;
          font-weight: 600;
        }

        .contact-card {
          padding: 30px 24px;
          margin-bottom: 40px;
          background: #0d0d12;
          border: 1px solid rgba(228, 166, 47, 0.2);
          border-radius: 12px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Inputs & Select */
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-group label {
          font-family: var(--font-family-title);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--color-gold-light);
        }

        .input-group input, .select-input, textarea {
          background: #121218;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-radius: 8px;
          padding: 14px 16px;
          font-size: 0.9rem;
          outline: none;
          font-family: var(--font-family-sans);
          transition: var(--transition-smooth);
        }

        .input-group input::placeholder, textarea::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }

        .select-input option {
          background-color: #0d0d12;
          color: #ffffff;
        }

        .input-group input:focus, .select-input:focus, textarea:focus {
          border-color: rgba(228, 166, 47, 0.5);
          box-shadow: 0 0 8px rgba(228, 166, 47, 0.15);
          background: #14141d;
        }

        textarea {
          resize: none;
        }

        .submit-contact-btn {
          width: 100%;
          margin-top: 8px;
          background: var(--gold-gradient);
          color: #070709;
          border: none;
          border-radius: 50px;
          height: 48px;
          font-family: var(--font-family-title);
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: var(--transition-smooth);
          box-shadow: 0 4px 15px rgba(228, 166, 47, 0.2);
        }

        .submit-contact-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-gold-glow);
        }

        /* Floating WhatsApp Button */
        .whatsapp-float-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background-color: #25d366;
          color: #ffffff;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(37, 211, 102, 0.4);
          z-index: 90;
          cursor: pointer;
          transition: var(--transition-smooth);
          animation: pulse-wa 2s infinite;
        }

        .whatsapp-float-btn:hover {
          transform: scale(1.08);
          background-color: #20ba5a;
        }

        @keyframes pulse-wa {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.5);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(37, 211, 102, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 211, 102, 0);
          }
        }

        /* Footer */
        .contact-footer {
          border-top: 1px solid rgba(228, 166, 47, 0.1);
          padding-top: 40px;
          padding-bottom: 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .footer-logo {
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .footer-logo:hover {
          transform: scale(1.05);
        }

        .footer-logo-img {
          object-fit: contain;
          filter: drop-shadow(0 0 4px rgba(228, 166, 47, 0.15));
        }

        .footer-socials {
          display: flex;
          gap: 16px;
          margin: 4px 0;
        }

        .social-icon-link {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(228, 166, 47, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
          transition: var(--transition-smooth);
        }

        .social-icon-link:hover {
          color: var(--color-gold-main);
          border-color: var(--color-gold-main);
          background: rgba(228, 166, 47, 0.05);
          transform: translateY(-2px);
        }

        .footer-links {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px 12px;
          margin-top: 14px;
          margin-bottom: 12px;
        }

        .footer-links a {
          color: var(--color-text-muted);
          font-size: 0.7rem;
          text-decoration: none;
          transition: color 0.2s ease;
          font-weight: 500;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .footer-links a:hover {
          color: var(--color-gold-main);
        }

        .footer-links .separator {
          color: rgba(228, 166, 47, 0.25);
          font-size: 0.7rem;
        }

        .footer-copyright {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          letter-spacing: 0.05em;
          font-weight: 500;
        }

        .footer-credit {
          font-family: var(--font-family-title);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: var(--color-gold-dark);
          text-transform: uppercase;
        }

        @media (min-width: 768px) {
          .contact-intro {
            text-align: center;
            max-width: 600px;
            margin: -12px auto 30px auto;
          }
          .contact-grid {
            flex-direction: row;
            align-items: stretch;
            gap: 24px;
            max-width: 1000px;
            margin: 0 auto 40px auto;
          }
          .contact-info-card {
            flex: 1;
            margin: 0;
          }
          .contact-card {
            flex: 1.3;
            margin: 0;
          }
          .contact-footer {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px 20px 20px;
          }
          .footer-socials {
            order: 2;
          }
          .footer-logo {
            order: 1;
          }
          .footer-copyright {
            order: 3;
          }
          .footer-credit {
            order: 4;
          }
        }
      `}</style>
    </section>
  );
}
