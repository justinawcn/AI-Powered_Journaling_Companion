# AI Integration Setup Guide

## Environment Variables Setup

To enable AI-powered analysis, you need to set up your OpenAI API key:

### Step 1: Create Environment File
Create a file named `.env.local` in your project root with the following content:

```bash
# OpenAI API Configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_actual_api_key_here
```

### Step 2: Get Your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Create a new API key
4. Copy the key and replace `your_actual_api_key_here` in your `.env.local` file

### Step 3: Security
- Make sure `.env.local` is in your `.gitignore` file
- Never commit your API key to version control
- Keep your API key secure and don't share it

### Step 4: Restart Development Server
After adding the API key, restart your development server:
```bash
npm run dev
```

## How It Works

### Hybrid Approach
- **With API Key**: Uses OpenAI GPT-3.5-turbo for advanced analysis
- **Without API Key**: Falls back to local keyword-based analysis
- **Always Works**: Local analysis ensures the feature works even without API access

### Analysis Types
1. **Sentiment Analysis**: Determines if entries are positive, negative, or neutral
2. **Theme Analysis**: Identifies recurring topics and themes
3. **Trend Analysis**: Analyzes writing patterns, mood trends, and emoji usage

### Caching Strategy
- Analysis results are cached for 24 hours
- Cache is automatically cleared when new entries are added
- On-demand processing when user visits insights page

## Testing Without API Key

The system will work with local analysis even without an API key:
- Sentiment analysis uses keyword matching
- Theme analysis extracts frequent words
- Trend analysis aggregates existing data

## Troubleshooting

### Common Issues
1. **"Analysis service unavailable"**: Check your API key and internet connection
2. **Slow analysis**: This is normal for the first run; subsequent visits use cache
3. **No insights shown**: Make sure you have journal entries to analyze

### Debug Mode
Check the browser console for detailed logs about the analysis process.

## Cost Considerations

- OpenAI API calls cost approximately $0.001-0.002 per analysis
- Local analysis is free but less accurate
- Cache reduces API calls significantly
- Consider setting usage limits in your OpenAI account
