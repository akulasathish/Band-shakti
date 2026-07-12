# 🎸 Band Shakthi — Live Music Website & Admin Gate App

A premium, high-performance web platform built with **Next.js**, **Supabase**, and **CSS** for **Band Shakthi**. The application features a gold-and-midnight-black visual identity, dynamic landing page sliders, active gig transition controls, and a responsive **Admin Gate Scanner App** for scanning QR entry tickets at live pub events.

---

## 🎨 Tech Stack & Visual Identity
*   **Frontend Core:** Next.js (App Router) & React Hooks.
*   **Styling System:** Vanilla CSS with custom property tokens (Gold gradients, dark glassmorphism overlays, and smooth animations).
*   **Database & File Storage:** Supabase Postgres Database & Storage Buckets.
*   **QR Scanner:** `html5-qrcode` integration with hardware camera selection.

---

## ✨ Features Implemented

### 📱 1. Admin Gate App (/admin)
*   **Constrained Mobile Layout:** Constrained to a centered `480px` phone preview viewport on desktop monitors, keeping it highly responsive and optimized on physical mobile devices.
*   **Real-time Stats Dashboard:** Displays ticket sales, revenue totals, capacity progress, and check-in counts.
*   **Gate QR Code Scanner:** Activates the device's back camera automatically over secure browser contexts to scan and check in ticket holders.
*   **Offline Ticket Activator (Sell Counter):** Allows counter staff to bind generic pre-printed QR stickers to guests instantly on-site.
*   **Zomato / BookMyShow CSV Importer:** Drag-and-drop parser to sync third-party bookings into the local check-in database.

### 🔄 2. Event Transition Manager
*   Located directly inside the Admin portal.
*   Allows the admin to create new events (Title, Venue, Date, Ticket Price, and Capacity) and click **"Set Active"**.
*   **Zero-Downtime Rotation:** Activating a new event instantly syncs the landing page booking form, changing the ticket price, date, and show title dynamically.

### 🖼️ 3. Dynamic Media Panels
*   **Banners Panel:** Allows uploading new background banner images, titles, subtitles, and descriptions.
*   **Band Members Panel:** Provides interface to add new members, edit names, roles, and portraits.
*   **Gallery Panel:** Dynamic photo upload and deletion panel that renders live on the landing page gallery lightbox grid.

### 📞 4. Social & Contact Integration
*   **Contact Card:** Direct Booking inquiry forms coupled with a booking email card (`bookings@bandshakti.com`).
*   **WhatsApp Integrations:** Embedded floaters and booking triggers routed to **`+91 88979 63589`**.
*   **Instagram Integration:** Link routing directly to the official **[@band_shakthi](https://www.instagram.com/band_shakthi)** profile.

---

## 💻 Local Development Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
3.  **Local Database:** Run `supabase start` (requires Docker running) or connect to your cloud Supabase database in `.env.local`.

---

## 📱 Mobile Network Testing (Local Wi-Fi)

To test the **QR Gate Scanner** on your physical phone using the local server:

1.  **Configure environment:** In your `.env.local`, change your Supabase URL from `127.0.0.1` to your laptop's Wi-Fi network IP:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=http://192.168.1.67:54321
    ```
2.  **Open Firewalls (Linux):** Open TCP port `3000` to allow local device traffic:
    ```bash
    sudo ufw allow 3000/tcp
    ```
3.  **Run Dev Host Binding:** Start Next.js dev server listening to all network interfaces:
    ```bash
    npm run dev -- -H 0.0.0.0
    ```
4.  **Connect on Phone:** Open `http://192.168.1.67:3000/admin` in your phone browser!

---

## 🔑 Git & Repository Management (SSH)
The repository is fully configured to use **SSH keys** for security and credentials persistence:
```bash
# Push latest code to origin main
git push origin main
```
*Repository origin URL:* `git@github.com:akulasathish/Band-shakti.git`
