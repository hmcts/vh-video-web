using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;

using System.Text.Json;
using VideoWeb.Contract.Request;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Controllers.InternalEventControllers;

[Produces("application/json")]
[ApiController]
[Route("internalevent")]
[Authorize(AuthenticationSchemes = "InternalEvent")]
public class InternalEventAllocationController(ILogger<InternalEventAllocationController> logger, IAllocationHearingsEventNotifier allocationHearingsEventNotifier)
    : ControllerBase
{
    [HttpPost("AllocationHearings")]
    [SwaggerOperation(OperationId = "AllocationHearings")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> AllocationHearings(HearingAllocationNotificationRequest request)
    {
        logger.LogDebug("AllocationHearings called. Request {Serialize}", JsonSerializer.Serialize(request));
        await allocationHearingsEventNotifier.PushAllocationHearingsEvent(request.AllocatedCsoUserName,
            request.ConferenceIds);
        return NoContent();
    }
}
