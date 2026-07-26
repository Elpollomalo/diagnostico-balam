// Contenido de la landing page pública de Ponexo (antes "Diagnóstico de
// Marketing"). Multi-idioma (ES/EN/ZH/HI), mismo sistema que el resto del
// producto (ver LangText en ./config.ts) — nunca un solo idioma fijo.
//
// Nota: ZH e HI son traducciones hechas por IA, competentes pero sin
// revisión de un hablante nativo todavía — vale la pena una revisión antes
// de considerarlas definitivas para un lanzamiento amplio en esos mercados.

import type { LangText } from "./config";

export const BRAND_NAME = "Ponexo";

interface Capability {
  title: LangText;
  description: LangText;
}

export const hero = {
  eyebrow: {
    es: "Diagnóstico de negocio con IA",
    en: "AI Business Diagnostics",
    zh: "AI 商业诊断",
    hi: "एआई व्यवसाय निदान",
  } as LangText,
  headline: {
    es: "Descubre qué está frenando el crecimiento de tu empresa.",
    en: "Find out what's holding your business back.",
    zh: "找出阻碍您业务增长的原因。",
    hi: "जानें कि आपके व्यवसाय की वृद्धि में क्या बाधा डाल रहा है।",
  } as LangText,
  subheadline: {
    es: "Responde un cuestionario breve sobre tu negocio. Recibe un plan de acción claro — directo a tu correo y disponible en tu panel.",
    en: "Answer a short set of questions about your business. Get a clear, actionable plan — sent to your inbox and saved to your dashboard.",
    zh: "回答几个关于您业务的简短问题，获取清晰可行的增长计划——发送至您的邮箱，并保存在您的控制面板中。",
    hi: "अपने व्यवसाय के बारे में कुछ संक्षिप्त प्रश्नों के उत्तर दें। एक स्पष्ट, कार्यान्वित करने योग्य योजना पाएं — सीधे आपके ईमेल पर और आपके डैशबोर्ड में सुरक्षित।",
  } as LangText,
  ctaPrimary: {
    es: "Iniciar mi diagnóstico",
    en: "Start your diagnostic",
    zh: "开始诊断",
    hi: "अपना निदान शुरू करें",
  } as LangText,
  ctaSecondary: {
    es: "Ver cómo funciona",
    en: "See how it works",
    zh: "了解运作方式",
    hi: "देखें यह कैसे काम करता है",
  } as LangText,
};

export const whatItDoes = {
  title: {
    es: "Qué hace",
    en: "What it does",
    zh: "功能介绍",
    hi: "यह क्या करता है",
  } as LangText,
  subtitle: {
    es: "Una plataforma, cuatro pasos, un plan.",
    en: "One platform, four steps, one plan.",
    zh: "一个平台，四个步骤，一份计划。",
    hi: "एक प्लेटफ़ॉर्म, चार चरण, एक योजना।",
  } as LangText,
  cards: [
    {
      title: {
        es: "Análisis de marketing",
        en: "Marketing Analysis",
        zh: "营销分析",
        hi: "मार्केटिंग विश्लेषण",
      },
      description: {
        es: "Revisa tu sitio web, contenido y presencia digital frente a lo que realmente funciona en tu industria.",
        en: "Reviews your website, content and digital presence against what actually works in your industry.",
        zh: "对比行业内真正有效的做法，审查您的网站、内容和数字形象。",
        hi: "आपकी वेबसाइट, कंटेंट और डिजिटल उपस्थिति की समीक्षा आपके उद्योग में वास्तव में काम करने वाली चीज़ों के आधार पर करता है।",
      },
    },
    {
      title: {
        es: "Diagnóstico de negocio",
        en: "Business Diagnosis",
        zh: "业务诊断",
        hi: "व्यवसाय निदान",
      },
      description: {
        es: "Identifica los puntos específicos que están limitando tu crecimiento — no consejos genéricos.",
        en: "Identifies the specific gaps that are limiting growth — not generic advice.",
        zh: "找出限制增长的具体问题所在——而非泛泛而谈的建议。",
        hi: "विकास को सीमित करने वाली विशिष्ट कमियों की पहचान करता है — सामान्य सलाह नहीं।",
      },
    },
    {
      title: {
        es: "Oportunidades de crecimiento",
        en: "Growth Opportunities",
        zh: "增长机会",
        hi: "विकास के अवसर",
      },
      description: {
        es: "Detecta los cambios de mayor impacto que puedes hacer, ordenados por esfuerzo y resultado.",
        en: "Surfaces the highest-impact changes you can make, ranked by effort and result.",
        zh: "按投入与效果排序，找出最具影响力的改进方向。",
        hi: "प्रयास और परिणाम के आधार पर सबसे प्रभावी बदलावों को सामने लाता है।",
      },
    },
    {
      title: {
        es: "Perspectiva del cliente",
        en: "Customer Insights",
        zh: "客户洞察",
        hi: "ग्राहक अंतर्दृष्टि",
      },
      description: {
        es: "Muestra cómo se ve tu negocio desde el punto de vista de un cliente.",
        en: "Shows how your business looks from a customer's point of view.",
        zh: "从客户的角度审视您的业务。",
        hi: "दिखाता है कि आपका व्यवसाय ग्राहक की नज़र से कैसा दिखता है।",
      },
    },
    {
      title: {
        es: "Generación de estrategia",
        en: "Strategy Generation",
        zh: "策略生成",
        hi: "रणनीति निर्माण",
      },
      description: {
        es: "Convierte el diagnóstico en un plan paso a paso que puedes aplicar esta semana.",
        en: "Turns the diagnosis into a step-by-step plan you can act on this week.",
        zh: "将诊断结果转化为本周即可执行的分步计划。",
        hi: "निदान को इस सप्ताह लागू करने योग्य चरण-दर-चरण योजना में बदलता है।",
      },
    },
    {
      title: {
        es: "Reportes y automatización",
        en: "Reports & Automation",
        zh: "报告与自动化",
        hi: "रिपोर्ट और ऑटोमेशन",
      },
      description: {
        es: "Entrega tu plan por correo y lo mantiene disponible en tu panel.",
        en: "Delivers your plan by email and keeps it available in your dashboard.",
        zh: "通过邮件发送您的计划，并保存在您的控制面板中随时查看。",
        hi: "आपकी योजना ईमेल द्वारा भेजता है और इसे आपके डैशबोर्ड में उपलब्ध रखता है।",
      },
    },
  ] as Capability[],
};

