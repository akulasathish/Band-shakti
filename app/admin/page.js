'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { supabase } from '@/utils/supabaseClient';
import { formatDateTimeLocalInput, formatEventDateTime, parseLocalDatetimeToISO } from '@/utils/formatDate';

function AdminPageContent() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Hydration-safe persistent authentication check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth = localStorage.getItem('admin_authenticated') === 'true';
      setIsAuthenticated(isAuth);
    }
    setIsAuthLoading(false);
  }, []);

  // Lock browser history to /admin, preventing hardware back button exits (only when authenticated)
  useEffect(() => {
    if (typeof window === 'undefined' || !isAuthenticated) return;

    // Push state immediately on authentication
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = (e) => {
      // Re-push state to block back navigation
      window.history.pushState(null, document.title, window.location.href);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated]);
  
  // Tab Navigation State: 'stats' | 'scan' | 'sell' | 'more' | 'csv' | 'media' | 'history'
  const [activeTab, setActiveTab] = useState('stats');
  const [stickerCount, setStickerCount] = useState('');
  
  // Scanner States
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [checkInCount, setCheckInCount] = useState(1);
  const html5QrCodeRef = useRef(null);

  // Tickets & Passes History States
  const [ticketsHistory, setTicketsHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'OFFLINE'
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Contact Inquiries States
  const [inquiries, setInquiries] = useState([]);
  const [inquirySearch, setInquirySearch] = useState('');

  // Counter Sell / Sticker Activator Inputs
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPax, setGuestPax] = useState(1);
  const [activeEvent, setActiveEvent] = useState({ id: null, title: 'No Active Event' });
  const [activationResult, setActivationResult] = useState(null);

  // Dynamic Banners list loaded from DB
  const [banners, setBanners] = useState([]);
  
  // Dynamic Band Members list loaded from DB
  const [bandMembers, setBandMembers] = useState([]);

  // --- EVENTS TRANSITION MANAGER STATES ---
  const [eventsList, setEventsList] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showCreateEventForm, setShowCreateEventForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventPrice, setNewEventPrice] = useState('500');
  const [newEventCapacity, setNewEventCapacity] = useState('400');
  const [newEventTerms, setNewEventTerms] = useState('1. Please carry a valid physical photo ID.\n2. Tickets are strictly non-refundable.\n3. The venue reserves the right of admission.');

  // --- PAST EVENTS LOGGER STATES ---
  const [showCreatePastEventForm, setShowCreatePastEventForm] = useState(false);
  const [pastEventTitle, setPastEventTitle] = useState('');
  const [pastEventDate, setPastEventDate] = useState('');
  const [pastEventVenue, setPastEventVenue] = useState('');
  const [pastEventDescription, setPastEventDescription] = useState('');
  const [pastEventCapacity, setPastEventCapacity] = useState('500');
  const [pastEventPrice, setPastEventPrice] = useState('400');
  const [selectedPastEventId, setSelectedPastEventId] = useState(null);

  // --- SUB-NAVIGATION MEDIA TAB STATE ---
  const [mediaSubTab, setMediaSubTab] = useState('menu'); // 'menu' | 'banners' | 'members' | 'gallery'

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
    capacity: 400,
    onlineTicketsSold: 0,
    onlineCheckedIn: 0,
    onlineRevenue: '₹0',
    offlineTicketsSold: 0,
    offlineCheckedIn: 0,
    offlineRevenue: '₹0'
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
        localStorage.setItem('admin_authenticated', 'true');
        setIsAuthenticated(true);
      } else {
        alert('Invalid admin credentials.');
      }
    } catch (err) {
      console.error("Login verification failed:", err);
      alert('Login query failed: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    setActiveTab('stats');
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
      } else {
        setActiveEvent({ id: null, title: 'No Active Event' });
      }
    } catch (err) {
      console.error("Failed to load active event:", err);
    }
  };

  // 3. Fetch all events in system
  const fetchEventsList = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      if (data) {
        setEventsList(data);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  // 4. Fetch live uploaded gallery assets & sort dynamic sections
  const fetchGalleryImages = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_assets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setGalleryImages(data);

        // Filter and map dynamic banners
        const bannerAssets = data.filter(img => img.type === 'HERO_BANNER');
        setBanners(bannerAssets.map((item, idx) => {
          let title = idx === 0 ? 'WELCOME TO BAND SHAKTHI' : 'FEEL THE ELECTRIC VIBE';
          let subtitle = idx === 0 ? 'THE ULTIMATE LIVE EXPERIENCE' : 'JAM ARENA 2026';
          let desc = idx === 0 
            ? 'HIGH-ENERGY POP & ROCK GIGS IN PUBS, FESTIVALS, AND EVENTS' 
            : 'WITNESS CAPTIVATING MUSICAL RUNS & CROWD-PULSING RHYTHMS';
          
          try {
            if (item.description && (item.description.startsWith('{') || item.description.startsWith('['))) {
              const meta = JSON.parse(item.description);
              if (meta.title) title = meta.title;
              if (meta.subtitle) subtitle = meta.subtitle;
              if (meta.desc) desc = meta.desc;
            }
          } catch (e) {}
          return {
            id: item.id,
            url: item.url,
            title,
            subtitle,
            desc
          };
        }));

        // Filter and map dynamic band members
        const memberAssets = data.filter(img => img.type === 'BAND_MEMBER');
        setBandMembers(memberAssets.map((item, idx) => {
          let name = 'Band Member';
          let role = 'Musician';
          let bio = 'Dedicated member of Band Shakthi.';
          try {
            if (item.description && (item.description.startsWith('{') || item.description.startsWith('['))) {
              const meta = JSON.parse(item.description);
              if (meta.name) name = meta.name;
              if (meta.role) role = meta.role;
              if (meta.bio) bio = meta.bio;
            }
          } catch (e) {}
          return {
            id: item.id,
            url: item.url,
            name,
            role,
            bio
          };
        }));
      }
    } catch (err) {
      console.error("Error fetching gallery images:", err);
    }
  };

  // 5. Fetch live statistics from database tickets table
  const fetchStats = async () => {
    try {
      // Get the currently active event ID and details
      const { data: actEvent } = await supabase
        .from('events')
        .select('id, total_capacity, ticket_price')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const eventId = actEvent ? actEvent.id : null;
      const capacity = actEvent ? actEvent.total_capacity : 400;
      const ticketPrice = actEvent && actEvent.ticket_price ? actEvent.ticket_price : 500;

      if (!eventId) {
        setDbStats({
          totalTicketsSold: 0,
          revenue: '₹0',
          checkedIn: 0,
          capacity: 400,
          onlineTicketsSold: 0,
          onlineCheckedIn: 0,
          onlineRevenue: '₹0',
          offlineTicketsSold: 0,
          offlineCheckedIn: 0,
          offlineRevenue: '₹0'
        });
        return;
      }

      // Fetch tickets specifically for this active event
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;

      if (data) {
        const paidTickets = data.filter(t => t.status === 'PAID');
        
        // Combined Totals
        const totalPaxSold = paidTickets.reduce((sum, t) => sum + (t.pax || 1), 0);
        const checkedInCount = paidTickets.filter(t => t.scanned).reduce((sum, t) => sum + (t.pax || 1), 0);
        const revenueAmount = paidTickets.reduce((sum, t) => sum + ((t.pax || 1) * ticketPrice), 0);

        // Helper check for offline tickets (supports is_offline boolean flag or ticket_type = OFFLINE_GUEST)
        const isOfflineTicket = (t) => Boolean(t.is_offline) || t.ticket_type === 'OFFLINE_GUEST';

        // Online Breakdown
        const onlineTickets = paidTickets.filter(t => !isOfflineTicket(t));
        const onlineTicketsSold = onlineTickets.reduce((sum, t) => sum + (t.pax || 1), 0);
        const onlineCheckedIn = onlineTickets.reduce((sum, t) => sum + (t.scanned_pax || (t.scanned ? (t.pax || 1) : 0)), 0);
        const onlineRevenueAmount = onlineTickets.reduce((sum, t) => sum + ((t.pax || 1) * ticketPrice), 0);

        // Offline Breakdown
        const offlineTickets = paidTickets.filter(t => isOfflineTicket(t));
        const offlineTicketsSold = offlineTickets.reduce((sum, t) => sum + (t.pax || 1), 0);
        const offlineCheckedIn = offlineTickets.reduce((sum, t) => sum + (t.scanned_pax || (t.scanned ? (t.pax || 1) : 0)), 0);
        const offlineRevenueAmount = offlineTickets.reduce((sum, t) => sum + ((t.pax || 1) * ticketPrice), 0);

        setDbStats({
          totalTicketsSold: totalPaxSold,
          revenue: `₹${revenueAmount.toLocaleString('en-IN')}`,
          checkedIn: checkedInCount,
          capacity: capacity,
          onlineTicketsSold,
          onlineCheckedIn,
          onlineRevenue: `₹${onlineRevenueAmount.toLocaleString('en-IN')}`,
          offlineTicketsSold,
          offlineCheckedIn,
          offlineRevenue: `₹${offlineRevenueAmount.toLocaleString('en-IN')}`
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard statistics:", err);
    }
  };

  // --- TICKETS & PASSES HISTORY ---
  const fetchTicketsHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, events(title)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setTicketsHistory(data);
      }
    } catch (err) {
      console.error("Error fetching tickets history:", err);
    }
  };

  // --- CONTACT INQUIRIES INBOX ---
  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setInquiries(data);
      }
    } catch (err) {
      console.error("Error fetching contact inquiries:", err);
    }
  };

  const handleResolveInquiry = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'PENDING' ? 'RESOLVED' : 'PENDING';
      const { error } = await supabase
        .from('contact_inquiries')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      fetchInquiries();
    } catch (err) {
      console.error("Failed to update inquiry status:", err);
      alert("Error updating status: " + err.message);
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchInquiries();
    } catch (err) {
      console.error("Failed to delete inquiry:", err);
      alert("Error deleting inquiry: " + err.message);
    }
  };

  // Sync details on tab updates
  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveEvent();
      fetchStats();
      fetchGalleryImages();
      fetchEventsList();
      if (activeTab === 'history') {
        fetchTicketsHistory();
      }
      if (activeTab === 'inquiries') {
        fetchInquiries();
      }
    }
  }, [isAuthenticated, activeTab]);

  // --- CAMERA SCANNER INITIALIZATION EFFECTS ---
  useEffect(() => {
    let scanner = null;
    const elementId = activeTab === 'scan' ? 'gate-scanner-reader' : 'sell-scanner-reader';

    // Start scanner if tab is active and no scan result exists yet (for sell, wait until scanned)
    const shouldStartScanner = 
      isAuthenticated && 
      (activeTab === 'scan' || (activeTab === 'sell' && (!scanResult || scanResult.status !== 'READY_TO_ACTIVATE') && !activationResult));

    if (shouldStartScanner) {
      const timer = setTimeout(() => {
        const checkEl = document.getElementById(elementId);
        if (!checkEl) return;

        try {
          // Dynamically import the scanner library to bypass server-side rendering crashes
          import('html5-qrcode').then(({ Html5Qrcode }) => {
            const html5QrCode = new Html5Qrcode(elementId);
            html5QrCodeRef.current = html5QrCode;
            setIsScanning(true);

            html5QrCode.start(
              { facingMode: "environment" }, // back camera
              {
                fps: 10,
                qrbox: { width: 250, height: 250 }
              },
              (decodedText) => {
                handleScanSuccess(decodedText);
              },
              (errorMessage) => {
                // verbose logs ignored
              }
            ).catch(err => {
              console.error("Camera start failed:", err);
              const errMsg = err?.message || err || "Browser secure context is required. Note that mobile browsers strictly block camera access over insecure HTTP connections (e.g. your local Wi-Fi IP address 192.168.*). To test the camera on a physical phone, you must run it over localhost, HTTPS, or set up a secure proxy tunnel (like Ngrok).";
              setScanError("Failed to access camera: " + errMsg);
              setIsScanning(false);
            });
          }).catch(err => {
            console.error("Failed to load html5-qrcode dynamically:", err);
          });
        } catch (e) {
          console.error("Scanner setup failed:", e);
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        if (html5QrCodeRef.current) {
          try {
            html5QrCodeRef.current.stop().then(() => {
              setIsScanning(false);
              html5QrCodeRef.current = null;
            }).catch(err => {
              console.warn("Safe cleanup stop:", err);
              setIsScanning(false);
              html5QrCodeRef.current = null;
            });
          } catch (e) {
            setIsScanning(false);
            html5QrCodeRef.current = null;
          }
        }
      };
    } else {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            setIsScanning(false);
            html5QrCodeRef.current = null;
          }).catch(err => {
            console.warn("Safe switch stop:", err);
            setIsScanning(false);
            html5QrCodeRef.current = null;
          });
        } catch (e) {
          setIsScanning(false);
          html5QrCodeRef.current = null;
        }
      }
    }
  }, [activeTab, isAuthenticated, scanResult, activationResult]);


  const galleryOnlyImages = galleryImages.filter(img => img.type === 'IMAGE');

  // --- LOCAL INPUT TEXT MODIFIERS ---
  const handleBannerTextChange = (id, field, value) => {
    setBanners(banners.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleMemberTextChange = (id, field, value) => {
    setBandMembers(bandMembers.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // --- EVENTS TRANSITION MANAGER ACTIONS ---
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle || !newEventDate || !newEventVenue) {
      alert("Please fill in event Title, Date, and Venue.");
      return;
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      alert("Cannot create event while offline. An active internet connection is required to create and save events to the backend database.");
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: newEventTitle,
          event_date: parseLocalDatetimeToISO(newEventDate),
          venue: newEventVenue,
          ticket_price: parseFloat(newEventPrice) || 500,
          total_capacity: parseInt(newEventCapacity) || 400,
          terms: newEventTerms,
          is_active: false
        });

      if (error) throw error;

      alert('Event scheduled successfully! You can switch to it anytime.');
      setNewEventTitle('');
      setNewEventDate('');
      setNewEventVenue('');
      setNewEventPrice('500');
      setNewEventCapacity('400');
      setNewEventTerms('1. Please carry a valid physical photo ID.\n2. Tickets are strictly non-refundable.\n3. The venue reserves the right of admission.');
      setShowCreateEventForm(false);
      fetchEventsList();
    } catch (err) {
      console.error("Failed to schedule event:", err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        alert("Failed to create event: Network connection error. Please connect to the internet and ensure Supabase credentials are valid.");
      } else {
        alert("Failed to create event: " + err.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // --- PAST EVENTS LOGGER ACTIONS ---
  const handleCreatePastEvent = async (e) => {
    e.preventDefault();
    if (!pastEventTitle || !pastEventDate || !pastEventVenue) {
      alert("Please fill in event Title, Date, and Venue.");
      return;
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      alert("Cannot create past event while offline. An active internet connection is required to create and save events to the backend database.");
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: pastEventTitle,
          event_date: parseLocalDatetimeToISO(pastEventDate),
          venue: pastEventVenue,
          description: pastEventDescription || '',
          ticket_price: parseFloat(pastEventPrice) || 400,
          total_capacity: parseInt(pastEventCapacity) || 500,
          is_active: false
        });

      if (error) throw error;

      alert('Past event logged successfully! You can now upload photo/video assets for this gig.');
      setPastEventTitle('');
      setPastEventDate('');
      setPastEventVenue('');
      setPastEventDescription('');
      setPastEventPrice('400');
      setPastEventCapacity('500');
      setShowCreatePastEventForm(false);
      fetchEventsList();
    } catch (err) {
      console.error("Failed to log past event:", err);
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        alert("Failed to create past event: Network connection error. Please connect to the internet and ensure Supabase credentials are valid.");
      } else {
        alert("Failed to create past event: " + err.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadPastEventMedia = async (e, eventId) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
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
            type: fileType,
            url: urlData.publicUrl,
            description: file.name,
            event_id: eventId
          });

        if (dbError) throw dbError;
      }

      alert('Media assets uploaded and linked to this gig successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Past event media upload failed:", err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeletePastEventMedia = async (assetId, assetUrl) => {
    if (!confirm('Are you sure you want to delete this media asset?')) return;
    setIsUploading(true);
    try {
      if (assetUrl.includes('/storage/v1/object/public/gallery/')) {
        const fileName = assetUrl.split('/').pop();
        await supabase.storage.from('gallery').remove([fileName]);
      }
      
      const { error } = await supabase
        .from('gallery_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      alert('Media asset deleted!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Failed to delete asset:", err);
      alert("Delete failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActiveEvent = async (eventId) => {
    setIsUploading(true);
    try {
      const { error: err1 } = await supabase
        .from('events')
        .update({ is_active: false })
        .neq('id', eventId);

      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from('events')
        .update({ is_active: true })
        .eq('id', eventId);

      if (err2) throw err2;

      alert('Active event shifted! The public site booking widget has updated.');
      await fetchActiveEvent();
      await fetchEventsList();
      await fetchStats();
    } catch (err) {
      console.error("Failed to activate event:", err);
      alert("Switch failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This will delete all ticket registrations bound to it.')) return;
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      alert('Event deleted successfully.');
      await fetchActiveEvent();
      await fetchEventsList();
      await fetchStats();
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Delete failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({
          title: editingEvent.title,
          event_date: parseLocalDatetimeToISO(editingEvent.event_date),
          venue: editingEvent.venue,
          ticket_price: parseInt(editingEvent.ticket_price) || 0,
          total_capacity: parseInt(editingEvent.total_capacity) || 0,
          description: editingEvent.description,
          terms: editingEvent.terms
        })
        .eq('id', editingEvent.id);

      if (error) throw error;

      alert('Event updated successfully!');
      setEditingEvent(null);
      await fetchActiveEvent();
      await fetchEventsList();
      await fetchStats();
    } catch (err) {
      console.error("Failed to update event:", err);
      alert("Update failed: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- DYNAMIC SLIDES CONTROL MUTATIONS ---
  const handleAddBanner = async () => {
    setIsUploading(true);
    try {
      const defaultImageUrl = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000';
      const descriptionJson = JSON.stringify({
        title: 'FEEL THE ELECTRIC VIBE',
        subtitle: 'NEW BAND SHOW TIMELINE',
        desc: 'GET READY TO SHRED THE DANCE FLOOR WITH BAND SHAKTHI'
      });
      
      const { error } = await supabase
        .from('gallery_assets')
        .insert({
          type: 'HERO_BANNER',
          url: defaultImageUrl,
          description: descriptionJson
        });

      if (error) throw error;
      alert('New background slide added! You can now edit its text details or upload a new photo.');
      fetchGalleryImages();
    } catch (err) {
      console.error("Failed to add banner:", err);
      alert("Failed to add slide: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveBannerDetails = async (id, title, subtitle, desc) => {
    setIsUploading(true);
    try {
      const descriptionJson = JSON.stringify({ title, subtitle, desc });
      const { error } = await supabase
        .from('gallery_assets')
        .update({ description: descriptionJson })
        .eq('id', id);

      if (error) throw error;
      alert('Slide text details updated successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Failed to save banner details:", err);
      alert("Save failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteBanner = async (id, url) => {
    if (!confirm('Are you sure you want to delete this background slide?')) return;
    setIsUploading(true);
    try {
      if (url.includes('/storage/v1/object/public/gallery/')) {
        const fileName = url.split('/').pop();
        await supabase.storage.from('gallery').remove([fileName]);
      }
      
      const { error } = await supabase
        .from('gallery_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Slide deleted successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Failed to delete banner:", err);
      alert("Delete failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadBannerImage = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${id.substring(0, 8)}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
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
        .select('url')
        .eq('id', id)
        .maybeSingle();

      if (oldAsset && oldAsset.url.includes('/storage/v1/object/public/gallery/')) {
        const oldFileName = oldAsset.url.split('/').pop();
        await supabase.storage.from('gallery').remove([oldFileName]);
      }

      const { error: dbError } = await supabase
        .from('gallery_assets')
        .update({ url: urlData.publicUrl })
        .eq('id', id);

      if (dbError) throw dbError;

      alert('Slide background picture updated successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Banner upload failed:", err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // --- DYNAMIC BAND MEMBERS CONTROL MUTATIONS ---
  const handleAddMember = async () => {
    setIsUploading(true);
    try {
      const defaultImageUrl = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=400';
      const descriptionJson = JSON.stringify({
        name: 'New Musician',
        role: 'Instrumentalist',
        bio: 'Dedicated member of Band Shakthi.'
      });
      
      const { error } = await supabase
        .from('gallery_assets')
        .insert({
          type: 'BAND_MEMBER',
          url: defaultImageUrl,
          description: descriptionJson
        });

      if (error) throw error;
      alert('New band member added! You can now customize their name, role, and portrait.');
      fetchGalleryImages();
    } catch (err) {
      console.error("Failed to add member:", err);
      alert("Failed to add member: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveMemberText = async (id, name, role, bio) => {
    setIsUploading(true);
    try {
      const descriptionJson = JSON.stringify({ name, role, bio });
      const { error } = await supabase
        .from('gallery_assets')
        .update({ description: descriptionJson })
        .eq('id', id);

      if (error) throw error;
      alert('Member details updated successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Failed to save member details:", err);
      alert("Save failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMember = async (id, url) => {
    if (!confirm('Are you sure you want to delete this band member profile?')) return;
    setIsUploading(true);
    try {
      if (url.includes('/storage/v1/object/public/gallery/')) {
        const fileName = url.split('/').pop();
        await supabase.storage.from('gallery').remove([fileName]);
      }
      
      const { error } = await supabase
        .from('gallery_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Member profile deleted successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Failed to delete member:", err);
      alert("Delete failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadMemberImage = async (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `member_${id.substring(0, 8)}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;
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
        .select('url')
        .eq('id', id)
        .maybeSingle();

      if (oldAsset && oldAsset.url.includes('/storage/v1/object/public/gallery/')) {
        const oldFileName = oldAsset.url.split('/').pop();
        await supabase.storage.from('gallery').remove([oldFileName]);
      }

      const { error: dbError } = await supabase
        .from('gallery_assets')
        .update({ url: urlData.publicUrl })
        .eq('id', id);

      if (dbError) throw dbError;

      alert('Member portrait updated successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Member upload failed:", err);
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // --- MULTIPLE IMAGES UPLOAD (CONCERT GALLERY) ---
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

  const handleDeleteImage = async (id, url) => {
    if (!confirm('Are you sure you want to delete this photo from the concert gallery?')) return;
    setIsUploading(true);
    try {
      if (url.includes('/storage/v1/object/public/gallery/')) {
        const fileName = url.split('/').pop();
        await supabase.storage.from('gallery').remove([fileName]);
      }
      
      const { error } = await supabase
        .from('gallery_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Photo deleted successfully!');
      fetchGalleryImages();
    } catch (err) {
      console.error("Failed to delete photo:", err);
      alert("Delete failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

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

        // Calculate remaining balance for this pass
        const totalPax = ticket.pax || 1;
        const currentScanned = ticket.scanned_pax || 0;
        const remaining = totalPax - currentScanned;

        if (remaining <= 0) {
          const scanTime = ticket.scanned_at ? new Date(ticket.scanned_at).toLocaleTimeString() : 'earlier';
          setScanResult({
            status: 'DENIED',
            message: `TICKET FULLY CHECKED IN AT ${scanTime}! All ${totalPax} guests already entered. Duplicate entry denied.`,
            buyer: ticket.buyer_name,
            pax: totalPax,
            event: ticket.events?.title || 'Concert Live Show'
          });
        } else {
          // Trigger the Partial Entry confirmation selector
          setCheckInCount(remaining); // default entry selection to remaining balance
          setScanResult({
            status: 'PARTIAL_ENTRY_PROMPT',
            ticketId: ticket.id,
            buyer: ticket.buyer_name,
            totalPax,
            scannedPax: currentScanned,
            remaining,
            event: ticket.events?.title || 'Concert Live Show'
          });
        }
      } else if (activeTab === 'sell') {
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

  // Process the partial entry check-in confirmation
  const handleConfirmPartialEntry = async (ticketId, selectedCount) => {
    try {
      // 1. Fetch current checked-in count first to prevent race conditions
      const { data: ticket, error: fetchErr } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (fetchErr) throw fetchErr;

      const totalPax = ticket.pax || 1;
      const prevScanned = ticket.scanned_pax || 0;
      const newScanned = prevScanned + selectedCount;
      const isFullyScanned = newScanned >= totalPax;

      const updateData = {
        scanned_pax: newScanned
      };

      if (isFullyScanned) {
        updateData.scanned = true;
        updateData.scanned_at = new Date().toISOString();
      }

      const { error: updateErr } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (updateErr) throw updateErr;

      setScanResult({
        status: 'GRANTED',
        message: isFullyScanned 
          ? `ACCESS GRANTED for remaining ${selectedCount} guest(s)! All ${totalPax} check-in complete.`
          : `ACCESS GRANTED for ${selectedCount} guest(s)! ${totalPax - newScanned} guests remaining on this pass.`,
        buyer: ticket.buyer_name,
        pax: totalPax,
        scannedPax: newScanned,
        event: 'Concert Live Show'
      });
      fetchStats();
    } catch (err) {
      console.error("Verification processing failed:", err);
      setScanResult({
        status: 'DENIED',
        message: 'DATABASE ERROR: ' + err.message,
        buyer: 'Update Failed'
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
      const finalEmail = guestEmail || (guestPhone ? `${guestPhone.replace(/\s+/g, '')}@counter.com` : 'counter@guest.com');
      const finalPax = parseInt(guestPax) || 1;

      const { error: dbError } = await supabase
        .from('tickets')
        .insert({
          id: ticketId,
          event_id: activeEvent.id,
          buyer_name: guestName,
          buyer_email: finalEmail,
          buyer_phone: guestPhone || '00000 00000',
          ticket_type: 'OFFLINE_GUEST',
          is_offline: true,
          pax: finalPax,
          status: 'PAID',
          scanned: false
        });

      if (dbError) throw dbError;

      // Trigger automatic background email pass delivery if guest email is provided
      if (guestEmail) {
        const formattedDateText = formatEventDateTime(activeEvent?.event_date);

        fetch('/api/booking/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            name: guestName,
            email: guestEmail,
            phone: guestPhone || '00000 00000',
            qty: finalPax,
            eventTitle: activeEvent?.title || 'Band Shakthi Live Concert',
            eventVenue: activeEvent?.venue || 'The DownTown Pub, Ground Stage',
            eventDate: formattedDateText
          })
        }).catch(err => console.error("Automatic email delivery failed:", err));
      }

      setActivationResult({
        success: true,
        message: guestEmail 
          ? `Pass Activated! Bound to "${guestName}" for ${finalPax} pax. Ticket PDF has been automatically dispatched to ${guestEmail}.`
          : `Pass Activated! Bound to "${guestName}" for ${finalPax} pax.`,
        name: guestName,
        phone: guestPhone || '00000 00000',
        email: guestEmail || '',
        pax: finalPax,
        ticketId: ticketId
      });
      
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
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

  const handleExportCSV = () => {
    if (!ticketsHistory || ticketsHistory.length === 0) {
      alert("No tickets available to export!");
      return;
    }

    try {
      // 1. Define the CSV column headers
      const headers = ["Ticket ID", "Buyer Name", "Email", "Phone", "Channel", "Pax (Quantity)", "Status", "Scanned Status", "Payment ID", "Created At"];
      
      // 2. Map tickets history array into CSV formatted rows
      const rows = ticketsHistory.map(ticket => {
        const isOffline = ticket.ticket_type === 'OFFLINE_GUEST' || Boolean(ticket.is_offline);
        return [
          ticket.id || "",
          ticket.buyer_name || "Guest",
          ticket.buyer_email || "",
          ticket.buyer_phone || "",
          isOffline ? "Offline Counter" : "Online Website",
          ticket.pax || 1,
          ticket.status || "PENDING",
          ticket.scanned ? "CHECKED_IN" : (ticket.scanned_pax > 0 ? `PARTIAL (${ticket.scanned_pax}/${ticket.pax || 1})` : "NOT_ATTENDED"),
          ticket.payment_id || "",
          ticket.created_at ? new Date(ticket.created_at).toLocaleString() : ""
        ];
      });

      // 3. Combine header and rows with proper escaping
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      // 4. Create a download link and trigger the browser to save it
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Band_Shakthi_Guest_List_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export guest list CSV:", err);
      alert("Error exporting CSV: " + err.message);
    }
  };

  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070709', color: 'var(--color-gold-light)' }}>
        <span className="spinner-mini" style={{ width: '40px', height: '40px', border: '3px solid rgba(228, 166, 47, 0.1)', borderTopColor: 'var(--color-gold-main)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
        <p style={{ marginTop: '16px', fontSize: '0.85rem', letterSpacing: '0.05em' }}>VERIFYING CREDENTIALS...</p>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

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
            className="login-logo-img"
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
        <Image src="/logo.png" alt="Logo" width={90} height={31} className="header-logo-img" />
        <span className="badge-pwa">ADMIN APP</span>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {/* Main Content Area */}
      <div className="admin-body">
        
        {/* TAB 1: DASHBOARD STATS & EVENT MANAGER */}
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

            {/* Sales Channel Breakdown */}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--color-gold-light)', margin: '24px 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Sales Breakdown</h3>
            <div className="breakdown-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
              
              {/* Online Channel */}
              <div className="glass-card channel-box" style={{ padding: '14px', borderLeft: '3px solid #3b82f6', background: 'var(--color-bg-card)', borderRadius: '8px' }}>
                <h4 style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 800, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Online Channel</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Sold:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{dbStats.onlineTicketsSold} Pax</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Attended:</span>
                    <span style={{ color: '#25d366', fontWeight: 'bold' }}>{dbStats.onlineCheckedIn} Pax</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '6px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Revenue:</span>
                    <span style={{ color: 'var(--color-gold-light)', fontWeight: 'bold' }}>{dbStats.onlineRevenue}</span>
                  </div>
                </div>
              </div>

              {/* Offline Channel */}
              <div className="glass-card channel-box" style={{ padding: '14px', borderLeft: '3px solid var(--color-gold-main)', background: 'var(--color-bg-card)', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--color-gold-main)', fontSize: '0.8rem', fontWeight: 800, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Offline Counter</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Sold:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{dbStats.offlineTicketsSold} Pax</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Attended:</span>
                    <span style={{ color: '#25d366', fontWeight: 'bold' }}>{dbStats.offlineCheckedIn} Pax</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '6px', marginTop: '4px' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Revenue:</span>
                    <span style={{ color: 'var(--color-gold-light)', fontWeight: 'bold' }}>{dbStats.offlineRevenue}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions */}
            <div className="action-cards" style={{ marginBottom: '24px' }}>
              <div className="glass-card action-box" onClick={() => setActiveTab('scan')}>
                <h4>Launch Scanner</h4>
                <p>Verify gate entries using device camera</p>
              </div>
              <div className="glass-card action-box" onClick={() => setActiveTab('sell')}>
                <h4>Sticker Activator</h4>
                <p>Register counter sales and activate passes</p>
              </div>
            </div>

            {/* EVENT TRANSITION MANAGER PANEL */}
            <div className="glass-card events-manager-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: 'var(--color-gold-light)' }}>Event Transition Manager</h4>
                <button 
                  type="button" 
                  className="btn-gold" 
                  style={{ fontSize: '0.65rem', padding: '5px 10px', borderRadius: '4px' }}
                  onClick={() => setShowCreateEventForm(!showCreateEventForm)}
                >
                  {showCreateEventForm ? 'Cancel' : '+ New Event'}
                </button>
              </div>

              {/* Create New Event Form (Slide open drawer) */}
              {showCreateEventForm && (
                <form onSubmit={handleCreateEvent} style={{ borderBottom: '1px dashed rgba(228, 166, 47, 0.15)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="input-group-mini">
                    <label>Event Title</label>
                    <input 
                      type="text" 
                      className="mini-text-input" 
                      placeholder="e.g. Band Shakthi Live — Jam Arena" 
                      value={newEventTitle} 
                      onChange={(e) => setNewEventTitle(e.target.value)} 
                      required
                    />
                  </div>
                  
                  <div className="input-group-mini">
                    <label>Event Date & Time</label>
                    <input 
                      type="datetime-local" 
                      className="mini-text-input" 
                      value={newEventDate} 
                      onChange={(e) => setNewEventDate(e.target.value)} 
                      required
                    />
                  </div>

                  <div className="input-group-mini">
                    <label>Venue Location</label>
                    <input 
                      type="text" 
                      className="mini-text-input" 
                      placeholder="e.g. The DownTown Pub, Ground Stage" 
                      value={newEventVenue} 
                      onChange={(e) => setNewEventVenue(e.target.value)} 
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="input-group-mini" style={{ flex: 1 }}>
                      <label>Ticket Price (₹)</label>
                      <input 
                        type="number" 
                        className="mini-text-input" 
                        value={newEventPrice} 
                        onChange={(e) => setNewEventPrice(e.target.value)} 
                        required
                      />
                    </div>
                    <div className="input-group-mini" style={{ flex: 1 }}>
                      <label>Capacity</label>
                      <input 
                        type="number" 
                        className="mini-text-input" 
                        value={newEventCapacity} 
                        onChange={(e) => setNewEventCapacity(e.target.value)} 
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group-mini">
                    <label>Terms & Conditions (One rule per line)</label>
                    <textarea 
                      className="mini-text-input" 
                      style={{ minHeight: '80px', resize: 'vertical', width: '100%', fontFamily: 'inherit', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(228, 166, 47, 0.25)', color: '#fff', padding: '10px', borderRadius: '6px' }}
                      placeholder="e.g.&#10;1. Carry valid physical photo ID.&#10;2. Entry restricted below age 18.&#10;3. Tickets are non-refundable." 
                      value={newEventTerms} 
                      onChange={(e) => setNewEventTerms(e.target.value)} 
                    />
                  </div>

                  <button type="submit" className="btn-gold" style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', width: '100%', marginTop: '6px' }}>
                    Schedule Concert Gig
                  </button>
                </form>
              )}

              {/* Active Event Status Display */}
              <div style={{ background: 'rgba(32, 186, 90, 0.05)', border: '1px solid rgba(32, 186, 90, 0.2)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div className="live-indicator" style={{ backgroundColor: '#20ba5a', boxShadow: '0 0 10px rgba(32, 186, 90, 0.6)' }}></div>
                  <span style={{ fontSize: '0.65rem', color: '#20ba5a', fontWeight: 'bold', textTransform: 'uppercase' }}>CURRENT ACTIVE EVENT</span>
                </div>
                <h5 style={{ fontSize: '0.9rem', margin: '4px 0', color: '#fff' }}>{activeEvent.title}</h5>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>ID: {activeEvent.id || 'None'}</span>
              </div>

              {/* Scheduled Events List */}
              <div className="events-list-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(() => {
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                  
                  // Filter events into Upcoming and Past
                  const upcomingEvents = eventsList.filter(evt => {
                    const evtTime = new Date(evt.event_date).getTime();
                    return evtTime >= today || evt.is_active;
                  });
                  
                  const pastEvents = eventsList.filter(evt => {
                    const evtTime = new Date(evt.event_date).getTime();
                    return evtTime < today && !evt.is_active;
                  });

                  return (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>
                        Upcoming & Active Shows ({upcomingEvents.length}):
                      </span>

                      {upcomingEvents.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                          No upcoming shows scheduled.
                        </p>
                      ) : (
                        upcomingEvents.map((evt) => (
                          <div 
                            key={evt.id} 
                            style={{ 
                              background: evt.is_active ? 'rgba(228, 166, 47, 0.05)' : 'rgba(255,255,255,0.02)', 
                              border: evt.is_active ? '1px solid rgba(228, 166, 47, 0.25)' : '1px solid rgba(255,255,255,0.05)', 
                              padding: '12px', 
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div 
                                onClick={() => setEditingEvent({ ...evt, event_date: formatDateTimeLocalInput(evt.event_date) })} 
                                style={{ flex: 1, paddingRight: '10px', cursor: 'pointer' }}
                                title="Click to edit event details"
                              >
                                <h6 style={{ fontSize: '0.85rem', margin: 0, color: evt.is_active ? 'var(--color-gold-light)' : '#fff', fontWeight: 600 }}>
                                  ✏️ {evt.title} <span style={{ fontSize: '0.65rem', fontWeight: 'normal', color: 'var(--color-gold-main)', marginLeft: '6px' }}>(Click to edit)</span>
                                </h6>
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                                  📅 {new Date(evt.event_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} | 📍 {evt.venue}
                                </p>
                                <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                  🎫 ₹{evt.ticket_price} | Capacity: {evt.total_capacity}
                                </p>
                              </div>

                              {!evt.is_active && (
                                <button 
                                  type="button" 
                                  className="btn-gold" 
                                  style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '4px', whiteSpace: 'nowrap' }}
                                  onClick={() => handleSetActiveEvent(evt.id)}
                                  disabled={isUploading}
                                >
                                  Set Active
                                </button>
                              )}
                            </div>

                            {!evt.is_active && (
                              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '6px', marginTop: '2px' }}>
                                <button 
                                  type="button" 
                                  style={{ background: 'transparent', border: 'none', color: '#ff5252', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}
                                  onClick={() => handleDeleteEvent(evt.id)}
                                  disabled={isUploading}
                                >
                                  Delete Event
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {/* Past Shows Section (Collapsible & Scrollable Container) */}
                      {pastEvents.length > 0 && (
                        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                          <button
                            type="button"
                            onClick={() => setShowPastEvents(!showPastEvents)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              color: 'var(--color-text-muted)',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span>📁 Archive / Past Shows ({pastEvents.length})</span>
                            <span style={{ fontSize: '0.6rem' }}>{showPastEvents ? '▼ Hide' : '► Show'}</span>
                          </button>

                          {showPastEvents && (
                            <div 
                              style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '8px', 
                                marginTop: '10px', 
                                maxHeight: '200px', 
                                overflowY: 'auto',
                                paddingRight: '4px',
                                border: '1px solid rgba(255,255,255,0.03)',
                                borderRadius: '6px',
                                padding: '8px',
                                background: 'rgba(0,0,0,0.1)'
                              }}
                            >
                              {pastEvents.map((evt) => (
                                <div 
                                  key={evt.id} 
                                  style={{ 
                                    background: 'rgba(255,255,255,0.01)', 
                                    border: '1px solid rgba(255,255,255,0.02)', 
                                    padding: '8px', 
                                    borderRadius: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                  }}
                                >
                                  <div 
                                    onClick={() => setEditingEvent({ ...evt, event_date: formatDateTimeLocalInput(evt.event_date) })} 
                                    style={{ flex: 1, paddingRight: '10px', cursor: 'pointer' }}
                                    title="Click to edit event details"
                                  >
                                    <h6 style={{ fontSize: '0.75rem', margin: 0, color: '#aaa', textDecoration: 'line-through' }}>
                                      ✏️ {evt.title} <span style={{ fontSize: '0.55rem', textDecoration: 'none', color: 'var(--color-gold-main)', display: 'inline-block', marginLeft: '4px' }}>(Click to edit)</span>
                                    </h6>
                                    <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', margin: '2px 0 0 0' }}>
                                      📅 {new Date(evt.event_date).toLocaleDateString()} | 📍 {evt.venue}
                                    </p>
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button 
                                      type="button" 
                                      style={{ 
                                        background: 'transparent', 
                                        border: '1px solid rgba(228, 166, 47, 0.2)', 
                                        color: 'var(--color-gold-light)', 
                                        fontSize: '0.55rem', 
                                        padding: '2px 6px', 
                                        borderRadius: '3px',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => handleSetActiveEvent(evt.id)}
                                      disabled={isUploading}
                                    >
                                      Re-activate
                                    </button>
                                    <button 
                                      type="button" 
                                      style={{ background: 'transparent', border: 'none', color: '#ff5252', fontSize: '0.55rem', cursor: 'pointer', padding: 0 }}
                                      onClick={() => handleDeleteEvent(evt.id)}
                                      disabled={isUploading}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
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

            {/* Manual Ticket ID Verification */}
            {!scanResult && (
              <div className="glass-card" style={{ padding: '20px', marginTop: '16px', border: '1px solid rgba(228, 166, 47, 0.15)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px' }}>
                <h4 style={{ color: 'var(--color-gold-main)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔑 Manual Ticket Verification
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginBottom: '12px', lineHeight: '1.4' }}>
                  If the camera is unavailable or the guest's QR code is damaged, enter their Ticket ID manually:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input 
                    type="text" 
                    id="manual-ticket-id-input" 
                    placeholder="Enter 36-char Ticket ID (UUID)" 
                    style={{ 
                      background: 'rgba(0, 0, 0, 0.4)', 
                      border: '1px solid rgba(228, 166, 47, 0.25)', 
                      padding: '12px 14px', 
                      borderRadius: '8px', 
                      color: '#fff', 
                      fontSize: '0.85rem', 
                      width: '100%',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }} 
                  />
                  <button 
                    type="button"
                    className="btn-outline" 
                    onClick={() => handleSimulateScanInput('manual-ticket-id-input')}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      background: 'linear-gradient(135deg, #e4a62f 0%, #b37d14 100%)', 
                      border: 'none', 
                      color: '#070709', 
                      fontWeight: 'bold', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Verify & Check-In
                  </button>
                </div>
              </div>
            )}



            {/* Scanner Results Overlay */}
            {scanResult && scanResult.status === 'PARTIAL_ENTRY_PROMPT' && (
              <div className="scan-result-card result-prompt" style={{ border: '1px solid rgba(228, 166, 47, 0.4)', background: 'var(--color-bg-card)', padding: '20px', borderRadius: '12px', textAlign: 'center', marginTop: '16px' }}>
                <h3 style={{ color: 'var(--color-gold-main)', fontSize: '1.2rem', marginBottom: '8px' }}>⚡ PARTIAL CHECK-IN</h3>
                <p className="result-msg" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                  Please select how many guests are entering right now.
                </p>
                
                <div className="result-details" style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                  <p><b>Guest Name:</b> {scanResult.buyer}</p>
                  <p><b>Total Pass Capacity:</b> {scanResult.totalPax} Person(s)</p>
                  <p><b>Already Checked In:</b> <span style={{ color: '#25d366', fontWeight: 'bold' }}>{scanResult.scannedPax}</span></p>
                  <p><b>Remaining Balance:</b> <span style={{ color: 'var(--color-gold-main)', fontWeight: 'bold' }}>{scanResult.remaining}</span></p>
                </div>

                {/* Counter Selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
                  <button 
                    type="button"
                    onClick={() => setCheckInCount(prev => Math.max(1, prev - 1))}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(228, 166, 47, 0.3)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    -
                  </button>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', minWidth: '40px', textAlign: 'center' }}>
                    {checkInCount}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setCheckInCount(prev => Math.min(scanResult.remaining, prev + 1))}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(228, 166, 47, 0.3)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    +
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    className="btn-gold" 
                    onClick={() => handleConfirmPartialEntry(scanResult.ticketId, checkInCount)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Confirm Entry of {checkInCount} Guest(s)
                  </button>
                  <button 
                    className="btn-outline" 
                    onClick={() => setScanResult(null)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancel Scan
                  </button>
                </div>
              </div>
            )}

            {scanResult && scanResult.status !== 'PARTIAL_ENTRY_PROMPT' && (
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
                  {scanResult.scannedPax !== undefined && (
                    <p style={{ color: '#25d366', fontWeight: 'bold' }}>
                      <b>Total Checked In:</b> {scanResult.scannedPax} Person(s)
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

                {/* Manual Sticker ID Entry */}
                <div className="glass-card" style={{ marginTop: '20px', padding: '18px', border: '1px solid rgba(228, 166, 47, 0.15)' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--color-gold-light)', marginBottom: '8px' }}>
                    🔑 Manual Sticker ID Entry
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: '1.4' }}>
                    If the camera feed is not available, enter the printed Sticker ID (UUID) manually below to activate it.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input 
                      id="manual-sticker-id-input"
                      type="text" 
                      placeholder="e.g. f81d4fae-7dec-11d0-a765-00a0c91e6bf6" 
                      style={{ 
                        padding: '12px', 
                        background: '#070709', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '6px', 
                        color: '#fff', 
                        fontSize: '0.85rem', 
                        width: '100%',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }} 
                    />
                    <button 
                      type="button"
                      className="btn-gold" 
                      onClick={() => handleSimulateScanInput('manual-sticker-id-input')}
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Retrieve & Configure Sticker ⚡
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
                      placeholder="Qty (e.g. 100)"
                      value={stickerCount} 
                      onChange={(e) => setStickerCount(e.target.value)}
                      min="1" 
                      max="500"
                      style={{ 
                        width: '120px', 
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
                      onClick={() => {
                        const countToOpen = parseInt(stickerCount) || 100;
                        window.open(`/admin/stickers?count=${countToOpen}`, '_blank');
                      }}
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
                      placeholder="e.g. 1"
                      value={guestPax} 
                      onChange={(e) => setGuestPax(e.target.value)}
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

                  <div className="input-group">
                    <label>Email (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={guestEmail} 
                      onChange={(e) => setGuestEmail(e.target.value)}
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
                  {activationResult.phone && activationResult.phone !== '00000 00000' && (
                    <button 
                      type="button"
                      className="btn-whatsapp"
                      onClick={() => {
                        const origin = window.location.origin;
                        const ticketUrl = `${origin}/api/booking/ticket?name=${encodeURIComponent(activationResult.name)}&phone=${encodeURIComponent(activationResult.phone)}&qty=${activationResult.pax}&id=${activationResult.ticketId}`;
                        const text = `Hi ${activationResult.name}!%0A%0AHere is your official Band Shakthi Live Concert entry pass PDF. Please download it using the link below and show it at the gate entry for check-in:%0A%0A🎟️ Passes: ${activationResult.pax}%0A🆔 Pass ID: ${activationResult.ticketId}%0A%0A🔗 Download Link:%0A${encodeURIComponent(ticketUrl)}`;
                        
                        let rawPhone = activationResult.phone.replace(/\s+/g, '');
                        if (!rawPhone.startsWith('+') && rawPhone.length === 10) {
                          rawPhone = `91${rawPhone}`;
                        }
                        
                        window.open(`https://wa.me/${rawPhone}?text=${text}`, '_blank');
                      }}
                      style={{
                        background: '#25d366',
                        border: 'none',
                        color: '#fff',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em'
                      }}
                    >
                      <svg style={{ width: '16px', height: '16px', fill: 'currentColor' }} viewBox="0 0 24 24">
                        <path d="M12.008 0C5.397 0 .06 5.348.06 12.008c-.001 2.097.546 4.142 1.587 5.946L0 24l6.284-1.646c1.751.955 3.719 1.456 5.724 1.457 6.613 0 11.949-5.34 11.953-11.997.002-3.204-1.239-6.216-3.505-8.484C18.22 1.246 15.21.001 12.008 0zm6.97 15.344c-.242.678-1.402 1.294-1.958 1.378-.5.075-1.13.105-1.823-.115-2.9-1.258-4.795-4.18-4.94-4.373-.144-.194-1.182-1.57-1.182-2.994 0-1.425.748-2.127 1.014-2.417.265-.29.579-.362.772-.362.193 0 .386.002.556.01.178.01.417-.067.653.502.242.581.823 2.007.895 2.152.072.146.121.314.024.507-.097.193-.145.313-.29.483-.145.168-.305.379-.435.508-.145.143-.297.3-.127.59.169.29.752 1.242 1.616 2.013 1.111.992 2.05 1.3 2.34 1.445.29.144.46.12.63-.073.17-.193.724-.847.917-1.137.193-.29.387-.241.653-.145.267.096 1.693.799 1.983.944.29.146.483.218.556.34.07.12.07.701-.17 1.379z"/>
                      </svg>
                      Send Pass via WhatsApp
                    </button>
                  )}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="tab-title" style={{ marginBottom: 0 }}>CSV Importer</h2>
              <button 
                type="button" 
                onClick={() => setActiveTab('more')}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(228, 166, 47, 0.3)',
                  color: 'var(--color-gold-light)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ← Back to Tools
              </button>
            </div>
            <p className="tab-desc" style={{ marginTop: '-8px', marginBottom: '16px' }}>Import guest sheets from Zomato District or BookMyShow.</p>

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="tab-title" style={{ marginBottom: 0 }}>Media & Content Manager</h2>
              {mediaSubTab === 'menu' ? (
                <button 
                  type="button" 
                  onClick={() => setActiveTab('more')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(228, 166, 47, 0.3)',
                    color: 'var(--color-gold-light)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ← Back to Tools
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setMediaSubTab('menu')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(228, 166, 47, 0.3)',
                    color: 'var(--color-gold-light)',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  ← Back to Media
                </button>
              )}
            </div>
            {mediaSubTab === 'menu' && (
              <p className="tab-desc" style={{ marginTop: '-8px', marginBottom: '16px' }}>Modify landing page images, slides, names, and roles dynamically.</p>
            )}

            {isUploading && (
              <div className="uploading-indicator-bar">
                <span className="spinner-mini"></span>
                <span>Updating details in Supabase...</span>
              </div>
            )}

            {/* mediaSubTab === 'menu' (Grid Selector Overview) */}
            {mediaSubTab === 'menu' && (
              <div className="media-menu-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                <div 
                  className="glass-card media-menu-card" 
                  onClick={() => setMediaSubTab('banners')}
                  style={{ cursor: 'pointer', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', transition: 'transform 0.2s' }}
                >
                  <div className="menu-icon-box" style={{ background: 'rgba(228, 166, 47, 0.1)', border: '1px solid rgba(228, 166, 47, 0.2)', borderRadius: '10px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-gold-main)">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-gold-light)', fontSize: '0.95rem' }}>1. Top Header Slider Banners</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                      Customize slide backgrounds, titles, subtitles, and descriptions for the main homepage carousel.
                    </p>
                  </div>
                </div>

                <div 
                  className="glass-card media-menu-card" 
                  onClick={() => setMediaSubTab('members')}
                  style={{ cursor: 'pointer', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', transition: 'transform 0.2s' }}
                >
                  <div className="menu-icon-box" style={{ background: 'rgba(228, 166, 47, 0.1)', border: '1px solid rgba(228, 166, 47, 0.2)', borderRadius: '10px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-gold-main)">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-gold-light)', fontSize: '0.95rem' }}>2. Band Member Profiles</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                      Create, edit, upload portraits, and delete dynamic band member biography profile cards.
                    </p>
                  </div>
                </div>

                <div 
                  className="glass-card media-menu-card" 
                  onClick={() => setMediaSubTab('gallery')}
                  style={{ cursor: 'pointer', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', transition: 'transform 0.2s' }}
                >
                  <div className="menu-icon-box" style={{ background: 'rgba(228, 166, 47, 0.1)', border: '1px solid rgba(228, 166, 47, 0.2)', borderRadius: '10px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-gold-main)">
                      <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-gold-light)', fontSize: '0.95rem' }}>3. Concert Photo Gallery</h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                      Upload live gig photos and manage the masonry gallery on the home page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="media-forms">
              
              {/* SUBTAB 1: Dynamic Banners Section */}
              {mediaSubTab === 'banners' && (
                <div className="glass-card media-editor-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0 }}>1. Top Header Slider Banners</h4>
                    <button type="button" className="btn-gold" style={{ fontSize: '0.7rem', padding: '5px 10px', borderRadius: '6px' }} onClick={handleAddBanner}>
                      + Add Slide
                    </button>
                  </div>
                  <p className="section-desc-small">Add, delete, or modify slides in the homepage background carousel.</p>
                  
                  <div className="admin-banner-row" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {banners.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '10px 0', textAlign: 'center' }}>
                        No custom slides in database. Homepage is currently using the 2 default slides. Click "+ Add Slide" to start customizing!
                      </p>
                    ) : (
                      banners.map((slide, idx) => (
                        <div key={slide.id} className="banner-preview-box" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(228, 166, 47, 0.05)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div 
                              className="banner-preview-thumb" 
                              style={{ backgroundImage: `url(${slide.url})`, width: '80px', height: '50px', borderRadius: '4px', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }}
                            ></div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>Background Slide #{idx + 1}</span>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <label className="btn-gold" style={{ fontSize: '0.6rem', padding: '4px 8px', margin: 0, cursor: 'pointer', borderRadius: '4px' }}>
                                  Change Pic
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    style={{ display: 'none' }}
                                    onChange={(e) => handleUploadBannerImage(e, slide.id)}
                                    disabled={isUploading}
                                  />
                                </label>
                                <button 
                                  type="button" 
                                  className="btn-outline" 
                                  style={{ fontSize: '0.6rem', padding: '4px 8px', borderColor: '#ff5252', color: '#ff5252', borderRadius: '4px' }}
                                  onClick={() => handleDeleteBanner(slide.id, slide.url)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="input-group-mini">
                            <label>Title</label>
                            <input 
                              type="text" 
                              className="mini-text-input"
                              value={slide.title}
                              onChange={(e) => handleBannerTextChange(slide.id, 'title', e.target.value)}
                            />
                          </div>

                          <div className="input-group-mini">
                            <label>Subtitle</label>
                            <input 
                              type="text" 
                              className="mini-text-input"
                              value={slide.subtitle}
                              onChange={(e) => handleBannerTextChange(slide.id, 'subtitle', e.target.value)}
                            />
                          </div>

                          <div className="input-group-mini">
                            <label>Description</label>
                            <input 
                              type="text" 
                              className="mini-text-input"
                              value={slide.desc}
                              onChange={(e) => handleBannerTextChange(slide.id, 'desc', e.target.value)}
                            />
                          </div>

                          <button 
                            type="button" 
                            className="btn-gold" 
                            style={{ fontSize: '0.7rem', padding: '6px 12px', width: '100%', marginTop: '4px', borderRadius: '6px' }}
                            onClick={() => handleSaveBannerDetails(slide.id, slide.title, slide.subtitle, slide.desc)}
                          >
                            Save Text Details
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: Dynamic Band Members Section */}
              {mediaSubTab === 'members' && (
                <div className="glass-card media-editor-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0 }}>2. Band Member Profiles</h4>
                    <button type="button" className="btn-gold" style={{ fontSize: '0.7rem', padding: '5px 10px', borderRadius: '6px' }} onClick={handleAddMember}>
                      + Add Member
                    </button>
                  </div>
                  <p className="section-desc-small">Change photos, display names, and roles on the homepage.</p>

                  <div className="admin-members-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {bandMembers.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '10px 0', textAlign: 'center', width: '100%' }}>
                        No custom members in database. Homepage is currently using the 4 default profiles. Click "+ Add Member" to start customizing!
                      </p>
                    ) : (
                      bandMembers.map((member, idx) => (
                        <div key={member.id} className="admin-member-upload-card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(228, 166, 47, 0.05)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '70px', flexShrink: 0 }}>
                            <div 
                              className="admin-member-thumb"
                              style={{ backgroundImage: `url(${member.url})`, width: '65px', height: '65px', borderRadius: '50%', backgroundSize: 'cover', backgroundPosition: 'center' }}
                            ></div>
                            <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Member #{idx + 1}</span>
                          </div>
                          
                          <div className="admin-member-details" style={{ flex: 1 }}>
                            <div className="input-group-mini">
                              <label>Display Name</label>
                              <input 
                                type="text" 
                                className="mini-text-input"
                                value={member.name}
                                onChange={(e) => handleMemberTextChange(member.id, 'name', e.target.value)}
                              />
                            </div>
                            
                            <div className="input-group-mini" style={{ marginTop: '6px' }}>
                              <label>Band Role</label>
                              <input 
                                type="text" 
                                className="mini-text-input"
                                value={member.role}
                                onChange={(e) => handleMemberTextChange(member.id, 'role', e.target.value)}
                              />
                            </div>
                            
                            <div className="input-group-mini" style={{ marginTop: '6px' }}>
                              <label>Biography</label>
                              <textarea 
                                className="mini-text-input"
                                value={member.bio || ''}
                                onChange={(e) => handleMemberTextChange(member.id, 'bio', e.target.value)}
                                rows="3"
                                style={{ resize: 'none', fontFamily: 'inherit', fontSize: '0.75rem', padding: '6px' }}
                              />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                              <button 
                                type="button" 
                                className="btn-outline btn-mini-act" 
                                onClick={() => handleSaveMemberText(member.id, member.name, member.role, member.bio)}
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
                                  onChange={(e) => handleUploadMemberImage(e, member.id)}
                                  disabled={isUploading}
                                />
                              </label>
                              <button 
                                type="button" 
                                className="btn-outline btn-mini-act" 
                                style={{ borderColor: '#ff5252', color: '#ff5252' }}
                                onClick={() => handleDeleteMember(member.id, member.url)}
                                disabled={isUploading}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: Concert Photo Gallery (masonry list) */}
              {mediaSubTab === 'gallery' && (
                <div className="glass-card media-editor-section">
                  <h4>3. Concert Photo Gallery</h4>
                  <p className="section-desc-small">Add new show photos to the main landing page masonry grid.</p>
                  
                  <div className="media-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Upload Live Concert Photos</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleMultipleImageUpload}
                      disabled={isUploading}
                      style={{ background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div className="admin-gallery-preview" style={{ marginTop: '20px', borderTop: '1px dashed rgba(228, 166, 47, 0.15)', paddingTop: '16px' }}>
                    <h5 style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '12px' }}>Currently in Gallery ({galleryOnlyImages.length})</h5>
                    {galleryOnlyImages.length === 0 ? (
                      <p className="no-images-text" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No uploaded images yet. Use the selector above to upload!</p>
                    ) : (
                      <div className="admin-gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {galleryOnlyImages.map((img) => (
                          <div key={img.id} className="admin-gallery-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div 
                              className="admin-gallery-thumb" 
                              style={{ backgroundImage: `url(${img.url})`, width: '100%', aspectRatio: '1', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '6px', position: 'relative', border: '1px solid rgba(228, 166, 47, 0.1)' }}
                            >
                              <button 
                                type="button"
                                className="btn-delete-img"
                                onClick={() => handleDeleteImage(img.id, img.url)}
                                title="Delete Image"
                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255, 51, 51, 0.9)', border: 'none', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                ×
                              </button>
                            </div>
                            <span className="img-desc-label" title={img.description} style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', width: '100%', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textTextOverflow: 'ellipsis' }}>
                              {img.description?.substring(0, 16) || 'Untitled'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* TAB 6: MORE TOOLS INDEX MENU */}
        {activeTab === 'more' && (
          <div className="tab-content">
            <h2 className="tab-title">More Tools</h2>
            <p className="tab-desc" style={{ marginBottom: '24px' }}>Administrative utilities and system operations.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tool 1: Tickets History */}
              <div 
                className="glass-card tool-link-card" 
                onClick={() => { setActiveTab('history'); fetchTicketsHistory(); }}
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(228, 166, 47, 0.15)', borderRadius: '12px', background: 'var(--color-bg-card)', transition: 'all 0.2s' }}
              >
                <div className="tool-icon" style={{ color: 'var(--color-gold-main)', background: 'rgba(228, 166, 47, 0.1)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Attendance & Tickets History</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>View all online bookings, offline sales, and guest check-in statuses.</p>
                </div>
              </div>

              {/* Tool 2: Media Manager */}
              <div 
                className="glass-card tool-link-card" 
                onClick={() => { setActiveTab('media'); setMediaSubTab('menu'); }}
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(228, 166, 47, 0.15)', borderRadius: '12px', background: 'var(--color-bg-card)', transition: 'all 0.2s' }}
              >
                <div className="tool-icon" style={{ color: 'var(--color-gold-main)', background: 'rgba(228, 166, 47, 0.1)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Website Content Manager</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>Modify homepage slider banners, update band members, and upload gallery photos.</p>
                </div>
              </div>

              {/* Tool 2.5: Past Gigs Logger */}
              <div 
                className="glass-card tool-link-card" 
                onClick={() => { setActiveTab('past_events'); }}
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(228, 166, 47, 0.15)', borderRadius: '12px', background: 'var(--color-bg-card)', transition: 'all 0.2s' }}
              >
                <div className="tool-icon" style={{ color: 'var(--color-gold-main)', background: 'rgba(228, 166, 47, 0.1)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <path d="M12 14v4"></path>
                    <path d="M10 16h4"></path>
                  </svg>
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Past Gigs & Media Logger</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>Log historical band concerts, and upload/post photos and videos directly for those gigs.</p>
                </div>
              </div>

              {/* Tool 3: CSV Importer */}
              <div 
                className="glass-card tool-link-card" 
                onClick={() => setActiveTab('csv')}
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(228, 166, 47, 0.15)', borderRadius: '12px', background: 'var(--color-bg-card)', transition: 'all 0.2s' }}
              >
                <div className="tool-icon" style={{ color: 'var(--color-gold-main)', background: 'rgba(228, 166, 47, 0.1)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Zomato / BMS CSV Importer</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>Import bulk third-party booking spreadsheets directly into the gate database.</p>
                </div>
              </div>

              {/* Tool 4: Inquiries Manager */}
              <div 
                className="glass-card tool-link-card" 
                onClick={() => { setActiveTab('inquiries'); fetchInquiries(); }}
                style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(228, 166, 47, 0.15)', borderRadius: '12px', background: 'var(--color-bg-card)', transition: 'all 0.2s' }}
              >
                <div className="tool-icon" style={{ color: 'var(--color-gold-main)', background: 'rgba(228, 166, 47, 0.1)', width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Website Inquiries Inbox</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>View direct booking requests and customer messages submitted via the contact form.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: TICKETS & ATTENDANCE HISTORY LIST */}
        {activeTab === 'history' && (() => {
          const onlineTickets = ticketsHistory.filter(t => !t.is_offline && t.ticket_type !== 'OFFLINE_GUEST');
          const offlineTickets = ticketsHistory.filter(t => t.is_offline || t.ticket_type === 'OFFLINE_GUEST');

          const totalPax = ticketsHistory.reduce((sum, t) => sum + (t.pax || 1), 0);
          const totalCheckedInPax = ticketsHistory.reduce((sum, t) => sum + (t.scanned_pax || (t.scanned ? (t.pax || 1) : 0)), 0);

          const onlinePax = onlineTickets.reduce((sum, t) => sum + (t.pax || 1), 0);
          const onlineCheckedInPax = onlineTickets.reduce((sum, t) => sum + (t.scanned_pax || (t.scanned ? (t.pax || 1) : 0)), 0);

          const offlinePax = offlineTickets.reduce((sum, t) => sum + (t.pax || 1), 0);
          const offlineCheckedInPax = offlineTickets.reduce((sum, t) => sum + (t.scanned_pax || (t.scanned ? (t.pax || 1) : 0)), 0);

          const filteredTickets = ticketsHistory.filter(ticket => {
            const isOffline = ticket.is_offline || ticket.ticket_type === 'OFFLINE_GUEST';
            if (historyTypeFilter === 'ONLINE' && isOffline) return false;
            if (historyTypeFilter === 'OFFLINE' && !isOffline) return false;

            const searchLower = historySearch.toLowerCase();
            return (
              ticket.buyer_name?.toLowerCase().includes(searchLower) ||
              ticket.buyer_phone?.toLowerCase().includes(searchLower) ||
              ticket.buyer_email?.toLowerCase().includes(searchLower) ||
              ticket.id?.toLowerCase().includes(searchLower)
            );
          });

          return (
            <div className="tab-content">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(228,166,47,0.1)', paddingBottom: '12px' }}>
                <div>
                  <h2 className="tab-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#fff' }}>Attendance & Passes Log</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>Real-time gate check-ins & sales history across Online and Offline channels.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('more')}
                  style={{
                    background: 'rgba(228, 166, 47, 0.08)',
                    border: '1px solid rgba(228, 166, 47, 0.3)',
                    color: 'var(--color-gold-light)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    transition: 'all 0.2s'
                  }}
                >
                  ← Tools
                </button>
              </div>

              {/* Top Summary Cards: Online vs Offline Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                {/* Total Stats */}
                <div 
                  className="glass-card" 
                  onClick={() => setHistoryTypeFilter('ALL')}
                  style={{ 
                    padding: '14px 16px', 
                    borderRadius: '10px', 
                    background: historyTypeFilter === 'ALL' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', 
                    border: historyTypeFilter === 'ALL' ? '1px solid rgba(228, 166, 47, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>Total Audience</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{totalPax} Pax</div>
                  <div style={{ fontSize: '0.7rem', color: '#25d366', marginTop: '2px', fontWeight: 600 }}>{totalCheckedInPax} Checked In ({totalPax > 0 ? Math.round((totalCheckedInPax/totalPax)*100) : 0}%)</div>
                </div>

                {/* Online Stats */}
                <div 
                  className="glass-card" 
                  onClick={() => setHistoryTypeFilter('ONLINE')}
                  style={{ 
                    padding: '14px 16px', 
                    borderRadius: '10px', 
                    background: historyTypeFilter === 'ONLINE' ? 'rgba(0, 180, 216, 0.15)' : 'rgba(0, 180, 216, 0.04)', 
                    border: historyTypeFilter === 'ONLINE' ? '1px solid rgba(0, 180, 216, 0.5)' : '1px solid rgba(0, 180, 216, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#00b4d8', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🌐</span> Online Section
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{onlinePax} Pax <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>({onlineTickets.length} orders)</span></div>
                  <div style={{ fontSize: '0.7rem', color: '#00b4d8', marginTop: '2px', fontWeight: 600 }}>{onlineCheckedInPax} Entered Gate</div>
                </div>

                {/* Offline Stats */}
                <div 
                  className="glass-card" 
                  onClick={() => setHistoryTypeFilter('OFFLINE')}
                  style={{ 
                    padding: '14px 16px', 
                    borderRadius: '10px', 
                    background: historyTypeFilter === 'OFFLINE' ? 'rgba(228, 166, 47, 0.18)' : 'rgba(228, 166, 47, 0.04)', 
                    border: historyTypeFilter === 'OFFLINE' ? '1px solid rgba(228, 166, 47, 0.5)' : '1px solid rgba(228, 166, 47, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-gold-main)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🏪</span> Offline Section
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{offlinePax} Pax <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>({offlineTickets.length} passes)</span></div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-gold-light)', marginTop: '2px', fontWeight: 600 }}>{offlineCheckedInPax} Entered Gate</div>
                </div>
              </div>

              {/* Filter Tabs & Search Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {/* Channel Section Pills */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setHistoryTypeFilter('ALL')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: historyTypeFilter === 'ALL' ? '1px solid var(--color-gold-main)' : '1px solid rgba(255,255,255,0.1)',
                      background: historyTypeFilter === 'ALL' ? 'var(--color-gold-main)' : 'rgba(255,255,255,0.03)',
                      color: historyTypeFilter === 'ALL' ? '#070709' : 'var(--color-text-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    🎟️ All Passes ({ticketsHistory.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTypeFilter('ONLINE')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: historyTypeFilter === 'ONLINE' ? '1px solid #00b4d8' : '1px solid rgba(255,255,255,0.1)',
                      background: historyTypeFilter === 'ONLINE' ? 'rgba(0, 180, 216, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: historyTypeFilter === 'ONLINE' ? '#00b4d8' : 'var(--color-text-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    🌐 Online Section ({onlineTickets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTypeFilter('OFFLINE')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: historyTypeFilter === 'OFFLINE' ? '1px solid var(--color-gold-main)' : '1px solid rgba(255,255,255,0.1)',
                      background: historyTypeFilter === 'OFFLINE' ? 'rgba(228, 166, 47, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: historyTypeFilter === 'OFFLINE' ? 'var(--color-gold-light)' : 'var(--color-text-muted)',
                      transition: 'all 0.2s'
                    }}
                  >
                    🏪 Offline Section ({offlineTickets.length})
                  </button>
                </div>

                {/* Search Bar & Export CSV Action */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <input 
                      type="text" 
                      placeholder={`Search ${historyTypeFilter === 'ONLINE' ? 'Online' : historyTypeFilter === 'OFFLINE' ? 'Offline' : 'All'} Passes by Name, Phone, or ID...`} 
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      style={{ width: '100%', background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    style={{
                      height: '38px',
                      background: 'linear-gradient(135deg, #e4a62f 0%, #b37d14 100%)',
                      border: 'none',
                      color: '#070709',
                      padding: '0 16px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(228, 166, 47, 0.2)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* Ticket Cards List */}
              <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '55vh', paddingBottom: '40px' }}>
                {filteredTickets.map(ticket => {
                  const isExpanded = expandedTicketId === ticket.id;
                  const totalPax = ticket.pax || 1;
                  const scannedPax = ticket.scanned_pax || 0;
                  const remaining = totalPax - scannedPax;
                  const isOffline = ticket.ticket_type === 'OFFLINE_GUEST' || Boolean(ticket.is_offline);

                  // Render visual status badge text based on scanned pax count
                  let attendanceBadgeText = 'Not Attended';
                  let badgeBg = 'rgba(228, 166, 47, 0.15)';
                  let badgeColor = 'var(--color-gold-main)';
                  let badgeBorder = '1px solid rgba(228, 166, 47, 0.3)';

                  if (ticket.scanned) {
                    attendanceBadgeText = 'Checked In';
                    badgeBg = 'rgba(37, 211, 102, 0.15)';
                    badgeColor = '#25d366';
                    badgeBorder = '1px solid rgba(37, 211, 102, 0.3)';
                  } else if (scannedPax > 0) {
                    attendanceBadgeText = `Partially In (${scannedPax}/${totalPax})`;
                    badgeBg = 'rgba(0, 180, 216, 0.15)';
                    badgeColor = '#00b4d8';
                    badgeBorder = '1px solid rgba(0, 180, 216, 0.3)';
                  }

                  return (
                    <div 
                      key={ticket.id} 
                      className="glass-card history-item-card" 
                      onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                      style={{ 
                        padding: '16px', 
                        borderLeft: ticket.scanned ? '4px solid #25d366' : scannedPax > 0 ? '4px solid #00b4d8' : isOffline ? '4px solid var(--color-gold-main)' : '4px solid #00b4d8', 
                        background: 'var(--color-bg-card)', 
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{ticket.buyer_name || 'Guest'}</h4>
                            <span style={{ 
                              fontSize: '0.6rem', 
                              fontWeight: 800, 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              background: isOffline ? 'rgba(228, 166, 47, 0.15)' : 'rgba(0, 180, 216, 0.15)',
                              color: isOffline ? 'var(--color-gold-main)' : '#00b4d8',
                              border: isOffline ? '1px solid rgba(228, 166, 47, 0.3)' : '1px solid rgba(0, 180, 216, 0.3)',
                              textTransform: 'uppercase'
                            }}>
                              {isOffline ? '🏪 Offline Counter' : '🌐 Online'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                            Click card to show full details
                          </span>
                        </div>
                        <span 
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background: badgeBg,
                            color: badgeColor,
                            border: badgeBorder
                          }}
                        >
                          {attendanceBadgeText}
                        </span>
                      </div>
                      
                      <div style={{ 
                        marginTop: '12px', 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '8px', 
                        fontSize: '0.75rem', 
                        color: 'var(--color-text-muted)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                        paddingTop: '10px'
                      }}>
                        <div>Qty: <b style={{ color: '#fff' }}>{totalPax} Pax</b></div>
                        <div>Channel: <b style={{ color: isOffline ? 'var(--color-gold-light)' : '#00b4d8' }}>{isOffline ? 'Offline Counter' : 'Online Website'}</b></div>
                        <div style={{ gridColumn: 'span 2', marginTop: '2px' }}>Event: <b style={{ color: 'var(--color-gold-light)', fontWeight: 500 }}>{ticket.events?.title || 'Concert Live'}</b></div>
                      </div>

                      {/* Collapsible Accordion Drawer Details */}
                      {isExpanded && (
                        <div 
                          className="accordion-content"
                          style={{ 
                            marginTop: '14px', 
                            paddingTop: '14px', 
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)',
                            animation: 'fadeIn 0.2s ease-in'
                          }}
                          onClick={(e) => e.stopPropagation()} // prevent double-closing when clicking details text
                        >
                          <div>
                            <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>🎟️ Booking Channel:</span>{' '}
                            <span style={{ color: '#fff', fontWeight: 700 }}>{isOffline ? 'Offline On-Site POS Counter' : 'Online Website (Razorpay/Gate)'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>📧 Email Address:</span>{' '}
                            <span style={{ color: '#fff' }}>{ticket.buyer_email || 'N/A'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>📞 Contact Number:</span>{' '}
                            <span style={{ color: '#fff' }}>{ticket.buyer_phone || 'N/A'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>⏱️ Ticket Created:</span>{' '}
                            <span style={{ color: '#fff' }}>
                              {ticket.created_at ? new Date(ticket.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>✅ Checked-In Pax:</span>{' '}
                            <span style={{ color: '#fff' }}>{scannedPax} entered ({remaining} remaining)</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-gold-light)', fontWeight: 600 }}>⏰ Last Check-in Time:</span>{' '}
                            <span style={{ color: '#fff' }}>
                              {ticket.scanned_at ? new Date(ticket.scanned_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                            </span>
                          </div>
                          <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.65rem', marginTop: '6px', color: 'rgba(255,255,255,0.15)' }}>
                            Ticket ID: {ticket.id}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredTickets.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    No {historyTypeFilter === 'ONLINE' ? 'online' : historyTypeFilter === 'OFFLINE' ? 'offline counter' : ''} ticket bookings found in system.
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 8: INQUIRIES INBOX LIST */}
        {activeTab === 'inquiries' && (
          <div className="tab-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="tab-title" style={{ marginBottom: 0 }}>Website Inbox</h2>
              <button 
                type="button" 
                onClick={() => setActiveTab('more')}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(228, 166, 47, 0.3)',
                  color: 'var(--color-gold-light)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ← Back to Tools
              </button>
            </div>

            {/* Search Filter Input */}
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label>Search Messages</label>
              <input 
                type="text" 
                placeholder="Search by Name, Email, or Type..." 
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                style={{ width: '100%', background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '60vh', paddingBottom: '40px' }}>
              {inquiries
                .filter(inq => {
                  const searchLower = inquirySearch.toLowerCase();
                  return (
                    inq.name?.toLowerCase().includes(searchLower) ||
                    inq.email?.toLowerCase().includes(searchLower) ||
                    inq.inquiry_type?.toLowerCase().includes(searchLower) ||
                    inq.message?.toLowerCase().includes(searchLower)
                  );
                })
                .map(inq => (
                  <div key={inq.id} className="glass-card history-item-card" style={{ padding: '16px', borderLeft: inq.status === 'RESOLVED' ? '4px solid #25d366' : '4px solid #f2ab27', background: 'var(--color-bg-card)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{inq.name}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', margin: 0 }}>{inq.email}</p>
                      </div>
                      <span 
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          background: inq.status === 'RESOLVED' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(242, 171, 39, 0.15)',
                          color: inq.status === 'RESOLVED' ? '#25d366' : '#f2ab27',
                          border: inq.status === 'RESOLVED' ? '1px solid rgba(37, 211, 102, 0.3)' : '1px solid rgba(242, 171, 39, 0.3)'
                        }}
                      >
                        {inq.status === 'RESOLVED' ? 'Resolved' : 'Pending'}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', marginTop: '10px', fontSize: '0.8rem', color: '#eaeaea', whiteSpace: 'pre-wrap', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <b>Type: {inq.inquiry_type}</b><br />
                      {inq.message}
                    </div>
                    
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      <span>Submitted: <b>{new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b></span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => handleResolveInquiry(inq.id, inq.status)}
                          style={{ background: 'transparent', border: 'none', color: '#25d366', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }}
                        >
                          {inq.status === 'RESOLVED' ? 'Mark Pending' : 'Mark Resolved'}
                        </button>
                        <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                        <button 
                          onClick={() => handleDeleteInquiry(inq.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ff5252', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {inquiries.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No messages in your inbox.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: PAST EVENTS LOGGER AND ASSET MANAGER */}
        {activeTab === 'past_events' && (
          <div className="tab-content">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 className="tab-title" style={{ marginBottom: 0 }}>Past Gigs Manager</h2>
              <button 
                type="button" 
                onClick={() => setActiveTab('more')}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(228, 166, 47, 0.3)',
                  color: 'var(--color-gold-light)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ← Back to Tools
              </button>
            </div>

            <p className="tab-desc" style={{ marginBottom: '20px' }}>Log historical band gigs, and upload/post videos and images directly for those events.</p>

            <button 
              type="button" 
              className="btn-gold" 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              onClick={() => setShowCreatePastEventForm(!showCreatePastEventForm)}
            >
              {showCreatePastEventForm ? 'Cancel New Log' : '+ Log Historical Gig'}
            </button>

            {/* Create Past Event Form */}
            {showCreatePastEventForm && (
              <form onSubmit={handleCreatePastEvent} className="glass-card" style={{ padding: '20px', border: '1px solid rgba(228, 166, 47, 0.25)', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--color-bg-card)' }}>
                <h3 style={{ color: 'var(--color-gold-light)', margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 700 }}>Log Historical Gig</h3>
                
                <div className="input-group-mini">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Gig/Concert Title</label>
                  <input 
                    type="text" 
                    className="mini-text-input" 
                    placeholder="e.g. Band Shakthi Live — Hard Rock Cafe" 
                    value={pastEventTitle} 
                    onChange={(e) => setPastEventTitle(e.target.value)} 
                    style={{ width: '100%', background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
                    required
                  />
                </div>
                
                <div className="input-group-mini">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Gig Date & Time</label>
                  <input 
                    type="datetime-local" 
                    className="mini-text-input" 
                    value={pastEventDate} 
                    onChange={(e) => setPastEventDate(e.target.value)} 
                    style={{ width: '100%', background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <div className="input-group-mini">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Venue Location</label>
                  <input 
                    type="text" 
                    className="mini-text-input" 
                    placeholder="e.g. Hard Rock Cafe, St. Mark's Road" 
                    value={pastEventVenue} 
                    onChange={(e) => setPastEventVenue(e.target.value)} 
                    style={{ width: '100%', background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
                    required
                  />
                </div>

                <div className="input-group-mini">
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Gig Description / Highlights</label>
                  <textarea 
                    placeholder="e.g. Sold out fusion show. High energy violinist run of 20 mins. Played for 600+ guests..." 
                    value={pastEventDescription} 
                    onChange={(e) => setPastEventDescription(e.target.value)} 
                    rows={3}
                    style={{ width: '100%', background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="input-group-mini" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Estimated Crowd/Capacity</label>
                    <input 
                      type="number" 
                      className="mini-text-input" 
                      value={pastEventCapacity} 
                      onChange={(e) => setPastEventCapacity(e.target.value)} 
                      style={{ width: '100%', background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>
                  <div className="input-group-mini" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Ticket Price (₹)</label>
                    <input 
                      type="number" 
                      className="mini-text-input" 
                      value={pastEventPrice} 
                      onChange={(e) => setPastEventPrice(e.target.value)} 
                      style={{ width: '100%', background: '#070709', border: '1px solid rgba(228, 166, 47, 0.15)', color: '#fff', padding: '10px', borderRadius: '8px', fontSize: '0.85rem' }}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn-gold" 
                  disabled={isUploading}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '6px' }}
                >
                  {isUploading ? 'Logging Gig...' : 'Confirm & Log Gig'}
                </button>
              </form>
            )}

            {/* List of past events */}
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>Gigs History Grid</h3>
            <div className="history-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '55vh', overflowY: 'auto', paddingBottom: '40px' }}>
              {eventsList
                .filter(e => !e.is_active)
                .map(event => {
                  const eventDate = new Date(event.event_date);
                  const isExpanded = selectedPastEventId === event.id;
                  const linkedAssets = galleryImages.filter(img => img.event_id === event.id);

                  return (
                    <div key={event.id} className="glass-card" style={{ padding: '18px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', background: 'var(--color-bg-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, margin: 0 }}>{event.title}</h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-gold-light)', marginTop: '4px', margin: 0 }}>📍 {event.venue}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px', margin: 0 }}>
                            📅 {eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span 
                          style={{
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#aaa',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                          }}
                        >
                          Completed
                        </span>
                      </div>

                      {event.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.15)', padding: '8px 10px', borderRadius: '6px', margin: '12px 0 0 0', border: '1px solid rgba(255,255,255,0.02)', fontStyle: 'italic' }}>
                          {event.description}
                        </p>
                      )}

                      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          Media: <b>{linkedAssets.length} file(s)</b> linked
                        </span>
                        
                        <button 
                          onClick={() => setSelectedPastEventId(isExpanded ? null : event.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-gold-main)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isExpanded ? 'Hide Media Panel ▲' : 'Manage Media Panel ▼'}
                        </button>
                      </div>

                      {/* Expandable Media management section for this past event */}
                      {isExpanded && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(228, 166, 47, 0.15)' }}>
                          <h5 style={{ color: 'var(--color-gold-light)', margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            Linked Photos & Videos
                          </h5>

                          {/* Media asset grid */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                            {linkedAssets.map(asset => (
                              <div key={asset.id} className="admin-gallery-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', position: 'relative' }}>
                                {asset.type === 'VIDEO' ? (
                                  <div style={{ width: '100%', aspectRatio: '1', borderRadius: '6px', border: 'var(--border-glass)', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="var(--color-gold-main)">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    <span style={{ position: 'absolute', bottom: '2px', left: '2px', fontSize: '0.5rem', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '1px 3px', borderRadius: '2px' }}>VIDEO</span>
                                  </div>
                                ) : (
                                  <div 
                                    className="admin-gallery-thumb" 
                                    style={{ backgroundImage: `url(${asset.url})` }}
                                  />
                                )}
                                <button 
                                  onClick={() => handleDeletePastEventMedia(asset.id, asset.url)}
                                  className="btn-delete-img"
                                  title="Delete Media"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>

                          {linkedAssets.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '14px', fontStyle: 'italic' }}>
                              No photos/videos uploaded for this gig yet.
                            </div>
                          )}

                          {/* File input to upload past event photos/videos */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>Upload Photos / Videos</label>
                            <input 
                              type="file" 
                              accept="image/*,video/*"
                              multiple 
                              onChange={(e) => handleUploadPastEventMedia(e, event.id)}
                              disabled={isUploading}
                              style={{ display: 'none' }}
                              id={`past-upload-${event.id}`}
                            />
                            <label 
                              htmlFor={`past-upload-${event.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: 'rgba(228, 166, 47, 0.05)',
                                border: '1px dashed var(--color-gold-main)',
                                color: 'var(--color-gold-light)',
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                transition: 'all 0.2s',
                                textAlign: 'center'
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                              <span>{isUploading ? 'Uploading assets...' : 'Select Files to Upload'}</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

              {eventsList.filter(e => !e.is_active).length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No historical gigs logged in system yet.
                </div>
              )}
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

        <button className={`tab-link ${['more', 'csv', 'media', 'history', 'inquiries', 'past_events'].includes(activeTab) ? 'active' : ''}`} onClick={() => setActiveTab('more')}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0 12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zM8 12c0 .83.67 1.5 1.5 1.5h10c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-10c-.83 0-1.5.67-1.5 1.5zm0-6c0 .83.67 1.5 1.5 1.5h10c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-10C8.67 4.5 8 5.17 8 6zm0 12c0 .83.67 1.5 1.5 1.5h10c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-10c-.83 0-1.5.67-1.5 1.5z"/>
          </svg>
          <span>More Tools</span>
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
          padding: 0 16px;
          height: 60px;
          border-bottom: 1px solid rgba(228, 166, 47, 0.15);
          background-color: #070709;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

         .logo-img {
          height: 30px;
          width: auto;
          object-fit: contain;
        }

        .header-logo-img {
          height: 21px !important;
          width: auto !important;
          max-width: 80px;
          object-fit: contain;
          display: block;
        }

        .login-logo-img {
          height: auto !important;
          max-height: 56px;
          width: auto !important;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }

        .badge-pwa {
          background: rgba(228, 166, 47, 0.08);
          border: 1px solid rgba(228, 166, 47, 0.3);
          color: var(--color-gold-light);
          font-family: var(--font-family-title);
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: #ff3333;
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: var(--transition-smooth);
        }

        .logout-btn:hover {
          color: #ff6666;
          opacity: 0.9;
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

        /* Media Menu styling */
        .media-menu-card {
          border: 1px solid rgba(228, 166, 47, 0.1);
          background: rgba(18, 18, 24, 0.6);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .media-menu-card:hover {
          transform: translateY(-2px);
          border-color: rgba(228, 166, 47, 0.35);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
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
      {/* ✏️ EDIT EVENT MODAL POPUP DIALOG */}
      {editingEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div className="glass-card" style={{
            background: '#0f0f15',
            border: '1px solid var(--color-gold-main)',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <h3 style={{ color: 'var(--color-gold-main)', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid rgba(228, 166, 47, 0.2)', paddingBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✏️ Edit Show Details
            </h3>

            <form onSubmit={handleUpdateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>Show Title</label>
                <input 
                  type="text" 
                  value={editingEvent.title || ''} 
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '0.85rem' }}
                  required 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={editingEvent.event_date || ''} 
                  onChange={(e) => setEditingEvent({ ...editingEvent, event_date: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '0.85rem' }}
                  required 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>Venue Location</label>
                <input 
                  type="text" 
                  value={editingEvent.venue || ''} 
                  onChange={(e) => setEditingEvent({ ...editingEvent, venue: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '0.85rem' }}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>Price (₹)</label>
                  <input 
                    type="number" 
                    value={editingEvent.ticket_price ?? ''} 
                    onChange={(e) => setEditingEvent({ ...editingEvent, ticket_price: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '0.85rem' }}
                    required 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>Capacity</label>
                  <input 
                    type="number" 
                    value={editingEvent.total_capacity ?? ''} 
                    onChange={(e) => setEditingEvent({ ...editingEvent, total_capacity: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '0.85rem' }}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>Description / Tagline</label>
                <textarea 
                  value={editingEvent.description || ''} 
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '0.85rem', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontWeight: 600 }}>Terms & Conditions</label>
                <textarea 
                  value={editingEvent.terms || ''} 
                  onChange={(e) => setEditingEvent({ ...editingEvent, terms: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', padding: '10px', fontSize: '0.85rem', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setEditingEvent(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#aaa', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEdit}
                  className="btn-gold"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '0.85rem', cursor: isSavingEdit ? 'not-allowed' : 'pointer' }}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes 💾'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const AdminPage = dynamic(() => Promise.resolve(AdminPageContent), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070709', color: 'var(--color-gold-light)' }}>
      <span className="spinner-mini" style={{ width: '40px', height: '40px', border: '3px solid rgba(228, 166, 47, 0.1)', borderTopColor: 'var(--color-gold-main)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
      <p style={{ marginTop: '16px', fontSize: '0.85rem', letterSpacing: '0.05em', fontFamily: 'sans-serif' }}>LOADING SECURE PANEL...</p>
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
});

export default AdminPage;
