import {PluraliseTextPipePipe} from './pluraliseTextPipe.pipe';

describe('PluraliseTextPipePipe', () =>{
  it('should return singular parameter', () => {
    const pipe = new PluraliseTextPipePipe();
    expect(pipe.transform(0, 'single', 'plural')).toBe('single');
    expect(pipe.transform(1, 'single', 'plural')).toBe('single');
  });

  it('should return plural parameter', () => {
    const pipe = new PluraliseTextPipePipe();
    expect(pipe.transform(2, 'single', 'plural')).toBe('plural');
    expect(pipe.transform(3, 'single', 'plural')).toBe('plural');
  });
});
