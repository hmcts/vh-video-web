import { HyphenatePipe } from './hyphenate.pipe';

describe('DatePipe', () => {
    let pipe: HyphenatePipe;
    const input = 'this is a string';
    const expectedOutput = 'this-is-a-string';

    beforeEach(() => {
        pipe = new HyphenatePipe();
    });

    it('should replace all spaces with hyphens', () => {
        expect(pipe.transform(input)).toEqual(expectedOutput);
    });

    it('should convert to lower case', () => {
        expect(pipe.transform(expectedOutput.toUpperCase())).toEqual(expectedOutput);
    });

    it('should replace all spaces with hyphens and convert to lower case', () => {
        expect(pipe.transform(input.toUpperCase())).toEqual(expectedOutput);
    });
});
