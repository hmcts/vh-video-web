import { WaitingSpaceModule } from './waiting-space.module';

describe('WaitingSpaceModule', () => {
  let waitingSpaceModule: WaitingSpaceModule;

  beforeEach(() => {
    waitingSpaceModule = new WaitingSpaceModule();
  });

  it('should create an instance', () => {
    expect(waitingSpaceModule).toBeTruthy();
  });
});
