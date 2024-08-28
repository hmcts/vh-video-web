using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.EventHub.Services;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ConferenceManagementNonHostController(IConferenceManagementService conferenceManagementService) : ControllerBase
    {
        /// <summary>
        /// Leave host from hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="cancellationToken"></param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/participant/{participantId}/non-host-leave")]
        [SwaggerOperation(OperationId = "NonHostLeaveHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> NonHostLeaveHearingAsync(Guid conferenceId,
            CancellationToken cancellationToken)
        {
            var username = User.Identity!.Name;
            await conferenceManagementService.ParticipantLeaveConferenceAsync(conferenceId, username,
                cancellationToken);
            return Accepted();
        }
    }
}
