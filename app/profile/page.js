'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link'; // Next.js Link
import { supabase } from '@/utils/supabaseClient';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sign In State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // QR Code Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Sync session state on load
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) {
          fetchUserBookings(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Session sync failed:", err);
        setIsLoading(false);
      }
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        fetchUserBookings(session.user.id);
      } else {
        setBookings([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all successful & pending bookings for the authenticated user ID
  const fetchUserBookings = async (userId) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          buyer_name,
          buyer_email,
          buyer_phone,
          pax,
          status,
          created_at,
          event_id
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Since events can be fetched separately or we mock defaults, let's format them nicely
      // If we want to join with events, we can, but let's query the events separately or resolve defaults gracefully.
      const resolvedBookings = await Promise.all((data || []).map(async (ticket) => {
        let eventInfo = {
          title: 'Band Shakthi Live Concert',
          date: 'Next Friday | 8:00 PM onwards',
          venue: 'The DownTown Pub, Ground Stage'
        };

        if (ticket.event_id) {
          const { data: evt } = await supabase
            .from('events')
            .select('title, event_date, venue')
            .eq('id', ticket.event_id)
            .maybeSingle();
          
          if (evt) {
            const dateObj = new Date(evt.event_date);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            }) + ' | ' + dateObj.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit'
            });

            eventInfo = {
              title: evt.title,
              date: `${formattedDate} onwards`,
              venue: evt.venue
            };
          }
        }

        return { ...ticket, event: eventInfo };
      }));

      setBookings(resolvedBookings);
    } catch (err) {
      console.error("Failed to load user bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auth Handler: Send 6-Digit OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }
    try {
      setIsAuthLoading(true);
      setAuthError('');
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim()
      });
      if (error) throw error;
      setOtpSent(true);
    } catch (err) {
      setAuthError('Failed to send verification code: ' + err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Auth Handler: Verify OTP (supports both existing logins and new signups automatically!)
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      setAuthError('Please enter your 6-digit verification code.');
      return;
    }
    try {
      setIsAuthLoading(true);
      setAuthError('');
      
      // Try verifying as an existing user login first
      let { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email'
      });
      
      // Fallback: If login verification fails, try verifying as a brand-new user signup!
      if (error) {
        const signupRes = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: otpCode.trim(),
          type: 'signup'
        });
        
        if (signupRes.error) {
          throw new Error(signupRes.error.message || error.message);
        }
        data = signupRes.data;
      }

      if (data?.user) {
        setUser(data.user);
        setOtpSent(false);
        setOtpCode('');
      }
    } catch (err) {
      setAuthError('Verification failed: ' + err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Log Out Handler
  const handleLogout = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="profile-container">
      {/* Header Navigation */}
      <header className="profile-header">
        <Link href="/" className="back-home-link">
          ⬅️ Back to Home
        </Link>
        <span className="portal-logo">BAND SHAKTHI</span>
      </header>

      <main className="profile-content">
        {isLoading ? (
          <div className="loader-container">
            <span className="spinner-large"></span>
            <p>Loading your profile...</p>
          </div>
        ) : !user ? (
          /* Sign In Card (When not authenticated) */
          <div className="glass-card auth-card">
            <div className="profile-badge">FAN PORTAL</div>
            
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="auth-form">
                <h2 className="section-title">Sign In / Sign Up</h2>
                <p className="auth-subtitle">Enter your email to receive a 6-digit OTP code. Access your booking history and secure passes instantly!</p>
                
                <div className="input-group">
                  <label htmlFor="auth-email">Email Address</label>
                  <input 
                    id="auth-email"
                    type="email" 
                    placeholder="name@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                {authError && <div className="auth-error">⚠️ {authError}</div>}
                
                <button type="submit" className="btn-gold" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Sending OTP Code...' : 'Get Verification OTP Code ✉️'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="auth-form">
                <h2 className="section-title">Verify OTP</h2>
                <p className="auth-subtitle">We sent a secure verification code to <br /><strong>{email}</strong></p>
                
                <div className="input-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor="auth-otp" style={{ alignSelf: 'flex-start' }}>6-Digit Code</label>
                  <input 
                    id="auth-otp"
                    type="text" 
                    maxLength="6"
                    placeholder="123456" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="otp-input"
                    required
                  />
                </div>
                
                {authError && <div className="auth-error">⚠️ {authError}</div>}
                
                <button type="submit" className="btn-gold" disabled={isAuthLoading}>
                  {isAuthLoading ? 'Verifying...' : 'Verify & Log In ⚡'}
                </button>

                <div className="auth-footer-actions">
                  <button type="button" onClick={() => setOtpSent(false)} className="btn-text">
                    ⬅️ Back
                  </button>
                  <button type="button" onClick={handleSendOTP} className="btn-text highlight">
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* Authenticated User Dashboard */
          <div className="dashboard-layout">
            <div className="user-profile-summary glass-card">
              <div className="user-avatar-badge">👤</div>
              <div className="user-details-meta">
                <h3>{bookings[0]?.buyer_name || user.email.split('@')[0]}</h3>
                <p className="user-email">{user.email}</p>
                <div className="mobile-badges-wrapper">
                  <span className="verified-badge">✓ Fan Member</span>
                  <span className="verified-badge" style={{ color: 'var(--color-gold-light)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(212,175,55,0.05)' }}>✓ Verified Email</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                Log Out 🚪
              </button>
            </div>

            <div className="booking-history-section">
              <h2 className="history-title">Your Booking History 🎟️</h2>
              
              {bookings.length === 0 ? (
                <div className="glass-card empty-state-card">
                  <p className="empty-text">No active bookings found for this account.</p>
                  <p className="empty-sub">Tickets you book in the future will automatically link and display here!</p>
                  <Link href="/#booking" className="btn-gold book-now-btn">
                    Book Tickets Now
                  </Link>
                </div>
              ) : (
                <div className="bookings-grid">
                  {bookings.map((ticket) => {
                    const downloadUrl = `/api/booking/ticket?name=${encodeURIComponent(ticket.buyer_name)}&phone=${encodeURIComponent(ticket.buyer_phone)}&qty=${ticket.pax}&id=${ticket.id}`;
                    const isPaid = ticket.status === 'PAID' || ticket.status === 'SUCCESS' || ticket.status === 'ACTIVE';

                    return (
                      <div key={ticket.id} className="glass-card booking-history-card">
                        <div className="card-header">
                          <span className={`status-badge ${ticket.status.toLowerCase()}`}>
                            {ticket.status}
                          </span>
                          <span className="pax-count">{ticket.pax} {ticket.pax === 1 ? 'Pass' : 'Passes'}</span>
                        </div>
                        
                        <h4 className="event-title">{ticket.event.title}</h4>
                        <p className="event-date">📅 {ticket.event.date}</p>
                        <p className="event-venue">📍 {ticket.event.venue}</p>
                        
                        <div className="buyer-meta-info">
                          <span><strong>Buyer:</strong> {ticket.buyer_name}</span>
                          <span><strong>Phone:</strong> {ticket.buyer_phone}</span>
                        </div>

                        <div className="card-actions">
                          {isPaid ? (
                            <>
                              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="action-btn btn-download">
                                📥 Download PDF
                              </a>
                              <button onClick={() => setSelectedTicket(ticket)} className="action-btn btn-qr">
                                📱 Entrance QR
                              </button>
                            </>
                          ) : (
                            <span className="pending-notice">Payment Pending or Failed</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Entrance QR Code Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedTicket(null)}>×</button>
            
            <h3 className="modal-title">OFFICIAL QR CODE PASS</h3>
            <p className="modal-subtitle">Present this code on your phone screen at the gate entrance.</p>
            
            <div className="qr-container">
              {/* Premium Public QR server API */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=212-175-55&bgcolor=13-13-18&data=${selectedTicket.id}`}
                alt="Ticket QR Code"
                className="qr-img"
              />
            </div>
            
            <div className="ticket-modal-details">
              <h4>{selectedTicket.event.title}</h4>
              <p><strong>Holder:</strong> {selectedTicket.buyer_name}</p>
              <p><strong>Passes Allowed:</strong> {selectedTicket.pax} Pax</p>
              <p className="ticket-id-text">ID: {selectedTicket.id}</p>
            </div>
            
            <button onClick={() => setSelectedTicket(null)} className="btn-gold close-btn">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Global CSS Styles */}
      <style jsx global>{`
        .profile-container {
          min-height: 100vh;
          background: #070709;
          color: #ffffff;
          padding: 20px;
          font-family: var(--font-family-body, sans-serif);
        }

        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 1px solid rgba(228, 166, 47, 0.1);
          padding-bottom: 16px;
        }

        .back-home-link {
          color: var(--color-gold-light, #f0e68c);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 600;
          transition: 0.2s;
        }

        .back-home-link:hover {
          color: #ffffff;
        }

        .portal-logo {
          font-family: var(--font-family-title, sans-serif);
          font-size: 1.1rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          background: var(--gold-gradient, linear-gradient(135deg, #d4af37, #f0e68c));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .profile-content {
          max-width: 900px;
          margin: 0 auto;
        }

        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 16px;
        }

        .spinner-large {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(228, 166, 47, 0.1);
          border-top: 4px solid var(--color-gold-main, #d4af37);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Glassmorphic Auth Card */
        .auth-card {
          max-width: 450px;
          margin: 60px auto;
          padding: 30px 24px;
          text-align: center;
          border: 1px solid rgba(228, 166, 47, 0.2);
          background: rgba(13, 13, 18, 0.8);
          border-radius: 16px;
        }

        .profile-badge {
          background: rgba(228, 166, 47, 0.15);
          border: 1px solid rgba(228, 166, 47, 0.3);
          color: var(--color-gold-light, #f0e68c);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 4px 12px;
          border-radius: 12px;
          display: inline-block;
          margin-bottom: 20px;
        }

        .auth-subtitle {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          text-align: left;
          width: 100%;
        }

        .input-group label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 6px;
          display: block;
        }

        .input-group input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(228, 166, 47, 0.2);
          color: #ffffff;
          padding: 12px;
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          transition: 0.2s;
        }

        .input-group input:focus {
          border-color: var(--color-gold-main, #d4af37);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.15);
        }

        .otp-input {
          width: 180px !important;
          font-size: 1.6rem !important;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-align: center;
          color: var(--color-gold-light, #f0e68c) !important;
          border-color: var(--color-gold-main, #d4af37) !important;
        }

        .auth-error {
          color: #ff5555;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .auth-footer-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }

        .btn-text {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          font-size: 0.85rem;
        }

        .btn-text.highlight {
          color: var(--color-gold-light, #f0e68c);
          text-decoration: underline;
        }

        /* Dashboard Layout */
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .user-profile-summary {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 20px;
          background: rgba(13, 13, 18, 0.85);
          border: 1px solid rgba(228, 166, 47, 0.15);
          border-radius: 12px;
          text-align: center;
          gap: 16px;
        }

        @media (min-width: 576px) {
          .user-profile-summary {
            flex-direction: row;
            text-align: left;
            justify-content: space-between;
            gap: 20px;
          }
        }

        .user-avatar-badge {
          width: 54px;
          height: 54px;
          background: rgba(228, 166, 47, 0.1);
          border: 1px solid rgba(228, 166, 47, 0.25);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
        }

        .user-details-meta {
          flex: 1;
          margin-left: 0;
          width: 100%;
          overflow: hidden;
        }

        @media (min-width: 576px) {
          .user-details-meta {
            margin-left: 18px;
          }
        }

        .user-details-meta h3 {
          font-size: 1.1rem;
          margin-bottom: 2px;
          color: #ffffff;
        }

        .user-email {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 4px;
        }

        .verified-badge {
          font-size: 0.75rem;
          color: #00ff66;
          font-weight: 600;
        }

        .mobile-badges-wrapper {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (min-width: 576px) {
          .mobile-badges-wrapper {
            justify-content: flex-start;
          }
        }

        .btn-logout {
          background: transparent;
          border: 1px solid rgba(255, 85, 85, 0.3);
          color: #ff5555;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: 0.2s;
          width: 100%;
          max-width: 180px;
          text-align: center;
        }

        @media (min-width: 576px) {
          .btn-logout {
            width: auto;
            max-width: none;
          }
        }

        .btn-logout:hover {
          background: rgba(255, 85, 85, 0.1);
          border-color: #ff5555;
        }

        /* Bookings Section */
        .history-title {
          font-size: 1.4rem;
          margin-bottom: 20px;
          background: var(--gold-gradient, linear-gradient(135deg, #d4af37, #f0e68c));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .empty-state-card {
          padding: 40px;
          text-align: center;
          background: rgba(13, 13, 18, 0.5);
          border: 1px dashed rgba(228, 166, 47, 0.2);
          border-radius: 12px;
        }

        .empty-text {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .empty-sub {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 20px;
        }

        .book-now-btn {
          display: inline-block;
          padding: 10px 24px;
          text-decoration: none;
        }

        .bookings-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 768px) {
          .bookings-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .card-actions {
            flex-direction: column;
            gap: 8px;
          }
          .buyer-meta-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }

        .booking-history-card {
          padding: 20px;
          background: rgba(13, 13, 18, 0.8);
          border: 1px solid rgba(228, 166, 47, 0.1);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: 0.2s;
        }

        .booking-history-card:hover {
          border-color: rgba(228, 166, 47, 0.3);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 10px;
          text-transform: uppercase;
        }

        .status-badge.paid, .status-badge.success, .status-badge.active {
          background: rgba(0, 255, 102, 0.1);
          border: 1px solid rgba(0, 255, 102, 0.3);
          color: #00ff66;
        }

        .status-badge.pending {
          background: rgba(255, 204, 0, 0.1);
          border: 1px solid rgba(255, 204, 0, 0.3);
          color: #ffcc00;
        }

        .pax-count {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-gold-light, #f0e68c);
        }

        .event-title {
          font-size: 1.15rem;
          color: #ffffff;
          font-weight: 700;
          margin-bottom: -4px;
        }

        .event-date, .event-venue {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .buyer-meta-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(0, 0, 0, 0.2);
          padding: 8px 10px;
          border-radius: 6px;
        }

        .card-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .action-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: 0.2s;
        }

        .btn-download {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .btn-download:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #ffffff;
        }

        .btn-qr {
          background: var(--gold-gradient, linear-gradient(135deg, #d4af37, #f0e68c));
          border: none;
          color: #070709;
        }

        .btn-qr:hover {
          opacity: 0.9;
        }

        .pending-notice {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          width: 100%;
          display: block;
          padding: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        /* Modals and Overlays */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          z-index: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          max-width: 380px;
          width: 100%;
          background: #0d0d12;
          border: 2px solid var(--color-gold-main, #d4af37);
          border-radius: 16px;
          padding: 30px 24px;
          text-align: center;
          position: relative;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
        }

        .close-modal {
          position: absolute;
          top: 15px;
          right: 20px;
          background: transparent;
          border: none;
          color: #ffffff;
          font-size: 2rem;
          cursor: pointer;
        }

        .modal-title {
          font-size: 1.25rem;
          font-family: var(--font-family-title, sans-serif);
          background: var(--gold-gradient, linear-gradient(135deg, #d4af37, #f0e68c));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 4px;
          letter-spacing: 0.05em;
        }

        .modal-subtitle {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 24px;
          line-height: 1.4;
        }

        .qr-container {
          background: #0d0d12;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(228, 166, 47, 0.2);
          display: inline-block;
          margin-bottom: 24px;
        }

        .qr-img {
          display: block;
          border-radius: 6px;
        }

        .ticket-modal-details {
          text-align: left;
          background: rgba(0, 0, 0, 0.3);
          padding: 14px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .ticket-modal-details h4 {
          font-size: 1.05rem;
          color: #ffffff;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 6px;
        }

        .ticket-modal-details p {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 4px;
        }

        .ticket-id-text {
          font-size: 0.75rem !important;
          color: rgba(255, 255, 255, 0.4) !important;
          font-family: monospace;
          margin-top: 10px;
        }

        .close-btn {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
