import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'Guest Buyer';
  const email = searchParams.get('email') || 'guest@email.com';
  const phone = searchParams.get('phone') || '98765 43210';
  const qty = searchParams.get('qty') || '1';
  const ticketId = searchParams.get('id') || 'pass_' + Math.random().toString(36).substring(2, 10);

  try {
    // 1. Create a PDF Document
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

    // Draw header banner solid gold block
    page.drawRectangle({
      x: 30,
      y: 570,
      width: 340,
      height: 44,
      color: rgb(0.894, 0.651, 0.184),
    });

    // Draw Header text in black inside gold banner
    page.drawText('BAND SHAKTHI', {
      x: 95,
      y: 584,
      size: 20,
      font: helveticaBold,
      color: rgb(0.027, 0.027, 0.035),
    });

    // Draw logo accent red dot
    page.drawCircle({
      x: 295,
      y: 593,
      radius: 4,
      color: rgb(1, 0.2, 0.2),
    });

    // Pass Type Title centered below header block
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
    page.drawText('Band Shakthi Live — Jam Arena Show', { x: 110, y: 490, size: 10, font: helveticaBold, color: rgb(1, 1, 1) });

    page.drawText('VENUE:', { x: 40, y: 465, size: 9, font: helveticaBold, color: rgb(0.894, 0.651, 0.184) });
    page.drawText('The DownTown Pub, Ground Stage', { x: 110, y: 465, size: 10, font: helveticaRegular, color: rgb(0.9, 0.9, 0.9) });

    page.drawText('DATE/TIME:', { x: 40, y: 440, size: 9, font: helveticaBold, color: rgb(0.894, 0.651, 0.184) });
    page.drawText('Next Friday | 8:00 PM Onwards', { x: 110, y: 440, size: 10, font: helveticaRegular, color: rgb(0.9, 0.9, 0.9) });

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
    page.drawText(`${email} | ${phone}`, { x: 110, y: 370, size: 9, font: helveticaRegular, color: rgb(0.8, 0.8, 0.8) });

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
    // Points directly to the admin gate verification portal
    const verificationUrl = `http://127.0.0.1:3000/admin?verify=${ticketId}`;
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
    page.drawText(`TICKET ID: ${ticketId}`, {
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
    page.drawText('JAM ARENA PRODUCTIONS © 2026', {
      x: 120,
      y: 40,
      size: 8,
      font: helveticaRegular,
      color: rgb(0.4, 0.4, 0.4),
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