export const howItWorks = {
  title: {
    es: "Cómo funciona",
    en: "How it works",
    zh: "运作方式",
    hi: "यह कैसे काम करता है",
  } as LangText,
  steps: [
    {
      title: { es: "Analizar", en: "Analyze", zh: "分析", hi: "विश्लेषण" },
      description: {
        es: "Revisamos tu negocio, tu sitio web y tu presencia digital.",
        en: "We review your business, website and digital presence.",
        zh: "我们审查您的业务、网站和数字形象。",
        hi: "हम आपके व्यवसाय, वेबसाइट और डिजिटल उपस्थिति की समीक्षा करते हैं।",
      },
    },
    {
      title: { es: "Diagnosticar", en: "Diagnose", zh: "诊断", hi: "निदान" },
      description: {
        es: "Detectamos fortalezas, debilidades y oportunidades de crecimiento.",
        en: "We detect strengths, weaknesses and growth opportunities.",
        zh: "发现优势、劣势和增长机会。",
        hi: "हम ताकत, कमज़ोरियाँ और विकास के अवसर पहचानते हैं।",
      },
    },
    {
      title: { es: "Recomendar", en: "Recommend", zh: "建议", hi: "सिफ़ारिश" },
      description: {
        es: "Recibes una estrategia construida específicamente para tu negocio.",
        en: "You receive a strategy built specifically for your business.",
        zh: "获得专为您的业务量身定制的策略。",
        hi: "आपको आपके व्यवसाय के लिए विशेष रूप से बनाई गई रणनीति मिलती है।",
      },
    },
    {
      title: { es: "Monitorear", en: "Monitor", zh: "跟踪", hi: "निगरानी" },
      description: {
        es: "Das seguimiento a tu progreso con el tiempo.",
        en: "Track your progress over time.",
        zh: "持续跟踪您的进展。",
        hi: "समय के साथ अपनी प्रगति को ट्रैक करें।",
      },
    },
  ],
};

export const capabilitiesList: LangText[] = whatItDoes.cards.map((c) => c.title);

export const whyUseIt = {
  title: {
    es: "Por qué lo usan",
    en: "Why companies use it",
    zh: "为什么选择我们",
    hi: "कंपनियां इसका उपयोग क्यों करती हैं",
  } as LangText,
  benefits: [
    {
      title: { es: "Claridad", en: "Clarity", zh: "清晰", hi: "स्पष्टता" },
      description: {
        es: "Sin jerga. Sin relleno. Solo lo que hay que corregir y por qué.",
        en: "No jargon. No fluff. Just what to fix and why.",
        zh: "没有术语，没有废话。只有需要改进的地方和原因。",
        hi: "कोई शब्दजाल नहीं। कोई भराव नहीं। बस यह कि क्या ठीक करना है और क्यों।",
      },
    },
    {
      title: { es: "Velocidad", en: "Speed", zh: "快速", hi: "गति" },
      description: {
        es: "Recibe tu plan en minutos, no en semanas.",
        en: "Get your plan in minutes, not weeks.",
        zh: "几分钟内获得计划，而非数周。",
        hi: "हफ़्तों में नहीं, मिनटों में अपनी योजना पाएं।",
      },
    },
    {
      title: { es: "Específico", en: "Specific", zh: "精准", hi: "विशिष्टता" },
      description: {
        es: "Construido a partir de tu negocio real, no de una plantilla.",
        en: "Built from your actual business, not a template.",
        zh: "基于您真实的业务情况，而非通用模板。",
        hi: "किसी टेम्पलेट से नहीं, आपके वास्तविक व्यवसाय से बनाई गई।",
      },
    },
    {
      title: { es: "Continuo", en: "Ongoing", zh: "持续", hi: "निरंतरता" },
      description: {
        es: "Vuelve cuando quieras y da seguimiento a tu progreso.",
        en: "Revisit your plan anytime and track progress.",
        zh: "随时回来查看并跟踪您的进展。",
        hi: "कभी भी वापस आएं और अपनी प्रगति ट्रैक करें।",
      },
    },
  ],
};

