-- Phase 6: the database, not only application code, guarantees one active
-- template for an event/channel/audience/locale. This prevents concurrent
-- admin activation requests from producing ambiguous outbound messaging.
CREATE UNIQUE INDEX "CommunicationTemplate_one_active"
ON "CommunicationTemplate" ("eventKey", "channel", "audience", "locale")
WHERE "enabled" = true AND "status" = 'ACTIVE';
