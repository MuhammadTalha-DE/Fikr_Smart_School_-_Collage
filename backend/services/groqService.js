const Groq = require('groq-sdk');

let groq;

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com',
    });
  }

  return groq;
};

const getGeneralCompletion = async (messages, options = {}) => {
  const completion = await getGroqClient().chat.completions.create({
    model: options.model || 'llama-3.1-8b-instant',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
};

const getSystemCompletion = async (messages, tools, options = {}) => {
  const completion = await getGroqClient().chat.completions.create({
    model: options.model || 'llama-3.1-8b-instant',
    messages,
    tools,
    tool_choice: 'auto',
    temperature: options.temperature ?? 0.2,
    max_tokens: 1024,
  });

  return completion.choices[0].message;
};

const getVisionCompletion = async (messages, imageBase64, options = {}) => {
  const completion = await getGroqClient().chat.completions.create({
    model: 'llama-3.2-11b-vision-preview',
    messages: [
      ...messages,
      {
        role: 'user',
        content: [
          { type: 'text', text: messages[messages.length - 1].content },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: options.temperature ?? 0.7,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
};

const getGeneralCompletionStream = async (messages, options = {}) => {
  return getGroqClient().chat.completions.create({
    model: options.model || 'llama-3.1-8b-instant',
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: 1024,
    stream: true,
  });
};

module.exports = {
  getGeneralCompletion,
  getSystemCompletion,
  getVisionCompletion,
  getGeneralCompletionStream,
};
