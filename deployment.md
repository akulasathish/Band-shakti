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
