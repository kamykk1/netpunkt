import { base44 } from '@/api/base44Client';

/**
 * Generuje spersonalizowane powiadomienie przez AI i zapisuje je.
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.userEmail
 * @param {string} params.type - typ zdarzenia
 * @param {string} params.context - surowy kontekst zdarzenia (np. "kampania X straciła 80% budżetu")
 * @param {boolean} [params.sendEmail=false]
 */
export async function sendAINotification({ userId, userEmail, type, context, sendEmail = false }) {
  let title, message, priority;

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Jesteś systemem powiadomień platformy netpunkt.pl (platforma zarabiania przez reklamy, gry i programy partnerskie).
Wygeneruj krótkie, spersonalizowane powiadomienie w języku polskim na podstawie zdarzenia.

Typ zdarzenia: ${type}
Kontekst: ${context}

Zwróć:
- title: krótki tytuł (max 60 znaków)
- message: treść (max 160 znaków), pomocna i konkretna
- priority: "low" | "medium" | "high" (wyższy priorytet dla ważniejszych/pilnych zdarzeń)`,
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          message: { type: "string" },
          priority: { type: "string" }
        }
      }
    });
    title = result.title;
    message = result.message;
    priority = result.priority || 'medium';
  } catch {
    title = `Powiadomienie: ${type}`;
    message = context;
    priority = 'medium';
  }

  await base44.entities.Notification.create({
    user_id: userId,
    user_email: userEmail,
    type: type,
    title,
    message,
    is_read: false,
    priority
  });

  if (sendEmail && userEmail) {
    await base44.integrations.Core.SendEmail({
      to: userEmail,
      from_name: 'netpunkt.pl',
      subject: title,
      body: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0f18;color:#fff;padding:24px;border-radius:12px;">
        <h2 style="color:#8b5cf6;">${title}</h2>
        <p style="color:#cbd5e1;">${message}</p>
        <hr style="border-color:#8b5cf630;margin:16px 0;"/>
        <p style="color:#64748b;font-size:12px;">Powiadomienie z platformy <strong>netpunkt.pl</strong></p>
      </div>`
    });
  }
}