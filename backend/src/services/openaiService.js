import OpenAI from 'openai';
import { env } from '../config/env.js';

const client = new OpenAI({ apiKey: env.openAiApiKey });

export async function generateReply({ clientName, message, tone = 'friendly professional', language = 'English' }) {
  const prompt = `You are an AI assistant for a service business. Write one short ${tone} reply in ${language}.\nClient name: ${clientName || 'Client'}\nIncoming message: ${message}\nReturn only the final reply text.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  return response.choices[0]?.message?.content?.trim() || 'Thank you for your message.';
}

export async function generateBusinessInsight({ revenue, appointmentsCount, repeatClients, language = 'English' }) {
  const prompt = `You are a business assistant for a service professional. Answer in ${language}. Analyze these metrics and return 3 short practical insights.\nRevenue: ${revenue}\nAppointments: ${appointmentsCount}\nRepeat clients: ${repeatClients}`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4
  });

  return response.choices[0]?.message?.content?.trim() || 'No insights available.';
}