export const finalCta = {
  headline: {
    es: "¿Listo para saber en dónde estás parado?",
    en: "Ready to see where you stand?",
    zh: "准备好了解您的现状了吗？",
    hi: "जानने के लिए तैयार हैं कि आप कहां खड़े हैं?",
  } as LangText,
  subheadline: {
    es: "Inicia tu diagnóstico — toma unos minutos.",
    en: "Start your diagnostic — it takes a few minutes.",
    zh: "开始您的诊断——只需几分钟。",
    hi: "अपना निदान शुरू करें — इसमें बस कुछ मिनट लगते हैं।",
  } as LangText,
};

export const nav = {
  langLabel: {
    es: "Idioma",
    en: "Language",
    zh: "语言",
    hi: "भाषा",
  } as LangText,
};

// Textos del LoginForm (puerta de entrada real por correo/OTP). Antes vivían
// hardcodeados en español dentro del componente -- nunca respondían al
// selector de idioma de la landing, aunque el resto de la página sí cambiaba
// (bug real reportado por Carlos el 26 julio 2026: veía el hero en chino
// pero el formulario de correo seguía en español).
export const loginForm = {
  emailTitle: {
    es: "Ingresa tu correo",
    en: "Enter your email",
    zh: "输入您的邮箱",
    hi: "अपना ईमेल दर्ज करें",
  } as LangText,
  otpTitle: {
    es: "Ingresa el código",
    en: "Enter the code",
    zh: "输入验证码",
    hi: "कोड दर्ज करें",
  } as LangText,
  otpSubtitle: {
    es: "Lo enviamos a",
    en: "We sent it to",
    zh: "已发送至",
    hi: "यह भेजा गया",
  } as LangText,
  emailPlaceholder: {
    es: "tucorreo@ejemplo.com",
    en: "youremail@example.com",
    zh: "yourmail@example.com",
    hi: "yourmail@example.com",
  } as LangText,
  otpPlaceholder: {
    es: "123456",
    en: "123456",
    zh: "123456",
    hi: "123456",
  } as LangText,
  sendButton: {
    es: "Enviar código",
    en: "Send code",
    zh: "发送验证码",
    hi: "कोड भेजें",
  } as LangText,
  sendingButton: {
    es: "Enviando...",
    en: "Sending...",
    zh: "发送中...",
    hi: "भेजा जा रहा है...",
  } as LangText,
  verifyButton: {
    es: "Verificar",
    en: "Verify",
    zh: "验证",
    hi: "सत्यापित करें",
  } as LangText,
  verifyingButton: {
    es: "Verificando...",
    en: "Verifying...",
    zh: "验证中...",
    hi: "सत्यापित हो रहा है...",
  } as LangText,
  errorInvalidEmail: {
    es: "Ingresa un correo válido",
    en: "Enter a valid email",
    zh: "请输入有效的邮箱地址",
    hi: "एक मान्य ईमेल दर्ज करें",
  } as LangText,
  errorSendFailed: {
    es: "No se pudo enviar el código. Intenta de nuevo.",
    en: "Couldn't send the code. Please try again.",
    zh: "验证码发送失败，请重试。",
    hi: "कोड नहीं भेजा जा सका। कृपया पुनः प्रयास करें।",
  } as LangText,
  errorInvalidOtp: {
    es: "Ingresa el código de 6 dígitos",
    en: "Enter the 6-digit code",
    zh: "请输入6位验证码",
    hi: "6 अंकों का कोड दर्ज करें",
  } as LangText,
  errorVerifyFailed: {
    es: "Código incorrecto o expirado",
    en: "Incorrect or expired code",
    zh: "验证码错误或已过期",
    hi: "गलत या समाप्त हो चुका कोड",
  } as LangText,
};

export const swipeHint: LangText = {
  es: "Desliza para explorar",
  en: "Swipe to explore",
  zh: "滑动查看更多",
  hi: "अधिक जानने के लिए स्वाइप करें",
};

export const screenDots: LangText = {
  es: "Ir a la pantalla",
  en: "Go to screen",
  zh: "跳转到该页",
  hi: "स्क्रीन पर जाएं",
};
