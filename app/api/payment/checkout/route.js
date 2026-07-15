import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client with service role to securely insert database records
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, quantity, eventId, payableAmount } = body;

    if (!name || !email || !phone || !quantity || !eventId || !payableAmount) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
    }

    // Determine Instamojo endpoint host based on env setting
    const isProd = process.env.INSTAMOJO_ENV === 'production';
    const instamojoHost = isProd 
      ? 'https://www.instamojo.com/api/1.1' 
      : 'https://test.instamojo.com/api/1.1';

    const apiKey = process.env.INSTAMOJO_API_KEY;
    const authToken = process.env.INSTAMOJO_AUTH_TOKEN;

    // Default to a simulation mode if keys are not defined, so development never breaks
    if (!apiKey || !authToken) {
      console.warn("Instamojo API credentials not found. Simulating payment request...");
      
      // Save ticket in database as PENDING locally
      const { data: ticket, error: dbErr } = await supabase
        .from('tickets')
        .insert({
          event_id: eventId,
          buyer_name: name,
          buyer_email: email,
          buyer_phone: phone,
          pax: parseInt(quantity),
          ticket_type: 'ONLINE',
          status: 'PENDING',
          payment_request_id: 'SIMULATED_' + Date.now()
        })
        .select('id, payment_request_id')
        .single();

      if (dbErr) throw dbErr;

      const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
      const mockPayUrl = `${websiteUrl}/api/payment/verify?payment_request_id=${ticket.payment_request_id}&payment_id=MOJO_MOCK_${Date.now()}`;

      return NextResponse.json({ 
        success: true, 
        simulated: true,
        paymentUrl: mockPayUrl 
      });
    }

    // Call real Instamojo API to generate secure payment request
    const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
    const redirectUrl = `${websiteUrl}/api/payment/verify`;

    const formData = new URLSearchParams();
    formData.append('purpose', `Passes for Band Shakthi Live Concert`);
    formData.append('amount', parseFloat(payableAmount).toFixed(2));
    formData.append('buyer_name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('redirect_url', redirectUrl);
    formData.append('send_email', 'false');
    formData.append('send_sms', 'false');

    const res = await fetch(`${instamojoHost}/payment-requests/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Api-Key': apiKey,
        'X-Auth-Token': authToken
      },
      body: formData.toString()
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error("Instamojo API Error Response:", data);
      return NextResponse.json({ error: 'Failed to communicate with Instamojo gateway: ' + JSON.stringify(data) }, { status: 502 });
    }

    const paymentRequest = data.payment_request;

    // Create database entry with status PENDING and the unique payment_request_id
    const { error: dbErr } = await supabase
      .from('tickets')
      .insert({
        event_id: eventId,
        buyer_name: name,
        buyer_email: email,
        buyer_phone: phone,
        pax: parseInt(quantity),
        ticket_type: 'ONLINE',
        status: 'PENDING',
        payment_request_id: paymentRequest.id
      });

    if (dbErr) throw dbErr;

    return NextResponse.json({ 
      success: true, 
      paymentUrl: paymentRequest.longurl 
    });

  } catch (error) {
    console.error("Checkout initiation server error:", error);
    return NextResponse.json({ error: 'Internal server error processing checkout: ' + error.message }, { status: 500 });
  }
}
