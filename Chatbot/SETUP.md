# Chatbot Setup with Supabase Integration

This chatbot is now integrated with the tech-teach Supabase backend. Follow these steps to set it up:

## 1. Prerequisites

Ensure you have:
- Node.js 18+ installed
- pnpm or npm package manager
- Access to the tech-teach Supabase project credentials

## 2. Installation

```bash
cd Chatbot
pnpm install
# or
npm install
```

## 3. Environment Configuration

1. Get your Supabase credentials from tech-teach:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key from Supabase

2. Update `.env` with your credentials:
```env
# Groq API (Primary AI)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=mixtral-8x7b-32768

# Gemini API (Fallback)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server
PORT=3001
```

## 4. Database Setup

Run the SQL from `SUPABASE_SETUP.sql` in your Supabase SQL Editor to create the `chat_messages` table:

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the sidebar
3. Click "New Query"
4. Copy and paste the SQL from `SUPABASE_SETUP.sql`
5. Click "Run"

## 5. Running the Chatbot

### Option A: Express Server (Recommended for production)
```bash
npm run server
```
Server runs on http://localhost:3001

### Option B: Development Mode
```bash
npm run dev
```

## 6. API Endpoints

### Chat Endpoint
**POST** `/api/chat`

Request body:
```json
{
  "message": "I need help with...",
  "lectureId": "uuid (optional)",
  "doubtId": "uuid (optional)",
  "userId": "uuid (optional)"
}
```

Response:
```json
{
  "type": "technical_issue|attendance_issue|assignment_issue|concept_question|other",
  "reply": "AI response text",
  "escalate": false
}
```

### Health Check
**GET** `/health`

## 7. Features

- **Dual AI Support**: Uses Groq API as primary with Gemini fallback
- **Supabase Integration**: Stores all chat messages in the database
- **Doubt Tracking**: Automatically updates doubts with AI suggestions
- **Error Handling**: Graceful fallback if either API fails
- **Database Fallback**: Chat works even if database is unavailable

## 8. Data Flow

1. User sends message to `/api/chat`
2. ChatBot classifies it using Groq/Gemini
3. Response is saved to Supabase `chat_messages` table
4. If associated with a doubt, it's saved as AI suggestion
5. Response is returned to user

## 9. Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL" error
- Check `.env` has the correct Supabase URL
- Ensure it's set as an environment variable

### Chat messages not saving
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check that the `chat_messages` table exists in Supabase
- Review server logs for database errors

### AI API not responding
- Verify `GROQ_API_KEY` and `GEMINI_API_KEY` are valid
- Check API usage limits
- Fallback to the other API will be used automatically

## 10. Integration with Tech-Teach

The chatbot accesses the following tables from tech-teach:
- `profiles` - User information
- `lectures` - Lecture data
- `doubts` - Student questions
- `teachers` - Teacher information

New data is stored in:
- `chat_messages` - All chatbot conversations
