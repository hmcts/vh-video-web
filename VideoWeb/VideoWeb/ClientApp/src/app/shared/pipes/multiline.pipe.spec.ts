import { MultilinePipe } from './multiline.pipe';

describe('MultilinePipe', () => {
    it('create an instance', () => {
        const pipe = new MultilinePipe();
        const text = 'John Doe, Chris Doe';
        const expected = 'John Doe<br />Chris Doe';
        expect(pipe.transform(text)).toBe(expected);
    });
});
