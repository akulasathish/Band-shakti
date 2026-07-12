# Deployment & Configuration Guide — Band Shakti

This guide details the step-by-step setup required to connect the database, payment gateways, file storage, and deploy the application to production.

---

## 🏁 Step 1: Database Setup (Supabase)

1.  **Create a Project:**
    *   Sign up at [supabase.com](https://supabase.com) (free).
    *   Create a new project named `Band-shakti`. Set a strong database password and choose your nearest region.
2.  **Run SQL Schemas:**
    *   Navigate to the **SQL Editor** tab in the left sidebar.
    *   Click **New Query**.
    *   Copy and paste the database schemas provided in [techstack.md](file:///home/sathish/Desktop/projects/Band-shakti/techstack.md) and click **Run**.
3.  **Configure Storage Buckets:**
    *   Go to the **Storage** tab in Supabase.
    *   Create a new bucket named `gallery`.
    *   Toggle the **Public** option to `ON` (so image URLs can be accessed by the website).
    *   Create a bucket named `tickets` (keep this **Private** for storing PDFs securely).

---

## 💳 Step 2: Payment Gateway Setup (Instamojo)

1.  Create or log in to your dashboard:
    *   For **Testing (Sandbox):** Sign up at [test.instamojo.com](https://test.instamojo.com).
    *   For **Live Mode:** Sign up at [instamojo.com](https://www.instamojo.com).
2.  Complete your KYC onboarding as an **"Individual"** (uses your personal PAN and savings bank account).
3.  Go to **API & Plugins** (or Developer Settings) in the dashboard.
4.  Copy the following values:
    *   `Private API Key`
    *   `Private Auth Token`
    *   `Private Salt`

---

## 📧 Step 3: Email SMTP Setup (Resend / SendGrid / Google)

To send the ticket emails, you need an SMTP account. 
*   **Google Workspace / Gmail (Simplest):** Create an **App Password** for your account.
*   **Resend (Recommended):** Register at [resend.com](https://resend.com) (free tier allows 3,000 emails/month). Copy the API Key.

---

## 🔒 Step 4: Environment Variables (`.env.local`)

Create a file named `.env.local` in the root folder of your local project. Fill in the keys you gathered above:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Instamojo Configuration
INSTAMOJO_API_KEY=api_key_xxxxxxxxxxxxxxxxxxxxxxxx
INSTAMOJO_AUTH_TOKEN=auth_token_yyyyyyyyyyyyyyyyyy
INSTAMOJO_SALT=salt_zzzzzzzzzzzzzzzzzzzzzzzz
# Use "https://test.instamojo.com/api/1.1/" for Sandbox Testing
# Use "https://www.instamojo.com/api/1.1/" for Production Live Mode
INSTAMOJO_API_URL=https://test.instamojo.com/api/1.1/

# Email SMTP / Resend Configuration
EMAIL_HOST=smtp.resend.com
EMAIL_PORT=465
EMAIL_USER=resend
EMAIL_PASS=re_abcdef123456789
EMAIL_FROM=booking@bandshakti.com
```

---

## 🚀 Step 5: Hosting & Deployment (Vercel or Netlify)

Next.js apps are easiest to deploy to **Vercel** or **Netlify** (both platforms are completely free for personal/small business projects).

### Option A: Deploying on Vercel (Recommended)
1.  Push your code to your GitHub/GitLab repository.
2.  Log in to [vercel.com](https://vercel.com) and click **Add New Project**.
3.  Import your `Band-shakti` repository.
4.  Expand the **Environment Variables** section and copy-paste all keys from your `.env.local`.
5.  Click **Deploy**. Vercel will build the application and provide you with a production-ready, SSL-secured `https://...` URL.

### Option B: Deploying on Netlify
1.  Log in to [netlify.com](https://netlify.com) and click **Add new site** -> **Import from Git**.
2.  Choose your repository.
3.  Go to **Site settings** -> **Environment variables** -> **Add value** and input your keys.
4.  Trigger a manual deploy.

---

## 📱 Step 6: Local Wi-Fi Network Testing

To load the website and use the physical back camera of your mobile phone to scan tickets, follow these configuration overrides:

1.  **Find Laptop IP:** Locate your active local IP on your network (e.g., `192.168.1.67`).
2.  **Update `.env.local`:** Change the Supabase URL so client browser JS loaded on your phone points back to the laptop database server:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=http://<your-laptop-ip>:54321
    ```
3.  **Open UFW Firewall (Linux):** Let incoming TCP traffic connect to port `3000`:
    ```bash
    sudo ufw allow 3000/tcp
    ```
4.  **Launch Dev Server:** Bind Next.js to all external network addresses:
    ```bash
    npm run dev -- -H 0.0.0.0
    ```
5.  **Access on Phone:** Open `http://<your-laptop-ip>:3000/admin` on your mobile browser.

---

## 🔄 Step 7: Supabase Project Transfer (Organization Migration)

To transfer ownership of a Supabase project from your account to another owner/billing manager with **zero downtime**:

1.  **Invite target account:** In the Supabase dashboard, go to **Organization Settings** > **Members** > **Invite**. Invite the target owner's email address as an **Owner** or **Administrator**.
2.  **Accept invite:** The target owner accepts the email invitation and logs in.
3.  **Transfer project:** In your project settings, go to **Project Settings** > **General** > scroll to **Danger Zone** > click **Transfer Project**. Select the target owner's personal organization.
4.  **Confirm:** Once transferred, the project shifts to their billing/administration portal and **instantly disappears** from your dashboard.

