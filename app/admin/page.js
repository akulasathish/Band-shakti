'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

export default function AdminPage() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Tab Navigation State: 'stats' | 'scan' | 'sell' | 'csv' | 'media'
  const [activeTab, setActiveTab] = useState('stats');
  
  // Scanner States
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);

  // Counter Sell Inputs
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [activationResult, setActivationResult] = useState(null);

  // CSV Import States
  const [csvFile, setCsvFile] = useState(null);
  const [importedLogs, setImportedLogs] = useState([
    { date: '2026-07-12', source: 'Zomato District', count: 42 },
    { date: '2026-07-08', source: 'BookMyShow', count: 18 }
  ]);

  // Mock Dashboard Stats
  const stats = {
    totalTicketsSold: 284,
    revenue: '₹1,42,000',
    checkedIn: 186,
    capacity: 400
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@bandshakti.com' && password === 'shaktiadmin') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid admin credentials. Use admin@bandshakti.com / shaktiadmin');
    }
  };

  // QR Scanner Lifecycle Management (Starts camera when on scan tabs, stops when leaving)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const startScanner = async () => {
      // Clear previous scan states
      setScanResult(null);
      setScanError(null);
      
      const elementId = activeTab === 'scan' ? 'gate-scanner-reader' : 'sell-scanner-reader';
      const container = document.getElementById(elementId);
      
      if (!container) return;

      try {
        const html5QrCode = new Html5Qrcode(elementId);
        html5QrCodeRef.current = html5QrCode;
        setIsScanning(true);

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera
          config,
          (decodedText) => {
            // Success Callback
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Error callback (usually silent, fires on every frame with no QR code)
          }
        );
      } catch (err) {
        console.error("Camera access failed:", err);
        setScanError("Failed to access camera. Ensure permissions are granted.");
        setIsScanning(false);
      }
    };

    if (activeTab === 'scan' || activeTab === 'sell') {
      startScanner();
    }

    // Cleanup function: Stop camera when leaving the scanner tab
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          console.log("Scanner stopped successfully");
          setIsScanning(false);
        }).catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, [activeTab, isAuthenticated]);

  const handleScanSuccess = (decodedText) => {
    // Stop scanning immediately after a read
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        setIsScanning(false);
      });
    }

    if (activeTab === 'scan') {
      // Mock Gate scan validation logic
      // In production, this will call API: /api/admin/scan
      const isAlreadyUsed = decodedText.includes('used') || Math.random() > 0.7; 
      if (isAlreadyUsed) {
        setScanResult({
          status: 'DENIED',
          message: 'TICKET ALREADY SCANNED AT 08:24 PM!',
          buyer: 'Rahul Kumar (rahul@email.com)'
        });
      } else {
        setScanResult({
          status: 'GRANTED',
          message: 'ACCESS GRANTED! Valid Ticket.',
          buyer: 'Sathish Sharma (sathish@email.com)'
        });
      }
    } else if (activeTab === 'sell') {
      // Counter sell activation scan
      setScanResult({
        status: 'READY_TO_ACTIVATE',
        qrId: decodedText
      });
    }
  };

  const handleActivateSticker = (e) => {
    e.preventDefault();
    if (!guestName) {
      alert("Please enter guest name.");
      return;
    }
    // Mock Counter activation API: /api/admin/activate
    setActivationResult({
      success: true,
      message: `Pass Activated! Sticker QR [${scanResult.qrId.substring(0, 8)}...] is now bound to ${guestName} for tonight's show.`
    });
    // Reset form
    setGuestName('');
    setGuestPhone('');
    setScanResult(null);
  };

  const handleCsvSubmit = (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a Zomato/BookMyShow CSV file.");
      return;
    }
    // Mock CSV Import API
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      source: csvFile.name.toLowerCase().includes('zomato') ? 'Zomato District' : 'BookMyShow',
      count: Math.floor(Math.random() * 50) + 10
    };
    setImportedLogs([newLog, ...importedLogs]);
    alert(`Success! Imported ${newLog.count} bookings from ${csvFile.name}. Verification emails containing QR codes are now being dispatched.`);
    setCsvFile(null);
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <main className="mobile-container login-page">
        <div className="login-logo-wrapper">
          <Image 
            src="/logo.png" 
            alt="Band Shakthi Logo" 
            width={200} 
            height={70} 
            priority
            className="logo-img"
          />
        </div>
        
        <div className="glass-card login-card">
          <div className="login-header">
            <span className="live-indicator"></span>
            <h2>Admin Portal</h2>
            <p>Access your ticketing scanner & dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="login-email">Admin Email</label>
              <input 
                id="login-email"
                type="email" 
                placeholder="admin@bandshakti.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-pass">Password</label>
              <input 
                id="login-pass"
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-gold login-btn">
              Login Securely
            </button>
          </form>
        </div>

        <p className="login-note">Credentials for UI Review:<br /><b>admin@bandshakti.com</b> / <b>shaktiadmin</b></p>
        
        <style jsx global>{`
          .login-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 30px 20px;
            background: #070709;
            min-height: 100vh;
          }
          .login-logo-wrapper {
            margin-bottom: 32px;
          }
          .login-card {
            width: 100%;
            padding: 30px 20px;
          }
          .login-header {
            text-align: center;
            margin-bottom: 24px;
            position: relative;
          }
          .login-header h2 {
            font-size: 1.4rem;
            color: #ffffff;
            margin-top: 8px;
          }
          .login-header p {
            font-size: 0.8rem;
            color: var(--color-text-muted);
            margin-top: 4px;
          }
          .login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .login-btn {
            width: 100%;
            margin-top: 8px;
          }
          .login-note {
            font-size: 0.75rem;
            text-align: center;
            color: var(--color-text-muted);
            margin-top: 24px;
            line-height: 1.5;
            background: rgba(228, 166, 47, 0.05);
            padding: 10px;
            border-radius: 8px;
            border: 1px dashed rgba(228, 166, 47, 0.2);
            width: 100%;
          }
        `}</style>
      </main>
    );
  }

  // --- LOGGED IN ADMIN APP ---
  return (
    <main className="mobile-container admin-app">
      {/* App Header */}
      <header className="admin-header">
        <Image src="/logo.png" alt="Logo" width={110} height={38} className="logo-img" />
        <span className="badge-pwa">ADMIN APP</span>
      </header>

      {/* Main Content Area */}
      <div className="admin-body">
        
        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === 'stats' && (
          <div className="tab-content">
            <h2 className="tab-title">Sales Dashboard</h2>
            
            <div className="stats-grid">
              <div className="glass-card stat-box">
                <span className="stat-label">Tickets Sold</span>
                <span className="stat-value">{stats.totalTicketsSold}</span>
              </div>
              <div className="glass-card stat-box">
                <span className="stat-label">Revenue</span>
                <span className="stat-value gold-text">{stats.revenue}</span>
              </div>
              <div className="glass-card stat-box full-width">
                <span className="stat-label">Event Attendance</span>
                <div className="attendance-bar-row">
                  <div className="attendance-bar-bg">
                    <div 
                      className="attendance-bar-fill" 
                      style={{ width: `${(stats.checkedIn / stats.totalTicketsSold) * 100}%` }}
                    ></div>
                  </div>
                  <span className="attendance-text">
                    <b>{stats.checkedIn}</b> / {stats.totalTicketsSold} Entered
                  </span>
                </div>
              </div>
            </div>

            <div className="action-cards">
              <div className="glass-card action-box" onClick={() => setActiveTab('scan')}>
                <h4>Launch Scanner</h4>
                <p>Verify gate entries using device camera</p>
              </div>
              <div className="glass-card action-box" onClick={() => setActiveTab('sell')}>
                <h4>Sticker Activator</h4>
                <p>Register counter sales and activate passes</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GATE ENTRY SCANNER */}
        {activeTab === 'scan' && (
          <div className="tab-content">
            <h2 className="tab-title">Gate Ticket Scanner</h2>
            <p className="tab-desc">Point the camera at the attendee's ticket QR code.</p>

            {/* Scanner Viewer */}
            <div className="scanner-container">
              <div id="gate-scanner-reader" className="qr-reader-window"></div>
              {!isScanning && !scanResult && (
                <div className="scanner-placeholder">
                  <span className="spinner"></span>
                  <p>Starting Camera Feed...</p>
                </div>
              )}
            </div>

            {/* Scanner Results Overlay */}
            {scanResult && (
              <div className={`scan-result-card ${scanResult.status === 'GRANTED' ? 'result-success' : 'result-fail'}`}>
                <h3>{scanResult.status === 'GRANTED' ? '✓ ACCESS GRANTED' : '✗ ACCESS DENIED'}</h3>
                <p className="result-msg">{scanResult.message}</p>
                <div className="result-details">
                  <p><b>Buyer:</b> {scanResult.buyer}</p>
                </div>
                <button className="btn-outline btn-scan-again" onClick={() => setActiveTab('stats')}>
                  Back to Dashboard
                </button>
              </div>
            )}

            {scanError && (
              <div className="scan-error-card">
                <p>{scanError}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COUNTER SELL (STICKER ACTIVATOR) */}
        {activeTab === 'sell' && (
          <div className="tab-content">
            <h2 className="tab-title">Sticker Activator</h2>
            <p className="tab-desc">Step 1: Scan a generic QR sticker on a pass.</p>

            {/* Step 1: Scan sticker */}
            {(!scanResult || scanResult.status !== 'READY_TO_ACTIVATE') && (
              <div className="scanner-container">
                <div id="sell-scanner-reader" className="qr-reader-window"></div>
                {!isScanning && (
                  <div className="scanner-placeholder">
                    <span className="spinner"></span>
                    <p>Starting Camera Feed...</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Input guest details to activate */}
            {scanResult && scanResult.status === 'READY_TO_ACTIVATE' && (
              <div className="glass-card activation-form-card">
                <div className="activation-header">
                  <span className="badge-ok">Sticker Scanned</span>
                  <p className="qr-hash">ID: {scanResult.qrId.substring(0, 16)}...</p>
                </div>

                <form onSubmit={handleActivateSticker} className="activation-form">
                  <div className="input-group">
                    <label>Guest Name</label>
                    <input 
                      type="text" 
                      placeholder="Enter Guest Name" 
                      value={guestName} 
                      onChange={(e) => setGuestName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label>Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      placeholder="Phone" 
                      value={guestPhone} 
                      onChange={(e) => setGuestPhone(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-gold">
                    Activate Pass Card
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setScanResult(null)}>
                    Scan Another Sticker
                  </button>
                </form>
              </div>
            )}

            {/* Success message */}
            {activationResult && (
              <div className="glass-card activation-success-card">
                <h3>✓ Pass Activated!</h3>
                <p>{activationResult.message}</p>
                <button className="btn-gold" onClick={() => { setActivationResult(null); setActiveTab('stats'); }}>
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ZOMATO CSV IMPORTER */}
        {activeTab === 'csv' && (
          <div className="tab-content">
            <h2 className="tab-title">CSV Importer</h2>
            <p className="tab-desc">Import guest sheets from Zomato District or BookMyShow.</p>

            <div className="glass-card csv-importer-card">
              <form onSubmit={handleCsvSubmit} className="csv-form">
                <div className="csv-drop-zone">
                  <input 
                    type="file" 
                    accept=".csv" 
                    id="csv-file-input" 
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="hidden-file-input"
                  />
                  <label htmlFor="csv-file-input" className="file-input-label">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold-main)" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <span>{csvFile ? csvFile.name : 'Select Guest List CSV'}</span>
                  </label>
                </div>

                <button type="submit" className="btn-gold submit-csv-btn">
                  Import Bookings
                </button>
              </form>
            </div>

            {/* Import history log */}
            <div className="import-history">
              <h4>Recent Imports</h4>
              <div className="history-list">
                {importedLogs.map((log, idx) => (
                  <div key={idx} className="glass-card history-item">
                    <div className="history-left">
                      <span className="history-source">{log.source}</span>
                      <span className="history-date">{log.date}</span>
                    </div>
                    <span className="history-badge">+{log.count} Tickets</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WEBSITE CONTENT EDITOR */}
        {activeTab === 'media' && (
          <div className="tab-content">
            <h2 className="tab-title">Media Manager</h2>
            <p className="tab-desc">Edit images and texts live on the landing page.</p>

            <div className="media-forms">
              {/* Home Carousel */}
              <div className="glass-card media-editor-section">
                <h4>1. Hero Banner Slider</h4>
                <div className="media-row">
                  <span>Slide 1 Banner</span>
                  <input type="file" accept="image/*" />
                </div>
                <div className="media-row">
                  <span>Slide 2 Banner</span>
                  <input type="file" accept="image/*" />
                </div>
                <button className="btn-gold btn-save-media" onClick={() => alert("Banner updated! Image compression completed.")}>Save Banners</button>
              </div>

              {/* Photo Gallery */}
              <div className="glass-card media-editor-section">
                <h4>2. Concert Photo Gallery</h4>
                <div className="media-row">
                  <span>Upload New Photos</span>
                  <input type="file" accept="image/*" multiple />
                </div>
                <button className="btn-gold btn-save-media" onClick={() => alert("Concert images uploaded to Supabase Storage.")}>Add to Gallery</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom App Navigation Bar (PWA style) */}
      <nav className="admin-footer-tabs">
        <button className={`tab-link ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          <span>Dashboard</span>
        </button>

        <button className={`tab-link ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => setActiveTab('scan')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M4 4h7v7H4zm2 2v3h3V6zm2 2H7V7h1zm3-4h7v7h-7zm2 2v3h3V6zm2 2h-1V7h1zM4 13h7v7H4zm2 2v3h3v-3zm2 2H7v-1h1zm8-4h3v3h-3zm0 5h3v3h-3zm3-2h3v3h-3zm-3-3h3v3h-3zm3-2h3v3h-3zm-6 3h3v3h-3zm3 3h3v3h-3z"/>
          </svg>
          <span>Scan Gate</span>
        </button>

        <button className={`tab-link ${activeTab === 'sell' ? 'active' : ''}`} onClick={() => setActiveTab('sell')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
          </svg>
          <span>Sell Counter</span>
        </button>

        <button className={`tab-link ${activeTab === 'csv' ? 'active' : ''}`} onClick={() => setActiveTab('csv')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
          </svg>
          <span>CSV Import</span>
        </button>

        <button className={`tab-link ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
          <span>Media</span>
        </button>
      </nav>

      <style jsx>{`
        .admin-app {
          background-color: #070709;
          height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .admin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          height: 60px;
          border-bottom: 1px solid rgba(228, 166, 47, 0.1);
          background-color: rgba(18, 18, 24, 0.5);
        }

        .logo-img {
          object-fit: contain;
        }

        .badge-pwa {
          background: rgba(228, 166, 47, 0.15);
          border: 1px solid rgba(228, 166, 47, 0.3);
          color: var(--color-gold-light);
          font-family: var(--font-family-title);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 4px;
        }

        .admin-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px 16px 90px 16px; /* 90px padding at bottom to prevent nav overlap */
        }

        .tab-title {
          font-size: 1.5rem;
          text-transform: uppercase;
          margin-bottom: 4px;
          color: #ffffff;
        }

        .tab-desc {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-bottom: 20px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
        }

        .full-width {
          grid-column: span 2;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          font-family: var(--font-family-title);
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: #ffffff;
          font-family: var(--font-family-title);
        }

        .attendance-bar-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 6px;
        }

        .attendance-bar-bg {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .attendance-bar-fill {
          height: 100%;
          background: var(--gold-gradient);
          border-radius: 4px;
        }

        .attendance-text {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        /* Action box cards */
        .action-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .action-box {
          cursor: pointer;
        }

        .action-box h4 {
          font-size: 1rem;
          color: var(--color-gold-light);
          margin-bottom: 2px;
        }

        .action-box p {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        /* QR Scanner Reader Styling */
        .scanner-container {
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
          border: var(--border-glass-active);
          position: relative;
          aspect-ratio: 1;
        }

        .qr-reader-window {
          width: 100%;
          height: 100%;
        }

        .scanner-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--color-text-muted);
          font-size: 0.85rem;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(228, 166, 47, 0.1);
          border-top-color: var(--color-gold-main);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Scan result details */
        .scan-result-card {
          margin-top: 24px;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          animation: slideUp 0.3s ease-out;
        }

        .result-success {
          background: rgba(32, 186, 90, 0.1);
          border: 1px solid rgba(32, 186, 90, 0.3);
          color: #20ba5a;
        }

        .result-fail {
          background: rgba(255, 51, 51, 0.1);
          border: 1px solid rgba(255, 51, 51, 0.3);
          color: #ff3333;
        }

        .scan-result-card h3 {
          font-size: 1.2rem;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
        }

        .result-msg {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 12px;
          color: #ffffff;
        }

        .result-details {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 10px;
          font-size: 0.8rem;
          text-align: left;
          color: var(--color-text-muted);
          margin-bottom: 20px;
        }

        .btn-scan-again {
          width: 100%;
        }

        .scan-error-card {
          background: rgba(255, 51, 51, 0.15);
          color: #ff6666;
          border: 1px solid rgba(255, 51, 51, 0.25);
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          font-size: 0.8rem;
          margin-top: 16px;
        }

        /* Activation Form Details */
        .activation-form-card, .activation-success-card {
          animation: slideUp 0.3s ease-out;
        }

        .activation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(228, 166, 47, 0.1);
          padding-bottom: 12px;
        }

        .badge-ok {
          background: rgba(32, 186, 90, 0.15);
          color: #20ba5a;
          border: 1px solid rgba(32, 186, 90, 0.3);
          font-size: 0.7rem;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .qr-hash {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-family: monospace;
        }

        .activation-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activation-success-card {
          border-color: #20ba5a;
          background: rgba(32, 186, 90, 0.05);
          padding: 24px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activation-success-card h3 {
          color: #20ba5a;
        }

        .activation-success-card p {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          line-height: 1.5;
        }

        /* CSV Import tab */
        .csv-importer-card {
          padding: 24px;
          margin-bottom: 24px;
        }

        .csv-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .csv-drop-zone {
          border: 2px dashed rgba(228, 166, 47, 0.3);
          border-radius: 12px;
          padding: 32px 16px;
          text-align: center;
          background: rgba(7, 7, 9, 0.3);
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .csv-drop-zone:hover {
          border-color: var(--color-gold-main);
          background: rgba(228, 166, 47, 0.05);
        }

        .hidden-file-input {
          display: none;
        }

        .file-input-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .submit-csv-btn {
          width: 100%;
        }

        .import-history h4 {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-gold-light);
          margin-bottom: 12px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
        }

        .history-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .history-source {
          font-weight: 700;
          font-size: 0.85rem;
          color: #ffffff;
        }

        .history-date {
          font-size: 0.7rem;
          color: var(--color-text-muted);
        }

        .history-badge {
          background: rgba(228, 166, 47, 0.1);
          color: var(--color-gold-light);
          border: 1px solid rgba(228, 166, 47, 0.2);
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        /* Media upload rows */
        .media-editor-section {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .media-editor-section h4 {
          font-size: 0.95rem;
          color: var(--color-gold-light);
          border-bottom: 1px solid rgba(228, 166, 47, 0.1);
          padding-bottom: 8px;
        }

        .media-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .media-row span {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--color-text-muted);
        }

        .media-row input {
          background: var(--color-bg-input);
          border: 1px solid rgba(228, 166, 47, 0.15);
          color: #ffffff;
          border-radius: 8px;
          padding: 10px;
          font-size: 0.8rem;
        }

        .btn-save-media {
          width: 100%;
        }

        /* Bottom Tab Navigation Bar */
        .admin-footer-tabs {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 64px;
          background: rgba(18, 18, 24, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(228, 166, 47, 0.1);
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          z-index: 100;
        }

        .tab-link {
          background: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition-smooth);
          padding: 6px 0;
        }

        .tab-link:hover {
          color: var(--color-gold-light);
        }

        .tab-link.active {
          color: var(--color-gold-main);
          font-weight: 600;
        }

        .tab-link span {
          font-size: 0.65rem;
          letter-spacing: 0.02em;
        }
      `}</style>
    </main>
  );
}
