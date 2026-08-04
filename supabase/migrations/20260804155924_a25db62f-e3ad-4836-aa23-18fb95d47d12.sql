DROP POLICY IF EXISTS "anyone can log traffic" ON public.traffic_events;

CREATE POLICY "log own or anonymous traffic"
ON public.traffic_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);