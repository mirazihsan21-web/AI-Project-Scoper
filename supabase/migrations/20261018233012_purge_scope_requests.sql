-- Rate limiting only looks back one hour, so older scope_requests rows are dead weight (and hashed IPs we
-- no longer need). Purge anything older than a day, every night at 03:17 UTC.
create extension if not exists pg_cron with schema pg_catalog;

-- cron.schedule upserts by job name, so re-running this is safe.
select cron.schedule(
  'purge-scope-requests',
  '17 3 * * *',
  $$delete from public.scope_requests where created_at < now() - interval '1 day'$$
);
