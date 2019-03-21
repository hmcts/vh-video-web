export class MockAdalService {
  userInfo = {
    authenticated: false,
    userName: 'test@automated.com',
    token: 'token'
  };
  init(configOptions: adal.Config) { }
  handleWindowCallback() { }
  login() { }
  logOut() { }
  setAuthenticated(flag: boolean) {
    this.userInfo.authenticated = flag;
  }
}

