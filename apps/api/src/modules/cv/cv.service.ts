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

function normalizeSections(rawSections: unknown): CvSection[] {
  const byId = new Map<string, CvSection>();
  const byTitle = new Map<string, CvSection>();

  if (Array.isArray(rawSections)) {
    for (const candidate of rawSections) {
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
    const summary = existing?.summary ? existing.summary : template.summary;
    const bullets = existing?.bullets?.length ? existing.bullets : template.bullets;
    return {
      id: template.id,
      title: template.title,
      summary: cleanText(summary) || template.summary,
      bullets: cleanList(bullets.length ? bullets : template.bullets),
    };
  });
}

function normalizeDocument(input: unknown): CvDocument {
  const source = input && typeof input === 'object' ? (input as Partial<CvDocument>) : {};
  const fullName = cleanText(source.fullName) || DEFAULT_CV_DOCUMENT.fullName;
  const role = cleanText(source.role) || DEFAULT_CV_DOCUMENT.role;
  const tagline = cleanText(source.tagline) || DEFAULT_CV_DOCUMENT.tagline;
  const chips = cleanList(source.chips);

  return {
    fullName,
    role,
    tagline,
    chips: chips.length ? chips : [...DEFAULT_CV_DOCUMENT.chips],
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
    const content = profile.content ?? DEFAULT_CV_DOCUMENT;
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
