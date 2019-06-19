export class SessionStorage<TType> {
    constructor(private storageKey: string) { }

    /**
     * Returns the of the value `TType` if it exists or null
     */
    get(): TType {
        const cached = sessionStorage.getItem(this.storageKey);
        if (!cached) {
            return null;
        }

        try {
            return JSON.parse(cached) as TType;
        } catch (err) {
            // make sure we clear the invalid item so that the next time we try we won't get the same issue
            sessionStorage.removeItem(this.storageKey);
            throw err;
        }
    }

    set(value: TType) {
        sessionStorage.setItem(this.storageKey, JSON.stringify(value));
    }

    clear() {
        sessionStorage.removeItem(this.storageKey);
    }
}
