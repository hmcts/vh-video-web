using System;
using System.Linq;
using System.Net;
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
using VideoWeb.Common.Logging;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Services;
using Supplier = VideoWeb.Common.Enums.Supplier;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("conferences")]
[Authorize("Host")]
public class ConferenceManagementController(
    IVideoApiClient videoApiClient,
    ILogger<ConferenceManagementController> logger,
    IHearingLayoutService hearingLayoutService,
    IConferenceManagementService conferenceManagementService,
    IConferenceService conferenceService)
    : ControllerBase
{
    /// <summary>
    /// Start or resume a video hearing
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="request">start hearing request details</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Accepted status</returns>
    [HttpPost("{conferenceId}/start")]
    [SwaggerOperation(OperationId = "StartOrResumeVideoHearing")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> StartOrResumeVideoHearingAsync(Guid conferenceId,
        StartOrResumeVideoHearingRequest request, CancellationToken cancellationToken)
    {
        var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
        if (validatedRequest != null)
        {
            return validatedRequest;
        }

        await conferenceManagementService.StartOrResumeVideoHearingAsync(conferenceId, User.Identity!.Name,
            request.Layout, cancellationToken);
        logger.LogStartOrResumeConference(conferenceId);
        return Accepted();
    }

    /// <summary>
    /// Returns the active layout for a conference
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Ok status</returns>
    /// <returns>Forbidden status</returns>
    /// <returns>Not Found status</returns>
    [HttpGet("{conferenceId}/getlayout")]
    [SwaggerOperation(OperationId = "GetLayoutForHearing")]
    [ProducesResponseType(typeof(HearingLayout), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.Forbidden)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetLayoutForHearing(Guid conferenceId, CancellationToken cancellationToken)
    {
        logger.LogGettingLayout(conferenceId);
        var layout = await hearingLayoutService.GetCurrentLayout(conferenceId, cancellationToken);

        if (!layout.HasValue)
        {
            logger.LogLayoutNotFound(conferenceId);
            return NotFound();
        }

        logger.LogParticipantDismissed(layout.Value.ToString(), conferenceId);
        return Ok(layout);
    }

    /// <summary>
    /// Update the active layout for a conference
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="layout">layout</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Ok status</returns>
    /// <returns>Forbidden status</returns>
    /// <returns>Not Found status</returns>
    [HttpPost("{conferenceId}/updatelayout")]
    [SwaggerOperation(OperationId = "UpdateLayoutForHearing")]
    [ProducesResponseType((int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.Forbidden)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> UpdateLayoutForHearing(Guid conferenceId, HearingLayout layout,
        CancellationToken cancellationToken)
    {
        logger.LogUpdateLayout(layout.ToString(), conferenceId);
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participant = conference.GetParticipant(User.Identity!.Name);

        if (participant == null)
        {
            logger.LogParticipantNotFound(layout.ToString(), User.Identity.Name, conferenceId);
            return NotFound(nameof(participant));
        }

        await hearingLayoutService.UpdateLayout(conferenceId, participant.Id, layout, cancellationToken);

        logger.LogLayoutUpdated(layout.ToString(), conferenceId);
        return Ok();
    }

    /// <summary>
    /// Get recommended layout for hearing
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Ok status</returns>
    /// <returns>Forbidden status</returns>
    /// <returns>Not Found status</returns>
    [HttpPost("{conferenceId}/getrecommendedlayout")]
    [SwaggerOperation(OperationId = "GetRecommendedLayoutForHearing")]
    [ProducesResponseType(typeof(HearingLayout), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.Forbidden)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetRecommendedLayoutForHearing(Guid conferenceId,
        CancellationToken cancellationToken)
    {
        logger.LogGetRecommendedLayout(conferenceId);
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        return Ok(conference.GetRecommendedLayout());
    }

    /// <summary>
    /// Pause a video hearing
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Accepted status</returns>
    [HttpPost("{conferenceId}/pause")]
    [SwaggerOperation(OperationId = "PauseVideoHearing")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    public async Task<IActionResult> PauseVideoHearingAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
        if (validatedRequest != null)
        {
            return validatedRequest;
        }

        await videoApiClient.PauseVideoHearingAsync(conferenceId, cancellationToken);
        logger.LogPauseConference(conferenceId);
        return Accepted();
    }

    /// <summary>
    /// Suspend a video hearing
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Accepted status</returns>
    [HttpPost("{conferenceId}/suspend")]
    [SwaggerOperation(OperationId = "SuspendVideoHearing")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    public async Task<IActionResult> SuspendVideoHearingAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
        if (validatedRequest != null)
        {
            return validatedRequest;
        }

        await videoApiClient.SuspendHearingAsync(conferenceId, cancellationToken);
        logger.LogSuspendConference(conferenceId);
        return Accepted();
    }

    /// <summary>
    /// End a video hearing
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Accepted status</returns>
    [HttpPost("{conferenceId}/end")]
    [SwaggerOperation(OperationId = "EndVideoHearing")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    public async Task<IActionResult> EndVideoHearingAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
        if (validatedRequest != null)
        {
            return validatedRequest;
        }

        await videoApiClient.EndVideoHearingAsync(conferenceId, cancellationToken);
        logger.LogEndConference(conferenceId);
        return Accepted();
    }

    /// <summary>
    /// Admit a participant into an active video hearing
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="participantId">participant or endpoint id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Accepted status</returns>
    [HttpPost("{conferenceId}/participant/{participantId}/call")]
    [SwaggerOperation(OperationId = "CallParticipant")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    public async Task<IActionResult> CallParticipantAsync(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var validatedRequest = await ValidateUserIsHostAndParticipantIsInConferenceIsCallable(conference, participantId, cancellationToken);
        if (validatedRequest != null)
        {
            return validatedRequest;
        }
        await TransferParticipantAsync(conference, participantId, TransferType.Call, cancellationToken);
        return Accepted();
    }

    /// <summary>
    /// Joins a video hearing currently in session
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="participantId">participant id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Accepted status</returns>
    [HttpPost("{conferenceId}/participant/{participantId}/join-hearing")]
    [SwaggerOperation(OperationId = "JoinHearingInSession")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    public async Task<IActionResult> JoinHearingInSession(Guid conferenceId, Guid participantId,
        CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var validatedRequest = await ValidateUserIsHostAndInConference(conference);
        if (validatedRequest != null)
        {
            return validatedRequest;
        }

        await TransferParticipantAsync(conference, participantId, TransferType.Call, cancellationToken);
        return Accepted();

    }

    /// <summary>
    /// Call a participant into a video hearing
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="participantId">participant or endpoint id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Accepted status</returns>
    [HttpPost("{conferenceId}/participant/{participantId}/dismiss")]
    [SwaggerOperation(OperationId = "DismissParticipant")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    public async Task<IActionResult> DismissParticipantAsync(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var validatedRequest = await ValidateUserIsHostAndParticipantIsInConferenceIsCallable(conference, participantId, cancellationToken);
        if (validatedRequest != null)
        {
            return validatedRequest;
        }
        
        await TransferParticipantAsync(conference, participantId, TransferType.Dismiss, cancellationToken);
        if(conference.GetParticipant(participantId) != null)
        {
            // reset hand raise on dismiss if participant
            await conferenceManagementService.UpdateParticipantHandStatusInConference(conferenceId, participantId,
                false, cancellationToken);
        
            await AddDismissTaskAsync(conference, participantId, cancellationToken);
        }
        
        return Accepted();
    }

    /// <summary>
    /// Leave host from hearing
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="participantId">participant id</param>
    /// <param name="cancellationToken">cancellation token</param>
    /// <returns>Accepted status</returns>
    [HttpPost("{conferenceId}/participant/{participantId}/leave")]
    [SwaggerOperation(OperationId = "LeaveHearing")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    public async Task<IActionResult> LeaveHearingAsync(Guid conferenceId, Guid participantId,
        CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var validatedRequest = await ValidateUserIsHostAndInConference(conference);
        if (validatedRequest != null)
        {
            return validatedRequest;
        }

        await TransferParticipantAsync(conference, participantId, TransferType.Dismiss, cancellationToken);

        return Accepted();
    }

    private async Task<IActionResult> ValidateUserIsHostAndInConference(Guid conferenceid, CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(conferenceid, cancellationToken);
        return await ValidateUserIsHostAndInConference(conference);
    }
    
    private Task<IActionResult> ValidateUserIsHostAndInConference(Conference conference)
    {
        var isUserHostForConference = conference.Participants.Exists(x =>
            x.Username.Equals(User.Identity!.Name?.Trim(), StringComparison.InvariantCultureIgnoreCase) && x.IsHost());
        if (isUserHostForConference)
        {
            return Task.FromResult<IActionResult>(null);
        }
        
        logger.LogParticipantDismissed(AppRoles.JudgeRole, AppRoles.StaffMember);
        return Task.FromResult<IActionResult>(Unauthorized($"User must be either {AppRoles.JudgeRole} or {AppRoles.StaffMember}."));
    }
    
    private async Task<IActionResult> ValidateUserIsHostAndParticipantIsInConferenceIsCallable(Conference conference, Guid participantId, CancellationToken cancellationToken)
    {
        // ensure the invoker is a host of the given conference id
        var judgeValidation = await ValidateUserIsHostAndInConference(conference);
        if (judgeValidation != null) return judgeValidation;

        var endpoint = conference.Endpoints.Find(x => x.Id == participantId);
        if(endpoint != null)
        {
            return null;
        }
        
        // ensure the participant exists in said conference and is callable
        if (await ValidateParticipantIsInConferenceAndCallable(conference, participantId, cancellationToken))
        {
            return null;
        }
        
        logger.LogParticipantNotCallable(participantId, conference.Id);
        return Unauthorized("Participant/Endpoint is not callable");
    }
    
    private async Task<bool> ValidateParticipantIsInConferenceAndCallable(Conference conference, Guid participantId, CancellationToken cancellationToken)
    {
        var participant = conference.Participants.SingleOrDefault(x => x.Id == participantId);
        
        if (participant == null)
        {
            return false;
        }
        
        // Vodafone is the supplier, all participants are callable.
        // VMRs will not be used so the below is not required if the supplier is Vodafone
        if (conference.Supplier == Supplier.Vodafone) return true;
        
        if (participant.LinkedParticipants.Count == 0)
        {
            return participant.IsCallable();
        }
        
        var witnessRoom = await GetWitnessRoom(conference, participantId, cancellationToken);
        
        if (witnessRoom == null)
        {
            return false;
        }
        
        var expectedParticipantsInRoomIds = participant.LinkedParticipants.Select(x => x.LinkedId).ToList();
        expectedParticipantsInRoomIds.Add(participant.Id);
        return expectedParticipantsInRoomIds.TrueForAll(p => witnessRoom.Participants.Contains(p));
    }
    
    private async Task<CivilianRoom> GetWitnessRoom(Conference conference, Guid participantId, CancellationToken cancellationToken)
    {
        var witnessRoom = GetRoomForParticipant(conference, participantId);
        
        if (witnessRoom != null) return witnessRoom;
        
        conference = await conferenceService.GetConference(conference.Id, cancellationToken);
        
        witnessRoom = GetRoomForParticipant(conference, participantId);
        
        return witnessRoom;
    }
    
    private static CivilianRoom GetRoomForParticipant(Conference conference, Guid participantId) =>
        conference.CivilianRooms.Find(x => x.Participants.Contains(participantId));
    
    private static string GetParticipantRoleString(Participant participant)
    {
        return participant.Role switch
        {
            Role.QuickLinkParticipant => "Participant",
            Role.QuickLinkObserver => "Observer",
            _ => participant.HearingRole
        };
    }

    private Task TransferParticipantAsync(Conference conference, Guid participantId, TransferType transferType,
        CancellationToken cancellationToken)
    {
        var role = conference.GetNonScreenedParticipantsAndEndpoints().Contains(participantId)
            ? ConferenceRole.Host
            : ConferenceRole.Guest;
        return videoApiClient.TransferParticipantAsync(conference.Id, new TransferParticipantRequest
        {
            ParticipantId = participantId,
            TransferType = transferType,
            ConferenceRole = role
        }, cancellationToken);
    }

    private async Task AddDismissTaskAsync(Conference conference, Guid participantId, CancellationToken cancellationToken)
    {
        logger.LogParticipantDismissed(participantId, conference.Id);

        
        var participant = conference.GetParticipant(participantId);
        var dismisser = conference.GetParticipant(User.Identity!.Name);
        
        await videoApiClient.AddTaskAsync(conference.Id, new AddTaskRequest
        {
            ParticipantId = participantId,
            Body = $"{GetParticipantRoleString(participant)} dismissed by {GetParticipantRoleString(dismisser)}",
            TaskType = TaskType.Participant
        }, cancellationToken);
    }
}
