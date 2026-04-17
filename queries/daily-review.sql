WITH inbound_today AS (
  SELECT
    "detectedGovernmentBody" AS government_body,
    COUNT(*) AS message_count,
    AVG("aiConfidence") AS average_confidence
  FROM "Message"
  WHERE "direction" = 'INBOUND'
    AND DATE("createdAt" AT TIME ZONE 'Asia/Riyadh') = DATE(NOW() AT TIME ZONE 'Asia/Riyadh')
  GROUP BY "detectedGovernmentBody"
),
delivery_stats AS (
  SELECT json_build_object(
    'auto_sent_percentage',
    COALESCE(ROUND(100.0 * SUM(CASE WHEN "direction" = 'OUTBOUND' AND "wasSentAutomatically" THEN 1 ELSE 0 END)
      / NULLIF(SUM(CASE WHEN "direction" = 'INBOUND' THEN 1 ELSE 0 END), 0), 2), 0),
    'queued_percentage',
    COALESCE(ROUND(100.0 * SUM(CASE WHEN "direction" = 'INBOUND' AND "founderAction" = 'PENDING' THEN 1 ELSE 0 END)
      / NULLIF(SUM(CASE WHEN "direction" = 'INBOUND' THEN 1 ELSE 0 END), 0), 2), 0)
  ) AS data
  FROM "Message"
  WHERE DATE("createdAt" AT TIME ZONE 'Asia/Riyadh') = DATE(NOW() AT TIME ZONE 'Asia/Riyadh')
),
open_urgent_conversations AS (
  SELECT
    c.id,
    u."displayName",
    c."primaryCategory",
    c."lastMessageAt",
    MAX(m."detectedUrgency") AS max_urgency
  FROM "Conversation" c
  JOIN "User" u ON u.id = c."userId"
  JOIN "Message" m ON m."conversationId" = c.id
  WHERE c.status = 'OPEN'
  GROUP BY c.id, u."displayName", c."primaryCategory", c."lastMessageAt"
  HAVING MAX(m."detectedUrgency") >= 4
),
unauthorized_attempts AS (
  SELECT *
  FROM "AuditLog"
  WHERE "eventType" = 'unauthorized_attempt'
    AND "occurredAt" >= NOW() - INTERVAL '24 hours'
)
SELECT 'messages_by_government_body' AS section, json_agg(inbound_today) AS data
FROM inbound_today
UNION ALL
SELECT 'delivery_stats' AS section, data
FROM delivery_stats
UNION ALL
SELECT 'open_urgent_conversations' AS section, json_agg(open_urgent_conversations) AS data
FROM open_urgent_conversations
UNION ALL
SELECT 'unauthorized_attempts_last_24h' AS section, json_agg(unauthorized_attempts) AS data
FROM unauthorized_attempts;
