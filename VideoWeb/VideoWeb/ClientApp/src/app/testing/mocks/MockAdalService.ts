export class MockAdalService {
    userInfo = {
        authenticated: true,
        userName: 'chris.green@hearings.net',
        token: 'token'
    };
    init(configOptions: adal.Config) {}
    handleWindowCallback() {}
    login() {}
    logOut() {}
    setAuthenticated(flag: boolean) {
        this.userInfo.authenticated = flag;
    }
}
