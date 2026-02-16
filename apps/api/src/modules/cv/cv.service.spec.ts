import { Repository } from 'typeorm';
import { CvProfile } from './entities/cv-profile.entity';
import { CvService } from './cv.service';

describe('CvService', () => {
  function buildCanonicalSections() {
    return [
      {
        id: 'profile-summary',
        title: 'Profile Summary',
        summary: 'Profile summary',
        bullets: ['Summary bullet'],
      },
      {
        id: 'experience-highlights',
        title: 'Experience Highlights',
        summary: 'Experience summary',
        bullets: ['Experience bullet'],
      },
      {
        id: 'skills',
        title: 'Skills',
        summary: 'Skills summary',
        bullets: ['Skills bullet'],
      },
      {
        id: 'projects',
        title: 'Projects',
        summary: 'Projects summary',
        bullets: ['Projects bullet'],
      },
      {
        id: 'education',
        title: 'Education',
        summary: 'Education summary',
        bullets: ['Education bullet'],
      },
      {
        id: 'languages',
        title: 'Languages',
        summary: 'Languages summary',
        bullets: ['Languages bullet'],
      },
    ];
  }

  function buildRepoMock() {
    return {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => ({
        id: 1,
        slug: 'primary',
        createdAt: new Date('2026-02-16T00:00:00.000Z'),
        updatedAt: new Date('2026-02-16T00:00:00.000Z'),
        ...value,
      })),
      save: jest.fn(async (value) => ({
        ...value,
        updatedAt: new Date('2026-02-16T01:00:00.000Z'),
      })),
    } as unknown as Repository<CvProfile>;
  }

  function buildValidPayload() {
    return {
      fullName: 'New Name',
      role: 'Senior Engineer',
      tagline: 'Reliable systems',
      chips: ['Location: Remote'],
      sections: buildCanonicalSections(),
    };
  }

  it('returns default profile when storage is empty', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);

    const profile = await service.getProfile();

    expect(profile.fullName).toBeDefined();
    expect(profile.sections.length).toBeGreaterThan(0);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('fails when existing profile is missing required sections', async () => {
    const repo = buildRepoMock();
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      slug: 'primary',
      content: {
        fullName: 'Existing Name',
        role: 'Existing Role',
        tagline: 'Existing Tagline',
        chips: ['Location: Remote'],
        sections: [
          {
            id: 'profile-summary',
            title: 'Profile Summary',
            summary: 'Existing summary',
            bullets: ['Existing bullet'],
          },
        ],
      },
      createdAt: new Date('2026-02-16T00:00:00.000Z'),
      updatedAt: new Date('2026-02-16T00:00:00.000Z'),
    });
    const service = new CvService(repo);

    await expect(service.getProfile()).rejects.toThrow(
      'Missing required section: experience-highlights',
    );
    expect(repo.save).toHaveBeenCalledTimes(0);
  });

  it('updates existing profile with strict canonical sections', async () => {
    const repo = buildRepoMock();
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      slug: 'primary',
      content: {
        fullName: 'Old Name',
        role: 'Old Role',
        tagline: 'Old Tagline',
        chips: ['Chip'],
        sections: buildCanonicalSections(),
      },
      createdAt: new Date('2026-02-16T00:00:00.000Z'),
      updatedAt: new Date('2026-02-16T00:00:00.000Z'),
    });
    const service = new CvService(repo);

    const profile = await service.upsertProfile({
      ...buildValidPayload(),
      fullName: '  New Name  ',
      role: ' Senior Engineer ',
      tagline: ' Reliable systems ',
      chips: ['  Location: Remote ', ''],
    });

    expect(profile.fullName).toBe('New Name');
    expect(profile.chips).toEqual(['Location: Remote']);
    expect(profile.sections).toHaveLength(6);
    const projects = profile.sections.find((section) => section.id === 'projects');
    expect(projects).toBeDefined();
    expect(projects?.title).toBe('Projects');
    expect(projects?.bullets).toEqual(['Projects bullet']);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('creates profile on upsert when storage is empty', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);

    const profile = await service.upsertProfile(buildValidPayload());

    expect(profile.fullName).toBe('New Name');
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('does not save on getProfile when stored content is already normalized', async () => {
    const repo = buildRepoMock();
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      slug: 'primary',
      content: buildValidPayload(),
      createdAt: new Date('2026-02-16T00:00:00.000Z'),
      updatedAt: new Date('2026-02-16T00:00:00.000Z'),
    });
    const service = new CvService(repo);

    await service.getProfile();

    expect(repo.save).toHaveBeenCalledTimes(0);
  });

  it('rejects upsert when fullName is missing', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);

    await expect(
      service.upsertProfile({
        ...buildValidPayload(),
        fullName: '',
      }),
    ).rejects.toThrow('fullName is required');
  });

  it('rejects upsert when chips list is empty', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);

    await expect(
      service.upsertProfile({
        ...buildValidPayload(),
        chips: [],
      }),
    ).rejects.toThrow('chips must contain at least one item');
  });

  it('rejects upsert when sections is not an array', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);

    await expect(
      service.upsertProfile({
        ...buildValidPayload(),
        sections: undefined as unknown as never[],
      }),
    ).rejects.toThrow('sections must be an array');
  });

  it('rejects upsert when section entries are not objects', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);

    await expect(
      service.upsertProfile({
        ...buildValidPayload(),
        sections: [null] as unknown as never[],
      }),
    ).rejects.toThrow('sections entries must be objects');
  });

  it('rejects upsert when section title does not match canonical title', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);
    const invalidSections = buildCanonicalSections();
    invalidSections[0].title = 'Wrong title';

    await expect(
      service.upsertProfile({
        ...buildValidPayload(),
        sections: invalidSections,
      }),
    ).rejects.toThrow('Section profile-summary must keep title');
  });

  it('rejects upsert when section id is unsupported', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);
    const invalidSections = buildCanonicalSections();
    invalidSections[0].id = 'non-canonical';

    await expect(
      service.upsertProfile({
        ...buildValidPayload(),
        sections: invalidSections,
      }),
    ).rejects.toThrow('Unsupported section id: non-canonical');
  });
});
