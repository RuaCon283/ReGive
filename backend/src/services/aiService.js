const {
  PRODUCT_CONDITION,
  PRODUCT_QUALITY,
} = require('../constants/enums');
const config = require('../config');

const CATEGORY_KEYWORDS = [
  { category: 'bags', keywords: ['balo', 'tui', 'bag', 'backpack', 'vali'] },
  { category: 'clothing', keywords: ['ao', 'quan', 'shirt', 'dress', 'jacket', 'clothes'] },
  { category: 'books', keywords: ['sach', 'book', 'vo', 'notebook'] },
  { category: 'electronics', keywords: ['dien thoai', 'laptop', 'tai nghe', 'phone', 'tablet'] },
  { category: 'toys', keywords: ['do choi', 'toy', 'lego'] },
  { category: 'home', keywords: ['noi', 'chen', 'ban', 'ghe', 'home', 'kitchen'] },
];

const BASE_PRICE = {
  bags: 100000,
  clothing: 80000,
  books: 30000,
  electronics: 500000,
  toys: 60000,
  home: 90000,
  other: 50000,
};

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
const GEMINI_TIMEOUT_MS = 20000;
const VALID_CATEGORIES = Object.freeze(['bags', 'clothing', 'books', 'electronics', 'toys', 'home', 'other']);

function detectCategory(text) {
  const lower = String(text || '').toLowerCase();
  for (const item of CATEGORY_KEYWORDS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return item.category;
    }
  }
  return 'other';
}

function detectCondition(text) {
  const lower = String(text || '').toLowerCase();
  if (/(hong|hu|vo|damaged|broken|unsafe)/.test(lower)) return PRODUCT_CONDITION.DAMAGED;
  if (/(moi|new\b)/.test(lower)) return PRODUCT_CONDITION.NEW;
  if (/(nhu moi|like[_ ]?new|con tot)/.test(lower)) return PRODUCT_CONDITION.LIKE_NEW;
  if (/(cu|fair|tray)/.test(lower)) return PRODUCT_CONDITION.FAIR;
  if (/(poor|xau|rach)/.test(lower)) return PRODUCT_CONDITION.POOR;
  return PRODUCT_CONDITION.GOOD;
}

function detectQuality(condition) {
  if ([PRODUCT_CONDITION.NEW, PRODUCT_CONDITION.LIKE_NEW].includes(condition)) {
    return PRODUCT_QUALITY.HIGH;
  }
  if ([PRODUCT_CONDITION.GOOD, PRODUCT_CONDITION.FAIR].includes(condition)) {
    return PRODUCT_QUALITY.MEDIUM;
  }
  return PRODUCT_QUALITY.LOW;
}

