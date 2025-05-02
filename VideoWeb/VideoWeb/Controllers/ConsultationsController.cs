using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.EventHub.Services;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Requests;
using ConsultationAnswer = VideoWeb.Common.Models.ConsultationAnswer;
using VideoWeb.Common.Logging;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("consultations")]
public class ConsultationsController(
    IVideoApiClient videoApiClient,
    IConferenceService conferenceService,
    ILogger<ConsultationsController> logger,
    IConsultationNotifier consultationNotifier,
    IConsultationInvitationTracker consultationInvitationTracker,
    IDistributedJohConsultationRoomLockCache distributedJohConsultationRoomLockCache)
    : ControllerBase
{
#pragma warning disable S1104
    public int WaitForLockRoomTime = 3000;
#pragma warning restore S1104
    public const string ConsultationHasScreenedParticipantErrorMessage =
        "Participant is not allowed to join the consultation room with a participant they are screened from";
    
    public const string ConsultationHasScreenedEndpointErrorMessage =
        "Endpoint is not allowed to join the consultation room with a participant they are screened from";
    
    public const string ConsultationHasScreenedParticipantAndEndpointErrorMessage =
        "Cannot start consultation with participants or endpoints that are screened from each other";

    public const string ConsultationWithObserversNotAllowedMessage = "Cannot start consultation with observers";
    
    /// <summary>
    /// Leave the Consultation
    /// </summary>
    /// <param name="request"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("leave")]
    [SwaggerOperation(OperationId = "LeaveConsultation")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> LeaveConsultationAsync(LeavePrivateConsultationRequest request, CancellationToken cancellationToken)
    {
        var participant = new Participant();
        try
        {
            var conference = await conferenceService.GetConference(request.ConferenceId, cancellationToken);
            participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId);
            if (participant == null)
            {
                return NotFound();
            }
            
            var mappedRequest = LeavePrivateConsultationRequestMapper.Map(request);
            await videoApiClient.LeaveConsultationAsync(mappedRequest, cancellationToken);
            
            return NoContent();
        }
        catch (VideoApiException e)
        {
            if (participant != null)
            {
                logger.LogLeaveConsultationError(e, participant.Username);
            }
            else
            {
                logger.LogInvalidParticipant(e);
            }
            
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    /// <summary>
    /// Send response to Consultation Request
    /// </summary>
    /// <param name="request"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("respond")]
    [SwaggerOperation(OperationId = "RespondToConsultationRequest")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> RespondToConsultationRequestAsync(PrivateConsultationRequest request, CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(request.ConferenceId, cancellationToken);
        var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedById);
        if (participant == null && request.RequestedById != Guid.Empty)
        {
            // Participants other than VHO
            return NotFound();
        }
        
        var mappedRequest = PrivateConsultationRequestMapper.Map(request);
        
        try
        {
            await consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, request.Answer);
            var haveAllAccepted = await consultationInvitationTracker.HaveAllParticipantsAccepted(request.InvitationId);
            if (haveAllAccepted)
            {
                await consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, ConsultationAnswer.Transferring);
                await videoApiClient.RespondToConsultationRequestAsync(mappedRequest, cancellationToken);
            }
            else if (request.Answer != ConsultationAnswer.Accepted)
            {
                await videoApiClient.RespondToConsultationRequestAsync(mappedRequest, cancellationToken);
            }
            
            return NoContent();
        }
        catch (VideoApiException e)
        {
            await consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, ConsultationAnswer.Failed);
            logger.LogError(e, "Consultation request could not be responded to");
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    /// <summary>
    /// Join a private consultation
    /// </summary>
    /// <param name="request"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("joinPrivateConsultation")]
    [SwaggerOperation(OperationId = "JoinPrivateConsultation")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> JoinPrivateConsultation(JoinPrivateConsultationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogAttemptingToJoinPrivateConsultation(request.ConferenceId, request.ParticipantId, request.RoomLabel);
            var authenticatedUsername = User.Identity?.Name?.ToLower().Trim();
            var conference = await conferenceService.GetConference(request.ConferenceId, cancellationToken);
            var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId && x.Username.Trim().Equals(authenticatedUsername, StringComparison.CurrentCultureIgnoreCase));
            
            if (participant == null)
            {
                logger.LogParticipantNotFoundForConsultation(request.ConferenceId, request.ParticipantId, request.RoomLabel);
                return NotFound("Couldn't find participant.");
            }
            
            if (!conference.CanParticipantJoinConsultationRoom(request.RoomLabel, request.ParticipantId))
            {
                return BadRequest(ConsultationHasScreenedParticipantErrorMessage);
            }
            
            var mappedRequest = JoinPrivateConsultationRequestMapper.Map(request);
            
            await videoApiClient.RespondToConsultationRequestAsync(mappedRequest, cancellationToken);
            await consultationNotifier.NotifyParticipantTransferring(conference, request.ParticipantId, request.RoomLabel);
        }
        catch (VideoApiException e)
        {
            logger.LogError(e, "Join private consultation error {ConferenceId} {ParticipantId} {RoomLabel}", request.ConferenceId, request.ParticipantId, request.RoomLabel);
            return StatusCode(e.StatusCode);
        }
        
        return Accepted();
    }
    
    /// <summary>
    /// Start a private consultation
    /// </summary>
    /// <param name="request"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    /// <exception cref="UnauthorizedAccessException"></exception>
    [HttpPost("start")]
    [SwaggerOperation(OperationId = "StartOrJoinConsultation")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> StartConsultationAsync(StartPrivateConsultationRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var username = User.Identity?.Name?.Trim() ?? throw new UnauthorizedAccessException("No username found in claims");
            var conference = await conferenceService.GetConference(request.ConferenceId, cancellationToken);
            
            if (conference.AreEntitiesScreenedFromEachOther(request.InviteParticipants.ToList(), request.InviteEndpoints.ToList()))
            {
                return BadRequest(ConsultationHasScreenedParticipantAndEndpointErrorMessage);
            }
            
            if (conference.Participants.Exists(x => request.InviteParticipants.Contains(x.Id) && x.IsObserver()))
            {
                return BadRequest(ConsultationWithObserversNotAllowedMessage);
            }
            
            var requestedBy = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedBy && x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
            if (requestedBy == null)
            {
                logger.LogParticipantNotFound(request.RequestedBy, username);
                return NotFound();
            }
            
            var mappedRequest = StartPrivateConsultationRequestMapper.Map(request);
            
            if (request.RoomType == Contract.Enums.VirtualCourtRoomType.Participant)
            {
                await StartParticipantConsultation(request, mappedRequest, conference, username, cancellationToken);
            }
            else
            {
                if (!CanStartJohConsultation())
                {
                    return Forbid();
                }
                
                await StartJudicialConsultation(conference, mappedRequest, cancellationToken);
            }
            
            return Accepted();
        }
        catch (VideoApiException e)
        {
            logger.LogStartConsultationError(e);
            return StatusCode(e.StatusCode);
        }
    }
    
    [HttpPost("lock")]
    [SwaggerOperation(OperationId = "LockConsultationRoomRequest")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> LockConsultationRoomRequestAsync(LockConsultationRoomRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var conference = await conferenceService.GetConference(request.ConferenceId, cancellationToken);
            var mappedRequest = LockRoomRequestMapper.Map(request);
            await videoApiClient.LockRoomAsync(mappedRequest, cancellationToken);
            
            await consultationNotifier.NotifyRoomUpdateAsync(conference,
                new Room { Label = request.RoomLabel, Locked = request.Lock, ConferenceId = conference.Id });
            
            return NoContent();
        }
        catch (VideoApiException e)
        {
            logger.LogLockConsultationRoomError(e);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
    
    [HttpPost("invite")]
    [SwaggerOperation(OperationId = "InviteToConsultation")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> InviteToConsultationAsync(InviteToConsultationRequest request, CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(request.ConferenceId, cancellationToken);
        var username = User.Identity?.Name?.ToLower().Trim();
        var requestedBy = conference.Participants.SingleOrDefault(x =>
            x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
        if (requestedBy == null && !User.IsInRole(AppRoles.VhOfficerRole))
        {
            return Unauthorized("You must be a VHO or a member of the conference");
        }
        
        if (!conference.CanParticipantJoinConsultationRoom(request.RoomLabel, request.ParticipantId))
        {
            return BadRequest(ConsultationHasScreenedParticipantErrorMessage);
        }
        
        await consultationNotifier.NotifyConsultationRequestAsync(conference, request.RoomLabel, requestedBy?.Id ?? Guid.Empty, request.ParticipantId);
        
        return Accepted();
    }
    
    [HttpPost("addendpoint")]
    [SwaggerOperation(OperationId = "AddEndpointToConsultation")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> AddEndpointToConsultationAsync(AddEndpointConsultationRequest request, CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(request.ConferenceId, cancellationToken);
        var username = User.Identity?.Name?.ToLower().Trim();
        var requestedBy = conference.Participants.SingleOrDefault(x => x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
        
        if (requestedBy == null)
        {
            return Unauthorized("You must be a VHO or a member of the conference");
        }
        
        if (!conference.CanEndpointJoinConsultationRoom(request.RoomLabel, request.EndpointId))
        {
            return BadRequest(ConsultationHasScreenedEndpointErrorMessage);
        }
        
        try
        {
            await consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Transferring);
            await videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
            {
                ConferenceId = request.ConferenceId,
                EndpointId = request.EndpointId,
                RoomLabel = request.RoomLabel
            }, cancellationToken);
        }
        catch (VideoApiException e)
        {
            // As endpoints cannot be linked participants just use and Empty GUID
            await consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Failed);
            logger.LogJoinEndpointToConsultationError(e);
            return StatusCode(e.StatusCode);
        }
        
        return Accepted();
    }
    
    private async Task StartJudicialConsultation(Conference conference, StartConsultationRequest mappedRequest, CancellationToken cancellationToken)
    {
        var johConsultationRoomLockedStatusKeyName = $"johConsultationRoomLockedStatus_{conference.Id}";
        var isLocked =
            await distributedJohConsultationRoomLockCache.IsJohRoomLocked(johConsultationRoomLockedStatusKeyName, cancellationToken);
        
        if (isLocked)
        {
            Thread.Sleep(WaitForLockRoomTime);
        }
        else
        {
            await distributedJohConsultationRoomLockCache.UpdateJohConsultationRoomLockStatus(true,
                johConsultationRoomLockedStatusKeyName, cancellationToken);
        }
        
        await videoApiClient.StartPrivateConsultationAsync(mappedRequest, cancellationToken);
    }
    
    private async Task StartParticipantConsultation(StartPrivateConsultationRequest request, StartConsultationRequest mappedRequest, Conference conference, string username,
        CancellationToken cancellationToken)
    {
        var room = await videoApiClient.CreatePrivateConsultationAsync(mappedRequest, cancellationToken);
        conference.UpsertConsultationRoom(room.Label, room.Locked);
        await conferenceService.UpdateConferenceAsync(conference, cancellationToken);
        await consultationNotifier.NotifyRoomUpdateAsync(conference, new Room { Label = room.Label, Locked = room.Locked, ConferenceId = conference.Id });
        foreach (var participantId in request.InviteParticipants.Where(participantId => conference.Participants.Exists(p => p.Id == participantId)))
        {
            await consultationNotifier.NotifyConsultationRequestAsync(conference, room.Label, request.RequestedBy, participantId);
        }
        
        var validSelectedEndpoints = request.InviteEndpoints
            .Select(endpointId => conference.Endpoints.SingleOrDefault(p => p.Id == endpointId))
            .Where(x => x != null && x.ParticipantsLinked.Contains(username));
        
        foreach (var endpointId in validSelectedEndpoints.Select(x => x.Id))
        {
            try
            {
                await videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                {
                    ConferenceId = request.ConferenceId,
                    EndpointId = endpointId,
                    RoomLabel = room.Label,
                    
                }, cancellationToken);
                break;
            }
            catch (VideoApiException e)
            {
                // As endpoints cannot be linked participants just use and Empty GUID
                await consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, room.Label, endpointId, ConsultationAnswer.Failed);
                logger.LogError(e, "Unable to add {EndpointId} to consultation",endpointId);
            }
        }
    }
    
    private bool CanStartJohConsultation()
    {
        return User.IsInRole(AppRoles.JudgeRole) || User.IsInRole(AppRoles.StaffMember) || User.IsInRole(AppRoles.JudicialOfficeHolderRole);
    }
}
