-- Production AI routing defaults for HireGo semantic memory and Voice Mock Interview.
-- These are admin data defaults, not application hard-coded fallbacks. Runtime still fails
-- closed when the provider API key is absent or a route/model is disabled.

DO $$
DECLARE
  pc jsonb;
  cfg jsonb;
  models jsonb;
  routes jsonb;
  current_version integer;
BEGIN
  SELECT COALESCE("platformConfig",'{}'::jsonb)
  INTO pc
  FROM "AdminConfiguration"
  WHERE "id"='global-admin-config'
  FOR UPDATE;

  IF pc IS NULL THEN
    RAISE EXCEPTION 'global-admin-config is missing';
  END IF;

  cfg := COALESCE(
    pc->'aiRouting',
    '{"version":1,"models":[],"routes":[]}'::jsonb
  );
  models := COALESCE(cfg->'models','[]'::jsonb);
  routes := COALESCE(cfg->'routes','[]'::jsonb);

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(models) m
    WHERE m->>'key'='openai:text-embedding-3-large'
  ) THEN
    models := models || jsonb_build_array(jsonb_build_object(
      'key','openai:text-embedding-3-large',
      'provider','openai',
      'modelId','text-embedding-3-large',
      'label','OpenAI Text Embedding 3 Large',
      'enabled',true,
      'qualityTier','PREMIUM',
      'capabilities',jsonb_build_array('EMBEDDING'),
      'taskTypes',jsonb_build_array('semantic-embedding'),
      'inputUsdPerMillion',NULL,
      'outputUsdPerMillion',NULL,
      'cachedInputUsdPerMillion',NULL,
      'contextWindow',8192
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(models) m
    WHERE m->>'key'='openai:text-embedding-3-small'
  ) THEN
    models := models || jsonb_build_array(jsonb_build_object(
      'key','openai:text-embedding-3-small',
      'provider','openai',
      'modelId','text-embedding-3-small',
      'label','OpenAI Text Embedding 3 Small',
      'enabled',true,
      'qualityTier','ECONOMY',
      'capabilities',jsonb_build_array('EMBEDDING'),
      'taskTypes',jsonb_build_array('semantic-embedding'),
      'inputUsdPerMillion',NULL,
      'outputUsdPerMillion',NULL,
      'cachedInputUsdPerMillion',NULL,
      'contextWindow',8192
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(models) m
    WHERE m->>'key'='openai:gpt-4o-transcribe'
  ) THEN
    models := models || jsonb_build_array(jsonb_build_object(
      'key','openai:gpt-4o-transcribe',
      'provider','openai',
      'modelId','gpt-4o-transcribe',
      'label','OpenAI GPT-4o Transcribe',
      'enabled',true,
      'qualityTier','PREMIUM',
      'capabilities',jsonb_build_array('STT'),
      'taskTypes',jsonb_build_array('mock-interview-stt'),
      'inputUsdPerMillion',NULL,
      'outputUsdPerMillion',NULL,
      'cachedInputUsdPerMillion',NULL,
      'contextWindow',NULL
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(models) m
    WHERE m->>'key'='openai:gpt-4o-mini-transcribe'
  ) THEN
    models := models || jsonb_build_array(jsonb_build_object(
      'key','openai:gpt-4o-mini-transcribe',
      'provider','openai',
      'modelId','gpt-4o-mini-transcribe',
      'label','OpenAI GPT-4o Mini Transcribe',
      'enabled',true,
      'qualityTier','BALANCED',
      'capabilities',jsonb_build_array('STT'),
      'taskTypes',jsonb_build_array('mock-interview-stt'),
      'inputUsdPerMillion',NULL,
      'outputUsdPerMillion',NULL,
      'cachedInputUsdPerMillion',NULL,
      'contextWindow',NULL
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(models) m
    WHERE m->>'key'='openai:gpt-4o-mini-tts'
  ) THEN
    models := models || jsonb_build_array(jsonb_build_object(
      'key','openai:gpt-4o-mini-tts',
      'provider','openai',
      'modelId','gpt-4o-mini-tts',
      'label','OpenAI GPT-4o Mini TTS',
      'enabled',true,
      'qualityTier','BALANCED',
      'capabilities',jsonb_build_array('TTS'),
      'taskTypes',jsonb_build_array('mock-interview-tts'),
      'inputUsdPerMillion',NULL,
      'outputUsdPerMillion',NULL,
      'cachedInputUsdPerMillion',NULL,
      'contextWindow',NULL
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(routes) r
    WHERE r->>'taskType'='semantic-embedding'
  ) THEN
    routes := routes || jsonb_build_array(jsonb_build_object(
      'taskType','semantic-embedding',
      'mode','QUALITY_FIRST',
      'primaryModelKey','openai:text-embedding-3-large',
      'fallbackModelKeys',jsonb_build_array('openai:text-embedding-3-small'),
      'timeoutMs',20000,
      'maxTokens',1,
      'temperature',NULL,
      'maxRetriesPerEndpoint',0,
      'maxCostUsdPerRequest',NULL
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(routes) r
    WHERE r->>'taskType'='mock-interview-stt'
  ) THEN
    routes := routes || jsonb_build_array(jsonb_build_object(
      'taskType','mock-interview-stt',
      'mode','QUALITY_FIRST',
      'primaryModelKey','openai:gpt-4o-transcribe',
      'fallbackModelKeys',jsonb_build_array('openai:gpt-4o-mini-transcribe'),
      'timeoutMs',60000,
      'maxTokens',1,
      'temperature',NULL,
      'maxRetriesPerEndpoint',0,
      'maxCostUsdPerRequest',NULL
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(routes) r
    WHERE r->>'taskType'='mock-interview-tts'
  ) THEN
    routes := routes || jsonb_build_array(jsonb_build_object(
      'taskType','mock-interview-tts',
      'mode','MANUAL',
      'primaryModelKey','openai:gpt-4o-mini-tts',
      'fallbackModelKeys','[]'::jsonb,
      'timeoutMs',30000,
      'maxTokens',1,
      'temperature',NULL,
      'maxRetriesPerEndpoint',0,
      'maxCostUsdPerRequest',NULL
    ));
  END IF;

  current_version := COALESCE((cfg->>'version')::integer,1);
  cfg := jsonb_set(cfg,'{models}',models,true);
  cfg := jsonb_set(cfg,'{routes}',routes,true);
  cfg := jsonb_set(cfg,'{version}',to_jsonb(current_version + 1),true);
  pc := jsonb_set(pc,'{aiRouting}',cfg,true);

  UPDATE "AdminConfiguration"
  SET "platformConfig"=pc, "updatedAt"=NOW()
  WHERE "id"='global-admin-config';

  INSERT INTO "AuditLog"
    ("id","userId","action","resource","ipAddress","details","createdAt")
  VALUES
    (
      gen_random_uuid()::text,
      NULL,
      'AI_ROUTING_PRODUCTION_DEFAULTS_APPLIED',
      'AdminConfiguration:aiRouting',
      'system',
      json_build_object(
        'reason','Production defaults for semantic embeddings and Voice Mock Interview. Runtime remains fail-closed without provider credentials.',
        'fromVersion',current_version,
        'toVersion',current_version + 1
      )::text,
      NOW()
    );
END $$;
