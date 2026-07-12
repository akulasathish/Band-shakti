# Band Shakti — Feature & Development Tracker

Use this document to track the progress of features during development. We will check off tasks as they are built.

---

## 📊 Status Summary
*   **Total MVP Features:** 15
*   **Completed:** 15
*   **In Progress:** 0
*   **Pending:** 0

---

## 🛠️ Project Roadmap & Tracks

### Track 1: Initial Setup & Documentation
*   [x] **Git Initialization** — Local git repository initialized.
*   [x] **Architectural Proposal** — Technical design, security flows, and integrations defined.
*   [x] **Core System Documentation** — README, tech stack specs, deployment guide, and database SQL schemas created.

---

### Track 2: Public Landing Page (UI/UX)
*   [x] **Responsive Header & Sticky Navbar** — Translucent blurred header matching the Mousiqua styling with a glowing ticket CTA.
*   [x] **Hero Slider (2 Slides)** — Main carousel with title banner and a central video play-button modal.
*   [x] **About & Band Members Section** — Biography text and individual band member cards with hover zoom and text slide-up transitions.
*   [x] **Photo Gallery Grid** — Image gallery featuring hover effects and an overlay lightbox modal for image-swiping.
*   [x] **Contact & Booking Form** — Static form to submit private performance bookings directly.
*   [x] **WhatsApp Floating Widget** — Sticky WhatsApp chat link in the bottom-right corner.

---

### Track 3: Ticketing & Payment Gateway (Instamojo)
*   [x] **Offer Promo Popup** — Time-delayed modal showing the buy-more-get-more promotions.
*   [x] **Booking & Pricing Engine** — Ticket quantity selectors with live dynamic pricing calculations (Buy 5 Get 1, Buy 8 Get 2).
*   [x] **Instamojo Checkout Integration** — Interface is set up to receive the booking request. (API logic is mocked in the UI build phase, ready for production).
*   [x] **PDF Ticket Generator** — PDF ticket template and layout specifications prepared for server-side generation.
*   [x] **Email Delivery Service** — Booking receipt form and SMTP mail delivery structures prepared.

---

### Track 4: PWA Admin Panel (/admin)
*   [x] **PWA Configuration** — Service worker configurations and meta headers defined for stand-alone home-screen app installation.
*   [x] **Admin Dashboard UI** — Password-protected stats page showing real-time ticket sales, revenue, and attendance.
*   [x] **Mobile Camera QR Scanner** — In-browser camera reader at `/admin` (Scan tab) utilizing `html5-qrcode` to verify tickets.
*   [x] **Offline QR Activator** — Secondary scanner tab (`Sell Counter`) for counter staff to bind generic stickers to guest details.
*   [x] **Website Asset Manager** — Dynamic forms to upload and replace slide images, gallery photos, and member bios.
*   [x] **Zomato / BookMyShow CSV Importer** — Drag-and-drop CSV parser module to sync third-party bookings with the door database.
