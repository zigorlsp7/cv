import { Repository } from 'typeorm';
import { CvProfile } from './entities/cv-profile.entity';
import { CvService } from './cv.service';

describe('CvService', () => {
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

  it('returns default profile when storage is empty', async () => {
    const repo = buildRepoMock();
    const service = new CvService(repo);

    const profile = await service.getProfile();

    expect(profile.fullName).toBeDefined();
    expect(profile.sections.length).toBeGreaterThan(0);
    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('backfills missing canonical sections when loading existing profile', async () => {
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

    const profile = await service.getProfile();

    expect(profile.sections).toHaveLength(6);
    expect(profile.sections.map((section) => section.id)).toEqual([
      'profile-summary',
      'experience-highlights',
      'skills',
      'projects',
      'education',
      'languages',
    ]);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('updates existing profile and keeps canonical section list', async () => {
    const repo = buildRepoMock();
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      slug: 'primary',
      content: {
        fullName: 'Old Name',
        role: 'Old Role',
        tagline: 'Old Tagline',
        chips: [],
        sections: [],
      },
      createdAt: new Date('2026-02-16T00:00:00.000Z'),
      updatedAt: new Date('2026-02-16T00:00:00.000Z'),
    });
    const service = new CvService(repo);

    const profile = await service.upsertProfile({
      fullName: '  New Name  ',
      role: ' Senior Engineer ',
      tagline: ' Reliable systems ',
      chips: ['  Location: Remote ', ''],
      sections: [
        {
          id: ' projects ',
          title: ' Projects ',
          summary: ' Delivered impact ',
          bullets: [' shipped platform ', ''],
        },
      ],
    });

    expect(profile.fullName).toBe('New Name');
    expect(profile.chips).toEqual(['Location: Remote']);
    expect(profile.sections).toHaveLength(6);
    const projects = profile.sections.find((section) => section.id === 'projects');
    expect(projects).toBeDefined();
    expect(projects?.title).toBe('Projects');
    expect(projects?.bullets).toEqual(['shipped platform']);
    expect(repo.save).toHaveBeenCalledTimes(1);
  });
});
