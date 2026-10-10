-- Candidate Jarvis hybrid routing foundation.
-- Keeps alternate models in the registry for Super Admin use; default Jarvis
-- runtime uses only GPT + Gemini reciprocal primary/fallback routes.

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

  cfg := COALESCE(pc->'aiRouting','{"version":1,"models":[],"routes":[]}'::jsonb);
  models := COALESCE(cfg->'models','[]'::jsonb);
  routes := COALESCE(cfg->'routes','[]'::jsonb);
  current_version := COALESCE((cfg->>'version')::integer,1);

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(models) m
    WHERE m->>'key'='gemini:2.5-flash-lite'
  ) THEN
    models := models || jsonb_build_array(jsonb_build_object(
      'key','gemini:2.5-flash-lite',
      'provider','gemini',
      'modelId','gemini-2.5-flash-lite',
      'label','Gemini 2.5 Flash-Lite',
      'enabled',true,
      'qualityTier','ECONOMY',
      'capabilities',jsonb_build_array('TEXT','STRUCTURED_OUTPUT','REASONING','VISION','TOOL_USE','LONG_CONTEXT'),
      'taskTypes',jsonb_build_array('*'),
      'inputUsdPerMillion',0.10,
      'outputUsdPerMillion',0.40,
      'cachedInputUsdPerMillion',0.01,
      'contextWindow',1000000
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(models) m
    WHERE m->>'key'='gemini:2.5-flash'
  ) THEN
    models := models || jsonb_build_array(jsonb_build_object(
      'key','gemini:2.5-flash',
      'provider','gemini',
      'modelId','gemini-2.5-flash',
      'label','Gemini 2.5 Flash',
      'enabled',true,
      'qualityTier','BALANCED',
      'capabilities',jsonb_build_array('TEXT','STRUCTURED_OUTPUT','REASONING','VISION','TOOL_USE','LONG_CONTEXT'),
      'taskTypes',jsonb_build_array('*'),
      'inputUsdPerMillion',0.30,
      'outputUsdPerMillion',2.50,
      'cachedInputUsdPerMillion',0.03,
      'contextWindow',1000000
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(routes) r
    WHERE r->>'taskType'='candidate-jarvis'
  ) THEN
    routes := routes || jsonb_build_array(jsonb_build_object(
      'taskType','candidate-jarvis',
      'mode','MANUAL',
      'primaryModelKey','openai:gpt-6-luna',
      'fallbackModelKeys',jsonb_build_array('gemini:2.5-flash-lite'),
      'timeoutMs',20000,
      'maxTokens',1800,
      'temperature',NULL,
      'maxRetriesPerEndpoint',0,
      'maxCostUsdPerRequest',0.05
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(routes) r
    WHERE r->>'taskType'='candidate-jarvis-quality'
  ) THEN
    routes := routes || jsonb_build_array(jsonb_build_object(
      'taskType','candidate-jarvis-quality',
      'mode','MANUAL',
      'primaryModelKey','gemini:2.5-flash',
      'fallbackModelKeys',jsonb_build_array('openai:gpt-6-sol'),
      'timeoutMs',30000,
      'maxTokens',3000,
      'temperature',NULL,
      'maxRetriesPerEndpoint',0,
      'maxCostUsdPerRequest',0.12
    ));
  END IF;

  cfg := jsonb_set(cfg,'{models}',models,true);
  cfg := jsonb_set(cfg,'{routes}',routes,true);
  cfg := jsonb_set(cfg,'{version}',to_jsonb(current_version + 1),true);
  pc := jsonb_set(pc,'{aiRouting}',cfg,true);

  IF NOT (pc ? 'candidateJarvis') THEN
    pc := jsonb_set(
      pc,
      '{candidateJarvis}',
      jsonb_build_object(
        'enabled',false,
        'voiceEnabled',false,
        'hybridRoutingEnabled',true,
        'smartTaskType','candidate-jarvis',
        'qualityTaskType','candidate-jarvis-quality',
        'maxInputChars',1600,
        'maxApplicationsContext',8,
        'maxInterviewsContext',5,
        'maxJobsContext',6,
        'maxVoiceAudioBytes',8388608,
        'defaultLanguage','en',
        'defaultVoiceKey','af_heart',
        'deepReasoningKeywords',jsonb_build_array(
          'compare','why','weakness','improve','strategy','prepare',
          'career','best fit','likely questions','explain deeply'
        )
      ),
      true
    );
  END IF;

  UPDATE "AdminConfiguration"
  SET "platformConfig"=pc, "updatedAt"=NOW()
  WHERE "id"='global-admin-config';

  INSERT INTO "AuditLog"
    ("id","userId","action","resource","ipAddress","details","createdAt")
  VALUES (
    gen_random_uuid()::text,
    NULL,
    'CANDIDATE_JARVIS_HYBRID_ROUTING_DEFAULTS_APPLIED',
    'AdminConfiguration:candidateJarvis',
    'system',
    json_build_object(
      'reason','Install Candidate Jarvis FAST/SMART/DEEP routing defaults without disabling alternate Super Admin models.',
      'fromVersion',current_version,
      'toVersion',current_version + 1,
      'smartPrimary','openai:gpt-6-luna',
      'smartFallback','gemini:2.5-flash-lite',
      'qualityPrimary','gemini:2.5-flash',
      'qualityFallback','openai:gpt-6-sol',
      'voiceEnabled',false
    )::text,
    NOW()
  );
END $$;
