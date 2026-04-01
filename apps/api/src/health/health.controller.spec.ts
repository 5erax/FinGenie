import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /health', () => {
    it('should return status "ok"', () => {
      const result = controller.check();

      expect(result.status).toBe('ok');
    });

    it('should return a valid ISO 8601 timestamp', () => {
      const before = new Date();
      const result = controller.check();
      const after = new Date();

      const timestamp = new Date(result.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return a fresh timestamp on every call', () => {
      const first = controller.check();
      const second = controller.check();

      // Both must be valid dates; second must be >= first
      expect(new Date(second.timestamp).getTime()).toBeGreaterThanOrEqual(
        new Date(first.timestamp).getTime(),
      );
    });
  });
});
