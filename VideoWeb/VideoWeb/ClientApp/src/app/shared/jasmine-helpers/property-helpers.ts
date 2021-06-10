export function getSpiedPropertyGetter<T, K extends keyof T>(spyObj: jasmine.SpyObj<T>, propName: K): jasmine.Spy<() => T[K]> {
    return Object.getOwnPropertyDescriptor(spyObj, propName)?.get as jasmine.Spy<() => T[K]>;
}
