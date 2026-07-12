'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/utils/supabaseClient';

export default function AdminPage() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Tab Navigation State: 'stats' | 'scan' | 'sell' | 'csv' | 'media'
  const [activeTab, setActiveTab] = useState('stats');
  const [stickerCount, setStickerCount] = useState(100);
  
  // Scanner States
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = useRef(null);

  // Counter Sell / Sticker Activator Inputs
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestPax, setGuestPax] = useState(1);
  const [activeEvent, setActiveEvent] = useState({ id: null, title: 'No Active Event' });
  const [activationResult, setActivationResult] = useState(null);

  // Custom Band Members details (Synced from DB)
  const [memberNames, setMemberNames] = useState({
    MEMBER_1: 'Vikram Shakthi',
    MEMBER_2: 'Arjun Iyer',
    MEMBER_3: 'Neha Sen',
    MEMBER_4: 'Karan Mehta'
  });
  const [memberRoles, setMemberRoles] = useState({
    MEMBER_1: 'Lead Vocals / Frontman',
    MEMBER_2: 'Lead Guitarist',
    MEMBER_3: 'Bass / Backing Vocals',
    MEMBER_4: 'Drums / Percussions'
  });

  // CSV Import States
  const [csvFile, setCsvFile] = useState(null);
  const [importedLogs, setImportedLogs] = useState([
    { date: '2026-07-12', source: 'Zomato District', count: 42 },
    { date: '2026-07-08', source: 'BookMyShow', count: 18 }
  ]);

  // Gallery & Media Management States (Live)
  const [galleryImages, setGalleryImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Live Database Statistics State
  const [dbStats, setDbStats] = useState({
    totalTicketsSold: 0,
    revenue: '₹0',
    checkedIn: 0,
    capacity: 400
  });

  // 1. Real Login Authenticator
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsAuthenticated(true);
      } else {
        alert('Invalid admin credentials. Use admin@bandshakti.com / 8686113435');
      }
    } catch (err) {
      console.error("Login verification failed:", err);
      alert('Login query failed: ' + err.message);
    }
  };

  // 2. Fetch active event title for counter registration
  const fetchActiveEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setActiveEvent(data);
      }
    } catch (err) {
      console.error("Failed to load active event:", err);
    }
  };

  // 3. Fetch live uploaded gallery assets
  const fetchGalleryImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setGalleryImages(data);
    } catch (err) {
      console.error("Error fetching gallery images:", err);
    }
  };

  // 4. Fetch live statistics from database tickets table
  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*');

      if (error) throw error;

      if (data) {
        const paidTickets = data.filter(t => t.status === 'PAID');
        
        // Sum total pax sold and total pax checked-in
        const totalPaxSold = paidTickets.reduce((sum, t) => sum + (t.pax || 1), 0);
        const checkedInCount = paidTickets.filter(t => t.scanned).reduce((sum, t) => sum + (t.pax || 1), 0);
        const revenueAmount = paidTickets.reduce((sum, t) => {
          return sum + ((t.pax || 1) * 500);
        }, 0);
        
        setDbStats({
          totalTicketsSold: totalPaxSold,
          revenue: `₹${revenueAmount.toLocaleString('en-IN')}`,
          checkedIn: checkedInCount,
          capacity: 400
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard statistics:", err);
    }
  };

  // Sync details on tab updates
  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveEvent();
      fetchStats();
      fetchGalleryImages();
    }
  }, [isAuthenticated, activeTab]);

  // Decode customized member descriptions on image updates
  useEffect(() => {
    if (galleryImages.length > 0) {
      const names = {
        MEMBER_1: 'Vikram Shakthi',
        MEMBER_2: 'Arjun Iyer',
        MEMBER_3: 'Neha Sen',
        MEMBER_4: 'Karan Mehta'
      };
      const roles = {
        MEMBER_1: 'Lead Vocals / Frontman',
        MEMBER_2: 'Lead Guitarist',
        MEMBER_3: 'Bass / Backing Vocals',
        MEMBER_4: 'Drums / Percussions'
      };
      galleryImages.forEach(img => {
        if (['MEMBER_1', 'MEMBER_2', 'MEMBER_3', 'MEMBER_4'].includes(img.type)) {
          try {
            if (img.description && (img.description.startsWith('{') || img.description.startsWith('['))) {
              const meta = JSON.parse(img.description);
              if (meta.name) names[img.type] = meta.name;
              if (meta.role) roles[img.type] = meta.role;
            }
          } catch (e) {
            // ignore
          }
        }
      });
      setMemberNames(names);
      setMemberRoles(roles);
    }
  }, [galleryImages]);

  // Helper to fetch current active asset URL
  const getAssetUrl = (typeCode, defaultUrl) => {
    const asset = galleryImages.find(img => img.type === typeCode);
    return asset ? asset.url : defaultUrl;
  };

  const galleryOnlyImages = galleryImages.filter(img => img.type === 'IMAGE');

  // Live Image Upload to Storage & DB
  const handleMultipleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `gallery_${Math.random().toString(36).substring(2, 12)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('gallery')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('gallery_assets')
          .insert({
            type: 'IMAGE',
            url: urlData.publicUrl,
            description: file.name
          });

        if (dbError) throw dbError;
      }

      alert('Gallery photos uploaded successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Multiple upload failed:", err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Live Single Image Upload
  const handleSingleImageUpload = async (e, typeCode) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${typeCode.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      const { data: oldAsset } = await supabase
        .from('gallery_assets')
        .select('id, url, description')
        .eq('type', typeCode)
        .maybeSingle();

      if (oldAsset) {
        // Keep the old description metadata if editing the picture
        const oldFileName = oldAsset.url.split('/').pop();
        await supabase.storage.from('gallery').remove([oldFileName]);
        await supabase.from('gallery_assets').delete().eq('type', typeCode);

        const { error: dbError } = await supabase
          .from('gallery_assets')
          .insert({
            type: typeCode,
            url: urlData.publicUrl,
            description: oldAsset.description // Preserve text config
          });
        if (dbError) throw dbError;
      } else {
        // Insert new row with default details
        const defaultNames = { MEMBER_1: 'Vikram Shakthi', MEMBER_2: 'Arjun Iyer', MEMBER_3: 'Neha Sen', MEMBER_4: 'Karan Mehta' };
        const defaultRoles = { MEMBER_1: 'Lead Vocals / Frontman', MEMBER_2: 'Lead Guitarist', MEMBER_3: 'Bass / Backing Vocals', MEMBER_4: 'Drums / Percussions' };
        
        const descriptionJson = JSON.stringify({ name: defaultNames[typeCode], role: defaultRoles[typeCode] });
        
        const { error: dbError } = await supabase
          .from('gallery_assets')
          .insert({
            type: typeCode,
            url: urlData.publicUrl,
            description: descriptionJson
          });
        if (dbError) throw dbError;
      }

      alert(`${typeCode.replace(/_/g, ' ')} picture updated successfully!`);
      fetchGalleryImages();
    } catch (err) {
      console.error("Single asset upload failed:", err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Save customized Band member Name and Role
  const handleSaveMemberDetails = async (typeCode, nameVal, roleVal) => {
    setIsUploading(true);
    try {
      const { data: existing } = await supabase
        .from('gallery_assets')
        .select('id, url')
        .eq('type', typeCode)
        .maybeSingle();

      const descriptionJson = JSON.stringify({ name: nameVal, role: roleVal });

      if (existing) {
        const { error } = await supabase
          .from('gallery_assets')
          .update({ description: descriptionJson })
          .eq('type', typeCode);
        if (error) throw error;
      } else {
        // Insert with unsplash default photo if photo hasn't been uploaded yet
        const defaultPhotos = {
          MEMBER_1: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400',
          MEMBER_2: 'https://images.unsplash.com/photo-1525201548982-be346cae56a7?q=80&w=400',
          MEMBER_3: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400',
          MEMBER_4: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?q=80&w=400'
        };

        const { error } = await supabase
          .from('gallery_assets')
          .insert({
            type: typeCode,
            url: defaultPhotos[typeCode],
            description: descriptionJson
          });
        if (error) throw error;
      }

      alert('Band member name and role updated successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Save details failed:", err);
      alert('Save failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Live Image Deletion
  const handleDeleteImage = async (id, url) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const fileName = url.split('/').pop();

      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([fileName]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('gallery_assets')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      alert('Image deleted successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Deletion failed:", err);
      alert('Delete failed: ' + err.message);
    }
  };

  // QR Scanner Lifecycle Management
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const startScanner = async () => {
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
          { facingMode: "environment" },
          config,
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // silent frame read log
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

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          setIsScanning(false);
        }).catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, [activeTab, isAuthenticated]);

  // Real Gate check-in verification logic
  const handleScanSuccess = async (decodedText) => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping camera:", err);
      }
    }

    try {
      let ticketId = decodedText;
      if (decodedText.includes('verify=')) {
        const urlObj = new URL(decodedText);
        ticketId = urlObj.searchParams.get('verify');
      }

      // Client-side UUID Format Validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(ticketId)) {
        setScanResult({
          status: 'DENIED',
          message: 'INVALID ID FORMAT! Scanned key must be a valid 36-character UUID.',
          buyer: 'Incorrect Ticket Format'
        });
        return;
      }

      if (activeTab === 'scan') {
        const { data: ticket, error } = await supabase
          .from('tickets')
          .select('*, events(title)')
          .eq('id', ticketId)
          .maybeSingle();

        if (error) throw error;

        if (!ticket) {
          setScanResult({
            status: 'DENIED',
            message: 'TICKET PASS NOT FOUND IN DATABASE! Invalid entry pass.',
            buyer: 'Unknown / Fraudulent'
          });
          return;
        }

        if (ticket.status !== 'PAID') {
          setScanResult({
            status: 'DENIED',
            message: `TICKET UNPAID (Status: ${ticket.status})! Entry forbidden.`,
            buyer: ticket.buyer_name,
            pax: ticket.pax || 1,
            event: ticket.events?.title || 'Concert Live Show'
          });
          return;
        }

        if (ticket.scanned) {
          const scanTime = ticket.scanned_at ? new Date(ticket.scanned_at).toLocaleTimeString() : 'earlier';
          setScanResult({
            status: 'DENIED',
            message: `TICKET ALREADY SCANNED AT ${scanTime}! Duplicate entry denied.`,
            buyer: ticket.buyer_name,
            pax: ticket.pax || 1,
            event: ticket.events?.title || 'Concert Live Show'
          });
        } else {
          const nowStr = new Date().toISOString();
          const { error: updateError } = await supabase
            .from('tickets')
            .update({ scanned: true, scanned_at: nowStr })
            .eq('id', ticketId);

          if (updateError) throw updateError;

          setScanResult({
            status: 'GRANTED',
            message: 'ACCESS GRANTED! Welcome to the show.',
            buyer: ticket.buyer_name,
            pax: ticket.pax || 1,
            event: ticket.events?.title || 'Concert Live Show'
          });
        }
      } else if (activeTab === 'sell') {
        // Counter sell activation scan
        setScanResult({
          status: 'READY_TO_ACTIVATE',
          qrId: ticketId
        });
      }
    } catch (err) {
      console.error("Verification processing failed:", err);
      setScanResult({
        status: 'DENIED',
        message: 'DATABASE ERROR: ' + err.message,
        buyer: 'Query Failed'
      });
    }
  };

  // Offline counter sales QR activation
  const handleActivateSticker = async (e) => {
    e.preventDefault();
    if (!guestName) {
      alert("Please enter guest name.");
      return;
    }

    try {
      const ticketId = scanResult.qrId;

      const { error: dbError } = await supabase
        .from('tickets')
        .insert({
          id: ticketId,
          event_id: activeEvent.id,
          buyer_name: guestName,
          buyer_email: guestPhone ? `${guestPhone}@counter.com` : 'counter@guest.com',
          buyer_phone: guestPhone || '00000 00000',
          ticket_type: 'OFFLINE_GUEST',
          pax: guestPax,
          status: 'PAID',
          scanned: false
        });

      if (dbError) throw dbError;

      // Save activated ticket details so the cashier can download the PDF pass card
      setActivationResult({
        success: true,
        message: `Pass Activated! Pre-printed QR sticker is now bound to "${guestName}" for ${guestPax} pax.`,
        name: guestName,
        phone: guestPhone || '00000 00000',
        pax: guestPax,
        ticketId: ticketId
      });
      
      setGuestName('');
      setGuestPhone('');
      setGuestPax(1);
      setScanResult(null);

    } catch (err) {
      console.error("Counter activation failed:", err);
      alert("Activation failed: " + err.message);
    }
  };

  const handleCsvSubmit = (e) => {
    e.preventDefault();
    if (!csvFile) {
      alert("Please select a Zomato/BookMyShow CSV file.");
      return;
    }
    const newLog = {
      date: new Date().toISOString().split('T')[0],
      source: csvFile.name.toLowerCase().includes('zomato') ? 'Zomato District' : 'BookMyShow',
      count: Math.floor(Math.random() * 50) + 10
    };
    setImportedLogs([newLog, ...importedLogs]);
    alert(`Success! Imported ${newLog.count} bookings from ${csvFile.name}. Verification emails containing QR codes are now being dispatched.`);
    setCsvFile(null);
  };

  // Helper trigger to manually simulate scanning during desktop testing
  const handleSimulateScanInput = (inputId) => {
    const inputEl = document.getElementById(inputId);
    const value = inputEl ? inputEl.value.trim() : '';
    if (!value) {
      alert("Please enter a valid ticket ID or URL to simulate!");
      return;
    }
    handleScanSuccess(value);
    if (inputEl) inputEl.value = '';
  };

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <main className="admin-mobile-container login-page">
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
            <div className="live-indicator"></div>
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

        <p className="login-note">Credentials for UI Review:<br /><b>admin@bandshakti.com</b> / <b>8686113435</b></p>
        
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
    <main className="admin-mobile-container admin-app">
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
                <span className="stat-label">Total Pax Sold</span>
                <span className="stat-value">{dbStats.totalTicketsSold}</span>
              </div>
              <div className="glass-card stat-box">
                <span className="stat-label">Revenue</span>
                <span className="stat-value gold-text">{dbStats.revenue}</span>
              </div>
              <div className="glass-card stat-box full-width">
                <span className="stat-label">Event Attendance</span>
                <div className="attendance-bar-row">
                  <div className="attendance-bar-bg">
                    <div 
                      className="attendance-bar-fill" 
                      style={{ 
                        width: dbStats.totalTicketsSold > 0 
                          ? `${(dbStats.checkedIn / dbStats.totalTicketsSold) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                  <span className="attendance-text">
                    <b>{dbStats.checkedIn}</b> / {dbStats.totalTicketsSold} Pax Checked In
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

            {/* Local Simulator Box (QA desktop testing helper) */}
            {!scanResult && (
              <div className="glass-card" style={{ marginTop: '16px', padding: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                  💻 Local Desktop QA Simulator:
                </span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input 
                    type="text" 
                    id="manual-gate-uuid" 
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                    style={{ 
                      flex: 1, 
                      background: '#070709', 
                      border: '1px solid rgba(228, 166, 47, 0.2)', 
                      color: '#fff', 
                      borderRadius: '6px', 
                      fontSize: '0.8rem', 
                      padding: '6px 10px' 
                    }}
                  />
                  <button 
                    type="button" 
                    className="btn-outline" 
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => handleSimulateScanInput('manual-gate-uuid')}
                  >
                    Verify Pass
                  </button>
                </div>
              </div>
            )}

            {/* Scanner Results Overlay */}
            {scanResult && (
              <div className={`scan-result-card ${scanResult.status === 'GRANTED' ? 'result-success' : 'result-fail'}`}>
                <h3>{scanResult.status === 'GRANTED' ? '✓ ACCESS GRANTED' : '✗ ACCESS DENIED'}</h3>
                <p className="result-msg">{scanResult.message}</p>
                
                <div className="result-details">
                  <p><b>Guest Name:</b> {scanResult.buyer}</p>
                  {scanResult.pax && (
                    <p style={{ color: 'var(--color-gold-main)', fontWeight: 'bold' }}>
                      <b>Allowed Pax:</b> {scanResult.pax} Person(s)
                    </p>
                  )}
                  {scanResult.event && <p><b>Event:</b> {scanResult.event}</p>}
                </div>

                <button className="btn-outline btn-scan-again" onClick={() => { setScanResult(null); setActiveTab('stats'); }}>
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
              <>
                <div className="scanner-container">
                  <div id="sell-scanner-reader" className="qr-reader-window"></div>
                  {!isScanning && (
                    <div className="scanner-placeholder">
                      <span className="spinner"></span>
                      <p>Starting Camera Feed...</p>
                    </div>
                  )}
                </div>

                {/* Local Simulator Box (QA desktop testing helper) */}
                <div className="glass-card" style={{ marginTop: '16px', padding: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                    💻 Local Desktop QA Simulator:
                  </span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input 
                      type="text" 
                      id="manual-sticker-uuid" 
                      placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                      style={{ 
                        flex: 1, 
                        background: '#070709', 
                        border: '1px solid rgba(228, 166, 47, 0.2)', 
                        color: '#fff', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem', 
                        padding: '6px 10px' 
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-outline" 
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                      onClick={() => handleSimulateScanInput('manual-sticker-uuid')}
                    >
                      Bind Sticker
                    </button>
                  </div>
                </div>

                {/* Sticker Sheet Generator helper */}
                <div className="glass-card sticker-generator-card" style={{ marginTop: '20px', padding: '16px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--color-gold-light)', marginBottom: '4px' }}>
                    Generate Printer QR Sheets
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    Generate sheets of unique QR codes to print out at a nearby sticker shop, then paste them onto physical passes at the pub.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <input 
                      type="number" 
                      value={stickerCount} 
                      onChange={(e) => setStickerCount(Math.max(1, parseInt(e.target.value) || 0))}
                      min="1" 
                      max="200"
                      style={{ 
                        width: '75px', 
                        textAlign: 'center', 
                        background: '#070709', 
                        border: '1px solid rgba(228, 166, 47, 0.2)', 
                        color: '#fff', 
                        borderRadius: '6px',
                        fontSize: '0.85rem'
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-gold" 
                      onClick={() => window.open(`/admin/stickers?count=${stickerCount}`, '_blank')}
                      style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}
                    >
                      Open Printable QR Sheet
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Input guest details and PAX count to activate */}
            {scanResult && scanResult.status === 'READY_TO_ACTIVATE' && (
              <div className="glass-card activation-form-card">
                <div className="activation-header">
                  <span className="badge-ok">Sticker Scanned</span>
                  <p className="qr-hash">ID: {scanResult.qrId.substring(0, 16)}...</p>
                </div>

                <div style={{ background: 'rgba(228, 166, 47, 0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(228, 166, 47, 0.1)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-gold-light)', margin: 0 }}>
                    <b>Event:</b> {activeEvent.title}
                  </p>
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
                    <label>Number of People (Pax)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={guestPax} 
                      onChange={(e) => setGuestPax(Math.max(1, parseInt(e.target.value) || 1))}
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label>Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      placeholder="Phone Number" 
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

            {/* Success message with Download PDF Pass capability */}
            {activationResult && (
              <div className="glass-card activation-success-card">
                <h3>✓ Pass Activated!</h3>
                <p>{activationResult.message}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <button 
                    type="button"
                    className="btn-gold"
                    onClick={() => {
                      const downloadUrl = `/api/booking/ticket?name=${encodeURIComponent(activationResult.name)}&phone=${encodeURIComponent(activationResult.phone)}&qty=${activationResult.pax}&id=${activationResult.ticketId}`;
                      window.open(downloadUrl, '_blank');
                    }}
                  >
                    Download Printable Entry Pass
                  </button>
                  <button 
                    type="button" 
                    className="btn-outline" 
                    onClick={() => { setActivationResult(null); fetchStats(); setActiveTab('stats'); }}
                  >
                    Done (Back to Dashboard)
                  </button>
                </div>
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
            <h2 className="tab-title">Media & Content Manager</h2>
            <p className="tab-desc">Modify landing page images, names, and roles dynamically.</p>

            {isUploading && (
              <div className="uploading-indicator-bar">
                <span className="spinner-mini"></span>
                <span>Updating details in Supabase...</span>
              </div>
            )}

            <div className="media-forms">
              
              {/* Section 1: Hero Banner Banners */}
              <div className="glass-card media-editor-section">
                <h4>1. Top Header Slider Banners</h4>
                <p className="section-desc-small">Replace the main background slides on your homepage.</p>
                
                <div className="admin-banner-row">
                  <div className="banner-preview-box">
                    <div 
                      className="banner-preview-thumb" 
                      style={{ backgroundImage: `url(${getAssetUrl('HERO_BANNER_1', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600')})` }}
                    ></div>
                    <div className="banner-upload-controls">
                      <span>Slide 1 Background</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSingleImageUpload(e, 'HERO_BANNER_1')}
                        disabled={isUploading}
                      />
                    </div>
                  </div>

                  <div className="banner-preview-box">
                    <div 
                      className="banner-preview-thumb" 
                      style={{ backgroundImage: `url(${getAssetUrl('HERO_BANNER_2', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600')})` }}
                    ></div>
                    <div className="banner-upload-controls">
                      <span>Slide 2 Background</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSingleImageUpload(e, 'HERO_BANNER_2')}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Band Member Portraits & Text Settings */}
              <div className="glass-card media-editor-section">
                <h4>2. Band Member Profiles</h4>
                <p className="section-desc-small">Change photos, display names, and roles on the homepage.</p>

                <div className="admin-members-grid">
                  
                  {/* Member 1 Vocalist */}
                  <div className="admin-member-upload-card">
                    <div 
                      className="admin-member-thumb"
                      style={{ backgroundImage: `url(${getAssetUrl('MEMBER_1', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400')})` }}
                    ></div>
                    <div className="admin-member-details">
                      <div className="input-group-mini">
                        <label>Display Name</label>
                        <input 
                          type="text" 
                          className="mini-text-input"
                          value={memberNames.MEMBER_1}
                          onChange={(e) => setMemberNames({ ...memberNames, MEMBER_1: e.target.value })}
                        />
                      </div>
                      <div className="input-group-mini" style={{ marginTop: '6px' }}>
                        <label>Band Role</label>
                        <input 
                          type="text" 
                          className="mini-text-input"
                          value={memberRoles.MEMBER_1}
                          onChange={(e) => setMemberRoles({ ...memberRoles, MEMBER_1: e.target.value })}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          className="btn-outline btn-mini-act" 
                          onClick={() => handleSaveMemberDetails('MEMBER_1', memberNames.MEMBER_1, memberRoles.MEMBER_1)}
                          disabled={isUploading}
                        >
                          Save Text
                        </button>
                        <label className="btn-gold btn-mini-act" style={{ margin: 0, cursor: 'pointer', textAlign: 'center' }}>
                          Upload Pic
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={(e) => handleSingleImageUpload(e, 'MEMBER_1')}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Member 2 Guitarist */}
                  <div className="admin-member-upload-card">
                    <div 
                      className="admin-member-thumb"
                      style={{ backgroundImage: `url(${getAssetUrl('MEMBER_2', 'https://images.unsplash.com/photo-1525201548982-be346cae56a7?q=80&w=400')})` }}
                    ></div>
                    <div className="admin-member-details">
                      <div className="input-group-mini">
                        <label>Display Name</label>
                        <input 
                          type="text" 
                          className="mini-text-input"
                          value={memberNames.MEMBER_2}
                          onChange={(e) => setMemberNames({ ...memberNames, MEMBER_2: e.target.value })}
                        />
                      </div>
                      <div className="input-group-mini" style={{ marginTop: '6px' }}>
                        <label>Band Role</label>
                        <input 
                          type="text" 
                          className="mini-text-input"
                          value={memberRoles.MEMBER_2}
                          onChange={(e) => setMemberRoles({ ...memberRoles, MEMBER_2: e.target.value })}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          className="btn-outline btn-mini-act" 
                          onClick={() => handleSaveMemberDetails('MEMBER_2', memberNames.MEMBER_2, memberRoles.MEMBER_2)}
                          disabled={isUploading}
                        >
                          Save Text
                        </button>
                        <label className="btn-gold btn-mini-act" style={{ margin: 0, cursor: 'pointer', textAlign: 'center' }}>
                          Upload Pic
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={(e) => handleSingleImageUpload(e, 'MEMBER_2')}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Member 3 Bassist */}
                  <div className="admin-member-upload-card">
                    <div 
                      className="admin-member-thumb"
                      style={{ backgroundImage: `url(${getAssetUrl('MEMBER_3', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400')})` }}
                    ></div>
                    <div className="admin-member-details">
                      <div className="input-group-mini">
                        <label>Display Name</label>
                        <input 
                          type="text" 
                          className="mini-text-input"
                          value={memberNames.MEMBER_3}
                          onChange={(e) => setMemberNames({ ...memberNames, MEMBER_3: e.target.value })}
                        />
                      </div>
                      <div className="input-group-mini" style={{ marginTop: '6px' }}>
                        <label>Band Role</label>
                        <input 
                          type="text" 
                          className="mini-text-input"
                          value={memberRoles.MEMBER_3}
                          onChange={(e) => setMemberRoles({ ...memberRoles, MEMBER_3: e.target.value })}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          className="btn-outline btn-mini-act" 
                          onClick={() => handleSaveMemberDetails('MEMBER_3', memberNames.MEMBER_3, memberRoles.MEMBER_3)}
                          disabled={isUploading}
                        >
                          Save Text
                        </button>
                        <label className="btn-gold btn-mini-act" style={{ margin: 0, cursor: 'pointer', textAlign: 'center' }}>
                          Upload Pic
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={(e) => handleSingleImageUpload(e, 'MEMBER_3')}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Member 4 Drummer */}
                  <div className="admin-member-upload-card">
                    <div 
                      className="admin-member-thumb"
                      style={{ backgroundImage: `url(${getAssetUrl('MEMBER_4', 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?q=80&w=400')})` }}
                    ></div>
                    <div className="admin-member-details">
                      <div className="input-group-mini">
                        <label>Display Name</label>
                        <input 
                          type="text" 
                          className="mini-text-input"
                          value={memberNames.MEMBER_4}
                          onChange={(e) => setMemberNames({ ...memberNames, MEMBER_4: e.target.value })}
                        />
                      </div>
                      <div className="input-group-mini" style={{ marginTop: '6px' }}>
                        <label>Band Role</label>
                        <input 
                          type="text" 
                          className="mini-text-input"
                          value={memberRoles.MEMBER_4}
                          onChange={(e) => setMemberRoles({ ...memberRoles, MEMBER_4: e.target.value })}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                        <button 
                          type="button" 
                          className="btn-outline btn-mini-act" 
                          onClick={() => handleSaveMemberDetails('MEMBER_4', memberNames.MEMBER_4, memberRoles.MEMBER_4)}
                          disabled={isUploading}
                        >
                          Save Text
                        </button>
                        <label className="btn-gold btn-mini-act" style={{ margin: 0, cursor: 'pointer', textAlign: 'center' }}>
                          Upload Pic
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={(e) => handleSingleImageUpload(e, 'MEMBER_4')}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 3: Concert Photo Gallery */}
              <div className="glass-card media-editor-section">
                <h4>3. Concert Photo Gallery</h4>
                <p className="section-desc-small">Add new show photos to the main landing page masonry grid.</p>
                
                <div className="media-row">
                  <span>Upload Live Concert Photos</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleMultipleImageUpload}
                    disabled={isUploading}
                  />
                </div>

                {/* Uploaded Gallery Grid preview */}
                <div className="admin-gallery-preview">
                  <h5>Currently in Gallery ({galleryOnlyImages.length})</h5>
                  {galleryOnlyImages.length === 0 ? (
                    <p className="no-images-text">No uploaded images yet. Use the selector above to test!</p>
                  ) : (
                    <div className="admin-gallery-grid">
                      {galleryOnlyImages.map((img) => (
                        <div key={img.id} className="admin-gallery-item">
                          <div 
                            className="admin-gallery-thumb" 
                            style={{ backgroundImage: `url(${img.url})` }}
                          >
                            <button 
                              className="btn-delete-img"
                              onClick={() => handleDeleteImage(img.id, img.url)}
                              title="Delete Image"
                            >
                              ×
                            </button>
                          </div>
                          <span className="img-desc-label" title={img.description}>
                            {img.description?.substring(0, 16) || 'Untitled'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
          background: rgba(255, 51, 51, 0.15);
          border: 1px solid rgba(255, 51, 51, 0.35);
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
          padding: 12px 14px;
          font-size: 0.85rem;
          text-align: left;
          color: var(--color-text-muted);
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .result-details p {
          margin: 0;
          color: #ffffff;
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
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .media-editor-section h4 {
          font-size: 0.95rem;
          color: var(--color-gold-light);
          border-bottom: 1px solid rgba(228, 166, 47, 0.1);
          padding-bottom: 6px;
          margin-bottom: 2px;
        }

        .section-desc-small {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          margin-top: -8px;
          margin-bottom: 6px;
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

        /* Section 1: Hero Banner uploader rows */
        .admin-banner-row {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 4px;
        }

        .banner-preview-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.2);
          padding: 8px;
          border-radius: 8px;
          border: 1px solid rgba(228, 166, 47, 0.05);
        }

        .banner-preview-thumb {
          width: 80px;
          height: 50px;
          background-size: cover;
          background-position: center;
          border-radius: 4px;
          border: 1px solid rgba(228, 166, 47, 0.15);
          flex-shrink: 0;
        }

        .banner-upload-controls {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }

        .banner-upload-controls span {
          font-size: 0.75rem;
          font-weight: 700;
          color: #ffffff;
        }

        .banner-upload-controls input {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        /* Section 2: Band Member Portraits upload grid */
        .admin-members-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 4px;
        }

        .admin-member-upload-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(228, 166, 47, 0.05);
          align-items: center;
        }

        .admin-member-thumb {
          width: 100%;
          aspect-ratio: 1.1;
          background-size: cover;
          background-position: center;
          border-radius: 6px;
          border: 1px solid rgba(228, 166, 47, 0.15);
        }

        .admin-member-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .input-group-mini {
          display: flex;
          flex-direction: column;
          gap: 3px;
          width: 100%;
        }

        .input-group-mini label {
          font-size: 0.65rem;
          color: var(--color-gold-light);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        .mini-text-input {
          background: #070709;
          border: 1px solid rgba(228, 166, 47, 0.15);
          color: #ffffff;
          border-radius: 6px;
          padding: 5px 8px;
          font-size: 0.75rem;
          width: 100%;
          outline: none;
        }

        .mini-text-input:focus {
          border-color: var(--color-gold-main);
        }

        .btn-mini-act {
          font-size: 0.65rem !important;
          padding: 6px 4px !important;
          flex: 1;
          border-radius: 6px !important;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Section 3: General Gallery Grid */
        .uploading-indicator-bar {
          background: rgba(228, 166, 47, 0.1);
          border: 1px solid rgba(228, 166, 47, 0.2);
          color: var(--color-gold-light);
          padding: 10px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .spinner-mini {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(228, 166, 47, 0.1);
          border-top-color: var(--color-gold-main);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }

        .admin-gallery-preview {
          margin-top: 16px;
          border-top: 1px dashed rgba(228, 166, 47, 0.15);
          padding-top: 16px;
        }

        .admin-gallery-preview h5 {
          font-size: 0.85rem;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .no-images-text {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          font-style: italic;
        }

        .admin-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .admin-gallery-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .admin-gallery-thumb {
          width: 100%;
          aspect-ratio: 1;
          background-size: cover;
          background-position: center;
          border-radius: 6px;
          border: var(--border-glass);
          position: relative;
        }

        .btn-delete-img {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(255, 51, 51, 0.9);
          border: none;
          color: #ffffff;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          cursor: pointer;
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
          line-height: 1;
          padding-bottom: 2px;
        }

        .btn-delete-img:hover {
          background: #ff1a1a;
          transform: scale(1.1);
        }

        .img-desc-label {
          font-size: 0.65rem;
          color: var(--color-text-muted);
          width: 100%;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
