export type CvSection = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export type CvProfile = {
  fullName: string;
  role: string;
  tagline: string;
  chips: string[];
  sections: CvSection[];
  updatedAt?: string;
};

export const DEFAULT_CV_PROFILE: CvProfile = {
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
  sections: [
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
  ],
};

export function cloneDefaultCvProfile(): CvProfile {
  return {
    fullName: DEFAULT_CV_PROFILE.fullName,
    role: DEFAULT_CV_PROFILE.role,
    tagline: DEFAULT_CV_PROFILE.tagline,
    chips: [...DEFAULT_CV_PROFILE.chips],
    sections: DEFAULT_CV_PROFILE.sections.map((section) => ({
      id: section.id,
      title: section.title,
      summary: section.summary,
      bullets: [...section.bullets],
    })),
    updatedAt: new Date().toISOString(),
  };
}
