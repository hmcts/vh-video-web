using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Controllers.InternalEventControllers;

[Produces("application/json")]
[ApiController]
[Route("internalevent")]
[Authorize(AuthenticationSchemes = "InternalEvent")]
[ApiExplorerSettings(IgnoreApi = true)]
public class InternalEventController(
    IConferenceService conferenceService,
    IHearingCancelledEventNotifier hearingCancelledEventNotifier,
    IHearingDetailsUpdatedEventNotifier hearingDetailsUpdatedEventNotifier)
    : ControllerBase
{

    [HttpPost("HearingCancelled")]
    [SwaggerOperation(OperationId = "HearingCancelled")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> HearingCancelled(Guid conferenceId)
    {
        var conference = await conferenceService.GetConference(conferenceId);
        await conferenceService.RemoveConference(conference);
        await hearingCancelledEventNotifier.PushHearingCancelledEvent(conference);
        return NoContent();
    }

    [HttpPost("HearingDetailsUpdated")]
    [SwaggerOperation(OperationId = "HearingDetailsUpdated")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> HearingDetailsUpdated(Guid conferenceId)
    {
        var conference = await conferenceService.ForceGetConference(conferenceId);
        await hearingDetailsUpdatedEventNotifier.PushHearingDetailsUpdatedEvent(conference);
        return NoContent();
    }
}
