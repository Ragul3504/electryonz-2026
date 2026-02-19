// api/register.js
// Vercel Serverless Function
// Handles: Supabase DB insert + Nodemailer email sending

const { createClient } = require('@supabase/supabase-js');
const nodemailer        = require('nodemailer');

// ── Supabase client ──────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Nodemailer transporter ───────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,   // altranz2026@gmail.com
    pass: process.env.MAIL_PASS,   // Gmail App Password (16-char)
  }
});

// ── Main handler ─────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });

  const {
    name, email, phone, college, dept, year,
    events, total, transactionId
  } = req.body;

  // ── 1. Validate required fields ──────────────────────────
  if (!name || !email || !phone || !college || !dept || !year || !events?.length || !transactionId) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  // ── 2. Save to Supabase ──────────────────────────────────
  const { data, error } = await supabase
    .from('registrations')
    .insert([{
      full_name:      name,
      email,
      phone,
      college,
      department:     dept,
      year_of_study:  year,
      events:         events.map(e => e.name),
      total_amount:   total,
      transaction_id: transactionId,
      registered_at:  new Date().toISOString(),
      payment_status: 'pending_verification'
    }])
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ success: false, message: 'Database error. Please try again.' });
  }

  // ── 3. Send confirmation email to participant ────────────
  const eventList = events.map(e => `• ${e.name} — ${e.feeLabel}`).join('\n');

  const participantMail = {
    from:    `"Electryonz 2026" <${process.env.MAIL_USER}>`,
    to:      email,
    subject: '🎉 Registration Confirmed — Electryonz 2026',
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin:0; padding:0; background:#0a0a0a; font-family:'Arial',sans-serif; color:#ccc; }
    .wrapper { max-width:560px; margin:0 auto; }
    .header { background:#111; padding:40px 32px; text-align:center; border-bottom:2px solid #f5c500; }
    .header h1 { font-size:38px; color:#f5c500; letter-spacing:8px; margin:0; }
    .header p  { font-size:12px; color:#666; letter-spacing:4px; margin-top:8px; }
    .body   { padding:36px 32px; background:#111; }
    .body h2 { color:#eee; font-size:22px; margin-top:0; }
    .label   { font-size:11px; color:#f5c500; letter-spacing:3px; text-transform:uppercase; margin-top:20px; }
    .value   { font-size:15px; color:#eee; margin-top:4px; }
    .events-box { background:#0a0a0a; border:1px solid #252525; padding:16px 20px; margin-top:12px; }
    .events-box p { margin:4px 0; font-size:14px; color:#aaa; }
    .total  { display:flex; justify-content:space-between; padding:16px 20px; background:#0a0a0a; border:1px solid #252525; margin-top:12px; }
    .total span:last-child { color:#f5c500; font-size:20px; font-weight:bold; }
    .footer { background:#0a0a0a; padding:24px 32px; text-align:center; }
    .footer p { font-size:12px; color:#444; }
    .badge  { display:inline-block; background:#f5c500; color:#000; font-weight:bold; font-size:11px; letter-spacing:2px; padding:4px 12px; margin-top:12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>ELECTRYONZ</h1>
      <p>⚡ 2026 ⚡ ANNUAL FEST</p>
    </div>
    <div class="body">
      <h2>You're Registered! 🎉</h2>
      <p style="color:#888;font-size:14px;line-height:1.6;">
        Hey <strong style="color:#eee">${name}</strong>, your registration for 
        <strong style="color:#f5c500">Electryonz 2026</strong> has been received.
        Our team will verify your payment and confirm your slot.
      </p>

      <div class="label">Participant Details</div>
      <div class="value">${name}</div>
      <div class="value" style="font-size:13px;color:#888;">${college} &nbsp;|&nbsp; ${dept} &nbsp;|&nbsp; Year ${year}</div>

      <div class="label">Selected Events</div>
      <div class="events-box">
        ${events.map(e => `<p>✦ ${e.name}</p>`).join('')}
      </div>

      <div class="total">
        <span style="color:#888;font-size:13px;">Total Paid</span>
        <span>₹${total}</span>
      </div>

      <div class="label">Transaction ID</div>
      <div class="value">${transactionId}</div>

      <div style="margin-top:28px;padding:16px;background:rgba(245,197,0,0.06);border:1px solid #f5c500;font-size:13px;color:#aaa;line-height:1.7;">
        ⚡ Your payment is under verification. Once confirmed, you'll receive your event pass via email.<br><br>
        For queries, contact us at <a href="mailto:altranz2026@gmail.com" style="color:#f5c500;">altranz2026@gmail.com</a>
      </div>
    </div>
    <div class="footer">
      <div class="badge">ELECTRYONZ 2026</div>
      <p style="margin-top:12px;">© 2026 Electryonz Fest. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `
  };

  // ── 4. Send notification to organizer ───────────────────
  const organizerMail = {
    from:    `"Electryonz 2026 Bot" <${process.env.MAIL_USER}>`,
    to:      'altranz2026@gmail.com',
    subject: `🆕 New Registration — ${name}`,
    text: `
New Registration Received
─────────────────────────
Name:     ${name}
Email:    ${email}
Phone:    ${phone}
College:  ${college}
Dept:     ${dept} | Year ${year}
Events:   ${events.map(e => e.name).join(', ')}
Amount:   ₹${total}
TxID:     ${transactionId}
Time:     ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
─────────────────────────
Verify payment and update status in Supabase dashboard.
    `
  };

  try {
    await transporter.sendMail(participantMail);
    await transporter.sendMail(organizerMail);
  } catch (mailErr) {
    console.error('Mail error:', mailErr);
    // Don't fail the registration if mail fails — data is already saved
  }

  return res.status(200).json({
    success: true,
    message: 'Registration successful! Check your email for confirmation.',
    id: data[0]?.id
  });
};
