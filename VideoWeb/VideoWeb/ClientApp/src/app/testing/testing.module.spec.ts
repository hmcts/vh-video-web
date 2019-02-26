import { TestingModule } from './testing.module';

describe('TestingModule', () => {
  let testingModule: TestingModule;

  beforeEach(() => {
    testingModule = new TestingModule();
  });

  it('should create an instance', () => {
    expect(testingModule).toBeTruthy();
  });
});
