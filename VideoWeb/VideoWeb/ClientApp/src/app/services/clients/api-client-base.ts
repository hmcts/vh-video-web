export class ApiClientBase {
    protected transformOptions(options: any) {
        options.headers = options.headers.append('Cache-Control', 'no-store');
        return Promise.resolve(options);
    }
}
