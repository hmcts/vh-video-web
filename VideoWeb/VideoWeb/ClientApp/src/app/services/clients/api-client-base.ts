export class ApiClientBase {
    protected transformOptions(options: any) {
        options.headers = options.headers.append('Cache-Control', 'no-store');
        options.headers = options.headers.append('Cache-Control', 'no-cache');
        options.headers = options.headers.append('Cache-Control', 'max-age=0');
        options.headers = options.headers.append('Cache-Control', 's-maxage=0');
        options.headers = options.headers.append('Expires', '0');
        return Promise.resolve(options);
    }
}
