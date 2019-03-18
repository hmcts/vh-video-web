import { SecurityModule } from './security.module';

describe('SecurityModule', () => {
  let securityModule: SecurityModule;

  beforeEach(() => {
    securityModule = new SecurityModule();
  });

  it('should create an instance', () => {
    expect(securityModule).toBeTruthy();
  });
});
