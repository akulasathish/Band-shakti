import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'Guest Buyer';
  const email = searchParams.get('email') || 'guest@email.com';
  const phone = searchParams.get('phone') || '98765 43210';
  const qty = searchParams.get('qty') || '1';
  const ticketId = searchParams.get('id') || '';

  // 1. Core Event details fallback values
  let eventTitle = 'Band Shakthi Live Concert';
  let eventVenue = 'The DownTown Pub, Ground Stage';
  let eventDateText = 'Next Friday | 8:00 PM Onwards';
  let eventTermsText = '';

  try {
    // 2. Query database to pull exact event details for this specific ticket
    if (ticketId && supabaseUrl) {
      const { data: ticketRecord, error: dbErr } = await supabase
        .from('tickets')
        .select('*, events(title, venue, event_date, terms)')
        .eq('id', ticketId)
        .maybeSingle();

      if (ticketRecord && ticketRecord.events) {
        eventTitle = ticketRecord.events.title || eventTitle;
        eventVenue = ticketRecord.events.venue || eventVenue;
        eventTermsText = ticketRecord.events.terms || '';
        
        try {
          const dateObj = new Date(ticketRecord.events.event_date);
          eventDateText = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          }) + ' Onwards';
        } catch (dateErr) {
          eventDateText = ticketRecord.events.event_date || eventDateText;
        }
      } else {
        // Fallback: If ticket is not found in database yet, fetch the currently active event details
        const { data: actEvent } = await supabase
          .from('events')
          .select('title, venue, event_date, terms')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (actEvent) {
          eventTitle = actEvent.title;
          eventVenue = actEvent.venue;
          eventTermsText = actEvent.terms || '';
          try {
            const dateObj = new Date(actEvent.event_date);
            eventDateText = dateObj.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }) + ' Onwards';
          } catch (e) {
            eventDateText = actEvent.event_date;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch dynamic event details for PDF pass:", err);
  }

  try {
    // 3. Create a PDF Document
    const pdfDoc = await PDFDocument.create();
    
    // Standard Vertical Concert Pass Dimensions (400pt wide, 650pt high)
    const page = pdfDoc.addPage([400, 650]);
    
    // Background Color: Midnight Black (#070709)
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 400,
      height: 650,
      color: rgb(0.027, 0.027, 0.035),
    });

    // Gold Outer Border Frame (#e4a62f)
    page.drawRectangle({
      x: 15,
      y: 15,
      width: 370,
      height: 620,
      borderColor: rgb(0.894, 0.651, 0.184),
      borderWidth: 1.5,
    });

    // Load Helvetica fonts
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // 4. Load and embed the official logo.png from the public directory
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    let logoImage = null;
    try {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await pdfDoc.embedPng(logoBytes);
    } catch (err) {
      console.error("Failed to load logo image file:", err);
    }

    // Draw the Logo centered in the header area (Page width is 400, Logo width is 160)
    if (logoImage) {
      page.drawImage(logoImage, {
        x: 120,
        y: 565,
        width: 160,
        height: 52,
      });
    } else {
      // Fallback text if logo.png is missing
      page.drawText('BAND SHAKTHI', {
        x: 110,
        y: 580,
        size: 20,
        font: helveticaBold,
        color: rgb(0.894, 0.651, 0.184),
      });
    }

    // Pass Type Title centered below the logo
    page.drawText('ENTRY PASS', {
      x: 145,
      y: 535,
      size: 14,
      font: helveticaBold,
      color: rgb(1, 0.32, 0.32),
    });

    // Divider Line 1 (Gold)
    page.drawLine({
      start: { x: 30, y: 515 },
      end: { x: 370, y: 515 },
      color: rgb(0.894, 0.651, 0.184),
      thickness: 1,
    });

    // ── GIG DETAILS ──
    page.drawText('EVENT:', { x: 40, y: 490, size: 9, font: helveticaBold, color: rgb(0.894, 0.651, 0.184) });
    
    // Auto-wrap title if too long to prevent PDF visual clipping
    const titleToDraw = eventTitle.length > 40 ? eventTitle.substring(0, 38) + "..." : eventTitle;
    page.drawText(titleToDraw, { x: 110, y: 490, size: 10, font: helveticaBold, color: rgb(1, 1, 1) });

    page.drawText('VENUE:', { x: 40, y: 465, size: 9, font: helveticaBold, color: rgb(0.894, 0.651, 0.184) });
    const venueToDraw = eventVenue.length > 40 ? eventVenue.substring(0, 38) + "..." : eventVenue;
    page.drawText(venueToDraw, { x: 110, y: 465, size: 10, font: helveticaRegular, color: rgb(0.9, 0.9, 0.9) });

    page.drawText('DATE/TIME:', { x: 40, y: 440, size: 9, font: helveticaBold, color: rgb(0.894, 0.651, 0.184) });
    page.drawText(eventDateText, { x: 110, y: 440, size: 10, font: helveticaRegular, color: rgb(0.9, 0.9, 0.9) });

    // Divider Line 2 (Gold)
    page.drawLine({
      start: { x: 30, y: 420 },
      end: { x: 370, y: 420 },
      color: rgb(0.894, 0.651, 0.184),
      thickness: 1,
    });

    // ── BUYER DETAILS ──
    page.drawText('HOLDER:', { x: 40, y: 395, size: 9, font: helveticaBold, color: rgb(0.894, 0.651, 0.184) });
    page.drawText(name.toUpperCase(), { x: 110, y: 395, size: 11, font: helveticaBold, color: rgb(1, 1, 1) });

    page.drawText('CONTACT:', { x: 40, y: 370, size: 9, font: helveticaBold, color: rgb(0.894, 0.651, 0.184) });
    
    // Auto-truncate extremely long emails to prevent overflow on layout
    const trimmedEmailPhone = `${email.length > 20 ? email.substring(0, 18) + '...' : email} | ${phone}`;
    page.drawText(trimmedEmailPhone, { x: 110, y: 370, size: 9, font: helveticaRegular, color: rgb(0.8, 0.8, 0.8) });

    page.drawText('PASS QTY:', { x: 40, y: 345, size: 9, font: helveticaBold, color: rgb(0.894, 0.651, 0.184) });
    page.drawText(`${qty} PASS(ES)`, { x: 110, y: 345, size: 11, font: helveticaBold, color: rgb(1, 1, 1) });

    // Divider Line 3 (Gold)
    page.drawLine({
      start: { x: 30, y: 325 },
      end: { x: 370, y: 325 },
      color: rgb(0.894, 0.651, 0.184),
      thickness: 1,
    });

    // ── SECURE QR CODE GENERATION ──
    // Points directly to the absolute local or production verification URL
    const finalTicketId = ticketId || 'pass_' + Math.random().toString(36).substring(2, 10);
    const verificationUrl = `${request.headers.get('origin') || 'http://localhost:3000'}/admin?verify=${finalTicketId}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, { 
      width: 300, 
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Embed the base64 QR PNG image
    const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);
    
    // Draw QR Code centered on the lower half
    page.drawImage(qrImage, {
      x: 120,
      y: 120,
      width: 160,
      height: 160,
    });

    // Unique Identifier string
    page.drawText(`TICKET ID: ${finalTicketId}`, {
      x: 40,
      y: 95,
      size: 8,
      font: helveticaRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Warning instructions
    page.drawText('DO NOT SHARE THIS PASS. SCAN AT GATE ENTRY FOR ADMISSION.', {
      x: 40,
      y: 65,
      size: 8,
      font: helveticaBold,
      color: rgb(1, 0.32, 0.32),
    });

    // Branding Footer
    page.drawText('BAND SHAKTHI OFFICIAL © 2026', {
      x: 120,
      y: 40,
      size: 8,
      font: helveticaRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    // ── PAGE 2: TERMS AND CONDITIONS ──
    const page2 = pdfDoc.addPage([400, 650]);
    
    // Background Color: Midnight Black (#070709)
    page2.drawRectangle({
      x: 0,
      y: 0,
      width: 400,
      height: 650,
      color: rgb(0.027, 0.027, 0.035),
    });

    // Gold Outer Border Frame (#e4a62f)
    page2.drawRectangle({
      x: 15,
      y: 15,
      width: 370,
      height: 620,
      borderColor: rgb(0.894, 0.651, 0.184),
      borderWidth: 1.5,
    });

    // Logo on Page 2
    if (logoImage) {
      page2.drawImage(logoImage, {
        x: 140,
        y: 575,
        width: 120,
        height: 39,
      });
    }

    // Title: TERMS & CONDITIONS
    page2.drawText('TERMS & CONDITIONS', {
      x: 120,
      y: 535,
      size: 13,
      font: helveticaBold,
      color: rgb(0.894, 0.651, 0.184),
    });

    // Divider Line
    page2.drawLine({
      start: { x: 30, y: 520 },
      end: { x: 370, y: 520 },
      color: rgb(0.894, 0.651, 0.184),
      thickness: 1,
    });

    // Load active dynamic terms or use premium default guidelines
    let activeTermsList = [];
    if (eventTermsText && eventTermsText.trim().length > 0) {
      activeTermsList = eventTermsText.split('\n').map(t => t.trim()).filter(t => t.length > 0);
    } else {
      activeTermsList = [
        "1. Please carry a valid physical photo ID (e.g. Aadhar, Driving License) for security check-in.",
        "2. Admission is subject to security checks at the main gate. This ticket allows one-time entry only.",
        "3. Tickets once booked are strictly non-refundable, non-transferable, and cannot be resold.",
        "4. Outside food, beverages, alcohol, professional cameras, and hazardous objects are strictly prohibited.",
        "5. The organizers and venue management reserve the absolute right of entry, security screening, and code of conduct."
      ];
    }

    let currentY = 485;
    activeTermsList.forEach((term, index) => {
      // Clean up text
      const cleanTerm = term.replace(/^\d+[\.\s\-]+/, '').trim(); // Remove leading numbers
      const formattedNum = `${index + 1}.  `;
      
      // Word wrapping logic
      const words = cleanTerm.split(' ');
      let currentLineText = formattedNum;
      const lines = [];

      words.forEach(word => {
        const testLine = currentLineText + " " + word;
        const width = helveticaRegular.widthOfTextAtSize(testLine, 8.5);
        if (width > 310) {
          lines.push(currentLineText);
          currentLineText = "    " + word; // Indent wrapped lines
        } else {
          currentLineText = testLine;
        }
      });
      lines.push(currentLineText);

      // Render the wrapped lines on PDF Page 2
      lines.forEach(line => {
        page2.drawText(line, {
          x: 40,
          y: currentY,
          size: 8.5,
          font: helveticaRegular,
          color: rgb(0.85, 0.85, 0.85),
        });
        currentY -= 15;
      });
      currentY -= 10; // Extra spacing between bullet points
    });

    // Page 2 Footer
    page2.drawText('PLEASE READ CAREFULLY. ENJOY THE CONCERT!', {
      x: 85,
      y: 45,
      size: 8,
      font: helveticaBold,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Serialize to bytes
    const pdfBytes = await pdfDoc.save();

    // Return PDF stream directly to browser
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Band_Shakthi_Pass_${name.replace(/\s+/g, '_')}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF generation failed:", error);
    return NextResponse.json({ error: 'Failed to generate PDF entry pass: ' + error.message }, { status: 500 });
  }
}
