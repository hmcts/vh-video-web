using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Common.Logging;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.Middleware;
using VideoWeb.Services;
using ParticipantResponse = VideoWeb.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("conferences")]
public class ParticipantsController(
    IVideoApiClient videoApiClient,
    IEventHandlerFactory eventHandlerFactory,
    ILogger<ParticipantsController> logger,
    IParticipantService participantService,
    IConferenceService conferenceService,
    IParticipantsUpdatedEventNotifier participantsUpdatedEventNotifier)
    : ControllerBase
{
    /// <summary>
    /// Update the participant status for a conference
    /// </summary>
    /// <param name="conferenceId">The conference ID</param>
    /// <param name="updateParticipantStatusEventRequest">The status change</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns></returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpPost("{conferenceId}/participantstatus")]
    [SwaggerOperation(OperationId = "UpdateParticipantStatus")]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    public async Task<IActionResult> UpdateParticipantStatusAsync(Guid conferenceId,
        UpdateParticipantStatusEventRequest updateParticipantStatusEventRequest, CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participantId = GetIdForParticipantByUsernameInConference(conference);
        var conferenceEventRequest = new ConferenceEventRequest
        {
            ConferenceId = conferenceId.ToString(),
            ParticipantId = participantId.ToString(),
            EventId = Guid.NewGuid().ToString(),
            EventType = updateParticipantStatusEventRequest.EventType,
            TimeStampUtc = DateTime.UtcNow,
            Reason = EventTypeReasonMapper.Map(updateParticipantStatusEventRequest.EventType)
        };

        var callbackEvent = CallbackEventMapper.Map(conferenceEventRequest, conference);
        var handler = eventHandlerFactory.Get(callbackEvent.EventType);
        try
        {
            await handler.HandleAsync(callbackEvent);
        }
        catch (ConferenceNotFoundException e)
        {
            logger.LogError(e, "Unable to retrieve conference details");
            return BadRequest(e);
        }

        await videoApiClient.RaiseVideoEventAsync(conferenceEventRequest, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Get the heartbeat data for a participant
    /// </summary>
    /// <param name="conferenceId">The ID of a conference</param>
    /// <param name="participantId">The ID of the participant</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns>The heartbeat data</returns>
    [Authorize(AppRoles.VhOfficerRole)]
    [HttpGet("{conferenceId}/participant/{participantId}/heartbeatrecent")]
    [SwaggerOperation(OperationId = "GetHeartbeatDataForParticipant")]
    [ProducesResponseType(typeof(ParticipantHeartbeatResponse[]), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetHeartbeatDataForParticipantAsync(Guid conferenceId, Guid participantId,
        CancellationToken cancellationToken)
    {
        var response =
            await videoApiClient.GetHeartbeatDataForParticipantAsync(conferenceId, participantId,
                cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="conferenceId">The ID of a conference</param>
    /// <param name="participantId">The ID of the participant</param>
    /// <param name="participantRequest">Payload including the new display name</param>
    /// <param name="cancellationToken">The cancellation token</param>
    /// <returns></returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpPost("{conferenceId}/participants/{participantId}/participantDisplayName")]
    [SwaggerOperation(OperationId = "UpdateParticipantDisplayName")]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    public async Task<IActionResult> UpdateParticipantDisplayNameAsync(Guid conferenceId, Guid participantId,
        [FromBody] UpdateParticipantDisplayNameRequest participantRequest, CancellationToken cancellationToken)
    {
        await videoApiClient.UpdateParticipantDetailsAsync(conferenceId, participantId, new UpdateParticipantRequest
        {
            DisplayName = participantRequest.DisplayName
        }, cancellationToken);
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        conference.GetParticipant(participantId).DisplayName = participantRequest.DisplayName;
        await UpdateCacheAndPublishUpdatedParticipantList(conference, null, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Get the participant details of a conference by id for VH officer
    /// </summary>
    /// <param name="conferenceId">The unique id of the conference</param>
    /// <param name="cancellationToken">CancellationToken</param>
    /// <returns>the participant details, if permitted</returns>
    [HttpGet("{conferenceId}/vhofficer/participants")]
    [ProducesResponseType(typeof(IEnumerable<ParticipantContactDetailsResponseVho>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [SwaggerOperation(OperationId = "GetParticipantsWithContactDetailsByConferenceId")]
    [Authorize(AppRoles.VhOfficerRole)]
    public async Task<IActionResult> GetParticipantsWithContactDetailsByConferenceIdAsync(Guid conferenceId,
        CancellationToken cancellationToken)
    {
        if (conferenceId == Guid.Empty)
        {
            logger.LogConferenceIdNotProvided();
            ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");
            return BadRequest(ModelState);
        }

        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);

        logger.LogRetrievingBookingParticipants(conference.HearingId);

        var hostsInHearingsToday = await videoApiClient.GetHostsInHearingsTodayAsync(cancellationToken);
        var response = ParticipantStatusResponseForVhoMapper.Map(conference, hostsInHearingsToday);

        return Ok(response);
    }

    /// <summary>
    /// Get participants for a conference
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
    [HttpGet("{conferenceId}/participants")]
    [SwaggerOperation(OperationId = "GetParticipantsByConferenceId")]
    [ProducesResponseType(typeof(List<ParticipantResponse>), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetParticipantsByConferenceIdAsync(Guid conferenceId,
        CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participants = conference.Participants.Select(ParticipantDtoForResponseMapper.Map).ToList();
        return Ok(participants);
    }

    /// <summary>
    /// Get Participant details for the user logged in
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpGet("{conferenceId}/currentparticipant")]
    [SwaggerOperation(OperationId = "GetCurrentParticipant")]
    [ProducesResponseType(typeof(LoggedParticipantResponse), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetCurrentParticipantAsync(Guid conferenceId, CancellationToken cancellationToken)
    {
        var participantsRoles = new List<Role>
        {
            Role.Judge,
            Role.Individual,
            Role.Representative,
            Role.JudicialOfficeHolder,
            Role.QuickLinkParticipant,
            Role.QuickLinkObserver,
            Role.StaffMember
        };
        var profile = ClaimsPrincipalToUserProfileResponseMapper.Map(User);
        var response = new LoggedParticipantResponse
        {
            AdminUsername = User.Identity?.Name,
            DisplayName = "Admin",
            Role = Role.VideoHearingsOfficer
        };

        if (!profile.Roles.Exists(role => participantsRoles.Contains(role))) return Ok(response);

        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participant = conference.GetParticipant(profile.Username);

        if (participant == null)
            return NotFound($"Current participant not found for conference {conferenceId}");
        
        response = new LoggedParticipantResponse
        {
            ParticipantId = participant.Id,
            DisplayName = participant.DisplayName,
            Role = participant.Role
        };

        return Ok(response);
    }

    /// <summary>
    /// Join a conference as a staff member
    /// </summary>
    /// <param name="conferenceId"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpPost("{conferenceId}/joinConference")]
    [SwaggerOperation(OperationId = "StaffMemberJoinConference")]
    [ProducesResponseType(typeof(ConferenceResponse), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType((int)HttpStatusCode.BadRequest)]
    [Authorize(AppRoles.StaffMember)]
    public async Task<IActionResult> StaffMemberJoinConferenceAsync(Guid conferenceId,
        CancellationToken cancellationToken)
    {
        var username = User.Identity!.Name!.ToLower().Trim();
        var originalConference =
            await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId, cancellationToken);

        if (!participantService.CanStaffMemberJoinConference(originalConference))
        {
            logger.LogWarning(
                "Staff Member only can view hearing within 30 minutes of the Start time and 2 hours after the hearing has closed");
            ModelState.AddModelError(nameof(conferenceId),
                $"Please select a valid conference {nameof(conferenceId)}");
            return BadRequest(ModelState);
        }

        logger.LogAssignStaffMemberToConference(username, conferenceId);

        var staffMemberProfile = ClaimsPrincipalToUserProfileResponseMapper.Map(User);

        var response = await videoApiClient.AddStaffMemberToConferenceAsync(conferenceId,
            participantService.InitialiseAddStaffMemberRequest(staffMemberProfile, username), cancellationToken);
        await participantService.AddParticipantToConferenceCache(response.ConferenceId, response.Participant);
        var updatedConference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var mappedUpdatedConference = ConferenceResponseMapper.Map(updatedConference);
        return Ok(mappedUpdatedConference);

    }

    /// <summary>  
    /// Removes a participant from a conference  
    /// errors.  
    /// </summary>  
    /// <returns>  
    /// No content result  
    /// </returns>  
    [HttpDelete("{conferenceId}/participants/{participantId}")]
    [SwaggerOperation(OperationId = "DeleteParticipantFromConference")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    [ProducesResponseType(typeof(ValidationProblemDetails), (int)HttpStatusCode.BadRequest)]
    public async Task<IActionResult> RemoveParticipantFromConferenceAsync(Guid conferenceId, Guid participantId,
        CancellationToken cancellationToken)
    {
        var conference = await conferenceService.GetConference(conferenceId, cancellationToken);
        var participantToRemove = conference.GetParticipant(participantId);
        if (conference.GetParticipant(participantId).ParticipantStatus is not ParticipantStatus.Disconnected)
        {
            ModelState.AddModelError(nameof(participantId), "Participant is not disconnected");
            return ValidationProblem(ModelState);
        }

        await videoApiClient.RemoveParticipantFromConferenceAsync(conferenceId, participantId, cancellationToken);

        conference.RemoveParticipantById(participantId);
        await UpdateCacheAndPublishUpdatedParticipantList(conference, participantToRemove, cancellationToken);
        return NoContent();
    }

    private async Task UpdateCacheAndPublishUpdatedParticipantList(Conference conference, Participant removedParticipant,
        CancellationToken cancellationToken)
    {
        await conferenceService.UpdateConferenceAsync(conference, cancellationToken);
        var participantsToNotify = conference.Participants.ToList();
        if (removedParticipant != null)
        {
            // removed participant needs an updated object without themselves in it
            participantsToNotify.Add(removedParticipant);
        }
        await participantsUpdatedEventNotifier.PushParticipantsUpdatedEvent(conference, participantsToNotify);
    }

    private Guid GetIdForParticipantByUsernameInConference(Conference conference)
    {
        var username = User.Identity!.Name;
        return conference.Participants
            .Single(x => x.Username.Equals(username, StringComparison.CurrentCultureIgnoreCase)).Id;
    }
}
