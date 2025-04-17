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
public class InternalEventConferenceController(
    IConferenceService conferenceService,
    INewConferenceAddedEventNotifier newConferenceAddedEventNotifier) : ControllerBase
{
    [HttpPost("ConferenceAdded")]
    [SwaggerOperation(OperationId = "ConferenceAdded")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> ConferenceAdded(Guid conferenceId)
    {
        var conference = await conferenceService.GetConference(conferenceId);
        await newConferenceAddedEventNotifier.PushNewConferenceAddedEvent(conference);
        return NoContent();
    }
}
