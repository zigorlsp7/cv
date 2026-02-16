import { MigrationInterface, QueryRunner } from 'typeorm';

type CvSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

type CvContent = {
  fullName: string;
  role: string;
  tagline: string;
  chips: string[];
  sections: CvSection[];
};

const SECTION_TEMPLATES: CvSection[] = [
  {
    id: 'profile-summary',
    title: 'Profile Summary',
    summary:
      'Short summary of your profile, seniority, and the type of impact you deliver.',
    bullets: [
      'Define your specialization and strongest domain.',
      'Include one sentence about your engineering philosophy.',
      'Mention one concrete strength with business impact.',
    ],
  },
  {
    id: 'experience-highlights',
    title: 'Experience Highlights',
    summary: 'Most relevant positions and achievements.',
    bullets: [
      'Role / company / period.',
      'Main outcomes with metrics (latency, cost, conversion, uptime).',
      'Architecture and leadership responsibilities.',
    ],
  },
  {
    id: 'skills',
    title: 'Skills',
    summary: 'Technical capabilities grouped by category.',
    bullets: [
      'Backend: Node.js, NestJS, Java, Python, Go (adapt to your stack).',
      'Cloud/DevOps: AWS, Docker, Terraform, CI/CD, observability.',
      'Data: PostgreSQL, Redis, messaging, data modeling.',
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    summary: 'Flagship projects that prove execution and ownership.',
    bullets: [
      'Problem statement and architecture approach.',
      'What you implemented end-to-end.',
      'Measured result and lessons learned.',
    ],
  },
  {
    id: 'education',
    title: 'Education',
    summary: 'Formal education and certifications.',
    bullets: [
      'Degree / institution / years.',
      'Certifications relevant to your target roles.',
      'Specialized training or advanced coursework.',
    ],
  },
  {
    id: 'languages',
    title: 'Languages',
    summary: 'Spoken languages and proficiency.',
    bullets: [
      'English: C1/C2 (or fluent/professional).',
      'Spanish: Native (or your native language).',
      'Other language: level and practical usage context.',
    ],
  },
];

const DEFAULT_CONTENT: CvContent = {
  fullName: 'Your Name',
  role: 'Senior Software Engineer',
  tagline:
    'Backend, cloud, and platform engineering with a focus on reliability and delivery velocity.',
  chips: [
    'Location: City, Country',
    'Email: your@email.com',
    'LinkedIn: linkedin.com/in/your-user',
    'GitHub: github.com/your-user',
    'Website: your-domain.dev',
    'Available for remote or hybrid roles',
  ],
  sections: SECTION_TEMPLATES.map((section) => ({
    id: section.id,
    title: section.title,
    summary: section.summary,
    bullets: [...section.bullets],
  })),
};

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanText).filter((part) => part.length > 0);
}

function normalizeSections(raw: unknown): CvSection[] {
  const byId = new Map<string, CvSection>();
  const byTitle = new Map<string, CvSection>();

  if (Array.isArray(raw)) {
    for (const candidate of raw) {
      if (!candidate || typeof candidate !== 'object') continue;
      const section = candidate as Partial<CvSection>;
      const id = cleanText(section.id);
      const title = cleanText(section.title);
      const normalized: CvSection = {
        id,
        title,
        summary: cleanText(section.summary),
        bullets: cleanList(section.bullets),
      };
      if (id) byId.set(id, normalized);
      if (title) byTitle.set(title.toLowerCase(), normalized);
    }
  }

  return SECTION_TEMPLATES.map((template) => {
    const existing =
      byId.get(template.id) ?? byTitle.get(template.title.toLowerCase());
    return {
      id: template.id,
      title: template.title,
      summary: existing?.summary || template.summary,
      bullets: existing?.bullets?.length ? existing.bullets : [...template.bullets],
    };
  });
}

function parseContent(raw: unknown): unknown {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
}

function normalizeContent(raw: unknown): CvContent {
  const source =
    raw && typeof raw === 'object' ? (raw as Partial<CvContent>) : {};
  const fullName = cleanText(source.fullName) || DEFAULT_CONTENT.fullName;
  const role = cleanText(source.role) || DEFAULT_CONTENT.role;
  const tagline = cleanText(source.tagline) || DEFAULT_CONTENT.tagline;
  const chips = cleanList(source.chips);
  return {
    fullName,
    role,
    tagline,
    chips: chips.length ? chips : [...DEFAULT_CONTENT.chips],
    sections: normalizeSections(source.sections),
  };
}

export class BackfillCvCanonicalSections1771300000000
  implements MigrationInterface
{
  name = 'BackfillCvCanonicalSections1771300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(
      `SELECT "id", "content" FROM "cv_profiles" WHERE "slug" = $1 LIMIT 1`,
      ['primary'],
    );

    if (!rows[0]) {
      await queryRunner.query(
        `INSERT INTO "cv_profiles" ("slug", "content") VALUES ($1, $2::jsonb) ON CONFLICT ("slug") DO NOTHING`,
        ['primary', JSON.stringify(DEFAULT_CONTENT)],
      );
      return;
    }

    const row = rows[0] as { id: number; content: unknown };
    const normalized = normalizeContent(parseContent(row.content));
    await queryRunner.query(
      `UPDATE "cv_profiles" SET "content" = $1::jsonb, "updated_at" = now() WHERE "id" = $2`,
      [JSON.stringify(normalized), row.id],
    );
  }

  public async down(): Promise<void> {
    // no-op: backfill migration is intentionally irreversible
  }
}

