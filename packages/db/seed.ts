import "dotenv/config";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type GovernmentBodySeed = {
  code: string;
  nameEn: string;
  nameAr: string;
  description: string;
  commonNoticeTypes: string[];
  typicalUrgency: number;
};

type NoticeTemplateSeed = {
  governmentBodyCode: string;
  code: string;
  nameEn: string;
  nameAr: string;
  description: string;
  keywordsAr: string[];
  keywordsEn: string[];
  defaultUrgency: number;
  requiresProfessional: boolean;
  typicalDeadlineDays: number | null;
  responseTemplateAr: string;
};

const governmentBodies: GovernmentBodySeed[] = [
  {
    code: "ZATCA",
    nameEn: "Zakat, Tax and Customs Authority",
    nameAr: "هيئة الزكاة والضريبة والجمارك",
    description:
      "الجهة المختصة بالزكاة والضرائب والجمارك في المملكة، وتشرف على ضريبة القيمة المضافة والزكاة وضريبة الدخل والتخليص الجمركي ومتطلبات الفوترة الإلكترونية فاتورة.",
    commonNoticeTypes: ["vat_return_due", "late_filing_penalty", "e_invoice_violation", "audit_request", "zakat_assessment"],
    typicalUrgency: 4
  },
  {
    code: "GOSI",
    nameEn: "General Organization for Social Insurance",
    nameAr: "المؤسسة العامة للتأمينات الاجتماعية",
    description:
      "الجهة المسؤولة عن اشتراكات التأمينات الاجتماعية وتعويضات الأخطار المهنية ومعالجة ملفات المشتركين والمنشآت والالتزامات الشهرية المرتبطة بالعمالة.",
    commonNoticeTypes: ["contribution_due", "contribution_overdue", "employee_registration", "injury_claim"],
    typicalUrgency: 3
  },
  {
    code: "MOJ",
    nameEn: "Ministry of Justice",
    nameAr: "وزارة العدل",
    description:
      "الجهة المشرفة على المحاكم والأنظمة القضائية والإشعارات القضائية والتنفيذية والتجارية، بما يشمل القضايا والجلسات والأحكام وإجراءات التبليغ.",
    commonNoticeTypes: ["case_filed", "hearing_scheduled", "judgment_issued", "mediation_invitation"],
    typicalUrgency: 4
  },
  {
    code: "BOG",
    nameEn: "Board of Grievances",
    nameAr: "ديوان المظالم",
    description:
      "القضاء الإداري المختص بالنظر في المنازعات الإدارية والدعاوى المقامة ضد الجهات الحكومية وما يتصل بها من مواعيد ومرافعات وقرارات قضائية.",
    commonNoticeTypes: ["administrative_case", "hearing_scheduled"],
    typicalUrgency: 4
  },
  {
    code: "EFAA",
    nameEn: "Enforcement Authority",
    nameAr: "محكمة التنفيذ",
    description:
      "الجهة القضائية المختصة بتنفيذ السندات التنفيذية والأحكام وأوامر السداد والحجز والتنفيذ على الأموال والحسابات البنكية.",
    commonNoticeTypes: ["payment_order", "account_freeze", "execution_notice"],
    typicalUrgency: 5
  },
  {
    code: "MHRSD",
    nameEn: "Ministry of Human Resources and Social Development",
    nameAr: "وزارة الموارد البشرية والتنمية الاجتماعية",
    description:
      "الجهة المنظمة لعلاقات العمل والامتثال العمالي وبرامج التوطين ومنصات العمل مثل قوى ومدد وما يرتبط بها من مخالفات وتنبيهات.",
    commonNoticeTypes: ["labor_violation", "wps_violation", "saudization_warning"],
    typicalUrgency: 3
  },
  {
    code: "QIWA",
    nameEn: "Qiwa Platform",
    nameAr: "منصة قوى",
    description:
      "منصة تشغيلية لتنظيم عقود العمل وتصاريح العمل وقياس نسب التوطين وخدمات المنشآت المرتبطة بسوق العمل.",
    commonNoticeTypes: ["contract_authentication", "nitaqat_warning", "work_permit_expiry"],
    typicalUrgency: 3
  },
  {
    code: "MUQEEM",
    nameEn: "Muqeem Platform",
    nameAr: "مقيم",
    description:
      "منصة لإدارة خدمات المقيمين مثل تجديد الإقامة والتأشيرات والخروج والعودة ومتابعة صلاحية الوثائق المتعلقة بالعمالة.",
    commonNoticeTypes: ["iqama_expiry", "exit_reentry"],
    typicalUrgency: 4
  },
  {
    code: "ABSHER",
    nameEn: "Absher Business",
    nameAr: "أبشر أعمال",
    description:
      "منصة خدمات إلكترونية للأعمال تشمل إدارة سجلات العاملين وبعض خدمات وزارة الداخلية والمخالفات والخدمات التشغيلية للمنشآت.",
    commonNoticeTypes: ["employee_record_update", "traffic_violation", "service_notice"],
    typicalUrgency: 3
  },
  {
    code: "MOC",
    nameEn: "Ministry of Commerce",
    nameAr: "وزارة التجارة",
    description:
      "الجهة المسؤولة عن السجل التجاري والامتثال التجاري وإفصاحات الملكية المستفيدة والرقابة على المخالفات التجارية.",
    commonNoticeTypes: ["cr_renewal", "ubo_disclosure", "commercial_violation"],
    typicalUrgency: 3
  },
  {
    code: "BALADY",
    nameEn: "Balady Platform",
    nameAr: "بلدي",
    description:
      "منصة وخدمات البلديات المتعلقة بالرخص الصحية والمهنية والتفتيش واللوحات والتنظيم البلدي واستخدامات الأراضي.",
    commonNoticeTypes: ["license_renewal", "inspection_notice", "municipal_violation"],
    typicalUrgency: 3
  },
  {
    code: "SAMA",
    nameEn: "Saudi Central Bank",
    nameAr: "البنك المركزي السعودي",
    description:
      "الجهة المنظمة للقطاع البنكي والتمويلي والإشراف على الالتزام المصرفي ومكافحة غسل الأموال والرقابة على المؤسسات المالية.",
    commonNoticeTypes: ["aml_request", "compliance_notice", "supervisory_followup"],
    typicalUrgency: 4
  },
  {
    code: "CMA",
    nameEn: "Capital Market Authority",
    nameAr: "هيئة السوق المالية",
    description:
      "الجهة المنظمة لسوق المال والإفصاحات النظامية وحوكمة الشركات المدرجة والموافقات والالتزامات المرتبطة بالأوراق المالية.",
    commonNoticeTypes: ["disclosure_notice", "compliance_breach", "filing_deadline"],
    typicalUrgency: 4
  },
  {
    code: "MONSHAAT",
    nameEn: "Small and Medium Enterprises General Authority",
    nameAr: "الهيئة العامة للمنشآت الصغيرة والمتوسطة",
    description:
      "الجهة المعنية بدعم المنشآت الصغيرة والمتوسطة من خلال البرامج والمسرعات والاستشارات والفرص التمويلية وغير التمويلية.",
    commonNoticeTypes: ["program_update", "grant_notice", "advisory_followup"],
    typicalUrgency: 2
  },
  {
    code: "NAFATH",
    nameEn: "Nafath",
    nameAr: "نفاذ",
    description:
      "خدمة تحقق وهوية رقمية تستخدم للمصادقة على الدخول والتفويض، وعادة ترتبط بطلبات تحقق أو اعتماد وليست إشعارات موضوعية مستقلة.",
    commonNoticeTypes: ["authentication_request", "identity_confirmation"],
    typicalUrgency: 2
  },
  {
    code: "CHAMBER",
    nameEn: "Chamber of Commerce",
    nameAr: "غرفة التجارة",
    description: "غرفة التجارة والصناعة الإقليمية المعنية بتسجيل المنشآت التجارية وإصدار شهادات العضوية وتوثيق الأنشطة التجارية.",
    commonNoticeTypes: ["membership_renewal", "certificate_expiry"],
    typicalUrgency: 2
  },
  {
    code: "CIVIL_DEFENSE",
    nameEn: "Civil Defense",
    nameAr: "الدفاع المدني",
    description: "الجهة المختصة بمتطلبات السلامة والحرائق للمنشآت التجارية والصناعية وإصدار شهادات السلامة وأوامر الإغلاق.",
    commonNoticeTypes: ["safety_cert_renewal", "inspection_notice", "closure_order"],
    typicalUrgency: 4
  },
  {
    code: "INDUSTRY",
    nameEn: "Ministry of Industry",
    nameAr: "وزارة الصناعة",
    description: "وزارة الصناعة والثروة المعدنية المختصة بتراخيص الأنشطة الصناعية وتنظيم المصانع والرقابة على الامتثال الصناعي.",
    commonNoticeTypes: ["license_renewal", "inspection_notice", "violation_notice"],
    typicalUrgency: 3
  },
  {
    code: "MOH",
    nameEn: "Ministry of Health",
    nameAr: "وزارة الصحة",
    description: "الجهة المشرفة على القطاع الصحي وترخيص المرافق الطبية والصيدليات والمختبرات وضمان جودة الخدمات الصحية.",
    commonNoticeTypes: ["license_renewal", "inspection_notice", "compliance_notice"],
    typicalUrgency: 4
  },
  {
    code: "TOURISM",
    nameEn: "Ministry of Tourism",
    nameAr: "وزارة السياحة",
    description: "الجهة المشرفة على قطاع السياحة وترخيص الفنادق والشقق المفروشة ووكالات السياحة والسفر.",
    commonNoticeTypes: ["license_renewal", "classification_update", "compliance_notice"],
    typicalUrgency: 3
  },
  {
    code: "SFDA",
    nameEn: "Saudi Food and Drug Authority",
    nameAr: "هيئة الغذاء والدواء",
    description: "الهيئة المختصة بتنظيم ومراقبة جودة المنتجات الغذائية والدوائية ومستحضرات التجميل والأجهزة الطبية.",
    commonNoticeTypes: ["license_renewal", "product_recall", "inspection_notice", "compliance_breach"],
    typicalUrgency: 4
  },
  {
    code: "SASO",
    nameEn: "Saudi Standards, Metrology and Quality Organization",
    nameAr: "هيئة المواصفات والمقاييس",
    description: "الجهة المختصة بالمواصفات القياسية الوطنية وبرنامج SABER وشهادات المطابقة للمنتجات المستوردة والمحلية.",
    commonNoticeTypes: ["saber_renewal", "certificate_expiry", "compliance_notice"],
    typicalUrgency: 3
  },
  {
    code: "CST",
    nameEn: "Communications, Space and Technology Commission",
    nameAr: "هيئة الاتصالات والفضاء والتقنية",
    description: "الجهة المنظمة لقطاع الاتصالات والفضاء والتقنية وتراخيص شبكات الاتصالات وخدمات الإنترنت والحوسبة السحابية.",
    commonNoticeTypes: ["license_renewal", "compliance_notice", "spectrum_fee"],
    typicalUrgency: 3
  },
  {
    code: "MISA",
    nameEn: "Ministry of Investment",
    nameAr: "وزارة الاستثمار",
    description: "الوزارة المعنية بتراخيص الاستثمار الأجنبي وشركات الملكية الأجنبية الكاملة أو المختلطة في المملكة العربية السعودية.",
    commonNoticeTypes: ["license_renewal", "compliance_notice", "reporting_due"],
    typicalUrgency: 3
  },
  {
    code: "SOCPA",
    nameEn: "Saudi Organization for Chartered and Professional Accountants",
    nameAr: "هيئة المحاسبين القانونيين السعوديين",
    description: "الجهة المنظمة لمهنة المحاسبة والمراجعة في المملكة وإصدار تراخيص المحاسبين القانونيين المعتمدين.",
    commonNoticeTypes: ["membership_renewal", "cpe_requirement", "license_notice"],
    typicalUrgency: 2
  },
  {
    code: "SCE",
    nameEn: "Saudi Council of Engineers",
    nameAr: "هيئة المهندسين السعوديين",
    description: "الجهة المنظمة لمهنة الهندسة في المملكة وترخيص المهندسين وتصنيف شركات الاستشارات الهندسية.",
    commonNoticeTypes: ["membership_renewal", "classification_update"],
    typicalUrgency: 2
  },
  {
    code: "ZAKAT",
    nameEn: "Zakat Authority",
    nameAr: "هيئة الزكاة",
    description: "تقييمات الزكاة المستقلة عن إجراءات ZATCA الضريبية، تشمل الربط الزكوي السنوي والاعتراضات.",
    commonNoticeTypes: ["zakat_assessment", "objection_response"],
    typicalUrgency: 3
  },
  {
    code: "ENVIRONMENT",
    nameEn: "Ministry of Environment",
    nameAr: "وزارة البيئة",
    description: "الوزارة المختصة بالتراخيص البيئية ومتطلبات الامتثال البيئي للمنشآت الصناعية والزراعية.",
    commonNoticeTypes: ["permit_renewal", "compliance_notice", "inspection_notice"],
    typicalUrgency: 3
  },
  {
    code: "CULTURE",
    nameEn: "Ministry of Culture",
    nameAr: "وزارة الثقافة",
    description: "الوزارة المختصة بتراخيص الأنشطة الثقافية والإبداعية والمسارح ودور العرض والمتاحف.",
    commonNoticeTypes: ["license_renewal", "event_permit"],
    typicalUrgency: 2
  },
  {
    code: "SPORTS",
    nameEn: "Ministry of Sports",
    nameAr: "وزارة الرياضة",
    description: "الوزارة المختصة بتراخيص الأنشطة الرياضية والأندية الرياضية والمرافق الترفيهية.",
    commonNoticeTypes: ["license_renewal", "event_permit"],
    typicalUrgency: 2
  },
  {
    code: "OTHER",
    nameEn: "Other",
    nameAr: "جهة أخرى",
    description:
      "تصنيف احتياطي لأي جهة غير مدرجة صراحة في القاموس الأولي، مع الحاجة إلى مراجعة بشرية للتأكد من الجهة وطبيعة الالتزام.",
    commonNoticeTypes: ["other_notice"],
    typicalUrgency: 3
  }
];

