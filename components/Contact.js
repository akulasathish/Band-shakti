'use client';
import { useState } from 'react';
import Image from 'next/image';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [inquiryType, setInquiryType] = useState('Booking');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you ${name}! Your booking inquiry has been submitted. Our team will contact you back via ${email} shortly.`);
    setName('');
    setEmail('');
    setMessage('');
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section id="contact" className="section-padding contact-section">
      <h2 className="section-title">Get in Touch</h2>
      <p className="contact-intro">Book Band Shakthi for private events, corporate gigs, pub shows, or weddings.</p>

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

          <button type="submit" className="btn-gold submit-contact-btn">
            Send Message
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>

      {/* Floating WhatsApp Widget (Pulsing and sticky in bottom-right) */}
      <a 
        href="https://wa.me/919999999999?text=Hi%20Band%20Shakthi,%20I%20would%20like%20to%20inquire%20about%20booking%20your%20live%20band!"
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
          margin-bottom: 24px;
          margin-top: -12px;
        }

        .contact-card {
          padding: 24px 20px;
          margin-bottom: 40px;
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
          letter-spacing: 0.05em;
          color: var(--color-gold-light);
        }

        .input-group input, .select-input, textarea {
          background: var(--color-bg-input);
          border: 1px solid rgba(228, 166, 47, 0.15);
          color: #ffffff;
          border-radius: 8px;
          padding: 12px;
          font-size: 0.9rem;
          outline: none;
          font-family: var(--font-family-sans);
          transition: var(--transition-smooth);
        }

        .select-input option {
          background-color: #0d0d12;
          color: #ffffff;
        }

        .input-group input:focus, .select-input:focus, textarea:focus {
          border-color: var(--color-gold-main);
          box-shadow: 0 0 10px rgba(228, 166, 47, 0.1);
        }

        textarea {
          resize: none;
        }

        .submit-contact-btn {
          width: 100%;
          margin-top: 8px;
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
          .contact-card {
            max-width: 600px;
            margin: 0 auto 40px auto;
          }
          .contact-intro {
            text-align: center;
            max-width: 600px;
            margin: -12px auto 24px auto;
          }
          .contact-footer {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px 20px 20px;
          }
        }
      
      `}</style>
    </section>
  );
}
