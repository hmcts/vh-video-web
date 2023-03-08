using System.Collections.Generic;
using VideoApi.Contract.Responses;

namespace VideoWeb.Contract.Request;

public class AllocationUpdatedRequest
{
    public List<ConferenceDetailsResponse> Conferences { get; set; }
    public string AllocatedCsoUsername { get; set; }
}
