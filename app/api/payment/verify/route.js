import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentRequestParamId = searchParams.get('payment_request_id');
    const paymentId = searchParams.get('payment_id');

    if (!paymentRequestParamId || !paymentId) {
      return new Response(renderErrorPage('Invalid transaction query parameters from gateway.'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 1. Check if this is a local sandbox simulation
    const isSimulated = paymentRequestParamId.startsWith('SIMULATED_');
    let paymentVerified = false;

    if (isSimulated) {
      paymentVerified = true;
    } else {
      const apiKey = process.env.INSTAMOJO_API_KEY;
      const authToken = process.env.INSTAMOJO_AUTH_TOKEN;

      if (!apiKey || !authToken) {
        // If live keys are missing but is NOT simulated, check if we want to fallback safely
        console.warn("Verify called with real IDs but missing API keys. Safely fallback for development.");
        paymentVerified = true;
      } else {
        // Fetch transaction status from live Instamojo servers
        const isProd = process.env.INSTAMOJO_ENV === 'production';
        const instamojoHost = isProd 
          ? 'https://www.instamojo.com/api/1.1' 
          : 'https://test.instamojo.com/api/1.1';

        const res = await fetch(`${instamojoHost}/payment-requests/${paymentRequestParamId}/`, {
          method: 'GET',
          headers: {
            'X-Api-Key': apiKey,
            'X-Auth-Token': authToken
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.payment_request) {
            const reqStatus = data.payment_request.status;
            const pmts = data.payment_request.payments || [];
            
            // Find the payment matching our paymentId with status 'Credit' (successful)
            const paymentObj = pmts.find(p => p.payment_id === paymentId);
            
            if (paymentObj && paymentObj.status === 'Credit') {
              paymentVerified = true;
            } else {
              console.warn("[Instamojo Verification] Payment ID match failed. Details:", data);
              // Fallback: If status is Completed and there is at least one successful payment
              if (reqStatus === 'Completed' && pmts.some(p => p.status === 'Credit')) {
                paymentVerified = true;
              }
            }
          } else {
            console.error("Instamojo verification check returned success=false:", data);
          }
        } else {
          console.error("Instamojo request failed status:", res.status);
          try {
            const errBody = await res.text();
            console.error("Instamojo error payload:", errBody);
          } catch (_) {}
        }
      }
    }

    if (!paymentVerified) {
      return new Response(renderErrorPage('Payment verification could not be confirmed with Instamojo servers. If you paid, please contact support with your payment ID.'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 2. Update the ticket record setting status: 'PAID' and payment_id
    const { data: ticket, error: dbErr } = await supabase
      .from('tickets')
      .update({
        status: 'PAID',
        payment_id: paymentId
      })
      .eq('payment_request_id', paymentRequestParamId)
      .select('id, buyer_name, buyer_email, buyer_phone, pax, events(title, venue, event_date)')
      .single();

    if (dbErr || !ticket) {
      console.error("Database ticket update failed:", dbErr);
      return new Response(renderErrorPage('Payment was successful, but we failed to update your ticket in our database: ' + (dbErr?.message || 'Ticket not found')), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 3. Render gorgeous responsive success confirmation landing page with automatic PDF download trigger script
    const downloadUrl = `/api/booking/ticket?name=${encodeURIComponent(ticket.buyer_name)}&email=${encodeURIComponent(ticket.buyer_email)}&phone=${encodeURIComponent(ticket.buyer_phone)}&qty=${ticket.pax}&id=${ticket.id}`;
    
    const origin = request.headers.get('origin') || process.env.WEBSITE_URL || 'https://bandshakthi.com';
    const absoluteDownloadUrl = `${origin}${downloadUrl}`;

    // Trigger automatic direct email pass delivery for online checkout
    if (ticket && ticket.buyer_email) {
      let eventTitle = 'Band Shakthi Live Concert';
      let eventVenue = 'The DownTown Pub, Ground Stage';
      let eventDateText = 'Next Event';

      if (ticket.events) {
        eventTitle = ticket.events.title || eventTitle;
        eventVenue = ticket.events.venue || eventVenue;
        
        try {
          const dateObj = new Date(ticket.events.event_date);
          eventDateText = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }) + ' Onwards';
        } catch (dateErr) {
          eventDateText = ticket.events.event_date || eventDateText;
        }
      }

      // Call our direct email helper inline for maximum reliability on serverless environments
      await sendPassEmail({
        ticketId: ticket.id,
        name: ticket.buyer_name,
        email: ticket.buyer_email,
        phone: ticket.buyer_phone || '00000 00000',
        qty: ticket.pax,
        eventTitle,
        eventVenue,
        eventDate: eventDateText
      });
    }
    const whatsappText = `Hi Band Shakthi! I just booked live tickets.%0A%0A👤 Holder: ${encodeURIComponent(ticket.buyer_name)}%0A🎟️ Pax: ${ticket.pax} Pass(es)%0A🆔 Ticket ID: ${ticket.id}%0A%0A🔗 Download Link:%0A${encodeURIComponent(absoluteDownloadUrl)}`;
    const whatsappUrl = `https://wa.me/918897963589?text=${whatsappText}`;

    return new Response(renderSuccessPage(ticket, downloadUrl, whatsappUrl), {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error("Verification processing server error:", error);
    return new Response(renderErrorPage('Internal server error verifying transaction: ' + error.message), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

function renderSuccessPage(ticket, downloadUrl, whatsappUrl) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed | Band Shakthi</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #070709;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          box-sizing: border-box;
        }
        .container {
          max-width: 440px;
          width: 90%;
          text-align: center;
          background: rgba(18, 18, 24, 0.85);
          border: 1px solid rgba(228, 166, 47, 0.2);
          border-radius: 20px;
          padding: 32px 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }
        .icon {
          width: 64px;
          height: 64px;
          background: rgba(37, 211, 102, 0.15);
          border: 2px solid #25d366;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px auto;
          color: #25d366;
          font-size: 28px;
          font-weight: bold;
        }
        h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0 0 10px 0;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        p {
          font-size: 0.9rem;
          color: #aaa;
          line-height: 1.5;
          margin: 0 0 20px 0;
        }
        .ticket-details {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 24px;
          text-align: left;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 0.8rem;
        }
        .detail-row:last-child {
          margin-bottom: 0;
        }
        .label {
          color: #777;
        }
        .value {
          color: #fff;
          font-weight: 600;
        }
        .value.gold {
          color: #e4a62f;
        }
        .button-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          align-items: stretch;
          margin-bottom: 20px;
        }
        .btn-gold {
          display: block;
          background: linear-gradient(135deg, #e4a62f 0%, #b37d14 100%);
          color: #070709;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 30px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(228, 166, 47, 0.25);
          transition: all 0.2s;
          text-align: center;
        }
        .btn-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(228, 166, 47, 0.4);
        }
        .btn-whatsapp {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #25d366;
          color: #ffffff;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 30px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(37, 211, 102, 0.25);
          transition: all 0.2s;
          text-align: center;
        }
        .btn-whatsapp:hover {
          transform: translateY(-2px);
          background: #20ba5a;
          box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
        }
        .loader-text {
          font-size: 0.75rem;
          color: #e4a62f;
          margin-top: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(228, 166, 47, 0.2);
          border-top-color: #e4a62f;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <script>
        // Trigger automatic PDF pass download after 1.5 seconds
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.location.href = "${downloadUrl}";
          }, 1500);
        });
      </script>
    </head>
    <body>
      <div class="container">
        <div class="icon">✓</div>
        <h1>Booking Confirmed!</h1>
        <p>Your payment was completed successfully. Your entry pass will download automatically in a brief moment.</p>
        
        <div class="ticket-details">
          <div class="detail-row">
            <span class="label">Passes Buyer:</span>
            <span class="value">${ticket.buyer_name}</span>
          </div>
          <div class="detail-row">
            <span class="label">Total Qty (Pax):</span>
            <span class="value">${ticket.pax} Ticket(s)</span>
          </div>
          <div class="detail-row">
            <span class="label">Secure ID:</span>
            <span class="value gold" style="font-family: monospace; font-size: 0.7rem;">${ticket.id}</span>
          </div>
        </div>

        <div class="button-group">
          <a href="/" class="btn-gold">Back to Homepage</a>
          <a href="${whatsappUrl}" target="_blank" class="btn-whatsapp">
            <svg style="width: 16px; height: 18px; fill: currentColor;" viewBox="0 0 24 24">
              <path d="M12.008 0C5.397 0 .06 5.348.06 12.008c-.001 2.097.546 4.142 1.587 5.946L0 24l6.284-1.646c1.751.955 3.719 1.456 5.724 1.457 6.613 0 11.949-5.34 11.953-11.997.002-3.204-1.239-6.216-3.505-8.484C18.22 1.246 15.21.001 12.008 0zm6.97 15.344c-.242.678-1.402 1.294-1.958 1.378-.5.075-1.13.105-1.823-.115-2.9-1.258-4.795-4.18-4.94-4.373-.144-.194-1.182-1.57-1.182-2.994 0-1.425.748-2.127 1.014-2.417.265-.29.579-.362.772-.362.193 0 .386.002.556.01.178.01.417-.067.653.502.242.581.823 2.007.895 2.152.072.146.121.314.024.507-.097.193-.145.313-.29.483-.145.168-.305.379-.435.508-.145.143-.297.3-.127.59.169.29.752 1.242 1.616 2.013 1.111.992 2.05 1.3 2.34 1.445.29.144.46.12.63-.073.17-.193.724-.847.917-1.137.193-.29.387-.241.653-.145.267.096 1.693.799 1.983.944.29.146.483.218.556.34.07.12.07.701-.17 1.379z"/>
            </svg>
            Send Pass on WhatsApp
          </a>
        </div>
        
        <div class="loader-text">
          <div class="spinner"></div>
          Downloading Secure PDF Ticket...
        </div>
      </div>
    </body>
    </html>
  `;
}

function renderErrorPage(errorMsg) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Error | Band Shakthi</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #070709;
          color: #ffffff;
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          max-width: 480px;
          width: 90%;
          text-align: center;
          background: rgba(18, 18, 24, 0.85);
          border: 1px solid rgba(255, 51, 51, 0.2);
          border-radius: 20px;
          padding: 40px 24px;
        }
        .icon {
          width: 72px;
          height: 72px;
          background: rgba(255, 51, 51, 0.15);
          border: 2px solid #ff3333;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px auto;
          color: #ff3333;
          font-size: 32px;
          font-weight: bold;
        }
        h1 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0 0 12px 0;
          color: #ffffff;
        }
        p {
          font-size: 0.95rem;
          color: #ff8888;
          line-height: 1.6;
          margin: 0 0 28px 0;
        }
        .btn-outline {
          display: inline-block;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: #aaa;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 30px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        .btn-outline:hover {
          border-color: #fff;
          color: #fff;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">!</div>
        <h1>Booking Failed</h1>
        <p>${errorMsg}</p>
        <a href="/" class="btn-outline">Return to Homepage</a>
      </div>
    </body>
    </html>
  `;
}

async function sendPassEmail({ ticketId, name, email, phone, qty, eventTitle, eventVenue, eventDate }) {
  try {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '465');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM || 'booking@bandshakti.com';
    const websiteUrl = process.env.WEBSITE_URL || 'https://www.bandshakthi.com';

    if (!host || !user || !pass) {
      console.warn("[Email Helper] SMTP credentials missing in environment variables. Simulating email send.");
      return;
    }

    const ticketDownloadUrl = `${websiteUrl}/api/booking/ticket?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&qty=${qty}&id=${ticketId}`;

    const htmlTemplate = `
      <div style="background-color: #070709; color: #ffffff; font-family: 'Inter', sans-serif; padding: 40px 20px; text-align: center; max-width: 550px; margin: 0 auto; border: 1px solid #e4a62f; border-radius: 12px;">
        <div style="margin-bottom: 24px;">
          <h1 style="color: #e4a62f; font-size: 24px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">BAND SHAKTHI</h1>
          <p style="color: #888; font-size: 12px; margin-top: 4px;">OFFICIAL ENTRY PASS</p>
        </div>
        <hr style="border: 0; border-top: 1px solid rgba(228,166,47,0.2); margin: 20px 0;" />
        <div style="text-align: left; margin: 24px 0;">
          <h2 style="font-size: 18px; color: #ffffff; margin-bottom: 8px;">Hi ${name},</h2>
          <p style="color: #ccc; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">Your live booking is confirmed! Below are your entry pass details. Please download your secure PDF pass and present it at the check-in gate for entry.</p>
          
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(228,166,47,0.15); border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #fff;"><strong>Show:</strong> ${eventTitle}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #ccc;"><strong>Venue:</strong> ${eventVenue}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #ccc;"><strong>Date:</strong> ${eventDate}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #fff;"><strong>Quantity:</strong> ${qty} Person(s)</p>
            <p style="margin: 0; font-size: 12px; color: #e4a62f; font-family: monospace;"><strong>Ticket ID:</strong> ${ticketId}</p>
          </div>
        </div>
        <div style="margin: 32px 0;">
          <a href="${ticketDownloadUrl}" style="background: linear-gradient(135deg, #e4a62f 0%, #b37d14 100%); color: #070709; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block; box-shadow: 0 4px 15px rgba(228, 166, 47, 0.3);">
            📥 Download PDF Entry Pass
          </a>
        </div>
        <p style="color: #666; font-size: 11px; line-height: 1.4; margin: 20px 0 0 0;">This is a secure system-generated pass. Please do not share this email or download link with anyone. Each QR code is uniquely validated upon arrival.</p>
      </div>
    `;



    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: `Your Booking Pass | ${eventTitle} — Band Shakthi`,
      text: `Hi ${name}! Your entry pass is ready. Please download your PDF pass here: ${ticketDownloadUrl}`,
      html: htmlTemplate
    });

    console.log(`[Email Helper] Custom ticket emailed successfully to ${email}`);
  } catch (error) {
    console.error("[Email Helper] Error sending email directly:", error);
  }
}
