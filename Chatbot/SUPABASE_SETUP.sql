-- SQL to add to Supabase for chat_messages table
-- Run this in your Supabase SQL Editor

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  lecture_id uuid REFERENCES public.lectures(id) ON DELETE SET NULL,
  doubt_id uuid REFERENCES public.doubts(id) ON DELETE SET NULL,
  message text NOT NULL,
  ai_response text NOT NULL,
  message_type text NOT NULL,
  escalate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_lecture_id ON public.chat_messages(lecture_id);
CREATE INDEX idx_chat_messages_doubt_id ON public.chat_messages(doubt_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
