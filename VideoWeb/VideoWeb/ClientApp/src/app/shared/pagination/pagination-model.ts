export class PaginationModel {
    totalCount: number;
    page: number;
    totalPages: number;
    pageSize: number;

    constructor(totalCount: number, page: number, totalPages: number, pageSize: number) {
        this.totalCount = totalCount;
        this.page = page;
        this.totalPages = totalPages;
        this.pageSize = pageSize;
    }

    get firstPage(): boolean {
        return this.page === 1;
    }

    get lastPage(): boolean {
        return this.page === this.totalPages;
    }

    get fromRecord(): number {
        return ((this.page - 1) * this.pageSize) + 1;
    }

    get toRecord(): number {
        return Math.min(this.page * this.pageSize, this.totalCount);
    }
}
