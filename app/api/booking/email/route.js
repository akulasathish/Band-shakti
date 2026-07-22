import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticketId, name, email, phone, qty, eventTitle, eventVenue, eventDate } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email address is required for dispatch.' }, { status: 400 });
    }

    console.log(`[Email Dispatcher] Initiating automated booking pass delivery for ${name} (${email})...`);

    let finalTitle = eventTitle || 'Band Shakthi Live Concert';
    let finalVenue = eventVenue || 'The DownTown Pub, Ground Stage';
    let finalDateText = eventDate || 'Upcoming Show';

    // Dynamically query database for exact event details if ticketId is provided
    if (supabaseUrl) {
      try {
        let eventToUse = null;

        if (ticketId) {
          const { data: ticketRecord } = await supabase
            .from('tickets')
            .select('event_id')
            .eq('id', ticketId)
            .maybeSingle();

          if (ticketRecord?.event_id) {
            const { data: evt } = await supabase
              .from('events')
              .select('title, venue, event_date')
              .eq('id', ticketRecord.event_id)
              .maybeSingle();
            if (evt) eventToUse = evt;
          }
        }

        if (!eventToUse) {
          const { data: activeEvt } = await supabase
            .from('events')
            .select('title, venue, event_date')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (activeEvt) eventToUse = activeEvt;
        }

        if (eventToUse) {
          finalTitle = eventToUse.title || finalTitle;
          finalVenue = eventToUse.venue || finalVenue;
          if (eventToUse.event_date) {
            try {
              const d = new Date(eventToUse.event_date);
              finalDateText = d.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) + ' Onwards';
            } catch (_) {
              finalDateText = eventToUse.event_date;
            }
          }
        }
      } catch (err) {
        console.error("[Email Dispatcher] Error fetching dynamic event details:", err);
      }
    } else if (finalDateText && !isNaN(Date.parse(finalDateText))) {
      try {
        const d = new Date(finalDateText);
        finalDateText = d.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }) + ' Onwards';
      } catch (_) {}
    }

    // Fetch SMTP Configuration variables
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '465');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const from = process.env.EMAIL_FROM || 'booking@bandshakti.com';
    const websiteUrl = process.env.WEBSITE_URL || 'https://bandshakthi.com';

    const ticketDownloadUrl = `${websiteUrl}/api/booking/ticket?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&qty=${qty}&id=${ticketId}`;

    // Elegant and premium HTML email structure
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

    // Verify if SMTP parameters exist
    if (!host || !user || !pass) {
      console.warn("[Email Dispatcher] SMTP credentials missing in environment variables. Simulated email dispatch succeeded (Logged layout in console).");
      return NextResponse.json({ 
        success: true, 
        simulated: true, 
        message: 'Email parameters omitted. Fallback simulator logged success payload successfully.' 
      });
    }

    // Create Transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    // Send Mail
    await transporter.sendMail({
      from,
      to: email,
      subject: `Your Booking Pass | ${finalTitle} — Band Shakthi`,
      text: `Hi ${name}! Your entry pass is ready. Please download your PDF pass here: ${ticketDownloadUrl}`,
      html: htmlTemplate
    });

    console.log(`[Email Dispatcher] Automated entry pass successfully dispatched to ${email}`);
    return NextResponse.json({ success: true, message: 'Official entry pass successfully emailed to guest!' });

  } catch (err) {
    console.error("[Email Dispatcher] Failed to process email delivery:", err);
    return NextResponse.json({ error: 'Email service failed: ' + err.message }, { status: 500 });
  }
}
