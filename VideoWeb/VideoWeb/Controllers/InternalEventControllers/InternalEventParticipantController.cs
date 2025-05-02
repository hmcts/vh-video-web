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
using VideoWeb.Contract.Request;
using VideoWeb.Common.Logging;

namespace VideoWeb.Controllers.InternalEventControllers;

[Produces("application/json")]
[ApiController]
[Route("internalevent")]
[Authorize(AuthenticationSchemes = "InternalEvent")]
[ApiExplorerSettings(IgnoreApi = true)]
public class InternalEventParticipantController(
    IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier,
    IConferenceService conferenceService,
    ILogger<InternalEventParticipantController> logger,
    IEndpointsUpdatedEventNotifier endpointsUpdatedEventNotifier)
    : ControllerBase
{
    [HttpPost("ParticipantsUpdated")]
    [SwaggerOperation(OperationId = "ParticipantsUpdated")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> ParticipantsUpdated(Guid conferenceId, UpdateConferenceParticipantsRequest request)
    {
        logger.LogParticipantsUpdatedCalled(conferenceId, JsonSerializer.Serialize(request));
        
        try
        {
            var conference = await conferenceService.GetConference(conferenceId);
            var removedParticipants = conference.Participants.Where(p => request.RemovedParticipants.Contains(p.Id)).ToList();
            
            //Will force getting latest added / updated /removed participant changes, no need to manually amend cache anymore
            conference = await conferenceService.ForceGetConference(conferenceId);
            
            var participantsToNotify = conference.Participants.Union(removedParticipants).ToList();
            
            await participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference, participantsToNotify);
            logger.LogParticipantsUpdatedFinished(conferenceId);
            return NoContent();
        }
        catch (VideoApiException e)
        {
            logger.LogConferenceError(e, conferenceId, e.StatusCode);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    [HttpPost("EndpointsUpdated")]
    [SwaggerOperation(OperationId = "EndpointsUpdated")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> EndpointsUpdated(Guid conferenceId, UpdateConferenceEndpointsRequest request)
    {
        logger.LogEndpointsUpdatedCalled(conferenceId, JsonSerializer.Serialize(request));
        
        try
        {
            var conference = await conferenceService.ForceGetConference(conferenceId);
            logger.LogRaisingVideoEvent(conference);
            
            await endpointsUpdatedEventNotifier.PushEndpointsUpdatedEvent(conference, request);
            logger.LogEndpointsUpdatedFinished(conferenceId);
            return NoContent();
        }
        catch (VideoApiException e)
        {
            logger.LogConferenceError(e, conferenceId, e.StatusCode);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    [HttpPost("UnlinkedParticipantFromEndpoint")]
    [SwaggerOperation(OperationId = "UnlinkedParticipantFromEndpoint")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> PushUnlinkedParticipantFromEndpoint(Guid conferenceId, string participant, string endpoint)
    {
        logger.LogUnlinkedParticipantFromEndpoint(conferenceId, participant, endpoint);
        await endpointsUpdatedEventNotifier.PushUnlinkedParticipantFromEndpoint(conferenceId, participant, endpoint);
        return NoContent();
    }
    
    [HttpPost("LinkedNewParticipantToEndpoint")]
    [SwaggerOperation(OperationId = "LinkedNewParticipantToEndpoint")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> PushLinkedNewParticipantToEndpoint(Guid conferenceId, string participant, string endpoint)
    {
        logger.LogUnlinkedParticipantFromEndpoint(conferenceId, participant, endpoint);
        await endpointsUpdatedEventNotifier.PushLinkedNewParticipantToEndpoint(conferenceId, participant, endpoint);
        return NoContent();
    }
    
    [HttpPost("CloseConsultationBetweenEndpointAndParticipant")]
    [SwaggerOperation(OperationId = "CloseConsultationBetweenEndpointAndParticipant")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> PushCloseConsultationBetweenEndpointAndParticipant(Guid conferenceId, string participant, string endpoint)
    {
        logger.LogUnlinkedParticipantFromEndpoint(conferenceId, participant, endpoint);
        await endpointsUpdatedEventNotifier.PushCloseConsultationBetweenEndpointAndParticipant(conferenceId, participant, endpoint);
        return NoContent();
    }
}
