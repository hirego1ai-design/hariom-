-- Repair routing entries that referenced invalid/unavailable model IDs.
-- Preserve each route's mode, budget, timeout, token limit and temperature.
-- This migration is idempotent and leaves all unrelated route/model fields intact.

DO $$
DECLARE
  pc jsonb;
  cfg jsonb;
  models jsonb;
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

  cfg := COALESCE(pc->'aiRouting', '{"version":1,"models":[],"routes":[]}'::jsonb);

  models := (
    SELECT jsonb_agg(
      CASE model->>'key'
        WHEN 'openai:gpt-6-luna' THEN jsonb_set(model, '{enabled}', 'false'::jsonb)
        WHEN 'openai:gpt-6-sol' THEN jsonb_set(model, '{enabled}', 'false'::jsonb)
        WHEN 'gemini:2.5-flash-lite' THEN jsonb_set(model, '{enabled}', 'false'::jsonb)
        ELSE model
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(COALESCE(cfg->'models', '[]'::jsonb))
      WITH ORDINALITY AS item(model, ordinality)
  );

  routes := (
    SELECT jsonb_agg(
      jsonb_set(
        CASE route->>'primaryModelKey'
          WHEN 'openai:gpt-6-luna' THEN jsonb_set(route, '{primaryModelKey}', '"openai:gpt-5.6-luna"'::jsonb)
          WHEN 'openai:gpt-6-sol' THEN jsonb_set(route, '{primaryModelKey}', '"openai:gpt-5.6-sol"'::jsonb)
          WHEN 'gemini:2.5-flash-lite' THEN jsonb_set(route, '{primaryModelKey}', '"gemini:3.8-flash"'::jsonb)
          ELSE route
        END,
        '{fallbackModelKeys}',
        COALESCE((
          SELECT jsonb_agg(
            CASE element #>> '{}'
              WHEN 'openai:gpt-6-luna' THEN '"openai:gpt-5.6-luna"'::jsonb
              WHEN 'openai:gpt-6-sol' THEN '"openai:gpt-5.6-sol"'::jsonb
              WHEN 'gemini:2.5-flash-lite' THEN '"gemini:3.8-flash"'::jsonb
              ELSE element
            END
            ORDER BY fallback_ordinality
          )
          FROM jsonb_array_elements(COALESCE(route->'fallbackModelKeys', '[]'::jsonb))
            WITH ORDINALITY AS fallback_item(element, fallback_ordinality)
        ), '[]'::jsonb),
        false
      )
      ORDER BY route_ordinality
    )
    FROM jsonb_array_elements(COALESCE(cfg->'routes', '[]'::jsonb))
      WITH ORDINALITY AS route_item(route, route_ordinality)
  );

  -- Make Gemini Flash-Lite the only primary LLM route. OpenAI is a fallback
  -- only, and only through valid GPT-5.6 Sol/Luna model IDs.
  models := (
    SELECT jsonb_agg(
      CASE model->>'key'
        WHEN 'gemini:3.5-flash-lite' THEN
          jsonb_set(
            jsonb_set(
              jsonb_set(model, '{enabled}', 'true'::jsonb),
              '{inputUsdPerMillion}', '0.30'::jsonb
            ),
            '{outputUsdPerMillion}', '2.50'::jsonb
          )
        WHEN 'openai:gpt-6-luna' THEN jsonb_set(model, '{enabled}', 'false'::jsonb)
        WHEN 'openai:gpt-6-sol' THEN jsonb_set(model, '{enabled}', 'false'::jsonb)
        ELSE model
      END
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(COALESCE(cfg->'models', '[]'::jsonb))
      WITH ORDINALITY AS item(model, ordinality)
  );

  routes := (
    SELECT jsonb_agg(
      CASE
        WHEN route->>'taskType' IN ('mock-interview-stt', 'mock-interview-tts', 'semantic-embedding')
          THEN route
        ELSE jsonb_set(
          jsonb_set(route, '{primaryModelKey}', '"gemini:3.5-flash-lite"'::jsonb),
          '{fallbackModelKeys}', '["openai:gpt-5.6-sol","openai:gpt-5.6-luna"]'::jsonb
        )
      END
      ORDER BY route_ordinality
    )
    FROM jsonb_array_elements(COALESCE(cfg->'routes', '[]'::jsonb))
      WITH ORDINALITY AS route_item(route, route_ordinality)
  );

  cfg := jsonb_set(cfg, '{models}', COALESCE(models, '[]'::jsonb), false);
  cfg := jsonb_set(cfg, '{routes}', COALESCE(routes, '[]'::jsonb), false);
  pc := jsonb_set(pc, '{aiRouting}', cfg, false);

  UPDATE "AdminConfiguration"
  SET "platformConfig" = pc
  WHERE "id" = 'global-admin-config';
END $$;
