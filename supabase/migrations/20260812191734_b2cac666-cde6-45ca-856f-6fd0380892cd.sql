CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('facebook-refresh-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'facebook-refresh-hourly');

SELECT cron.schedule(
  'facebook-refresh-hourly',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://magnoliamaids.pro/api/public/hooks/facebook-refresh',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_Jz-BP1tK4PmDVkwlxpkXZQ_Jc5KW8xN"}'::jsonb,
    body := '{"trigger":"cron"}'::jsonb
  );
  $$
);