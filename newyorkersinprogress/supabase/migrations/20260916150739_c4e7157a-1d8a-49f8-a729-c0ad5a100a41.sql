REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
REVOKE ALL ON FUNCTION public.increment_daily_visit() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_daily_visit() TO service_role;
CREATE POLICY "Backend manages aggregate visits" ON public.daily_visits FOR ALL TO service_role USING (true) WITH CHECK (true);