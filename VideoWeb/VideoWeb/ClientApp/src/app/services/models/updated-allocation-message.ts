import { UpdatedAllocationDto } from './updated-allocation';

export class UpdatedAllocationMessage {
    constructor(public allocations: UpdatedAllocationDto[]) {
        this.allocations = allocations;
    }
}
