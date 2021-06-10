import { Observable } from 'rxjs';

interface IHttpRequestResult {
    status: number;
    result: any;
    error: any;
}

function toHttpRequestResult() {
    return function <T>(source: Observable<T>): Observable<IHttpRequestResult> {
        return new Observable<IHttpRequestResult>(subscriber => {
            return source.subscribe({
                next(value) {
                    subscriber.next({ status: 200, result: value, error: null });
                },
                error(err) {
                    subscriber.next({ status: err?.status, result: null, error: err });
                },
                complete() {
                    subscriber.complete();
                }
            });
        });
    };
}
