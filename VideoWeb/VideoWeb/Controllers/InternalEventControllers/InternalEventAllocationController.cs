using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using System.Text.Json;
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
    [ProducesResponseType((int) HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
    public async Task<IActionResult> AllocationHearings(AllocationHearingsToCsoRequest request)
    {
        try
        {
            logger.LogDebug("AllocationHearings called. Request {Serialize}", JsonSerializer.Serialize(request));
            
            var csoToNotify = request.AllocatedCsoUserName;
            var hearings = request.Hearings;
            
            await allocationHearingsEventNotifier.PushAllocationHearingsEvent(csoToNotify, hearings);
            return NoContent();
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, "HearingIds: {Serialize}, ErrorCode: {EStatusCode}", JsonSerializer.Serialize(request), e.StatusCode);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
}
