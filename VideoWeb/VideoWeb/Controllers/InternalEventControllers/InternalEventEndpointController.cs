using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using System.Text.Json;
using VideoWeb.Common;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Contract.Request;

namespace VideoWeb.Controllers.InternalEventControllers;

[Produces("application/json")]
[ApiController]
[Route("internalevent")]
[Authorize(AuthenticationSchemes = "InternalEvent")]
public class InternalEventEndpointController(
    IConferenceService conferenceService,
    ILogger<InternalEventParticipantController> logger,
    IEndpointsUpdatedEventNotifier endpointsUpdatedEventNotifier)
    : ControllerBase
{

    [HttpPost("EndpointsUpdated")]
    [SwaggerOperation(OperationId = "EndpointsUpdated")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> EndpointsUpdated(Guid conferenceId, UpdateConferenceEndpointsRequest request)
    {
        logger.LogDebug("EndpointsUpdated called. ConferenceId: {ConferenceId}, Request {Payload}", conferenceId, JsonSerializer.Serialize(request));
        
        try
        {
            var conference = await conferenceService.ForceGetConference(conferenceId);
            logger.LogTrace("Initial conference details: {@Conference}", conference);
            
            await endpointsUpdatedEventNotifier.PushEndpointsUpdatedEvent(conference, request);
            logger.LogDebug("EndpointsUpdated finished. ConferenceId: {ConferenceId}", conferenceId);
            return NoContent();
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, "ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}", conferenceId,
                e.StatusCode);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    [HttpPost("UnlinkedParticipantFromEndpoint")]
    [SwaggerOperation(OperationId = "UnlinkedParticipantFromEndpoint")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> PushUnlinkedParticipantFromEndpoint(Guid conferenceId, string participant, string endpoint)
    {
        logger.LogDebug("UnlinkedParticipantFromEndpoint called. ConferenceId: {ConferenceId}, Participant {Participant}, Endpoint {Endpoint}",
            conferenceId, participant, endpoint);
        await endpointsUpdatedEventNotifier.PushUnlinkedParticipantFromEndpoint(conferenceId, participant, endpoint);
        return NoContent();
    }
    
    [HttpPost("LinkedNewParticipantToEndpoint")]
    [SwaggerOperation(OperationId = "LinkedNewParticipantToEndpoint")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> PushLinkedNewParticipantToEndpoint(Guid conferenceId, string participant, string endpoint)
    {
        logger.LogDebug("UnlinkedParticipantFromEndpoint called. ConferenceId: {ConferenceId}, Participant {Participant}, Endpoint {Endpoint}",
            conferenceId, participant, endpoint);
        await endpointsUpdatedEventNotifier.PushLinkedNewParticipantToEndpoint(conferenceId, participant, endpoint);
        return NoContent();
    }
    
    [HttpPost("CloseConsultationBetweenEndpointAndParticipant")]
    [SwaggerOperation(OperationId = "CloseConsultationBetweenEndpointAndParticipant")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> PushCloseConsultationBetweenEndpointAndParticipant(Guid conferenceId, string participant, string endpoint)
    {
        logger.LogDebug("UnlinkedParticipantFromEndpoint called. ConferenceId: {ConferenceId}, Participant {Participant}, Endpoint {Endpoint}",
            conferenceId, participant, endpoint);
        await endpointsUpdatedEventNotifier.PushCloseConsultationBetweenEndpointAndParticipant(conferenceId, participant, endpoint);
        return NoContent();
    }
}
