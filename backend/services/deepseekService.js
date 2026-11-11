const OpenAI = require('openai');

let deepseek;

const getDeepseekClient = () => {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  if (!deepseek) {
    deepseek = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

  return deepseek;
};

const getGeneralCompletion = async (messages, options = {}) => {
  const completion = await getDeepseekClient().chat.completions.create({
    model: options.model || 'deepseek-v4-flash',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0].message.content;
};

const getSystemCompletion = async (messages, tools, options = {}) => {
  const completion = await getDeepseekClient().chat.completions.create({
    model: options.model || 'deepseek-v4-flash',
    messages,
    tools,
    tool_choice: 'auto',
    temperature: options.temperature ?? 0.2,
    max_tokens: 2048,
  });

  return completion.choices[0].message;
};

const getGeneralCompletionStream = async (messages, options = {}) => {
  return getDeepseekClient().chat.completions.create({
    model: options.model || 'deepseek-v4-flash',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: 2048,
    stream: true,
  });
};

module.exports = {
  getGeneralCompletion,
  getSystemCompletion,
  getGeneralCompletionStream,
};
