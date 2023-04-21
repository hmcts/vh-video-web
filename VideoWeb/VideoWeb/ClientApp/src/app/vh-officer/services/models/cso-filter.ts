export class CsoFilter {
    constructor(allocatedCsoIds: string[], includeUnallocated: boolean) {
        this.allocatedCsoIds = allocatedCsoIds;
        this.includeUnallocated = includeUnallocated;
    }

    allocatedCsoIds: string[];
    includeUnallocated = false;
}
