import { UpdatedAllocation } from 'src/app/shared/models/update-allocation-dto';

export class NewAllocationMessage {
    constructor(public updatedAllocations: UpdatedAllocation[]) {}
}
