import { RandomPipe } from './random.pipe';

describe('RandomPipe', () => {
    it('should return a random number between 0 and 10000', () => {
        const pipe = new RandomPipe();
        expect(pipe.transform(10000)).toBeGreaterThanOrEqual(0);
        expect(pipe.transform(10000)).toBeLessThanOrEqual(10000);
        expect(pipe.transform(10000)).not.toBeGreaterThan(10000);
    });
});
