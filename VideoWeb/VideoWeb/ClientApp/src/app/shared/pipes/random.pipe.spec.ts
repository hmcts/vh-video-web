import { RandomPipe } from './random.pipe';

describe('RandomPipe', () => {
    it('should return a random number from 0 to 65535', () => {
        const pipe = new RandomPipe();
        expect(pipe.transform(1)).toBeGreaterThanOrEqual(0);
    });
});
