DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hirego_railway_worker') THEN
    CREATE ROLE hirego_railway_worker
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      BYPASSRLS;
  ELSE
    ALTER ROLE hirego_railway_worker
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      BYPASSRLS;
  END IF;
END
$$;

ALTER ROLE hirego_railway_worker CONNECTION LIMIT 5;
ALTER ROLE hirego_railway_worker SET statement_timeout = '60s';
ALTER ROLE hirego_railway_worker SET idle_in_transaction_session_timeout = '60s';

GRANT CONNECT ON DATABASE postgres TO hirego_railway_worker;
GRANT USAGE ON SCHEMA public TO hirego_railway_worker;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hirego_railway_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hirego_railway_worker;

GRANT INSERT, UPDATE ON TABLE
  public."OutboxEntry",
  public."DeadLetterJob",
  public."SystemEvent",
  public."EventConsumerCheckpoint",
  public."Notification",
  public."CandidateSourcingRelationship"
TO hirego_railway_worker;
