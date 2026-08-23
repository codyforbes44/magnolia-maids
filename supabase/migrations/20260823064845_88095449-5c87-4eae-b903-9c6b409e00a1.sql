DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;
CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DROP POLICY IF EXISTS "Staff manage payment links" ON public.payment_links;
CREATE POLICY "Staff manage payment links" ON public.payment_links
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'staff'::app_role));

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('webhook_events','outbound_idempotency')
       AND qual LIKE '%has_role%'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (private.has_role(auth.uid(), ''admin''::app_role))',
      p.policyname, p.tablename);
  END LOOP;
END;
$$;