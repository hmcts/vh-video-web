using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;

using System.Text.Json;
using VideoWeb.Common;
using VideoWeb.Contract.Request;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Controllers.InternalEventControllers;

[Produces("application/json")]
[ApiController]
[Route("internalevent")]
[Authorize(AuthenticationSchemes = "InternalEvent")]
[ApiExplorerSettings(IgnoreApi = true)]
public class InternalEventAllocationController(IAllocationHearingsEventNotifier allocationHearingsEventNotifier)
    : ControllerBase
{
    [HttpPost("AllocationHearings")]
    [SwaggerOperation(OperationId = "AllocationHearings")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> AllocationHearings(HearingAllocationNotificationRequest request)
    {
        await allocationHearingsEventNotifier.PushAllocationHearingsEvent(
            new UpdatedAllocationJusticeUserDto(request.AllocatedCsoUserName, request.AllocatedCsoUserId, request.AllocatedCsoFullName),
            request.ConferenceIds);
        return NoContent();
    }
}
