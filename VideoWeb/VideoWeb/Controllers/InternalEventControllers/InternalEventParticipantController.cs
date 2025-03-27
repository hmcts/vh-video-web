using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using System.Text.Json;
using VideoWeb.Common;
using VideoWeb.Helpers.Interfaces;

namespace VideoWeb.Controllers.InternalEventControllers;

[Produces("application/json")]
[ApiController]
[Route("internalevent")]
[Authorize(AuthenticationSchemes = "InternalEvent")]
public class InternalEventParticipantController(
    IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier,
    IConferenceService conferenceService,
    ILogger<InternalEventParticipantController> logger)
    : ControllerBase
{
    [HttpPost("ParticipantsUpdated")]
    [SwaggerOperation(OperationId = "ParticipantsUpdated")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> ParticipantsUpdated(Guid conferenceId, UpdateConferenceParticipantsRequest request)
    {
        logger.LogDebug("ParticipantsUpdated called. ConferenceId: {ConferenceId}, Request {Serialize}", conferenceId,
            JsonSerializer.Serialize(request));
        
        try
        {
            var conference = await conferenceService.GetConference(conferenceId);
            var removedParticipants =
                conference.Participants.Where(p => request.RemovedParticipants.Contains(p.Id)).ToList();
            
            //Will force getting latest added / updated /removed participant changes, no need to manually amend cache anymore
            conference = await conferenceService.ForceGetConference(conferenceId);
            
            var participantsToNotify = conference.Participants.Union(removedParticipants).ToList();
            
            await participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference, participantsToNotify);
            logger.LogDebug("ParticipantsUpdated finished. ConferenceId: {ConferenceId}", conferenceId);
            return NoContent();
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, "ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}", conferenceId,
                e.StatusCode);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
}
