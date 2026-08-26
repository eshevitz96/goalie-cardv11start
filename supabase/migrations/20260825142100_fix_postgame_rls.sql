CREATE POLICY "Users can insert daily_post_event_entries" ON public.daily_post_event_entries
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.daily_sessions
    WHERE id = daily_post_event_entries.session_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update daily_post_event_entries" ON public.daily_post_event_entries
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.daily_sessions
    WHERE id = daily_post_event_entries.session_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete daily_post_event_entries" ON public.daily_post_event_entries
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.daily_sessions
    WHERE id = daily_post_event_entries.session_id
    AND user_id = auth.uid()
  )
);
