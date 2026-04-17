"use strict";exports.id=446,exports.ids=[446],exports.modules={56480:(e,t,n)=>{n.d(t,{C:()=>o,z:()=>s});var r=n(30765),a=n(81856);let i={neutral:"bg-slate-100 text-slate-700",green:"bg-emerald-100 text-emerald-800",yellow:"bg-amber-100 text-amber-800",red:"bg-red-100 text-red-700",navy:"bg-navy-100 text-navy-700",gold:"bg-gold-500/10 text-gold-600 border border-gold-500/30"};function o({variant:e="neutral",className:t,...n}){return r.jsx("span",{className:(0,a.cn)("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",i[e],t),...n})}function s({color:e}){return r.jsx("span",{className:(0,a.cn)("inline-block h-2.5 w-2.5 rounded-full","green"===e?"bg-emerald-500":"yellow"===e?"bg-amber-500":"bg-red-500"),"aria-hidden":!0})}},8747:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.generateAction=d;let r=n(59455),a=n(52266),i=n(17590),o=n(57688),s=a.z.enum(["accountant","lawyer","hr_specialist","founder"]),l=a.z.object({title_ar:a.z.string(),summary_ar:a.z.string(),recommended_action_ar:a.z.string(),recommended_handler:s,action_deadline_hours:a.z.number().int().nullable(),penalty_if_ignored_ar:a.z.string(),what_to_tell_the_handler_ar:a.z.string(),response_to_user_ar:a.z.string()}),c={name:"makyn_action_output",strict:!0,schema:{type:"object",additionalProperties:!1,properties:{title_ar:{type:"string"},summary_ar:{type:"string"},recommended_action_ar:{type:"string"},recommended_handler:{type:"string",enum:["accountant","lawyer","hr_specialist","founder"]},action_deadline_hours:{anyOf:[{type:"integer"},{type:"null"}]},penalty_if_ignored_ar:{type:"string"},what_to_tell_the_handler_ar:{type:"string"},response_to_user_ar:{type:"string"}},required:["title_ar","summary_ar","recommended_action_ar","recommended_handler","action_deadline_hours","penalty_if_ignored_ar","what_to_tell_the_handler_ar","response_to_user_ar"]}};async function d(e,t,n){let a=Date.now(),s=(0,i.openaiClient)(),d=[`USER: ${n.fullName} (preferred language: ${n.preferredLanguage})`,"","EXTRACTION:",JSON.stringify(e,null,2),"","CLASSIFICATION:",JSON.stringify(t,null,2)].join("\n"),u=(await s.responses.create({model:i.OPENAI_MODEL,instructions:o.ACTION_SYSTEM_PROMPT,input:d,text:{format:{type:"json_schema",...c}}})).output_text.trim(),_=l.parse(JSON.parse(u)),m=Date.now()-a;return await r.prisma.auditLog.create({data:{eventType:"ai_stage_3",eventData:{promptVersion:o.ACTION_PROMPT_VERSION,rawResponse:u,latencyMs:m}}}),{action:_,promptVersion:o.ACTION_PROMPT_VERSION,latencyMs:m}}},69372:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.classifyNotice=u;let r=n(59455),a=n(52266),i=n(17590),o=n(57688),s=a.z.enum(["cr","tin","gosi","qiwa","name_fuzzy","none"]),l=a.z.enum(["accountant","lawyer","hr_specialist","none"]),c=a.z.object({notice_type_code:a.z.string(),notice_type_description_ar:a.z.string(),urgency_level:a.z.union([a.z.literal(1),a.z.literal(2),a.z.literal(3),a.z.literal(4),a.z.literal(5)]),urgency_reasoning:a.z.string(),matched_company_id:a.z.string().nullable(),match_confidence:a.z.number().min(0).max(1),match_method:s,requires_professional:a.z.boolean(),recommended_professional_type:l,requires_immediate_action:a.z.boolean(),why_this_urgency:a.z.string()}),d={name:"makyn_classifier_output",strict:!0,schema:{type:"object",additionalProperties:!1,properties:{notice_type_code:{type:"string"},notice_type_description_ar:{type:"string"},urgency_level:{type:"integer",enum:[1,2,3,4,5]},urgency_reasoning:{type:"string"},matched_company_id:{anyOf:[{type:"string"},{type:"null"}]},match_confidence:{type:"number"},match_method:{type:"string",enum:["cr","tin","gosi","qiwa","name_fuzzy","none"]},requires_professional:{type:"boolean"},recommended_professional_type:{type:"string",enum:["accountant","lawyer","hr_specialist","none"]},requires_immediate_action:{type:"boolean"},why_this_urgency:{type:"string"}},required:["notice_type_code","notice_type_description_ar","urgency_level","urgency_reasoning","matched_company_id","match_confidence","match_method","requires_professional","recommended_professional_type","requires_immediate_action","why_this_urgency"]}};async function u(e,t,n){let a=Date.now(),s=(0,i.openaiClient)(),l=[function(e){if(0===e.length)return"User owns NO companies yet. matched_company_id must be null, match_method must be 'none'.";let t=e.map(e=>{let t=[];e.crNumber&&t.push(`CR: ${e.crNumber}`),e.zatcaTin&&t.push(`TIN: ${e.zatcaTin}`),e.gosiEmployerNumber&&t.push(`GOSI: ${e.gosiEmployerNumber}`),e.qiwaEstablishmentId&&t.push(`Qiwa: ${e.qiwaEstablishmentId}`);let n=t.length?` (${t.join(", ")})`:"",r=e.tradeName?` — trade name: ${e.tradeName}`:"";return`- ${e.id}: ${e.legalNameAr}${r}${n}`});return`User owns these companies:
${t.join("\n")}`}(n),"","EXTRACTED DATA:",JSON.stringify(e,null,2),"","ORIGINAL NOTICE TEXT:",t].join("\n"),u=(await s.responses.create({model:i.OPENAI_MODEL,instructions:o.CLASSIFIER_SYSTEM_PROMPT,input:l,text:{format:{type:"json_schema",...d}}})).output_text.trim(),_=c.parse(JSON.parse(u)),m=Date.now()-a;return await r.prisma.auditLog.create({data:{eventType:"ai_stage_2",eventData:{promptVersion:o.CLASSIFIER_PROMPT_VERSION,rawResponse:u,companyCount:n.length,latencyMs:m}}}),{classification:_,promptVersion:o.CLASSIFIER_PROMPT_VERSION,latencyMs:m}}},17590:(e,t,n)=>{let r;Object.defineProperty(t,"__esModule",{value:!0}),t.OPENAI_MODEL=void 0,t.openaiClient=function(){if(!r){let e=process.env.OPENAI_API_KEY;if(!e)throw Error("OPENAI_API_KEY is not set");r=new a.default({apiKey:e})}return r};let a=function(e){return e&&e.__esModule?e:{default:e}}(n(96179));t.OPENAI_MODEL=process.env.OPENAI_MODEL??"gpt-5-mini"},91472:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.GOVERNMENT_BODIES=void 0,t.extractNotice=p;let r=n(59455),a=n(52266),i=n(17590),o=n(57688);t.GOVERNMENT_BODIES=["ZATCA","GOSI","MOJ","BOG","EFAA","MHRSD","QIWA","MUQEEM","ABSHER","MOC","BALADY","SAMA","CMA","MONSHAAT","NAFATH","OTHER"];let s=a.z.enum(["ar","en","mixed"]),l=a.z.enum(t.GOVERNMENT_BODIES),c=a.z.enum(["fine","tax_due","fee","deposit_required","refund","other"]),d=a.z.object({type:a.z.string(),value:a.z.string()}),u=a.z.object({type:a.z.string(),date:a.z.string()}),_=a.z.object({language_detected:s,sender:a.z.object({government_body:l.nullable(),specific_office:a.z.string().nullable(),officer_name:a.z.string().nullable(),contact_number:a.z.string().nullable()}),recipient:a.z.object({company_name_ar:a.z.string().nullable(),company_name_en:a.z.string().nullable(),cr_number:a.z.string().nullable(),zatca_tin:a.z.string().nullable(),gosi_number:a.z.string().nullable(),qiwa_id:a.z.string().nullable(),balady_license:a.z.string().nullable(),moi700:a.z.string().nullable(),other_ids:a.z.array(d)}),notice_reference:a.z.object({reference_number:a.z.string().nullable(),case_number:a.z.string().nullable(),file_number:a.z.string().nullable(),issued_date:a.z.string().nullable()}),financial:a.z.object({amount_sar:a.z.number().nullable(),amount_type:c.nullable(),is_compound_penalty:a.z.boolean(),compound_description:a.z.string().nullable()}),dates:a.z.object({response_deadline:a.z.string().nullable(),hearing_date:a.z.string().nullable(),payment_deadline:a.z.string().nullable(),other_dates:a.z.array(u)}),key_facts:a.z.array(a.z.string()),raw_arabic_excerpt:a.z.string().nullable()}),m={name:"makyn_extractor_output",strict:!0,schema:{type:"object",additionalProperties:!1,properties:{language_detected:{type:"string",enum:["ar","en","mixed"]},sender:{type:"object",additionalProperties:!1,properties:{government_body:{anyOf:[{type:"string",enum:[...t.GOVERNMENT_BODIES]},{type:"null"}]},specific_office:{anyOf:[{type:"string"},{type:"null"}]},officer_name:{anyOf:[{type:"string"},{type:"null"}]},contact_number:{anyOf:[{type:"string"},{type:"null"}]}},required:["government_body","specific_office","officer_name","contact_number"]},recipient:{type:"object",additionalProperties:!1,properties:{company_name_ar:{anyOf:[{type:"string"},{type:"null"}]},company_name_en:{anyOf:[{type:"string"},{type:"null"}]},cr_number:{anyOf:[{type:"string"},{type:"null"}]},zatca_tin:{anyOf:[{type:"string"},{type:"null"}]},gosi_number:{anyOf:[{type:"string"},{type:"null"}]},qiwa_id:{anyOf:[{type:"string"},{type:"null"}]},balady_license:{anyOf:[{type:"string"},{type:"null"}]},moi700:{anyOf:[{type:"string"},{type:"null"}]},other_ids:{type:"array",items:{type:"object",additionalProperties:!1,properties:{type:{type:"string"},value:{type:"string"}},required:["type","value"]}}},required:["company_name_ar","company_name_en","cr_number","zatca_tin","gosi_number","qiwa_id","balady_license","moi700","other_ids"]},notice_reference:{type:"object",additionalProperties:!1,properties:{reference_number:{anyOf:[{type:"string"},{type:"null"}]},case_number:{anyOf:[{type:"string"},{type:"null"}]},file_number:{anyOf:[{type:"string"},{type:"null"}]},issued_date:{anyOf:[{type:"string"},{type:"null"}]}},required:["reference_number","case_number","file_number","issued_date"]},financial:{type:"object",additionalProperties:!1,properties:{amount_sar:{anyOf:[{type:"number"},{type:"null"}]},amount_type:{anyOf:[{type:"string",enum:["fine","tax_due","fee","deposit_required","refund","other"]},{type:"null"}]},is_compound_penalty:{type:"boolean"},compound_description:{anyOf:[{type:"string"},{type:"null"}]}},required:["amount_sar","amount_type","is_compound_penalty","compound_description"]},dates:{type:"object",additionalProperties:!1,properties:{response_deadline:{anyOf:[{type:"string"},{type:"null"}]},hearing_date:{anyOf:[{type:"string"},{type:"null"}]},payment_deadline:{anyOf:[{type:"string"},{type:"null"}]},other_dates:{type:"array",items:{type:"object",additionalProperties:!1,properties:{type:{type:"string"},date:{type:"string"}},required:["type","date"]}}},required:["response_deadline","hearing_date","payment_deadline","other_dates"]},key_facts:{type:"array",items:{type:"string"}},raw_arabic_excerpt:{anyOf:[{type:"string"},{type:"null"}]}},required:["language_detected","sender","recipient","notice_reference","financial","dates","key_facts","raw_arabic_excerpt"]}};async function p(e){let t=Date.now(),n=(0,i.openaiClient)(),a=(await n.responses.create({model:i.OPENAI_MODEL,instructions:o.EXTRACTOR_SYSTEM_PROMPT,input:e,text:{format:{type:"json_schema",...m}}})).output_text.trim(),s=_.parse(JSON.parse(a)),l=Date.now()-t;return await r.prisma.auditLog.create({data:{eventType:"ai_stage_1",eventData:{promptVersion:o.EXTRACTOR_PROMPT_VERSION,rawResponse:a,latencyMs:l}}}),{extraction:s,promptVersion:o.EXTRACTOR_PROMPT_VERSION,latencyMs:l}}},76490:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.processNotice=s;let r=n(91472),a=n(69372),i=n(8747);function o(e){if(!e)return null;let t=new Date(e);return Number.isNaN(t.getTime())?null:t}async function s(e,t,n){let s=Date.now(),{extraction:l,promptVersion:c,latencyMs:d}=await (0,r.extractNotice)(e),{classification:u,promptVersion:_,latencyMs:m}=await (0,a.classifyNotice)(l,e,t),{action:p,promptVersion:y,latencyMs:g}=await (0,i.generateAction)(l,u,n),f=o(l.dates.response_deadline)??o(l.dates.payment_deadline);return{extraction:l,classification:u,action:p,governmentBody:l.sender.government_body,urgency:u.urgency_level,matchedCompanyId:u.matched_company_id,matchConfidence:u.match_confidence,matchMethod:u.match_method,titleAr:p.title_ar,summaryAr:p.summary_ar,recommendedActionAr:p.recommended_action_ar,recommendedHandler:p.recommended_handler,actionDeadlineHours:p.action_deadline_hours,penaltyIfIgnoredAr:p.penalty_if_ignored_ar,whatToTellHandlerAr:p.what_to_tell_the_handler_ar,responseToUserAr:p.response_to_user_ar,detectedDeadline:f,detectedAmountSar:l.financial.amount_sar,referenceNumber:l.notice_reference.reference_number,promptVersions:{extractor:c,classifier:_,action:y},latencyMs:{extractor:d,classifier:m,action:g,total:Date.now()-s}}}},57688:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.ACTION_SYSTEM_PROMPT=t.CLASSIFIER_SYSTEM_PROMPT=t.EXTRACTOR_SYSTEM_PROMPT=t.ACTION_PROMPT_VERSION=t.CLASSIFIER_PROMPT_VERSION=t.EXTRACTOR_PROMPT_VERSION=void 0,t.EXTRACTOR_PROMPT_VERSION="extractor_v1.0",t.CLASSIFIER_PROMPT_VERSION="classifier_v1.0",t.ACTION_PROMPT_VERSION="action_v1.0",t.EXTRACTOR_SYSTEM_PROMPT=`You are MAKYN's notice extractor. A Saudi business owner has forwarded
a government notice (text or OCR'd from image). Extract every piece of
structured information you can identify.

Return ONLY valid JSON with this exact schema:

{
  "language_detected": "ar" | "en" | "mixed",
  "sender": {
    "government_body": "ZATCA" | "GOSI" | "MOJ" | "BOG" | "EFAA" | "MHRSD" | "QIWA" | "MUQEEM" | "ABSHER" | "MOC" | "BALADY" | "SAMA" | "CMA" | "MONSHAAT" | "NAFATH" | "OTHER" | null,
    "specific_office": string or null,
    "officer_name": string or null,
    "contact_number": string or null
  },
  "recipient": {
    "company_name_ar": string or null,
    "company_name_en": string or null,
    "cr_number": string or null,
    "zatca_tin": string or null,
    "gosi_number": string or null,
    "qiwa_id": string or null,
    "balady_license": string or null,
    "moi700": string or null,
    "other_ids": [{ "type": string, "value": string }]
  },
  "notice_reference": {
    "reference_number": string or null,
    "case_number": string or null,
    "file_number": string or null,
    "issued_date": "YYYY-MM-DD" or null
  },
  "financial": {
    "amount_sar": number or null,
    "amount_type": "fine" | "tax_due" | "fee" | "deposit_required" | "refund" | "other" | null,
    "is_compound_penalty": boolean,
    "compound_description": string or null
  },
  "dates": {
    "response_deadline": "YYYY-MM-DD" or null,
    "hearing_date": "YYYY-MM-DD" or null,
    "payment_deadline": "YYYY-MM-DD" or null,
    "other_dates": [{ "type": string, "date": "YYYY-MM-DD" }]
  },
  "key_facts": [string],
  "raw_arabic_excerpt": string or null
}

CRITICAL EXTRACTION RULES:
- Saudi CR numbers are exactly 10 digits, starting with 1, 2, 4, or 7.
- ZATCA TINs are exactly 15 digits, starting with 3.
- GOSI employer numbers vary in length, typically 9-11 digits.
- Qiwa establishment IDs are typically 7-10 digits.
- Hijri dates should be converted to Gregorian; if both are present, use
  the Gregorian version.
- Amounts: extract in SAR; convert if explicitly given in another currency.
- Deadlines: interpret phrases like 'خلال 30 يوما' (within 30 days)
  relative to the issued_date if available, otherwise flag as relative.
- If a field cannot be determined from the notice, set it to null. Do NOT
  guess or invent values.

Temperature target: 0.1 (maximum consistency).`,t.CLASSIFIER_SYSTEM_PROMPT=`You are MAKYN's classifier. Given an extracted government notice and the
user's list of companies, determine what this notice is, how urgent it
is, and which of the user's companies it concerns.

Return ONLY valid JSON:

{
  "notice_type_code": string (match seed templates when possible, e.g. "ZATCA_VAT_LATE_FILING"),
  "notice_type_description_ar": string,
  "urgency_level": 1 | 2 | 3 | 4 | 5,
  "urgency_reasoning": string (English, for founder review),
  "matched_company_id": string or null,
  "match_confidence": 0.0 to 1.0,
  "match_method": "cr" | "tin" | "gosi" | "qiwa" | "name_fuzzy" | "none",
  "requires_professional": boolean,
  "recommended_professional_type": "accountant" | "lawyer" | "hr_specialist" | "none",
  "requires_immediate_action": boolean,
  "why_this_urgency": string (Arabic, 1 sentence)
}

URGENCY SCALE (BE STRICT):
1 = informational, no action needed (e.g. filing confirmation)
2 = routine, action within 2 weeks (e.g. upcoming renewal 30+ days out)
3 = standard, action within 1 week (e.g. document request, upcoming
    deadline 14 days)
4 = urgent, action within 48 hours (e.g. late penalty, deadline within
    7 days, GOSI contribution overdue)
5 = emergency, action today (court hearing within 72 hours, account freeze,
    enforcement order, EFAA matter, CR about to expire within 7 days)

COMPANY MATCHING LOGIC (YOU MUST FOLLOW):
- If extracted CR matches a user's company CR: confidence 1.0, method='cr'
- If extracted ZATCA TIN matches: confidence 1.0, method='tin'
- If extracted GOSI number matches: confidence 1.0, method='gosi'
- If extracted Qiwa ID matches: confidence 1.0, method='qiwa'
- If extracted company_name_ar is a close fuzzy match (>85% similarity)
  to a user's legalNameAr or tradeName: confidence 0.7-0.9, method='name_fuzzy'
- If no identifier matches cleanly: matched_company_id=null, confidence=0.0,
  method='none'

Do not guess. Returning null is correct when certainty is low.

Temperature target: 0.2.`,t.ACTION_SYSTEM_PROMPT=`You are MAKYN's action advisor. A Saudi business owner has received a
government notice that has been extracted and classified. Your job is to
tell the owner exactly what to do, in plain Arabic, in a way they can
act on in 10 seconds.

Return ONLY valid JSON:

{
  "title_ar": string (5-9 words, scannable, e.g. 'إشعار زاتكا — متأخرات ضريبة القيمة المضافة'),
  "summary_ar": string (2-3 sentences, Arabic, calm professional tone),
  "recommended_action_ar": string (1-2 sentences, specific and actionable),
  "recommended_handler": "accountant" | "lawyer" | "hr_specialist" | "founder",
  "action_deadline_hours": number (how many hours the owner has to act before serious consequences),
  "penalty_if_ignored_ar": string (what happens if the owner ignores this — amount, duration, escalation),
  "what_to_tell_the_handler_ar": string (the exact message to send the accountant/lawyer — 40-80 words, includes all necessary reference numbers, deadlines, and context),
  "response_to_user_ar": string (60-100 words, Arabic, the first message to send back to the user on Telegram — confirms receipt, summarizes the issue, gives ONE concrete next step, reassures without inventing specifics)
}

TONE FOR ARABIC:
- Address the user with respect: أستاذ (default masculine)
- Calm, professional, never alarmist — even for urgency 5 notices
- Concrete, not generic. 'اتصل بمحاسبك قبل الخميس بخصوص إشعار زاتكا مرجع 12345'
  not 'يُرجى التصرف بأسرع وقت'
- Never invent specific fine amounts, deadlines, or legal advice that
  aren't in the source notice
- Close the user response with reassurance: 'سأتابع معك التفاصيل قريباً'

ACTION DEADLINE LOGIC:
- Urgency 5 → action_deadline_hours: 2-6 (today)
- Urgency 4 → action_deadline_hours: 24-48 (next business day)
- Urgency 3 → action_deadline_hours: 72-168 (within a week)
- Urgency 2 → action_deadline_hours: 168-336 (within two weeks)
- Urgency 1 → action_deadline_hours: 720 or null (no real urgency)

Temperature target: 0.3 (slight variation for natural Arabic, but consistent on facts).`},88192:(e,t,n)=>{var r=Object.create?function(e,t,n,r){void 0===r&&(r=n);var a=Object.getOwnPropertyDescriptor(t,n);(!a||("get"in a?!t.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return t[n]}}),Object.defineProperty(e,r,a)}:function(e,t,n,r){void 0===r&&(r=n),e[r]=t[n]},a=function(e,t){for(var n in e)"default"===n||Object.prototype.hasOwnProperty.call(t,n)||r(t,e,n)};Object.defineProperty(t,"__esModule",{value:!0}),a(n(57688),t),a(n(76490),t),a(n(91472),t),a(n(69372),t),a(n(8747),t),a(n(25053),t),a(n(18874),t),a(n(81164),t),a(n(34949),t),a(n(37276),t)},18874:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.createOrUpdateIssue=i;let r=n(59455),a=n(37276);async function i(e,t,n){let i=await r.prisma.company.findUniqueOrThrow({where:{id:n},select:{id:!0,ownerId:!0}}),o=(0,a.addDays)(new Date,-30),s=await r.prisma.issue.findFirst({where:{companyId:n,governmentBody:e.governmentBody??void 0,noticeType:e.classification.notice_type_code,status:{in:[r.IssueStatus.OPEN,r.IssueStatus.ACKNOWLEDGED,r.IssueStatus.WITH_PROFESSIONAL]},createdAt:{gte:o}},orderBy:{createdAt:"desc"}});if(s){let i=(0,a.earliestDate)(s.detectedDeadline,e.detectedDeadline),o=Math.max(s.urgencyLevel,e.urgency);return await r.prisma.$transaction([r.prisma.issue.update({where:{id:s.id},data:{urgencyLevel:o,detectedDeadline:i,updatedAt:new Date}}),r.prisma.message.update({where:{id:t},data:{issueId:s.id,companyId:n}})]),{issueId:s.id,created:!1}}return{issueId:(await r.prisma.$transaction(async a=>{var o;let s=await a.issue.create({data:{companyId:n,ownerId:i.ownerId,titleAr:e.titleAr,summaryAr:e.summaryAr,governmentBody:e.governmentBody??"OTHER",noticeType:e.classification.notice_type_code,urgencyLevel:e.urgency,detectedDeadline:e.detectedDeadline,detectedAmountSar:null==(o=e.detectedAmountSar)?null:new r.Prisma.Decimal(o),referenceNumber:e.referenceNumber,extractedEntities:e.extraction,recommendedAction:e.recommendedActionAr,recommendedHandler:e.recommendedHandler,actionDeadlineHours:e.actionDeadlineHours,penaltyIfIgnored:e.penaltyIfIgnoredAr,whatToTellHandlerAr:e.whatToTellHandlerAr,status:r.IssueStatus.OPEN}});return await a.message.update({where:{id:t},data:{issueId:s.id,companyId:n}}),s})).id,created:!0}}},25053:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.matchCompanyByIdentifiers=function(e,t){let{recipient:n}=t;if(n.cr_number){let t=e.find(e=>e.crNumber&&e.crNumber===n.cr_number);if(t)return{companyId:t.id,method:"cr",confidence:1}}if(n.zatca_tin){let t=e.find(e=>e.zatcaTin&&e.zatcaTin===n.zatca_tin);if(t)return{companyId:t.id,method:"tin",confidence:1}}if(n.gosi_number){let t=e.find(e=>e.gosiEmployerNumber&&e.gosiEmployerNumber===n.gosi_number);if(t)return{companyId:t.id,method:"gosi",confidence:1}}if(n.qiwa_id){let t=e.find(e=>e.qiwaEstablishmentId&&e.qiwaEstablishmentId===n.qiwa_id);if(t)return{companyId:t.id,method:"qiwa",confidence:1}}return null},t.companyIdBelongsToUser=function(e,t){return!!t&&e.some(e=>e.id===t)}},81164:(e,t,n)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.calculateCompanyStatus=function(e){if(0===e.length)return"GREEN";let t=new Date,n=(0,r.addDays)(t,14),i=(0,r.addHours)(t,72);return e.some(e=>!!(e.urgencyLevel>=4||e.detectedDeadline&&e.detectedDeadline<t||a.has(e.governmentBody))||!!e.detectedDeadline&&e.detectedDeadline<i&&e.urgencyLevel>=3)?"RED":e.some(e=>e.urgencyLevel>=2||!!e.detectedDeadline&&e.detectedDeadline<n)?"YELLOW":"GREEN"};let r=n(37276),a=new Set(["EFAA","MOJ","BOG"])},37276:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.addDays=function(e,t){let n=new Date(e);return n.setUTCDate(n.getUTCDate()+t),n},t.addHours=function(e,t){let n=new Date(e);return n.setUTCHours(n.getUTCHours()+t),n},t.earliestDate=function(e,t){return e||t?e?t?e<t?e:t:e:t??null:null},t.hoursUntil=function(e,t=new Date){return Math.round((e.getTime()-t.getTime())/36e5)}},34949:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0}),t.AppError=void 0,t.getErrorMessage=function(e){return e instanceof Error?e.message:"Unknown error"};class n extends Error{constructor(e,t=500,n){super(e),this.name="AppError",this.statusCode=t,this.details=n}}t.AppError=n}};