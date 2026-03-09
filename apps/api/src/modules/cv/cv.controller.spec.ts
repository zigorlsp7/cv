import { CvController } from './cv.controller';
import { CvService } from './cv.service';

describe('CvController', () => {
  it('returns profile from service', async () => {
    const profile = {
      fullName: 'Jane Doe',
      role: 'Senior Engineer',
      tagline: 'Builds reliable platforms.',
      chips: ['Location: Remote'],
      sections: [],
      updatedAt: new Date().toISOString(),
    };
    const service = {
      getProfile: jest.fn().mockResolvedValue(profile),
    } as unknown as CvService;
    const controller = new CvController(service);

    await expect(controller.getProfile()).resolves.toEqual(profile);
    expect(service.getProfile).toHaveBeenCalledTimes(1);
  });

  it('delegates upsert to service', async () => {
    const payload = {
      fullName: 'Jane Doe',
      role: 'Senior Engineer',
      tagline: 'Builds reliable platforms.',
      chips: ['Location: Remote'],
      sections: [],
    };
    const profile = { ...payload, updatedAt: new Date().toISOString() };
    const service = {
      upsertProfile: jest.fn().mockResolvedValue(profile),
    } as unknown as CvService;
    const controller = new CvController(service);
    const req = { user: { role: 'admin' } } as any;

    await expect(controller.upsertProfile(payload, req)).resolves.toEqual(profile);
    expect(service.upsertProfile).toHaveBeenCalledWith(payload);
  });
});
