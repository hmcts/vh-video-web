using System;
using System.Collections.Generic;
using VideoApi.Contract.Responses;

namespace VideoWeb.Contract.Request;

public class HearingAllocationNotificationRequest
{
    public string AllocatedCsoUserName { get; set; }   
    public List<Guid> ConferenceIds { get; set; }
}
