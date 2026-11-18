// Anthropic Messages API access for stages 5 and 8 only.
// The key and model come from the environment (.env is loaded by run.mjs); neither is ever logged.
import Anthropic from '@anthropic-ai/sdk';

export class MalformedResponseError extends Error {
  constructor(message, problems = []) {
    super(message);
    this.name = 'MalformedResponseError';
    this.problems = problems;
  }
}

export const readAnthropicConfig = (env = process.env) => {
  const missing = ['ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL'].filter(name => !env[name]?.trim());
  if (missing.length) throw new Error(`Missing ${missing.join(' and ')} in the environment or .env (see .env.example). Needed by stages 5 and 8.`);
  return {model: env.ANTHROPIC_MODEL.trim(), sceneModel: env.ANTHROPIC_SCENE_MODEL?.trim() || env.ANTHROPIC_MODEL.trim()};
};

export const createClient = () => new Anthropic({maxRetries: 2});

/** Extracts one JSON object from model text, tolerating ```json fences and surrounding prose. */
export const extractJson = text => {
  if (typeof text !== 'string' || !text.trim()) throw new MalformedResponseError('response contained no text');
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new MalformedResponseError('response contained no JSON object');
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch (error) {
    throw new MalformedResponseError(`response JSON did not parse: ${error.message}`);
  }
};

const responseText = response => {
  if (response?.stop_reason === 'refusal') throw new MalformedResponseError(`model declined the request (stop_reason refusal${response.stop_details?.category ? `, ${response.stop_details.category}` : ''})`);
  if (response?.stop_reason === 'max_tokens') throw new MalformedResponseError('response was cut off at max_tokens');
  if (!Array.isArray(response?.content)) throw new MalformedResponseError('response had no content array');
  return response.content.filter(block => block?.type === 'text').map(block => block.text).join('');
};

/**
 * Sends one request, parses JSON and validates it. On malformed output (invalid JSON,
 * missing fields, out-of-range values, refusal, truncation) it retries exactly once,
 * telling the model what was wrong; a second failure throws a clear error.
 * `validate(json)` returns {value, problems: string[]}. `onAttempt` receives raw text for auditing.
 * API errors (auth, rate limit, network) are not retried here beyond the SDK's own retries.
 */
export const requestValidatedJson = async ({client, model, system, prompt, validate, maxTokens = 16000, onAttempt = () => {}}) => {
  const messages = [{role: 'user', content: prompt}];
  let lastProblems = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    let text = '';
    try {
      const response = await client.messages.create({model, max_tokens: maxTokens, system, messages});
      text = responseText(response);
      onAttempt({attempt, text, stopReason: response.stop_reason, usage: response.usage ?? null});
      const json = extractJson(text);
      const {value, problems} = validate(json);
      if (!problems.length) return {value, attempts: attempt};
      lastProblems = problems;
    } catch (error) {
      if (!(error instanceof MalformedResponseError)) throw error;
      if (!text) onAttempt({attempt, text: '', error: error.message});
      lastProblems = [error.message];
    }
    if (attempt === 1) {
      const note = `Your previous response was not usable:\n- ${lastProblems.join('\n- ')}\nReturn only the corrected JSON object, following every rule in the original request.`;
      if (text.trim()) messages.push({role: 'assistant', content: text}, {role: 'user', content: note});
      else messages.splice(0, messages.length, {role: 'user', content: `${prompt}\n\n${note}`});
    }
  }
  throw new MalformedResponseError(`Model response was still invalid after one retry:\n- ${lastProblems.join('\n- ')}`, lastProblems);
};
