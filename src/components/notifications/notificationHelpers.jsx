import { base44 } from '@/api/base44Client';

/**
 * Create an in-app notification and optionally send email.
 */
export async function sendNotification({ userId, userEmail, type, title, message, referenceId, referenceType, sendEmail = false }) {
  await base44.entities.Notification.create({
    user_id: userId,
    user_email: userEmail,
    type,
    title,
    message,
    reference_id: referenceId || null,
    reference_type: referenceType || 'other',
    is_read: false,
    priority: ['campaign_budget_low', 'system'].includes(type) ? 'high' : 'medium',
  });

  if (sendEmail && userEmail) {
    await base44.integrations.Core.SendEmail({
      to: userEmail,
      from_name: 'netpunkt.pl',
      subject: title,
      body: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f18;color:#fff;padding:24px;border-radius:12px;">
          <h2 style="color:#8b5cf6;">${title}</h2>
          <p style="color:#cbd5e1;">${message}</p>
          <hr style="border-color:#8b5cf630;margin:16px 0;"/>
          <p style="color:#64748b;font-size:12px;">Powiadomienie z platformy <strong>netpunkt.pl</strong></p>
        </div>
      `
    });
  }
}

/** Notify all admins */
export async function notifyAdmins({ type, title, message, referenceId, referenceType }) {
  const admins = await base44.entities.User.filter({ role: 'admin' });
  await Promise.all(admins.map(admin =>
    sendNotification({ userId: admin.id, userEmail: admin.email, type, title, message, referenceId, referenceType })
  ));
}