# OpenAI Integration for CV & Cover Letter Generator

## Recommended Models

For our CV and cover letter generation application, we should use the following OpenAI models based on their capabilities, cost efficiency, and performance:

### 1. GPT-4o

**Primary use cases:**
- CV analysis and generation
- Cover letter generation
- Job description parsing and analysis
- Detailed matching between CV and job requirements

**Advantages:**
- Most advanced reasoning capabilities
- Can understand nuanced job requirements
- Produces high-quality, professional writing
- Strong context understanding for tailoring content
- Can parse and understand complex documents
- Supports JSON mode for structured output
- 128K token context window (allows handling large CVs and job descriptions)
- Multimodal capabilities (can understand images if needed)

**Technical details:**
- Context window: 128,000 tokens
- Input pricing: $5.00 / 1M tokens
- Output pricing: $15.00 / 1M tokens
- Best model for professional writing quality

### 2. GPT-4o-mini

**Primary use cases:**
- Initial document parsing
- Job description analysis
- Draft generation for review
- User input processing

**Advantages:**
- 75% cheaper than GPT-4o
- 3x larger context window than GPT-3.5 Turbo
- Better reasoning than GPT-3.5
- Good balance between cost and quality
- Supports JSON mode for structured output

**Technical details:**
- Context window: 128,000 tokens
- Input pricing: $0.15 / 1M tokens
- Output pricing: $0.60 / 1M tokens
- Good balance between cost and performance

### 3. GPT-3.5 Turbo

**Primary use cases:**
- Initial document parsing
- User input processing
- Preview generation
- Non-critical analysis tasks

**Advantages:**
- Lowest cost option
- Fast response times
- Good for initial preprocessing
- Sufficient for many basic tasks

**Technical details:**
- Context window: 16,385 tokens
- Input pricing: $0.50 / 1M tokens
- Output pricing: $1.50 / 1M tokens
- Most cost-effective for simple tasks

## API Integration Strategy

### 1. Document Processing Flow

```
User Input → GPT-3.5 Turbo (Initial parsing) → GPT-4o (Final generation) → Formatted Document
```

### 2. Key API Features to Utilize

#### Structured Output
Use the JSON mode parameter to get structured data from both CV parsing and job description analysis:

```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [...],
  response_format: { type: "json_object" },
  temperature: 0.3,
});
```

#### System Instructions
Use detailed system prompts to get consistent, high-quality results:

```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: "You are a professional CV writer who specializes in tailoring CVs to specific job descriptions. Focus on highlighting relevant experience and skills that match the job requirements."
    },
    {
      role: "user",
      content: `Create a CV based on the following profile and job description: ${JSON.stringify(data)}`
    }
  ],
  temperature: 0.7,
});
```

#### Temperature Settings
- Use lower temperature (0.3-0.5) for parsing and analysis tasks where accuracy is critical
- Use moderate temperature (0.6-0.8) for document generation to allow creativity while maintaining professionalism

### 3. Cost Optimization Strategies

#### Multi-model approach
- Use GPT-4o-mini for parsing, analysis, and preprocessing
- Reserve GPT-4o for final content generation
- Strategic distribution of tasks across models based on cost-benefit

#### Implemented optimizations
- Two-stage generation process:
  1. Initial analysis with GPT-4o-mini to identify key matches (75% cheaper)
  2. Final content generation with GPT-4o for quality (only when needed)
- JSON mode for structured output to minimize token usage
- Low temperature (0.3) for parsing tasks to reduce unnecessary verbosity
- Higher temperature (0.7) for creative writing tasks

#### Additional cost controls
- Usage tracking in Firestore to monitor API consumption
- Document caching to avoid regeneration of the same content
- Token usage estimation before API calls
- Store generated documents to avoid regeneration
- Rate limiting for free tier users

## Storage of API Keys

For storing the OpenAI API keys securely:

1. Store the API key in Firebase environment variables:
   - Use Firebase Functions environment configuration
   - Never expose API keys in client-side code

2. Implementation in Firebase functions:

```javascript
// In Firebase Functions
const functions = require('firebase-functions');
const openai = require('openai');

exports.generateDocuments = functions.https.onCall(async (data, context) => {
  // Authenticate the user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const openaiClient = new openai.OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Stored in Firebase environment
  });

  // Process the request using OpenAI API
  // ...
});
```

3. Local development:
   - Store API keys in .env.local (already in our .gitignore)
   - Use environment variables in Next.js API routes

## Usage Monitoring and Rate Limiting

1. Implement usage tracking in Firestore:
   - Track tokens used per user
   - Implement daily/monthly quotas based on user tier

2. Rate limiting:
   - Implement rate limiting on API routes
   - Create queue system for batch processing

3. Error handling:
   - Handle API rate limits gracefully
   - Implement exponential backoff for retries

## Security Considerations

1. Never expose the OpenAI API key to the client
2. Validate all input data before sending to OpenAI
3. Sanitize outputs to prevent potential injection attacks
4. Implement user authentication for all API routes
5. Create specific Firebase security rules to protect user data

## Future Considerations

1. Fine-tuning models for CV optimization (if volume justifies cost)
2. Exploring embedding models for better job-to-CV matching
3. Implementing assistants API for interactive CV improvement