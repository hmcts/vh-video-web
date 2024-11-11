using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Controllers.InternalEventControllers;

[Produces("application/json")]
[ApiController]
[Route("internalevent")]
[Authorize(AuthenticationSchemes = "InternalEvent")]
public class InternalEventConferenceController(INewConferenceAddedEventNotifier newConferenceAddedEventNotifier) : ControllerBase
{
    [HttpPost("ConferenceAdded")]
    [SwaggerOperation(OperationId = "ConferenceAdded")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> ConferenceAdded(Guid conferenceId)
    {
        await newConferenceAddedEventNotifier.PushNewConferenceAddedEvent(conferenceId);
        return NoContent();
    }
}