function priceFor(category, condition, quality) {
  const price = BASE_PRICE[category] || BASE_PRICE.other;
  const conditionFactor = {
    [PRODUCT_CONDITION.NEW]: 1.2,
    [PRODUCT_CONDITION.LIKE_NEW]: 1.0,
    [PRODUCT_CONDITION.GOOD]: 0.85,
    [PRODUCT_CONDITION.FAIR]: 0.65,
    [PRODUCT_CONDITION.POOR]: 0.4,
    [PRODUCT_CONDITION.DAMAGED]: 0,
  }[condition] ?? 0.85;
  const qualityFactor = {
    [PRODUCT_QUALITY.HIGH]: 1.1,
    [PRODUCT_QUALITY.MEDIUM]: 1,
    [PRODUCT_QUALITY.LOW]: 0.75,
  }[quality] ?? 1;
  return Math.round((price * conditionFactor * qualityFactor) / 1000) * 1000;
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function normalizeCategory(category) {
  if (!category) return 'other';
  const normalized = String(category).toLowerCase().trim();
  if (VALID_CATEGORIES.includes(normalized)) return normalized;
  if (normalized.includes('book') || normalized.includes('stationery')) return 'books';
  if (normalized.includes('cloth') || normalized.includes('shirt') || normalized.includes('fashion')) return 'clothing';
  if (normalized.includes('elect') || normalized.includes('phone') || normalized.includes('laptop')) return 'electronics';
  if (normalized.includes('toy')) return 'toys';
  if (normalized.includes('bag') || normalized.includes('backpack')) return 'bags';
  if (normalized.includes('home') || normalized.includes('kitchen')) return 'home';
  return 'other';
}

function normalizeCondition(condition) {
  const normalized = String(condition || '').toLowerCase().trim();
  return Object.values(PRODUCT_CONDITION).includes(normalized)
    ? normalized
    : PRODUCT_CONDITION.GOOD;
}

function normalizeQuality(quality, condition) {
  const normalized = String(quality || '').toLowerCase().trim();
  return Object.values(PRODUCT_QUALITY).includes(normalized)
    ? normalized
    : detectQuality(condition);
}

function buildImpactMetrics(category, suggestedPrice, rawMetrics = {}) {
  const mealCost = 30000;
  const notebookCost = 15000;
  const fallbackMeals = Math.max(1, Math.floor(suggestedPrice / mealCost));
  const fallbackNotebooks = Math.max(2, Math.floor(suggestedPrice / notebookCost));
  const wasteMap = {
    clothing: 0.8,
    bags: 1.2,
    books: 0.6,
    electronics: 1.5,
    toys: 0.5,
    home: 2.0,
    other: 1.0,
  };
  const fallbackWaste = wasteMap[category] || 1.0;
  const wasteDivertedKg = Number(clamp(rawMetrics.wasteDivertedKg ?? fallbackWaste, 0.1, 20).toFixed(1));
  const co2SavedKg = Number(clamp(rawMetrics.co2SavedKg ?? wasteDivertedKg * 2.5, 0.1, 100).toFixed(1));

  return {
    mealsCount: Math.max(1, Math.round(Number(rawMetrics.mealsCount) || fallbackMeals)),
    notebooksCount: Math.max(2, Math.round(Number(rawMetrics.notebooksCount) || fallbackNotebooks)),
    wasteDivertedKg,
    co2SavedKg,
    quote:
      String(rawMetrics.quote || '').trim().slice(0, 300) ||
      `Món đồ này có thể tạo ra khoảng ${fallbackMeals} bữa ăn hoặc ${fallbackNotebooks} cuốn vở cho trẻ em vùng cao.`,
  };
}

function runHeuristicAssessmentSync({ name, description, category, images, extraNote }) {
  const text = [name, description, category, extraNote, ...(images || [])].join(' ');
  const detectedCategory = category && category !== 'other' ? normalizeCategory(category) : detectCategory(text);
  const condition = detectCondition(text);
  const quality = detectQuality(condition);
  const suitableForMarketplace = condition !== PRODUCT_CONDITION.DAMAGED && condition !== PRODUCT_CONDITION.POOR;
  const suggestedPrice = suitableForMarketplace
    ? priceFor(detectedCategory, condition, quality)
    : 0;
  const confidence = images && images.length > 0 ? 0.78 : 0.62;

  return {
    provider: 'heuristic',
    suggestion: {
      category: detectedCategory,
      condition,
      quality,
      suggestedPrice,
      suitableForMarketplace,
      confidence,
      rationale:
        'Đánh giá dựa trên thông tin văn bản và siêu dữ liệu hình ảnh của sản phẩm. Cần người phụ trách duyệt trước khi áp dụng.',
      impactMetrics: buildImpactMetrics(detectedCategory, suggestedPrice),
    },
    rawResponse: {
      engine: 'regive-heuristic-v1',
      analyzedFields: { name, description, category, imageCount: (images || []).length },
    },
  };
}

async function runHeuristicAssessment(input) {
  return runHeuristicAssessmentSync(input);
}

function stripCodeFence(text) {
  return String(text || '')
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
}

function parseGeminiJson(text) {
  const cleaned = stripCodeFence(text);
  try {
    return JSON.parse(cleaned);
  } catch (_err) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini response did not contain JSON');
    return JSON.parse(match[0]);
  }
}

function normalizeAiSuggestion(raw, input) {
  const fallback = runHeuristicAssessmentSync(input).suggestion;
  const category = normalizeCategory(raw.category || fallback.category);
  const condition = normalizeCondition(raw.condition || fallback.condition);
  const quality = normalizeQuality(raw.quality || fallback.quality, condition);
  const suitableForMarketplace =
    raw.suitableForMarketplace !== undefined
      ? Boolean(raw.suitableForMarketplace)
      : condition !== PRODUCT_CONDITION.DAMAGED && condition !== PRODUCT_CONDITION.POOR;
  const suggestedPrice = suitableForMarketplace
    ? Math.max(0, Math.round(Number(raw.suggestedPrice ?? fallback.suggestedPrice) || 0))
    : 0;

  return {
    category,
    condition,
    quality,
    suggestedPrice,
    suitableForMarketplace,
    confidence: clamp(raw.confidence ?? fallback.confidence, 0, 1),
    rationale:
      String(raw.rationale || '').trim().slice(0, 1000) ||
      'Gemini gợi ý kết quả này từ thông tin văn bản và tín hiệu hình ảnh của sản phẩm. Cần người phụ trách duyệt trước khi áp dụng.',
    impactMetrics: buildImpactMetrics(category, suggestedPrice, raw.impactMetrics || {}),
  };
}

