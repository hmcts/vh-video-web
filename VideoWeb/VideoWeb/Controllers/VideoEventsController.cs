using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Extensions;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("callback")]
[Authorize(AuthenticationSchemes = "Callback")]
public class VideoEventsController(
    IConferenceService conferenceService,
    IVideoApiClient videoApiClient,
    IEventHandlerFactory eventHandlerFactory,
    ILogger<VideoEventsController> logger) 
    : ControllerBase
{
    private readonly ActivitySource _callbackActivity = new("SupplierCallbackEvent");
    
    [HttpPost]
    [SwaggerOperation(OperationId = "SendEvent")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> SendHearingEventAsync(ConferenceEventRequest request)
    {
        var activity = _callbackActivity.StartActivity() ?? new Activity("SupplierCallbackEvent");
        try
        {
            activity.SetTag("event.source", "SupplierCallback");
            activity.SetTag("conference.id", request.ConferenceId);
            activity.SetTag("event.type", request.EventType.ToString());
            activity.SetTag("supplierCallbackPayload", JsonSerializer.Serialize(request));
            var conferenceId = Guid.Parse(request.ConferenceId);
            var conference = await conferenceService.GetConference(conferenceId, CancellationToken.None);
            await UpdateConferenceRoomParticipants(conference, request);
            
            var events = new List<ConferenceEventRequest> {request};
            if (request.IsParticipantAVmr(conference, out var roomId))
            {
                request.ParticipantRoomId = roomId.ToString();
                request.ParticipantId = null;
                events = request.CreateEventsForParticipantsInRoom(conference, roomId);
            }
            // Assign conference roles based on screening rules utilised by the Supplier API
            request.SetRoleForParticipantEvent(conference);
            
            var callbackEvents = events.Select(e => TransformAndMapRequest(e, conference)).ToList();
            
            // DO NOT USE Task.WhenAll because the handlers are not thread safe and will overwrite Source<Variable> for each run
            foreach (var e in events)
            {
                activity.AddEvent(new ActivityEvent("SentGeneratedEventToVideoApi"));
                await SendEventToVideoApi(e);
            }

            callbackEvents.RemoveRepeatedVhoCallConferenceEvents();
            foreach (var cb in callbackEvents)
            {
                activity.AddEvent(new ActivityEvent("SentGeneratedEventToUI"));
                await PublishEventToUi(cb);
            }

            await GenerateTransferEventOnVmrParticipantJoining(conference, request);

            activity.SetTag("event.handled", true);
            return NoContent();
        }
        catch (VideoApiException e)
        {
            activity.SetStatus(ActivityStatusCode.Error, e.Message);
            logger.LogError(e, "ConferenceId: {ConferenceId}, ErrorCode: {StatusCode}", request.ConferenceId, e.StatusCode);
            return StatusCode(e.StatusCode, e.Response);
        }
        finally
        {
            activity.Stop();
        }
    }
    
    private Task SendEventToVideoApi(ConferenceEventRequest request)
    {
        if (request.EventType == EventType.VhoCall)
        {
            return Task.CompletedTask;
        }
        
        request = request.UpdateEventTypeForVideoApi();
        
        logger.LogTrace("Raising video event: ConferenceId: {ConferenceId}, EventType: {EventType}",
            request.ConferenceId, request.EventType);
        
        return videoApiClient.RaiseVideoEventAsync(request);
    }
    
    private static CallbackEvent TransformAndMapRequest(ConferenceEventRequest request, Conference conference)
    {
        var callbackEvent = CallbackEventMapper.Map(request, conference);
        request.EventType = Enum.Parse<EventType>(callbackEvent.EventType.ToString());
        
        return callbackEvent;
    }
    
    private Task PublishEventToUi(CallbackEvent callbackEvent)
    {
        if (callbackEvent == null)
        {
            return Task.CompletedTask;
        }
        
        var handler = eventHandlerFactory.Get(callbackEvent.EventType);
        return handler.HandleAsync(callbackEvent);
    }
    
    /// <summary>
    /// This updates the VMRs for a conference when a participant joins or leaves a VMR
    /// </summary>
    /// <param name="conference"></param>
    /// <param name="request"></param>
    /// <returns></returns>
    private async Task UpdateConferenceRoomParticipants(Conference conference, ConferenceEventRequest request)
    {
        if (!request.IsParticipantAndVmrEvent())
        {
            return;
        }
        
        var vmrId = long.Parse(request.ParticipantRoomId);
        var participantId = Guid.Parse(request.ParticipantId);
        
        switch (request.EventType)
        {
            case EventType.Joined:
                conference.AddParticipantToRoom(vmrId, participantId);
                break;
            case EventType.Disconnected:
                conference.RemoveParticipantFromRoom(vmrId, participantId);
                break;
            default: return;
        }
        
        await conferenceService.UpdateConferenceAsync(conference);
    }
    
    private async Task GenerateTransferEventOnVmrParticipantJoining(Conference conference, ConferenceEventRequest request)
    {
        if (!request.IsParticipantAndVmrEvent())
        {
            return;
        }
        
        if (request.EventType == EventType.Joined)
        {
            var vmrId = long.Parse(request.ParticipantRoomId);
            var participantId = Guid.Parse(request.ParticipantId);
            
            var vmr = conference.CivilianRooms.Find(room => room.Id == vmrId);
            var linkedParticipantInConsultation = vmr?.Participants.Where(participantGuid => participantGuid != participantId)
                .Select(participantGuid => conference.Participants.Find(y => participantGuid == y.Id))
                .FirstOrDefault(participant => participant?.ParticipantStatus == ParticipantStatus.InConsultation);
            if (linkedParticipantInConsultation != null)
            {
                var room = (await videoApiClient.GetParticipantsByConferenceIdAsync(conference.Id)).FirstOrDefault(participant => participant.Id == linkedParticipantInConsultation.Id)?.CurrentRoom;
                if (room != null)
                {
                    await SendHearingEventAsync(new ConferenceEventRequest
                    {
                        ConferenceId = conference.Id.ToString(),
                        EventId = Guid.NewGuid().ToString(),
                        EventType = EventType.Transfer,
                        ParticipantId = vmrId.ToString(),
                        TransferFrom = "WaitingRoom",
                        TransferTo = room.Label
                    });
                }
            }
        }
    }
}
