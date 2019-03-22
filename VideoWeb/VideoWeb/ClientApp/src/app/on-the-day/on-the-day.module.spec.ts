import { OnTheDayModule } from './on-the-day.module';

describe('OnTheDayModule', () => {
  let onTheDayModule: OnTheDayModule;

  beforeEach(() => {
    onTheDayModule = new OnTheDayModule();
  });

  it('should create an instance', () => {
    expect(OnTheDayModule).toBeTruthy();
  });
});
