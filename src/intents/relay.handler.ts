import { ParsedIntent } from '../services/claude';

export async function handleRelayIntent(parsed: ParsedIntent): Promise<string> {
  const p = parsed.params as Record<string, string | undefined>;

  if (!p.recipient || !p.message) {
    return "Who should I message, and what should I say?";
  }

  return `SMS relay isn't available right now boss — Twilio's been retired. You'll need to message ${p.recipient} directly for now.`;
}
