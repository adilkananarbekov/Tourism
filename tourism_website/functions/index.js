const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

function getSmtpConfig() {
  const config = functions.config();
  if (!config.smtp || !config.smtp.host || !config.smtp.user || !config.smtp.pass) {
    return null;
  }
  return {
    host: config.smtp.host,
    port: Number(config.smtp.port || 587),
    secure: config.smtp.secure === 'true',
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    from: config.smtp.from || config.smtp.user,
    adminEmail: (config.notifications && config.notifications.admin_email) || config.smtp.user,
  };
}

function buildTransporter(smtp) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });
}

exports.notifyBookingCreated = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const smtp = getSmtpConfig();
    if (!smtp) {
      console.log('SMTP config is missing. Skipping booking email.');
      return null;
    }

    const transporter = buildTransporter(smtp);
    const subject = `Booking received: ${data.tourTitle || 'Tour'}`;
    const body = [
      `Hello ${data.name || 'Traveler'},`,
      '',
      'We have received your booking request.',
      '',
      `Tour: ${data.tourTitle || 'N/A'}`,
      `Dates: ${data.startDate || 'N/A'} to ${data.endDate || 'N/A'}`,
      `Participants: ${data.participants || 'N/A'}`,
      `Total: ${data.totalPrice || 'N/A'}`,
      '',
      'We will follow up shortly.',
    ].join('\n');

    const adminBody = [
      'New booking request received.',
      '',
      `Name: ${data.name || 'N/A'}`,
      `Email: ${data.email || 'N/A'}`,
      `Tour: ${data.tourTitle || 'N/A'}`,
      `Dates: ${data.startDate || 'N/A'} to ${data.endDate || 'N/A'}`,
      `Participants: ${data.participants || 'N/A'}`,
      `Total: ${data.totalPrice || 'N/A'}`,
    ].join('\n');

    const tasks = [];
    if (data.email) {
      tasks.push(
        transporter.sendMail({
          from: smtp.from,
          to: data.email,
          subject,
          text: body,
        })
      );
    }

    if (smtp.adminEmail) {
      tasks.push(
        transporter.sendMail({
          from: smtp.from,
          to: smtp.adminEmail,
          subject: `Admin: ${subject}`,
          text: adminBody,
        })
      );
    }

    await Promise.all(tasks);
    return null;
  });

exports.notifyCustomTourRequestCreated = functions.firestore
  .document('customTourRequests/{requestId}')
  .onCreate(async (snap) => {
    const data = snap.data();
    const smtp = getSmtpConfig();
    if (!smtp) {
      console.log('SMTP config is missing. Skipping custom tour email.');
      return null;
    }

    const transporter = buildTransporter(smtp);
    const subject = 'Custom tour request received';
    const body = [
      `Hello ${data.name || 'Traveler'},`,
      '',
      'We have received your custom tour request.',
      '',
      `Group size: ${data.groupSize || 'N/A'}`,
      `Dates: ${data.startDate || 'N/A'} to ${data.endDate || 'N/A'}`,
      `Route: ${data.startLocation || 'N/A'} to ${data.endLocation || 'N/A'}`,
      '',
      'We will follow up with a proposal soon.',
    ].join('\n');

    const adminBody = [
      'New custom tour request received.',
      '',
      `Name: ${data.name || 'N/A'}`,
      `Email: ${data.email || 'N/A'}`,
      `Group size: ${data.groupSize || 'N/A'}`,
      `Dates: ${data.startDate || 'N/A'} to ${data.endDate || 'N/A'}`,
      `Route: ${data.startLocation || 'N/A'} to ${data.endLocation || 'N/A'}`,
      `Budget: ${data.budget || 'N/A'}`,
    ].join('\n');

    const tasks = [];
    if (data.email) {
      tasks.push(
        transporter.sendMail({
          from: smtp.from,
          to: data.email,
          subject,
          text: body,
        })
      );
    }

    if (smtp.adminEmail) {
      tasks.push(
        transporter.sendMail({
          from: smtp.from,
          to: smtp.adminEmail,
          subject: `Admin: ${subject}`,
          text: adminBody,
        })
      );
    }

    await Promise.all(tasks);
    return null;
  });
