# Band Shakti — Feature & Development Tracker

Use this document to track the progress of features during development. We will check off tasks as they are built.

---

## 📊 Status Summary
*   **Total MVP Features:** 15
*   **Completed:** 3
*   **In Progress:** 0
*   **Pending:** 12

---

## 🛠️ Project Roadmap & Tracks

### Track 1: Initial setup & Documentation
*   [x] **Git Initialization** — Local git repository initialized.
*   [x] **Architectural Proposal** — Technical design, security flows, and integrations defined.
*   [x] **Core System Documentation** — README, tech stack specs, deployment guide, and database SQL schemas created.

---

### Track 2: Public Landing Page (UI/UX)
*   [ ] **Responsive Header & Sticky Navbar** — Translucent blurred header matching the Mousiqua styling with a glowing ticket CTA.
*   [ ] **Hero Slider (2 Slides)** — Main carousel with title banner and a central video play-button modal.
*   [ ] **About & Band Members Section** — Biography text and individual band member cards with hover zoom and text slide-up transitions.
*   [ ] **Photo Gallery Grid** — Image gallery featuring hover effects and an overlay lightbox modal for image-swiping.
*   [ ] **Contact & Booking Form** — Static form to submit private performance bookings directly.
*   [ ] **WhatsApp Floating Widget** — Sticky WhatsApp chat link in the bottom-right corner.

---

### Track 3: Ticketing & Payment Gateway (Instamojo)
*   [ ] **Offer Promo Popup** — Time-delayed modal showing the buy-more-get-more promotions.
*   [ ] **Booking & Pricing Engine** — Ticket quantity selectors with live dynamic pricing calculations (Buy 2 Get 1, Buy 5 Get 2, Buy 10 Get 3).
*   [ ] **Instamojo Checkout Integration** — API route to generate payment requests and handle redirect payment callbacks securely.
*   [ ] **PDF Ticket Generator** — Backend service utilizing `pdf-lib` to overlay event details and custom QR codes onto the ticket graphic.
*   [ ] **Email Delivery Service** — Automation utilizing Resend/SMTP to deliver the PDF tickets to the buyer immediately.

---

### Track 4: PWA Admin Panel (/admin)
*   [ ] **PWA Configuration** — Service worker and manifest setup to allow installing the admin panel as a full-screen home-screen app.
*   [ ] **Admin Dashboard UI** — Password-protected stats page showing real-time ticket sales, revenue, and attendance.
*   [ ] **Mobile Camera QR Scanner** — Built-in camera reader at `/admin/scan` for check-ins (marks ticket as used in database).
*   [ ] **Offline QR Activator** — Terminal-like page for counter staff to scan and activate generic pre-printed QR stickers.
*   [ ] **Website Asset Manager** — Dynamic upload interface (with image-compression) to edit homepage slides, members, and gallery images.
*   [ ] **Zomato / BookMyShow CSV Importer** — Drag-and-drop tool to load external ticket CSVs and email them custom QR passes.
