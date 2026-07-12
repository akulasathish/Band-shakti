# Technical Stack & Architecture — Band Shakti

This document defines the software stack, database schemas, and integration flows for the Band Shakti web application.

---

## 🛠️ The Tech Stack

### 1. Frontend & Backend Framework: Next.js (React)
*   **Version:** Latest (v14+) using the **App Router**.
*   **Routing:** Server-rendered routes for public pages (Home, Gallery, Contact) to ensure excellent SEO, and API routes (`/app/api/...`) for payment verification and scanning endpoints.
*   **Language:** JavaScript (ES6+).
*   **Styling:** **Vanilla CSS**. We will use a central design system defined via CSS variables in `styles/globals.css` (custom neon color tokens, layout spacing, transitions, and glassmorphic card utilities).

### 2. Database & Cloud Storage: Supabase (PostgreSQL)
*   **Database:** A relational Postgres database is used to handle real-time ticket sales safely, prevent double bookings, and manage QR codes.
*   **Storage:** Supabase Storage bucket for storing and hosting event banner images, band profile pictures, and gallery concert photos.
*   **Authentication:** Supabase Auth for protecting the `/admin` dashboard.

### 3. Payment Gateway: Instamojo API
*   **Client Integration:** Booking form triggers a backend request to create a payment request. The client redirects the user to Instamojo's secure payment screen.
*   **Backend Integration:** Verification API route (Redirect landing URL) to read the payment parameters returned by Instamojo, verify the status, and write to the database.

### 4. Ticket Generation & QR Engine
*   **PDF Compiler:** `pdf-lib` to overlay the ticket information (name, date, price) and custom QR code on top of a physical ticket graphic.
*   **QR Generator:** `qrcode` npm library to render the secure validation endpoint url into a high-res PNG stream.

### 5. Email Delivery: Nodemailer or Resend
*   Sends transactions emails with the compiled PDF ticket attached instantly upon verification.

---

## 🗄️ Database Schemas (PostgreSQL)

We will define three main tables in Supabase:

### 1. `events`
Stores details of specific live concerts.
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue VARCHAR(255) NOT NULL,
  ticket_price NUMERIC(10, 2) NOT NULL,
  total_capacity INTEGER NOT NULL,
  tickets_sold INTEGER DEFAULT 0,
  banner_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. `tickets`
Stores online purchases and offline activations.
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(50),
  ticket_type VARCHAR(50) DEFAULT 'ONLINE', -- 'ONLINE' or 'OFFLINE_GUEST'
  status VARCHAR(50) DEFAULT 'PENDING',    -- 'PENDING', 'PAID', 'CANCELLED', 'PENDING_ACTIVATION', 'ACTIVE'
  payment_id VARCHAR(255),                  -- Instamojo Payment ID
  payment_request_id VARCHAR(255),          -- Instamojo Payment Request ID
  scanned BOOLEAN DEFAULT false,
  scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. `gallery_assets`
Manages the image and video links.
```sql
CREATE TABLE gallery_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,                -- 'IMAGE' or 'VIDEO'
  url TEXT NOT NULL,
  description VARCHAR(255),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Security |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/checkout` | Initiates Instamojo payment request, returns the `longurl` payment page link. | Public |
| **GET** | `/api/verify-payment` | Redirect callback page. Inspects query params (payment_id, payment_request_id), verifies status, generates ticket, and renders success page. | Public |
| **POST** | `/api/admin/scan` | Entrance scanner endpoint. Verifies QR code, marks ticket as used. | Authenticated |
| **POST** | `/api/admin/activate` | Point of Sale scanner endpoint. Activates offline pre-printed QR. | Authenticated |
| **POST** | `/api/admin/upload` | Uploads files to Supabase Storage and inserts URLs in database. | Authenticated |
