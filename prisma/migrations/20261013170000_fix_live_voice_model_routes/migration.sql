-- Repair live conversation routes that referenced invalid/unavailable model IDs.
-- Keep the existing admin-selected routing policy, budgets, timeouts and model inventory.
-- This is idempotent: routes already corrected by the admin remain unchanged.

DO $$
DECLARE
  pc jsonb;
  routes jsonb;
BEGIN
  SELECT COALESCE("platformConfig", '{}'::jsonb)
  INTO pc
  FROM "AdminConfiguration"
  WHERE "id" = 'global-admin-config'
  FOR UPDATE;

  IF pc IS NULL THEN
    RAISE EXCEPTION 'global-admin-config is missing';
  END IF;

  routes := COALESCE(pc->'aiRouting'->'routes', '[]'::jsonb);
  IF jsonb_typeof(routes) <> 'array' THEN
    RAISE EXCEPTION 'aiRouting.routes must be an array';
  END IF;

  routes := (
    SELECT jsonb_agg(
      CASE route->>'taskType'
        WHEN 'candidate-jarvis' THEN
          jsonb_set(
            jsonb_set(route, '{primaryModelKey}', '"openai:gpt-5.6-luna"'::jsonb),
            '{fallbackModelKeys}', '["gemini:3.8-flash"]'::jsonb
          )
        WHEN 'candidate-jarvis-quality' THEN
          jsonb_set(
            jsonb_set(route, '{primaryModelKey}', '"gemini:3.8-flash"'::jsonb),
            '{fallbackModelKeys}', '["openai:gpt-5.6-sol"]'::jsonb
          )
        WHEN 'mock-interview' THEN
          jsonb_set(
            jsonb_set(route, '{primaryModelKey}', '"gemini:3.8-flash"'::jsonb),
            '{fallbackModelKeys}', '["openai:gpt-5.6-sol"]'::jsonb
          )
        WHEN 'assessment-feedback' THEN
          jsonb_set(
            jsonb_set(route, '{primaryModelKey}', '"openai:gpt-5.6-luna"'::jsonb),
            '{fallbackModelKeys}', '["gemini:3.8-flash"]'::jsonb
          )
        ELSE route
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(routes) WITH ORDINALITY AS item(route, ordinality)
  );

  pc := jsonb_set(pc, '{aiRouting,routes}', COALESCE(routes, '[]'::jsonb), false);

  UPDATE "AdminConfiguration"
  SET "platformConfig" = pc
  WHERE "id" = 'global-admin-config';
END $$;