function buildGeminiPrompt(input) {
  return [
    'Bạn là thành phần AI đánh giá sản phẩm cho ReGive, một nền tảng từ thiện và chợ đồ cũ tại Việt Nam.',
    'Hãy phân tích sản phẩm được quyên góp dựa trên văn bản và hình ảnh được cung cấp.',
    'Chỉ trả về JSON. Không bao gồm markdown.',
    '',
    'Các giá trị category được phép: bags, clothing, books, electronics, toys, home, other.',
    'Các giá trị condition được phép: new, like_new, good, fair, poor, damaged.',
    'Các giá trị quality được phép: high, medium, low.',
    'Giá phải tính bằng VND và thực tế đối với một chợ đồ cũ từ thiện tại Việt Nam.',
    'Đặt suitableForMarketplace=false cho các món đồ bị hư hỏng, không an toàn, kém chất lượng, không sử dụng được hoặc có rủi ro vệ sinh.',
    'Kết quả từ AI chỉ là gợi ý. Admin/Employee là con người sẽ xem xét trước khi áp dụng.',
    '',
    'Dữ liệu sản phẩm:',
    JSON.stringify(
      {
        name: input.name || '',
        description: input.description || '',
        category: input.category || 'other',
        extraNote: input.extraNote || '',
        imageCount: Array.isArray(input.images) ? input.images.length : 0,
        imageRefs: (input.images || []).filter((image) => typeof image === 'string').slice(0, 3),
      },
      null,
      2
    ),
  ].join('\n');
}

function geminiResponseSchema() {
  return {
    type: 'OBJECT',
    properties: {
      category: { type: 'STRING' },
      condition: { type: 'STRING' },
      quality: { type: 'STRING' },
      suggestedPrice: { type: 'NUMBER' },
      suitableForMarketplace: { type: 'BOOLEAN' },
      confidence: { type: 'NUMBER' },
      rationale: { type: 'STRING' },
      impactMetrics: {
        type: 'OBJECT',
        properties: {
          mealsCount: { type: 'NUMBER' },
          notebooksCount: { type: 'NUMBER' },
          wasteDivertedKg: { type: 'NUMBER' },
          co2SavedKg: { type: 'NUMBER' },
          quote: { type: 'STRING' },
        },
        required: ['mealsCount', 'notebooksCount', 'wasteDivertedKg', 'co2SavedKg', 'quote'],
      },
    },
    required: [
      'category',
      'condition',
      'quality',
      'suggestedPrice',
      'suitableForMarketplace',
      'confidence',
      'rationale',
      'impactMetrics',
    ],
  };
}

function parseDataUriImage(value) {
  const match = String(value || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function fetchImageAsInlineData(url, signal) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) return null;

  const response = await fetch(parsed, { signal });
  if (!response.ok) return null;
  const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || '';
  if (!mimeType.startsWith('image/')) return null;
  const length = Number(response.headers.get('content-length') || 0);
  if (length > GEMINI_IMAGE_MAX_BYTES) return null;

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > GEMINI_IMAGE_MAX_BYTES) return null;
  return {
    mimeType,
    data: Buffer.from(arrayBuffer).toString('base64'),
  };
}

async function buildImageParts(images, signal) {
  const parts = [];
  for (const image of (images || []).slice(0, 3)) {
    if (typeof image !== 'string' || !image.trim()) continue;
    const value = image.trim();
    const dataUri = parseDataUriImage(value);
    const inlineImage = dataUri || (await fetchImageAsInlineData(value, signal).catch(() => null));
    if (inlineImage) {
      parts.push({
        inline_data: {
          mime_type: inlineImage.mimeType,
          data: inlineImage.data,
        },
      });
    }
  }
  return parts;
}

async function runGeminiAssessment(input) {
  if (!config.aiApiKey) {
    throw new Error('Cần cấu hình GEMINI_API_KEY hoặc AI_API_KEY khi AI_PROVIDER=gemini');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const imageParts = await buildImageParts(input.images, controller.signal);
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            ...imageParts,
            { text: buildGeminiPrompt(input) },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: geminiResponseSchema(),
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(
      `${GEMINI_ENDPOINT}/${encodeURIComponent(config.aiModel)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.aiApiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini API thất bại với HTTP ${response.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('')
      .trim();
    if (!text) throw new Error('Gemini response was empty');

    const parsed = parseGeminiJson(text);
    return {
      provider: 'gemini',
      suggestion: normalizeAiSuggestion(parsed, input),
      rawResponse: {
        engine: config.aiModel,
        modelVersion: data.modelVersion,
        responseId: data.responseId,
        usageMetadata: data.usageMetadata,
        imagePartsSent: imageParts.length,
        parsed,
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function assessProductInput(input) {
  if (config.aiProvider === 'gemini') {
    try {
      return await runGeminiAssessment(input);
    } catch (err) {
      const fallback = await runHeuristicAssessment(input);
      return {
        ...fallback,
        provider: 'gemini-fallback',
        rawResponse: {
          ...fallback.rawResponse,
          requestedProvider: 'gemini',
          requestedModel: config.aiModel,
          fallbackReason: err.message,
        },
      };
    }
  }

  return runHeuristicAssessment(input);
}

module.exports = { assessProductInput, runHeuristicAssessment, runGeminiAssessment };