const noticeTemplates: NoticeTemplateSeed[] = [
  {
    governmentBodyCode: "ZATCA",
    code: "ZATCA_VAT_RETURN_DUE",
    nameEn: "VAT return filing reminder",
    nameAr: "تذكير بتقديم إقرار ضريبة القيمة المضافة",
    description: "إشعار بتقديم إقرار ضريبة القيمة المضافة للفترة الضريبية المستحقة.",
    keywordsAr: ["إقرار ضريبة القيمة المضافة", "موعد التقديم", "الفترة الضريبية", "ضريبة القيمة المضافة", "آخر موعد", "تقديم الإقرار"],
    keywordsEn: ["VAT return", "filing due", "tax period", "submission deadline"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 30,
    responseTemplateAr:
      "استلمنا إشعار ضريبة القيمة المضافة وفهمنا أنه يتعلق بموعد تقديم الإقرار عن الفترة الحالية. الخطوة التالية الآن هي تجهيز بيانات الفترة ومراجعتها قبل رفع الإقرار في الموعد النظامي، وإذا ظهرت أي فروقات أو نقاط غير واضحة فسيقوم الفريق بتأكيدها معك سريعاً قبل الإرسال."
  },
  {
    governmentBodyCode: "ZATCA",
    code: "ZATCA_VAT_LATE_FILING",
    nameEn: "Late VAT return penalty notice",
    nameAr: "إشعار غرامة تأخر في تقديم إقرار القيمة المضافة",
    description: "إشعار بفرض غرامة نتيجة تأخر تقديم إقرار ضريبة القيمة المضافة.",
    keywordsAr: ["غرامة", "تأخر في التقديم", "القيمة المضافة", "مخالفة ضريبية", "سداد الغرامة", "إقرار متأخر"],
    keywordsEn: ["late filing penalty", "VAT penalty", "overdue return", "fine"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا إشعار الغرامة وفهمنا أن هناك تأخراً مرتبطاً بإقرار ضريبة القيمة المضافة. الخطوة التالية هي مراجعة فترة الإقرار والسبب النظامي المسجل على الإشعار فوراً لتحديد إن كان يلزم اعتراض أو استكمال ناقص، وسيعود إليك الفريق خلال وقت قصير بتوجيه واضح ومحدد حسب المستند."
  },
  {
    governmentBodyCode: "ZATCA",
    code: "ZATCA_EINVOICE_NON_COMPLIANCE",
    nameEn: "FATOORA Phase 2 non-compliance",
    nameAr: "إشعار عدم امتثال للفوترة الإلكترونية",
    description: "إشعار بمخالفة متطلبات الفوترة الإلكترونية مرحلة الربط والتكامل.",
    keywordsAr: ["الفوترة الإلكترونية", "فاتورة", "مرحلة الربط", "عدم الامتثال", "مخالفة", "التكامل"],
    keywordsEn: ["e-invoicing", "FATOORA", "non-compliance", "phase 2", "integration"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 5,
    responseTemplateAr:
      "وصلتنا ملاحظة عدم الامتثال في الفوترة الإلكترونية، ويبدو أن الموضوع مرتبط بمتطلبات الربط أو إصدار الفواتير بالشكل النظامي. الخطوة التالية الآن هي فحص الإعدادات والسجلات الفنية المرتبطة بالنظام المستخدم لديك بشكل عاجل، ثم سنوافيك بتوصية عملية واضحة لتصحيح الوضع بأسرع وقت."
  },
  {
    governmentBodyCode: "ZATCA",
    code: "ZATCA_ZAKAT_ASSESSMENT",
    nameEn: "Annual Zakat assessment notification",
    nameAr: "إشعار ربط زكوي سنوي",
    description: "إشعار بصدور ربط أو تقييم زكوي سنوي على المنشأة.",
    keywordsAr: ["الربط الزكوي", "تقييم زكوي", "الزكاة", "السنة المالية", "اعتراض", "إشعار زكوي"],
    keywordsEn: ["zakat assessment", "annual zakat", "assessment notice", "objection"],
    defaultUrgency: 3,
    requiresProfessional: true,
    typicalDeadlineDays: 120,
    responseTemplateAr:
      "استلمنا إشعار الربط الزكوي وفهمنا أنه يتعلق بتقييم سنوي على المنشأة. الخطوة التالية هي مطابقة الأسس الواردة في الإشعار مع القوائم والبيانات المالية المعتمدة قبل اتخاذ أي موقف، وسيقوم الفريق بمراجعة العناصر الجوهرية ثم العودة لك بتوصية مناسبة ضمن المهلة النظامية."
  },
  {
    governmentBodyCode: "ZATCA",
    code: "ZATCA_AUDIT_REQUEST",
    nameEn: "Tax audit or document request",
    nameAr: "طلب تدقيق أو مستندات ضريبية",
    description: "طلب تقديم مستندات أو بيانات ضمن مراجعة أو تدقيق ضريبي.",
    keywordsAr: ["تدقيق", "مراجعة ضريبية", "طلب مستندات", "إرفاق الوثائق", "رد خلال", "بيانات ضريبية"],
    keywordsEn: ["tax audit", "document request", "provide documents", "review"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 20,
    responseTemplateAr:
      "استلمنا طلب التدقيق الضريبي ويبدو أن المطلوب هو تقديم مستندات أو بيانات داعمة خلال مهلة محددة. الخطوة التالية الآن هي تجميع المستندات المرتبطة بالفترة أو المعاملة المذكورة دون تأخير، وسيتولى الفريق ترتيب المتطلبات معك حتى يكون الرد منضبطاً وواضحاً."
  },
  {
    governmentBodyCode: "ZATCA",
    code: "ZATCA_REFUND_STATUS",
    nameEn: "VAT refund processing update",
    nameAr: "تحديث حالة طلب استرداد ضريبة",
    description: "إشعار بحالة معالجة طلب استرداد ضريبة القيمة المضافة.",
    keywordsAr: ["استرداد", "طلب الاسترداد", "حالة الطلب", "القيمة المضافة", "قيد المعالجة", "إشعار تحديث"],
    keywordsEn: ["refund status", "VAT refund", "processing update", "refund request"],
    defaultUrgency: 2,
    requiresProfessional: false,
    typicalDeadlineDays: null,
    responseTemplateAr:
      "استلمنا تحديث حالة طلب الاسترداد، ويبدو أن الرسالة تتعلق بمسار المعالجة وليس بإجراء طارئ مباشر. الخطوة التالية هي التحقق من الحالة الحالية والطلبات الإضافية إن وجدت داخل البوابة، وسنراجع الإشعار معك ثم نوضح لك إن كان هناك أي إجراء مطلوب من طرفك."
  },
  {
    governmentBodyCode: "ZATCA",
    code: "ZATCA_OBJECTION_RESPONSE",
    nameEn: "Response to taxpayer objection",
    nameAr: "رد على اعتراض ضريبي",
    description: "إشعار بنتيجة أو رد يتعلق باعتراض سبق تقديمه.",
    keywordsAr: ["الاعتراض", "نتيجة الاعتراض", "رد الهيئة", "قرار الاعتراض", "قبول الاعتراض", "رفض الاعتراض"],
    keywordsEn: ["objection response", "tax objection", "decision", "response"],
    defaultUrgency: 3,
    requiresProfessional: true,
    typicalDeadlineDays: 15,
    responseTemplateAr:
      "وصلنا الرد على الاعتراض الضريبي وفهمنا أن هناك قراراً أو ملاحظات تحتاج قراءة دقيقة قبل التحرك. الخطوة التالية هي مراجعة النتيجة وربطها بالاعتراض السابق والمستندات الداعمة لتحديد المسار الأنسب، وسيعود إليك الفريق قريباً بتفسير عملي وما إذا كانت هناك خطوة لاحقة مطلوبة."
  },
  {
    governmentBodyCode: "GOSI",
    code: "GOSI_CONTRIBUTION_DUE",
    nameEn: "Monthly contribution reminder",
    nameAr: "تذكير بسداد اشتراكات التأمينات",
    description: "تذكير شهري بسداد اشتراكات التأمينات الاجتماعية.",
    keywordsAr: ["اشتراكات", "التأمينات الاجتماعية", "سداد", "الشهر الحالي", "موعد الاستحقاق", "الاشتراك الشهري"],
    keywordsEn: ["contribution due", "GOSI", "monthly contribution", "payment reminder"],
    defaultUrgency: 3,
    requiresProfessional: false,
    typicalDeadlineDays: 15,
    responseTemplateAr:
      "استلمنا تذكير التأمينات الاجتماعية ويبدو أنه يتعلق باستحقاق الاشتراك الشهري على المنشأة. الخطوة التالية هي مطابقة عدد المشتركين والأجور المسجلة ثم إتمام السداد ضمن المهلة المحددة لتجنب أي مبالغ إضافية، وسنؤكد معك سريعاً إذا ظهر في الإشعار ما يستدعي مراجعة أعمق."
  },
  {
    governmentBodyCode: "GOSI",
    code: "GOSI_CONTRIBUTION_OVERDUE",
    nameEn: "Overdue contribution notice",
    nameAr: "إشعار اشتراكات متأخرة",
    description: "إشعار بوجود اشتراكات تأمينات متأخرة أو غير مسددة.",
    keywordsAr: ["متأخرات", "اشتراكات متأخرة", "التأمينات", "المبلغ المستحق", "تأخير السداد", "غرامة"],
    keywordsEn: ["overdue contribution", "late payment", "GOSI dues", "arrears"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا إشعار المتأخرات من التأمينات الاجتماعية وفهمنا أن هناك مبالغ أو فترات غير مسددة تحتاج معالجة قريبة. الخطوة التالية الآن هي مراجعة الأشهر والمشتركين المرتبطين بالمطالبة قبل أي سداد أو اعتراض، وسيقوم الفريق بترتيب صورة الالتزام معك ثم توجيهك إلى الإجراء الأنسب."
  },
  {
    governmentBodyCode: "GOSI",
    code: "GOSI_EMPLOYEE_REGISTRATION",
    nameEn: "New employee registration required",
    nameAr: "ضرورة تسجيل موظف جديد",
    description: "تنبيه بوجوب تسجيل موظف جديد في التأمينات الاجتماعية.",
    keywordsAr: ["تسجيل موظف", "إضافة مشترك", "موظف جديد", "خلال 30 يوماً", "بيانات العامل", "الاشتراك"],
    keywordsEn: ["employee registration", "new employee", "register worker", "subscriber"],
    defaultUrgency: 3,
    requiresProfessional: false,
    typicalDeadlineDays: 30,
    responseTemplateAr:
      "وصلنا التنبيه الخاص بتسجيل الموظف الجديد في التأمينات، ويبدو أن المطلوب استكمال تسجيل العامل ضمن المدة النظامية. الخطوة التالية هي التحقق من بيانات الموظف وتاريخ مباشرته ثم إتمام التسجيل في الحساب المعتمد، وسنراجع معك أي تعارض محتمل إذا كانت البيانات لا تطابق السجلات الحالية."
  },
  {
    governmentBodyCode: "GOSI",
    code: "GOSI_EMPLOYEE_UPDATE",
    nameEn: "Employee status change required",
    nameAr: "تحديث حالة موظف",
    description: "تنبيه بضرورة تعديل أو تحديث حالة موظف في التأمينات.",
    keywordsAr: ["تحديث الحالة", "استبعاد مشترك", "تعديل الأجر", "نقل موظف", "حالة الموظف", "بيانات التأمينات"],
    keywordsEn: ["employee update", "status change", "salary update", "subscriber update"],
    defaultUrgency: 3,
    requiresProfessional: false,
    typicalDeadlineDays: 14,
    responseTemplateAr:
      "استلمنا إشعار تحديث حالة الموظف في التأمينات الاجتماعية وفهمنا أن هناك بياناً يحتاج تعديل أو توثيق. الخطوة التالية هي مراجعة وضع الموظف المذكور وسبب التغيير ثم تحديث البيانات من خلال الحساب الرسمي، وسنوضح لك مباشرة إذا كانت الحالة تستدعي مستندات إضافية أو معالجة مختلفة."
  },
  {
    governmentBodyCode: "GOSI",
    code: "GOSI_INJURY_CLAIM",
    nameEn: "Work injury claim filed",
    nameAr: "بلاغ أو مطالبة إصابة عمل",
    description: "إشعار يتعلق بمطالبة أو بلاغ إصابة عمل.",
    keywordsAr: ["إصابة عمل", "تعويض", "بلاغ إصابة", "مطالبة", "حادث عمل", "مراجعة الحالة"],
    keywordsEn: ["work injury", "injury claim", "accident", "compensation"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 3,
    responseTemplateAr:
      "استلمنا إشعار إصابة العمل، ويفهم منه أن هناك مطالبة أو إجراء عاجل يرتبط بواقعة مهنية لموظف. الخطوة التالية الآن هي جمع تقرير الحادث والبيانات الطبية والإدارية المرتبطة بالحالة فوراً، وسيتابع الفريق معك بشكل مباشر لتحديد الاستجابة النظامية المناسبة دون تأخير."
  },
  {
    governmentBodyCode: "MOJ",
    code: "MOJ_CASE_FILED",
    nameEn: "Civil or commercial case filed",
    nameAr: "رفع قضية مدنية أو تجارية",
    description: "إشعار بوجود قضية مرفوعة ضد المنشأة أو صاحبها.",
    keywordsAr: ["تم قيد القضية", "دعوى", "رقم القضية", "المدعي", "المحكمة", "صحيفة الدعوى"],
    keywordsEn: ["case filed", "lawsuit", "claim", "case number", "court"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 2,
    responseTemplateAr:
      "استلمنا إشعار القضية وفهمنا أن هناك دعوى أو إجراء قضائي مرفوعاً يتطلب متابعة عاجلة. الخطوة التالية الآن هي مراجعة رقم القضية وموضوعها وأي موعد وارد في التبليغ فوراً حتى لا يفوتك إجراء مهم، وسيعود إليك الفريق بسرعة لتنسيق المتابعة القانونية المناسبة."
  },
  {
    governmentBodyCode: "MOJ",
    code: "MOJ_HEARING_SCHEDULED",
    nameEn: "Court hearing date notification",
    nameAr: "إشعار بموعد جلسة قضائية",
    description: "تبليغ بموعد جلسة أمام المحكمة.",
    keywordsAr: ["موعد جلسة", "جلسة قضائية", "الحضور", "الترافع", "الموعد المحدد", "المحكمة"],
    keywordsEn: ["hearing scheduled", "court hearing", "attendance", "session date"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 1,
    responseTemplateAr:
      "استلمنا تبليغ موعد الجلسة، ويبدو أن هناك حضوراً أو تمثيلاً مطلوباً أمام المحكمة خلال فترة قريبة جداً. الخطوة التالية الآن هي تثبيت موعد الجلسة ومرجعها وتجهيز المستندات الأساسية المتعلقة بها، وسيبادر الفريق بالتواصل معك سريعاً لترتيب المتابعة القانونية بالشكل المناسب."
  },
  {
    governmentBodyCode: "MOJ",
    code: "MOJ_JUDGMENT_ISSUED",
    nameEn: "Judgment delivered in your case",
    nameAr: "صدور حكم في القضية",
    description: "إشعار بصدور حكم قضائي في قضية قائمة.",
    keywordsAr: ["صدر الحكم", "نص الحكم", "الاعتراض", "الاستئناف", "الحكم القضائي", "قرار المحكمة"],
    keywordsEn: ["judgment issued", "court decision", "appeal", "verdict"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 30,
    responseTemplateAr:
      "وصلنا إشعار صدور الحكم وفهمنا أن القضية انتقلت إلى مرحلة تتطلب قراءة القرار ومواعيده بدقة. الخطوة التالية هي مراجعة منطوق الحكم وتاريخ التبليغ الرسمي قبل اتخاذ أي إجراء لاحق، وسيقوم الفريق بتحليل المستند معك ثم توضيح المسار الأنسب خلال المهلة المتاحة."
  },
  {
    governmentBodyCode: "MOJ",
    code: "MOJ_EXPERT_APPOINTMENT",
    nameEn: "Court expert appointment",
    nameAr: "تعيين خبير قضائي",
    description: "إشعار بتعيين خبير أو طلب تواصل مع خبير في القضية.",
    keywordsAr: ["تعيين خبير", "الخبير القضائي", "تقرير خبير", "معاينة", "إفادة", "تزويد الخبير"],
    keywordsEn: ["expert appointment", "court expert", "expert report", "inspection"],
    defaultUrgency: 3,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا إشعار تعيين الخبير في القضية وفهمنا أن المرحلة الحالية تتطلب تزويده بمعلومات أو مستندات محددة. الخطوة التالية هي حصر الملفات ذات الصلة بموضوع النزاع وتجهيزها بطريقة مرتبة قبل التواصل، وسيتابع الفريق معك ما يلزم حتى تكون الإفادة متماسكة وواضحة."
  },
  {
    governmentBodyCode: "MOJ",
    code: "MOJ_MEDIATION_INVITATION",
    nameEn: "Mediation invitation",
    nameAr: "دعوة إلى صلح أو وساطة",
    description: "دعوة لحضور جلسة وساطة أو صلح.",
    keywordsAr: ["الصلح", "الوساطة", "دعوة", "جلسة صلح", "مصالحة", "تسوية"],
    keywordsEn: ["mediation", "settlement", "conciliation", "invitation"],
    defaultUrgency: 3,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا دعوة الوساطة أو الصلح، ويظهر أن هناك فرصة لمعالجة النزاع قبل الاستمرار في المسار القضائي الكامل. الخطوة التالية الآن هي مراجعة موضوع الدعوة والأطراف والنطاق المقترح للتسوية قبل الرد، وسيراجع الفريق معك الإشعار ثم يوضح أفضل طريقة للتعامل معه."
  },
  {
    governmentBodyCode: "BOG",
    code: "BOG_CASE_FILED",
    nameEn: "Administrative case filed",
    nameAr: "قضية إدارية مقيدة",
    description: "إشعار بقيد دعوى أمام ديوان المظالم.",
    keywordsAr: ["ديوان المظالم", "قيد الدعوى", "قضية إدارية", "الجهة الحكومية", "رقم الدعوى", "تبليغ"],
    keywordsEn: ["Board of Grievances", "administrative case", "claim filed", "case number"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 3,
    responseTemplateAr:
      "استلمنا إشعار الدعوى الإدارية، وفهمنا أن الموضوع مرتبط بإجراء قضائي أمام ديوان المظالم ضد جهة حكومية أو بشأن قرار إداري. الخطوة التالية هي مراجعة بيانات الدعوى والطلبات الواردة فيها فوراً، وسيتابع الفريق معك تفاصيل المستند لتحديد أسلوب التعامل القانوني المناسب."
  },
  {
    governmentBodyCode: "BOG",
    code: "BOG_HEARING_SCHEDULED",
    nameEn: "Hearing date at Board of Grievances",
    nameAr: "موعد جلسة في ديوان المظالم",
    description: "إشعار بموعد جلسة أمام ديوان المظالم.",
    keywordsAr: ["موعد الجلسة", "ديوان المظالم", "الحضور", "الترافع", "الموعد", "تبليغ الجلسة"],
    keywordsEn: ["hearing date", "Board of Grievances", "session", "attendance"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 1,
    responseTemplateAr:
      "وصلنا تبليغ الجلسة أمام ديوان المظالم ويبدو أن هناك موعداً قريباً يحتاج إلى تجهيز ومتابعة سريعة. الخطوة التالية هي تثبيت التاريخ والوقت ومرجع الدعوى فوراً مع جمع المستندات الأساسية ذات الصلة، وسيقوم الفريق بالتواصل معك سريعاً لترتيب ما يلزم قبل الجلسة."
  },
  {
    governmentBodyCode: "EFAA",
    code: "EFAA_PAYMENT_ORDER",
    nameEn: "Enforcement of payment order",
    nameAr: "أمر تنفيذ سداد",
    description: "إشعار تنفيذ يتعلق بأمر سداد أو مطالبة مالية واجبة التنفيذ.",
    keywordsAr: ["محكمة التنفيذ", "أمر تنفيذ", "سداد", "منفذ ضده", "مهلة التنفيذ", "مبلغ المطالبة"],
    keywordsEn: ["payment order", "enforcement", "execution court", "payment demand"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 1,
    responseTemplateAr:
      "استلمنا أمر التنفيذ وفهمنا أن هناك مطالبة مالية أو التزاماً تنفيذياً يتطلب تحركاً فورياً اليوم. الخطوة التالية الآن هي مراجعة رقم الطلب والمبلغ والمهلة الواردة في الإشعار دون انتظار، وسيبادر الفريق بالتواصل معك مباشرة لتحديد الاستجابة العاجلة المناسبة لهذه الحالة."
  },
  {
    governmentBodyCode: "EFAA",
    code: "EFAA_ACCOUNT_FREEZE",
    nameEn: "Bank account freeze notification",
    nameAr: "إشعار تجميد حساب بنكي",
    description: "إشعار بحجز أو تجميد حسابات بسبب إجراء تنفيذي.",
    keywordsAr: ["إيقاف الحساب", "تجميد الحساب", "حجز", "محكمة التنفيذ", "تنفيذ", "البنك"],
    keywordsEn: ["account freeze", "bank freeze", "execution", "attachment"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 0,
    responseTemplateAr:
      "وصلنا إشعار تجميد الحساب البنكي، وهذا يدل على إجراء تنفيذي عاجل يحتاج متابعة فورية للغاية. الخطوة التالية الآن هي تزويد الفريق بنسخة الإشعار ومرجع الطلب التنفيذي حالاً حتى نراجع الأساس والإجراء المرتبط به، وسنتابع معك بشكل مباشر بسبب حساسية وتأثير هذا النوع من الحالات."
  },
  {
    governmentBodyCode: "EFAA",
    code: "EFAA_EXECUTION_NOTICE",
    nameEn: "Asset execution notice",
    nameAr: "إشعار تنفيذ على أصول",
    description: "إشعار بإجراءات تنفيذ على أصول أو ممتلكات.",
    keywordsAr: ["التنفيذ على الأصول", "حجز الأصول", "بيع بالمزاد", "إشعار تنفيذ", "الممتلكات", "إجراء تنفيذي"],
    keywordsEn: ["asset execution", "asset seizure", "execution notice", "auction"],
    defaultUrgency: 5,
    requiresProfessional: true,
    typicalDeadlineDays: 1,
    responseTemplateAr:
      "استلمنا إشعار التنفيذ على الأصول وفهمنا أن هناك خطوة تنفيذية مؤثرة قد تمس ممتلكات أو حقوقاً مالية للمنشأة. الخطوة التالية الآن هي مراجعة نوع الأصل والإجراء والمرجع التنفيذي فوراً، وسيراجع الفريق المستند على وجه السرعة ثم ينسق معك التحرك المناسب دون تأخير."
  },
  {
    governmentBodyCode: "QIWA",
    code: "QIWA_CONTRACT_AUTH_REQUIRED",
    nameEn: "Employment contract authentication needed",
    nameAr: "الحاجة إلى توثيق عقد عمل",
    description: "تنبيه بطلب توثيق أو اعتماد عقد عمل عبر قوى.",
    keywordsAr: ["توثيق العقد", "قوى", "عقد العمل", "اعتماد العقد", "الموظف", "المنصة"],
    keywordsEn: ["contract authentication", "Qiwa", "employment contract", "approval required"],
    defaultUrgency: 3,
    requiresProfessional: false,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا التنبيه المتعلق بتوثيق عقد العمل عبر قوى، ويبدو أن العقد يحتاج اعتماداً أو استكمالاً في المنصة. الخطوة التالية هي مراجعة بيانات العقد والموظف ثم إتمام التوثيق من الحساب المعتمد قبل انتهاء المهلة، وسنتأكد معك من أي ملاحظة إضافية إذا كانت الرسالة تتضمن استثناءً معيناً."
  },
  {
    governmentBodyCode: "QIWA",
    code: "QIWA_SAUDIZATION_WARNING",
    nameEn: "Saudization percentage below required",
    nameAr: "إنذار انخفاض نسبة التوطين",
    description: "تنبيه بانخفاض نسبة التوطين عن الحد المطلوب.",
    keywordsAr: ["التوطين", "نسبة السعودة", "إنذار", "الحد المطلوب", "قوى", "نطاق"],
    keywordsEn: ["Saudization warning", "localization", "quota", "Qiwa"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "وصلنا تنبيه التوطين وفهمنا أن نسبة السعودة الحالية قد تكون دون المتطلب النظامي للمنشأة. الخطوة التالية هي مراجعة وضع العاملين المسجلين والكيان المرتبط بالتنبيه قبل اتخاذ أي إجراء تصحيحي، وسيعمل الفريق على قراءة الإشعار معك ثم توضيح المسار العملي الأقرب لوضعك."
  },
  {
    governmentBodyCode: "QIWA",
    code: "QIWA_NITAQAT_DOWNGRADE",
    nameEn: "Nitaqat band downgrade warning",
    nameAr: "تحذير خفض نطاق نطاقات",
    description: "تحذير من تراجع نطاق المنشأة في نطاقات.",
    keywordsAr: ["نطاقات", "خفض النطاق", "اللون", "تحذير", "قوى", "تصنيف المنشأة"],
    keywordsEn: ["Nitaqat downgrade", "band downgrade", "Qiwa warning", "classification"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا تحذير خفض النطاق في نطاقات، ويبدو أن تصنيف المنشأة قد يتأثر إذا لم تتم المعالجة في الوقت المناسب. الخطوة التالية هي مراجعة مؤشرات التوطين المرتبطة بالمنشأة حالياً وتحديد سبب التراجع، وسيعود إليك الفريق بسرعة بتفسير واضح وما يلزم عمله بصورة عملية."
  },
  {
    governmentBodyCode: "QIWA",
    code: "QIWA_WORK_PERMIT_EXPIRY",
    nameEn: "Work permit renewal required",
    nameAr: "تجديد رخصة عمل مطلوب",
    description: "إشعار بقرب انتهاء أو انتهاء رخصة العمل.",
    keywordsAr: ["رخصة العمل", "تجديد", "انتهاء الصلاحية", "قوى", "الترخيص", "المهلة"],
    keywordsEn: ["work permit expiry", "renewal required", "labor permit", "Qiwa"],
    defaultUrgency: 4,
    requiresProfessional: false,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا إشعار رخصة العمل وفهمنا أن هناك تجديداً مطلوباً خلال فترة قريبة. الخطوة التالية هي التحقق من صلاحية الرخصة والرسوم والمتطلبات المرتبطة بالعامل أو المنشأة ثم البدء في التجديد عبر القنوات المعتمدة، وسنراجع معك الرسالة لتأكيد ما إذا كان هناك مانع أو شرط إضافي."
  },
  {
    governmentBodyCode: "MHRSD",
    code: "MUDAD_WPS_VIOLATION",
    nameEn: "Wage Protection System violation",
    nameAr: "مخالفة نظام حماية الأجور",
    description: "إشعار يتعلق بمخالفة أو تعثر في نظام حماية الأجور عبر مدد.",
    keywordsAr: ["حماية الأجور", "مدد", "مخالفة", "التزام الرواتب", "رفع الملف", "تأخير الرواتب"],
    keywordsEn: ["WPS violation", "Mudad", "wage protection", "salary compliance"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "وصلنا إشعار مخالفة حماية الأجور، ويبدو أن هناك تعثراً في ملف الرواتب أو التزام الرفع عبر مدد. الخطوة التالية هي مراجعة ملف الأجور للفترة المشار إليها ومطابقته مع بيانات العاملين فوراً، وسيقوم الفريق بتحليل الإشعار ثم توجيهك إلى التصحيح المطلوب بأسرع وقت."
  },
  {
    governmentBodyCode: "MUQEEM",
    code: "MUQEEM_IQAMA_EXPIRY",
    nameEn: "Iqama renewal required",
    nameAr: "تجديد الإقامة مطلوب",
    description: "تنبيه بقرب انتهاء أو انتهاء الإقامة.",
    keywordsAr: ["تجديد الإقامة", "انتهاء الإقامة", "مقيم", "صلاحية الإقامة", "العامل", "التجديد"],
    keywordsEn: ["Iqama expiry", "renewal required", "Muqeem", "residency renewal"],
    defaultUrgency: 4,
    requiresProfessional: false,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا تنبيه الإقامة وفهمنا أن هناك تجديداً مطلوباً لأحد المقيمين خلال فترة قريبة. الخطوة التالية الآن هي مراجعة صلاحية الإقامة والمتطلبات المرتبطة بها والبدء في إجراء التجديد عبر القناة المعتمدة، وسنؤكد معك سريعاً إذا كان الإشعار يتضمن عائقاً إضافياً يلزم معالجته."
  },
  {
    governmentBodyCode: "MUQEEM",
    code: "MUQEEM_EXIT_REENTRY",
    nameEn: "Exit or re-entry visa matter",
    nameAr: "مسألة خروج وعودة",
    description: "إشعار يخص تأشيرة خروج وعودة أو صلاحيتها.",
    keywordsAr: ["خروج وعودة", "التأشيرة", "مقيم", "صلاحية التأشيرة", "العودة", "انتهاء"],
    keywordsEn: ["exit re-entry", "visa", "Muqeem", "travel permit"],
    defaultUrgency: 3,
    requiresProfessional: false,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "وصلنا إشعار الخروج والعودة، ويبدو أن الموضوع يتعلق بصلاحية تأشيرة أو إجراء مرتبط بسفر أحد العاملين. الخطوة التالية هي مراجعة بيانات التأشيرة وتاريخ انتهائها أو استخدامها من الحساب المعتمد، وسنساعدك في قراءة الإشعار والتأكد من أي خطوة لازمة بحسب التفاصيل الواردة."
  },
  {
    governmentBodyCode: "MOC",
    code: "MOC_CR_RENEWAL",
    nameEn: "Commercial registration renewal due",
    nameAr: "استحقاق تجديد السجل التجاري",
    description: "تنبيه بموعد تجديد السجل التجاري.",
    keywordsAr: ["السجل التجاري", "تجديد", "وزارة التجارة", "انتهاء السجل", "تاريخ الانتهاء", "التجديد"],
    keywordsEn: ["CR renewal", "commercial registration", "MOC", "renewal due"],
    defaultUrgency: 4,
    requiresProfessional: false,
    typicalDeadlineDays: 30,
    responseTemplateAr:
      "استلمنا تنبيه السجل التجاري وفهمنا أن موعد التجديد أصبح قريباً. الخطوة التالية هي مراجعة صلاحية السجل والالتزامات المرتبطة به ثم بدء إجراء التجديد قبل تاريخ الانتهاء لتفادي أي تعطيل، وسنراجع معك الإشعار إذا كان يتضمن اشتراطات إضافية مثل بيانات أو إفصاحات لازمة."
  },
  {
    governmentBodyCode: "MOC",
    code: "MOC_UBO_DISCLOSURE",
    nameEn: "Ultimate beneficial owner disclosure required",
    nameAr: "الإفصاح عن المستفيد الحقيقي مطلوب",
    description: "تنبيه بوجوب تقديم أو تحديث بيانات المستفيد الحقيقي.",
    keywordsAr: ["المستفيد الحقيقي", "الإفصاح", "وزارة التجارة", "تحديث البيانات", "الملكية", "الهيكل"],
    keywordsEn: ["UBO disclosure", "beneficial owner", "disclosure required", "MOC"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا إشعار الإفصاح عن المستفيد الحقيقي وفهمنا أن هناك تحديثاً أو إفصاحاً مطلوباً على بيانات الملكية. الخطوة التالية الآن هي مراجعة هيكل الملكية والأطراف ذات العلاقة قبل إدخال أو تعديل البيانات في المنصة، وسيقوم الفريق بمراجعة الرسالة معك ثم توضيح الإجراء المناسب."
  },
  {
    governmentBodyCode: "MOC",
    code: "MOC_COMMERCIAL_VIOLATION",
    nameEn: "Commercial law violation notice",
    nameAr: "إشعار مخالفة تجارية",
    description: "إشعار بمخالفة أو إجراء رقابي من وزارة التجارة.",
    keywordsAr: ["مخالفة تجارية", "وزارة التجارة", "الرقابة", "ضبط", "غرامة", "إشعار مخالفة"],
    keywordsEn: ["commercial violation", "inspection", "MOC violation", "fine"],
    defaultUrgency: 4,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "وصلنا إشعار المخالفة التجارية وفهمنا أن هناك ملاحظة رقابية أو إجراء نظامي يتطلب مراجعة قريبة. الخطوة التالية هي قراءة وصف المخالفة والمهلة أو المرجع الوارد في الإشعار بدقة قبل الرد أو السداد، وسيقوم الفريق بتحليل المستند معك ثم توضيح التصرف الأنسب."
  },
  {
    governmentBodyCode: "BALADY",
    code: "BALADY_LICENSE_RENEWAL",
    nameEn: "Municipal license renewal",
    nameAr: "تجديد رخصة بلدية",
    description: "تنبيه بموعد تجديد الرخصة البلدية أو الصحية.",
    keywordsAr: ["الرخصة البلدية", "تجديد الرخصة", "بلدي", "الرخصة الصحية", "انتهاء", "البلدية"],
    keywordsEn: ["license renewal", "municipal license", "Balady", "permit renewal"],
    defaultUrgency: 3,
    requiresProfessional: false,
    typicalDeadlineDays: 14,
    responseTemplateAr:
      "استلمنا إشعار الرخصة البلدية وفهمنا أن هناك تجديداً مطلوباً خلال فترة قريبة. الخطوة التالية هي مراجعة صلاحية الرخصة والمتطلبات المحدثة المرتبطة بالنشاط ثم بدء إجراء التجديد عبر بلدي، وسنراجع معك الرسالة إذا كانت تتضمن شرطاً إضافياً مثل كشف أو مستند معين."
  },
  {
    governmentBodyCode: "BALADY",
    code: "BALADY_INSPECTION_NOTICE",
    nameEn: "Municipal inspection scheduled",
    nameAr: "إشعار بزيارة تفتيش بلدية",
    description: "إشعار بموعد تفتيش أو زيارة رقابية بلدية.",
    keywordsAr: ["تفتيش", "زيارة رقابية", "بلدي", "موعد الزيارة", "مفتش", "الاشتراطات"],
    keywordsEn: ["inspection notice", "municipal inspection", "visit", "Balady"],
    defaultUrgency: 3,
    requiresProfessional: false,
    typicalDeadlineDays: 3,
    responseTemplateAr:
      "وصلنا إشعار التفتيش البلدي ويبدو أن هناك زيارة رقابية أو موعداً محدداً للموقع. الخطوة التالية هي مراجعة الاشتراطات الأساسية المرتبطة بالنشاط وتجهيز الموقع والمستندات التشغيلية المطلوبة قبل الموعد، وسنراجع الإشعار معك للتأكد من أي نقاط خاصة وردت فيه."
  },
  {
    governmentBodyCode: "BALADY",
    code: "BALADY_VIOLATION",
    nameEn: "Municipal violation issued",
    nameAr: "مخالفة بلدية صادرة",
    description: "إشعار بمخالفة صادرة من البلدية أو منصة بلدي.",
    keywordsAr: ["مخالفة بلدية", "بلدي", "الغرامة", "الاشتراطات", "رصد مخالفة", "الإغلاق"],
    keywordsEn: ["municipal violation", "Balady violation", "fine", "compliance breach"],
    defaultUrgency: 3,
    requiresProfessional: true,
    typicalDeadlineDays: 7,
    responseTemplateAr:
      "استلمنا إشعار المخالفة البلدية وفهمنا أن هناك ملاحظة رقابية تستلزم مراجعة خلال مهلة محددة. الخطوة التالية هي التأكد من نوع المخالفة ومرجعها وحالة الموقع الحالية قبل اتخاذ أي إجراء، وسيعود إليك الفريق قريباً بتوجيه واضح حول أفضل طريقة لمعالجة الوضع."
  }
];

async function seedGovernmentBodies() {
  for (const body of governmentBodies) {
    await prisma.governmentBody.upsert({
      where: { code: body.code },
      update: body,
      create: body
    });
  }
}

async function seedNoticeTemplates() {
  for (const template of noticeTemplates) {
    await prisma.noticeTypeTemplate.upsert({
      where: { code: template.code },
      update: template,
      create: template
    });
  }
}

async function main() {
  await seedGovernmentBodies();
  await seedNoticeTemplates();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
