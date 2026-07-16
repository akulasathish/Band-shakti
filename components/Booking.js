'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export default function Booking() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [freeTickets, setFreeTickets] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(500);
  const [payableAmount, setPayableAmount] = useState(500);
  const [totalTickets, setTotalTickets] = useState(1);
  const [promoMessage, setPromoMessage] = useState('');
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // Authentication State Variables
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [activeEvent, setActiveEvent] = useState({
    id: null,
    title: 'Band Shakthi Live Concert',
    date: 'Next Friday | 8:00 PM onwards',
    venue: 'The DownTown Pub, Ground Stage'
  });

  // Fetch active user session on load & sync auth changes
  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) {
          setEmail(session.user.email);
        }
      } catch (err) {
        console.error("Failed to load user session:", err);
      }
    };
    fetchUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        setEmail(session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch active event details from database on load
  useEffect(() => {
    const fetchActiveEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          const dateObj = new Date(data.event_date);
          const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
          }) + ' | ' + dateObj.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });

          setActiveEvent({
            id: data.id,
            title: data.title,
            date: `${formattedDate} onwards`,
            venue: data.venue
          });
          setTicketPrice(parseFloat(data.ticket_price) || 500);
        }
      } catch (err) {
        console.error("Failed to load active event details:", err);
      }
    };
    fetchActiveEvent();
  }, []);

  // Auto show promo popup on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPromoPopup(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Recalculate prices and promotions dynamically
  useEffect(() => {
    let free = 0;

    if (quantity >= 5 && quantity < 8) {
      free = 1;
      setPromoMessage('🔥 LIMITED OFFER: Buy 5 Get 1 Free!');
    } else if (quantity >= 8) {
      free = 2;
      setPromoMessage('🎉 MEGAPACK APPLIED: Buy 8 Get 2 Free!');
    } else {
      setPromoMessage('');
    }

    setFreeTickets(free);
    setTotalTickets(quantity + free);
    setPayableAmount(quantity * ticketPrice);
  }, [quantity, ticketPrice]);

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // Sends custom 6-digit OTP verification code via Supabase + Resend SMTP
  const handleSendOTP = async () => {
    if (!authEmail.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    try {
      setIsAuthLoading(true);
      setAuthError('');
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim()
      });
      if (error) throw error;
      setOtpSent(true);
    } catch (err) {
      setAuthError('Failed to send code: ' + err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Verifies the user entered 4-digit OTP code and logs them in
  const handleVerifyOTP = async () => {
    if (otpCode.length < 4) {
      setAuthError('Please enter your 4-digit verification code.');
      return;
    }
    try {
      setIsAuthLoading(true);
      setAuthError('');
      const { data, error } = await supabase.auth.verifyOtp({
        email: authEmail.trim(),
        token: otpCode.trim(),
        type: 'email'
      });
      if (error) throw error;
      if (data?.user) {
        setUser(data.user);
        setEmail(data.user.email);
        setShowAuthModal(false);
        // Automatically proceed with checkout using the newly authenticated secure session
        await proceedWithPaymentCheckout(authEmail.trim(), phone.trim(), data.user.id);
      }
    } catch (err) {
      setAuthError('Verification failed: ' + err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Skip login and checkout as a guest (Frictionless / Not Strict checkout!)
  const handleContinueAsGuest = async () => {
    setShowAuthModal(false);
    await proceedWithPaymentCheckout(email.trim(), phone.trim(), null);
  };

  // Main Booking Submit - intercepts unauthenticated users for optional OTP flow
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!name.trim() || !trimmedEmail || !trimmedPhone) {
      alert("Please fill in all buyer details.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      alert("Please enter a valid 10-digit contact number.");
      return;
    }

    // Intercept unauthenticated checkouts to prompt secure OTP Sign In
    if (!user) {
      setAuthEmail(trimmedEmail);
      setAuthError('');
      setOtpSent(false);
      setOtpCode('');
      setShowAuthModal(true);
      return;
    }

    // Authenticated user - proceed with direct secure payment initialization
    await proceedWithPaymentCheckout(trimmedEmail, trimmedPhone, user.id);
  };

  // Initiates secure API checkout with Instamojo gateway (links booking to userId if authenticated)
  const proceedWithPaymentCheckout = async (trimmedEmail, trimmedPhone, loggedInUserId = null) => {
    try {
      setIsBookingLoading(true);

      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          email: trimmedEmail,
          phone: trimmedPhone,
          quantity: totalTickets,
          eventId: activeEvent.id,
          payableAmount: payableAmount,
          userId: loggedInUserId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize secure payment session.');
      }

      if (data.simulated) {
        alert("Instamojo Credentials Not Found on Server.\n\nRedirecting you to our secure local payment sandbox simulator...");
      } else {
        alert("Booking request initiated!\n\nRedirecting you securely to Instamojo checkout gateway...");
      }

      window.location.href = data.paymentUrl;

    } catch (err) {
      console.error("Booking checkout initiation failed:", err);
      alert("Booking failed to initialize secure checkout: " + err.message);
    } finally {
      setIsBookingLoading(false);
    }
  };


  return (
    <section id="booking" className="section-padding booking-section">
      <h2 className="section-title">Get Tickets</h2>
      <p className="booking-intro">Book your slots online for our upcoming gig. Immediate email delivery of secure QR passes.</p>

      {/* Dynamic Ticket Selector Card */}
      <div className="glass-card booking-card">
        <div className="show-header">
          <div className="show-badge">UPCOMING EVENT</div>
          <h3>{activeEvent.title}</h3>
          <p className="show-date">📅 {activeEvent.date}</p>
          <p className="show-venue">📍 {activeEvent.venue}</p>
        </div>

        <form onSubmit={handleBookingSubmit} className="booking-form">
          {/* Ticket Counter */}
          <div className="counter-row">
            <span className="counter-label">Quantity:</span>
            <div className="counter-controls">
              <button type="button" className="counter-btn" onClick={handleDecrement}>-</button>
              <span className="counter-value">{quantity}</span>
              <button type="button" className="counter-btn" onClick={handleIncrement}>+</button>
            </div>
          </div>

          {/* Dynamic Promo Message */}
          {promoMessage && (
            <div className="promo-badge-applied">
              {promoMessage}
            </div>
          )}

          {/* Pricing breakdown */}
          <div className="pricing-breakdown">
            <div className="pricing-line">
              <span>Paid Tickets:</span>
              <span>{quantity} x ₹{ticketPrice}</span>
            </div>
            {freeTickets > 0 && (
              <div className="pricing-line free-line">
                <span>Free Gift Tickets:</span>
                <span>+{freeTickets} Tickets</span>
              </div>
            )}
            <hr className="divider" />
            <div className="pricing-line total-line">
              <span>Total Tickets:</span>
              <span>{totalTickets} Passes</span>
            </div>
            <div className="pricing-line total-line gold-text">
              <span>Payable Amount:</span>
              <span>₹{payableAmount}</span>
            </div>
          </div>

          {/* Attendee Info Inputs */}
          <div className="input-group">
            <label htmlFor="buyer-name">Name</label>
            <input 
              id="buyer-name"
              type="text" 
              placeholder="Your Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="buyer-email">Email</label>
            <input 
              id="buyer-email"
              type="email" 
              placeholder="name@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="buyer-phone">Phone Number</label>
            <input 
              id="buyer-phone"
              type="tel" 
              placeholder="98765 43210" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-gold submit-booking-btn" 
            disabled={isBookingLoading}
            style={{ opacity: isBookingLoading ? 0.7 : 1, cursor: isBookingLoading ? 'not-allowed' : 'pointer' }}
          >
            {isBookingLoading ? (
              <>
                <span className="spinner-mini" style={{ display: 'inline-block', marginRight: '8px' }}></span>
                Redirecting to Secure Gateway...
              </>
            ) : (
              <>
                Proceed to Book
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22,10V6a2,2,0,0,0-2-2H4A2,2,0,0,0,2,6v4a2,2,0,0,1,0,4v4a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V14a2,2,0,0,1,0-4M20,8.5a1.5,1.5,0,0,0-3,0,1.5,1.5,0,0,0,3,0M7,8.5A1.5,1.5,0,1,0,8.5,10,1.5,1.5,0,0,0,7,8.5M17,15.5a1.5,1.5,0,1,0,1.5,1.5,1.5,1.5,0,0,0-1.5-1.5M7,15.5a1.5,1.5,0,1,0,1.5,1.5,1.5,1.5,0,0,0-1.5-1.5" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Initial Load Promotion Popup Drawer */}
      {showPromoPopup && (
        <div className="popup-overlay" onClick={() => setShowPromoPopup(false)}>
          <div className="popup-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={() => setShowPromoPopup(false)}>×</button>
            <div className="popup-accent-dot"></div>
            
            <h3 className="popup-title">EXCLUSIVE GIG DEALS</h3>
            <p className="popup-subtitle">Group Booking Discounts Active Now!</p>
            
            <div className="offers-list">
              <div className="offer-card-item" onClick={() => { setQuantity(5); setShowPromoPopup(false); }}>
                <span className="offer-title">LIMITED OFFER (5 + 1)</span>
                <span className="offer-details">Buy 5, Get 1 Ticket Free!</span>
              </div>
              
              <div className="offer-card-item" onClick={() => { setQuantity(8); setShowPromoPopup(false); }}>
                <span className="offer-title">MEGA ROCKSTAR PACK (8 + 2)</span>
                <span className="offer-details">Buy 8, Get 2 Tickets Free!</span>
              </div>
            </div>

            <button className="btn-gold claim-deal-btn" onClick={() => setShowPromoPopup(false)}>
              Claim Offers
            </button>
          </div>
        </div>
      )}

      {/* 6-Digit OTP Signup / Sign In Modal */}
      {showAuthModal && (
        <div className="popup-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="popup-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup" onClick={() => setShowAuthModal(false)}>×</button>
            <div className="popup-accent-dot"></div>
            
            {!otpSent ? (
              <>
                <h3 className="popup-title">🎸 JOIN THE SHAKTHI TRIBE</h3>
                <p className="popup-subtitle">Get booking history, recover lost tickets, and bypass lines at the gate!</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div className="input-group">
                    <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="name@email.com" 
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        color: '#ffffff', 
                        border: '1px solid rgba(228, 166, 47, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        width: '100%',
                        fontSize: '1rem'
                      }}
                      required
                    />
                  </div>
                  
                  {authError && (
                    <div style={{ color: '#ff5555', fontSize: '0.8rem', fontWeight: '500', textAlign: 'center' }}>
                      ⚠️ {authError}
                    </div>
                  )}

                  <button 
                    onClick={handleSendOTP} 
                    className="btn-gold" 
                    disabled={isAuthLoading}
                    style={{ width: '100%', cursor: isAuthLoading ? 'not-allowed' : 'pointer', opacity: isAuthLoading ? 0.7 : 1 }}
                  >
                    {isAuthLoading ? 'Sending verification code...' : 'Send 6-Digit OTP Code ✉️'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <button 
                      onClick={handleContinueAsGuest}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--color-text-muted)', 
                        textDecoration: 'underline', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      Continue as Guest 👤 (No account)
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="popup-title">🔢 ENTER VERIFICATION CODE</h3>
                <p className="popup-subtitle">We sent a secure verification OTP code to <br /><strong style={{ color: '#ffffff' }}>{authEmail}</strong></p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div className="input-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enter 4-Digit Code</label>
                    <input 
                      type="text" 
                      maxLength="4"
                      placeholder="1234" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        color: 'var(--color-gold-light)', 
                        border: '1px solid var(--color-gold-main)',
                        borderRadius: '8px',
                        padding: '12px',
                        width: '140px',
                        fontSize: '1.6rem',
                        fontWeight: '700',
                        letterSpacing: '0.25em',
                        textAlign: 'center'
                      }}
                      required
                    />
                  </div>
                  
                  {authError && (
                    <div style={{ color: '#ff5555', fontSize: '0.8rem', fontWeight: '500', textAlign: 'center' }}>
                      ⚠️ {authError}
                    </div>
                  )}

                  <button 
                    onClick={handleVerifyOTP} 
                    className="btn-gold" 
                    disabled={isAuthLoading}
                    style={{ width: '100%', cursor: isAuthLoading ? 'not-allowed' : 'pointer', opacity: isAuthLoading ? 0.7 : 1 }}
                  >
                    {isAuthLoading ? 'Verifying...' : 'Verify & Log In ⚡'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <button 
                      onClick={() => setOtpSent(false)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--color-text-muted)', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      ⬅️ Back
                    </button>
                    <button 
                      onClick={handleSendOTP}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--color-gold-light)', 
                        fontSize: '0.85rem', 
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}


      <style jsx>{`
        .booking-section {
          background: #070709;
        }

        .booking-intro {
          font-size: 0.9rem;
          color: var(--color-text-muted);
          margin-bottom: 24px;
          margin-top: -12px;
        }

        .booking-card {
          padding: 24px 20px;
        }

        .show-header {
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(228, 166, 47, 0.1);
          padding-bottom: 16px;
        }

        .show-badge {
          background: rgba(228, 166, 47, 0.15);
          border: 1px solid rgba(228, 166, 47, 0.3);
          color: var(--color-gold-light);
          font-family: var(--font-family-title);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 10px;
        }

        .show-header h3 {
          font-size: 1.3rem;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .show-date, .show-venue {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          margin-bottom: 4px;
        }

        /* Form styling */
        .booking-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .counter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: var(--font-family-title);
          font-weight: 600;
        }

        .counter-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .counter-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-bg-card);
          border: 1px solid var(--color-gold-main);
          color: #ffffff;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }

        .counter-btn:hover {
          background: var(--gold-gradient);
          color: #070709;
        }

        .counter-value {
          font-size: 1.2rem;
          color: #ffffff;
        }

        .promo-badge-applied {
          background: rgba(228, 166, 47, 0.1);
          border: 1px solid rgba(228, 166, 47, 0.2);
          color: var(--color-gold-light);
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          text-align: center;
          letter-spacing: 0.02em;
        }

        .pricing-breakdown {
          background: rgba(7, 7, 9, 0.4);
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pricing-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .free-line {
          color: #ff5555;
          font-weight: 600;
        }

        .total-line {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
        }

        .divider {
          border: 0;
          border-top: 1px solid rgba(228, 166, 47, 0.1);
          margin: 4px 0;
        }

        .submit-booking-btn {
          width: 100%;
          margin-top: 8px;
        }

        /* Timed Promo Popup Slide-up Drawer */
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          height: 100vh;
          background: transparent;
          z-index: 250;
          display: flex;
          align-items: flex-end;
        }

        .popup-drawer {
          width: 100%;
          background: #0d0d12;
          border-top: 2px solid var(--color-gold-main);
          border-radius: 20px 20px 0 0;
          padding: 30px 24px 40px 24px;
          position: relative;
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .close-popup {
          position: absolute;
          top: 15px;
          right: 20px;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 2rem;
          cursor: pointer;
        }

        .popup-accent-dot {
          width: 10px;
          height: 10px;
          background: var(--color-red-accent);
          border-radius: 50%;
          box-shadow: var(--shadow-red-glow);
          margin: 0 auto 12px auto;
        }

        .popup-title {
          font-size: 1.4rem;
          text-align: center;
          background: var(--gold-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
          letter-spacing: 0.05em;
        }

        .popup-subtitle {
          font-size: 0.8rem;
          text-align: center;
          color: var(--color-text-muted);
          margin-bottom: 24px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .offers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .offer-card-item {
          background: var(--color-bg-card);
          border: var(--border-glass);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .offer-card-item:hover {
          border-color: var(--color-gold-main);
          background: rgba(228, 166, 47, 0.05);
        }

        .offer-title {
          font-family: var(--font-family-title);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--color-gold-light);
        }

        .offer-details {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .claim-deal-btn {
          width: 100%;
        }

        @media (min-width: 768px) {
          .booking-card {
            max-width: 600px;
            margin: 0 auto;
          }
          .booking-intro {
            text-align: center;
            max-width: 600px;
            margin: -12px auto 32px auto;
          }
        }
      `}</style>
    </section>
  );
}
