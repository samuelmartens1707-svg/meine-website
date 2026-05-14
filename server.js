require('dotenv').config();
const express = require('express');
const path    = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use('/website', express.static(__dirname));
app.use(express.static(__dirname));

// ── Mailer ──
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── API: E-Mail senden ──
app.post('/api/send-email', async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) return res.status(400).json({ error: 'Fehlende Felder' });
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(503).json({ error: 'SMTP nicht konfiguriert — bitte .env ausfüllen' });
  }
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'Sam'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── API: Calendly-Termine ──
app.get('/api/calendly/events', async (req, res) => {
  const token = process.env.CALENDLY_TOKEN;
  if (!token) return res.json({ configured: false });

  try {
    const userRes = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userData = await userRes.json();
    const userUri  = userData.resource?.uri;
    if (!userUri) return res.status(500).json({ error: 'Kein User-URI' });

    const eventsRes = await fetch(
      `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&count=30&sort=start_time:desc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const eventsData = await eventsRes.json();
    const events = eventsData.collection || [];

    const eventsWithInvitees = await Promise.all(
      events.slice(0, 25).map(async event => {
        const uuid = event.uri.split('/').pop();
        try {
          const invRes  = await fetch(
            `https://api.calendly.com/scheduled_events/${uuid}/invitees`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const invData = await invRes.json();
          return { ...event, invitees: invData.collection || [] };
        } catch {
          return { ...event, invitees: [] };
        }
      })
    );

    res.json({ configured: true, events: eventsWithInvitees });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Fallback ──
app.get('*', (req, res) => {
  const host = req.hostname;
  if (host === 'backend.sammartens.de') {
    return res.sendFile(path.join(__dirname, 'admin.html'));
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000);
