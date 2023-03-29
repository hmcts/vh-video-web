using System;
using System.Collections.Generic;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.InternalHandlers.Core;

namespace VideoWeb.EventHub.InternalHandlers.Models;

public class ParticipantsUpdatedEventDto : IInternalEventPayload
{
    public Guid ConferenceId { get; set; }
    public List<ParticipantResponse> Participants { get; set; }
}
