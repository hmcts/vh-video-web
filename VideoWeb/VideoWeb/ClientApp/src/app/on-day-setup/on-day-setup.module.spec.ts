import { OnDaySetupModule } from './on-day-setup.module';

describe('OnDaySetupModule', () => {
  let onDaySetupModule: OnDaySetupModule;

  beforeEach(() => {
    onDaySetupModule = new OnDaySetupModule();
  });

  it('should create an instance', () => {
    expect(onDaySetupModule).toBeTruthy();
  });
});
