import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CvProfile, type CvDocument, type CvSection } from './entities/cv-profile.entity';
import { CvProfileDto, UpsertCvProfileDto } from './cv.dto';

const PRIMARY_SLUG = 'primary';

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

const DEFAULT_CV_DOCUMENT: CvDocument = {
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

function cleanList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map(cleanText).filter((value) => value.length > 0);
}

function requireText(value: unknown, label: string): string {
  const normalized = cleanText(value);
  if (!normalized) {
    throw new Error(`${label} is required`);
  }
  return normalized;
}

function requireList(values: unknown, label: string): string[] {
  const normalized = cleanList(values);
  if (normalized.length === 0) {
    throw new Error(`${label} must contain at least one item`);
  }
  return normalized;
}

function normalizeSections(rawSections: unknown): CvSection[] {
  if (!Array.isArray(rawSections)) {
    throw new Error('sections must be an array');
  }

  const byId = new Map<string, CvSection>();
  const templateIds = new Set(SECTION_TEMPLATES.map((section) => section.id));
  const templateTitleById = new Map(
    SECTION_TEMPLATES.map((section) => [section.id, section.title]),
  );

  for (const candidate of rawSections) {
    if (!candidate || typeof candidate !== 'object') {
      throw new Error('sections entries must be objects');
    }
    const section = candidate as Partial<CvSection>;
    const id = requireText(section.id, 'section.id');
    const title = requireText(section.title, `section(${id}).title`);
    if (!templateIds.has(id)) {
      throw new Error(`Unsupported section id: ${id}`);
    }
    const expectedTitle = templateTitleById.get(id);
    if (title.toLowerCase() !== expectedTitle?.toLowerCase()) {
      throw new Error(`Section ${id} must keep title "${expectedTitle}"`);
    }
    const normalized: CvSection = {
      id,
      title,
      summary: requireText(section.summary, `section(${id}).summary`),
      bullets: requireList(section.bullets, `section(${id}).bullets`),
    };

    byId.set(id, normalized);
  }

  return SECTION_TEMPLATES.map((template) => {
    const existing = byId.get(template.id);
    if (!existing) {
      throw new Error(`Missing required section: ${template.id}`);
    }
    return {
      id: template.id,
      title: template.title,
      summary: requireText(existing.summary, `section(${template.id}).summary`),
      bullets: requireList(existing.bullets, `section(${template.id}).bullets`),
    };
  });
}

function normalizeDocument(input: unknown): CvDocument {
  if (!input || typeof input !== 'object') {
    throw new Error('CV payload must be an object');
  }
  const source = input as Partial<CvDocument>;
  const fullName = requireText(source.fullName, 'fullName');
  const role = requireText(source.role, 'role');
  const tagline = requireText(source.tagline, 'tagline');
  const chips = requireList(source.chips, 'chips');

  return {
    fullName,
    role,
    tagline,
    chips,
    sections: normalizeSections(source.sections),
  };
}

@Injectable()
export class CvService {
  constructor(
    @InjectRepository(CvProfile)
    private readonly cvRepo: Repository<CvProfile>,
  ) {}

  async getProfile(): Promise<CvProfileDto> {
    let profile = await this.cvRepo.findOne({ where: { slug: PRIMARY_SLUG } });

    if (!profile) {
      profile = this.cvRepo.create({
        slug: PRIMARY_SLUG,
        content: normalizeDocument(DEFAULT_CV_DOCUMENT),
      });
      profile = await this.cvRepo.save(profile);
    } else {
      const normalized = normalizeDocument(profile.content);
      if (JSON.stringify(profile.content) !== JSON.stringify(normalized)) {
        profile.content = normalized;
        profile = await this.cvRepo.save(profile);
      }
    }

    return this.toDto(profile);
  }

  async upsertProfile(body: UpsertCvProfileDto): Promise<CvProfileDto> {
    const content = normalizeDocument(body);
    let profile = await this.cvRepo.findOne({ where: { slug: PRIMARY_SLUG } });

    if (!profile) {
      profile = this.cvRepo.create({
        slug: PRIMARY_SLUG,
        content,
      });
    } else {
      profile.content = content;
    }

    profile = await this.cvRepo.save(profile);
    return this.toDto(profile);
  }

  private toDto(profile: CvProfile): CvProfileDto {
    const content = normalizeDocument(profile.content);
    return {
      fullName: content.fullName,
      role: content.role,
      tagline: content.tagline,
      chips: [...content.chips],
      sections: content.sections.map((section) => ({
        id: section.id,
        title: section.title,
        summary: section.summary,
        bullets: [...section.bullets],
      })),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
