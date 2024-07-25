using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Exceptions;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Enums;
using VideoWeb.Common;
using VideoWeb.Mappings;
using VideoWeb.Middleware;
using VideoWeb.Services;
using ParticipantResponse = VideoWeb.Contract.Responses.ParticipantResponse;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ParticipantsController(
        IVideoApiClient videoApiClient,
        IEventHandlerFactory eventHandlerFactory,
        ILogger<ParticipantsController> logger,
        IParticipantService participantService,
        IConferenceService conferenceService)
        : ControllerBase
    {
        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpPost("{conferenceId}/participantstatus")]
        [SwaggerOperation(OperationId = "UpdateParticipantStatus")]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateParticipantStatusAsync(Guid conferenceId, UpdateParticipantStatusEventRequest updateParticipantStatusEventRequest)
        {
            var conference = await conferenceService.GetConference(conferenceId);
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

            try
            {
                await videoApiClient.RaiseVideoEventAsync(conferenceEventRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Unable to update participant status for participant: {ParticipantId} in conference: {ConferenceId}", participantId, conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private Guid GetIdForParticipantByUsernameInConference(Conference conference)
        {
            var username = User.Identity.Name;
            return conference.Participants
                .Single(x => x.Username.Equals(username, StringComparison.CurrentCultureIgnoreCase)).Id;
        }
       
        [Authorize(AppRoles.VhOfficerRole)]
        [HttpGet("{conferenceId}/participant/{participantId}/heartbeatrecent")]
        [SwaggerOperation(OperationId = "GetHeartbeatDataForParticipant")]
        [ProducesResponseType(typeof(ParticipantHeartbeatResponse[]), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetHeartbeatDataForParticipantAsync(Guid conferenceId, Guid participantId)
        {
            try
            {
                var response = await videoApiClient.GetHeartbeatDataForParticipantAsync(conferenceId, participantId);
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                logger.LogError(e,
                    "Unable to get heartbeat data for participant: {ParticipantId} in conference: {ConferenceId}", participantId, conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpPost("{conferenceId}/participants/{participantId}/participantDisplayName")]
        [SwaggerOperation(OperationId = "UpdateParticipantDisplayName")]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> UpdateParticipantDisplayNameAsync(Guid conferenceId, Guid participantId, [FromBody] UpdateParticipantDisplayNameRequest participantRequest)
        {
            try
            {
                await videoApiClient.UpdateParticipantDetailsAsync(conferenceId, participantId, new UpdateParticipantRequest
                {
                    DisplayName = participantRequest.DisplayName
                });
                await UpdateCacheAndPublishUpdate(conferenceId);
            }
            catch (VideoApiException ex)
            {
                logger.LogError(ex,
                    "Unable to update participant details for participant: {ParticipantId} in conference: {ConferenceId}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
            return NoContent();
        }

        private async Task UpdateCacheAndPublishUpdate(Guid conferenceId)
        {
            var conference = await conferenceService.ForceGetConference(conferenceId);
            var mappedParticipants = conference.Participants.Select(ParticipantDtoForResponseMapper.Map).ToList();
            await eventHandlerFactory.Get(EventHub.Enums.EventType.ParticipantsUpdated).HandleAsync(new CallbackEvent
            {
                Participants = mappedParticipants,
                ParticipantsToNotify = mappedParticipants,
                ConferenceId = conferenceId,
                EventType = EventHub.Enums.EventType.ParticipantsUpdated,
                Reason = "Participant display name updated",
                TimeStampUtc = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Get the participant details of a conference by id for VH officer
        /// </summary>
        /// <param name="conferenceId">The unique id of the conference</param>
        /// <returns>the participant details, if permitted</returns>
        [HttpGet("{conferenceId}/vhofficer/participants")]
        [ProducesResponseType(typeof(IEnumerable<ParticipantContactDetailsResponseVho>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetParticipantsWithContactDetailsByConferenceId")]
        [Authorize(AppRoles.VhOfficerRole)]
        public async Task<IActionResult> GetParticipantsWithContactDetailsByConferenceIdAsync(Guid conferenceId)
        {
            if (conferenceId == Guid.Empty)
            {
                logger.LogWarning("Unable to get conference when id is not provided");
                ModelState.AddModelError(nameof(conferenceId), $"Please provide a valid {nameof(conferenceId)}");

                return BadRequest(ModelState);
            }
            try
            {
                var conference = await conferenceService.GetConference(conferenceId);

                logger.LogTrace("Retrieving booking participants for hearing {HearingId}", conference.HearingId);
                
                var hostsInHearingsToday = await videoApiClient.GetHostsInHearingsTodayAsync();
                var response = ParticipantStatusResponseForVhoMapper.Map(conference, hostsInHearingsToday);

                return Ok(response);
            }
            catch (VideoApiException ex)
            {
                logger.LogError(ex, "Unable to retrieve conference: {ConferenceId}", conferenceId);

                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        [ServiceFilter(typeof(CheckParticipantCanAccessConferenceAttribute))]
        [HttpGet("{conferenceId}/participants")]
        [SwaggerOperation(OperationId = "GetParticipantsByConferenceId")]
        [ProducesResponseType(typeof(List<ParticipantResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetParticipantsByConferenceIdAsync(Guid conferenceId)
        {
            try
            {
                var conference = await conferenceService.GetConference(conferenceId);
                var participants = conference.Participants.Select(ParticipantDtoForResponseMapper.Map).ToList();
                return Ok(participants);
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Unable to retrieve participants for conference: {ConferenceId}", conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpGet("{conferenceId}/currentparticipant")]
        [SwaggerOperation(OperationId = "GetCurrentParticipant")]
        [ProducesResponseType(typeof(LoggedParticipantResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetCurrentParticipantAsync(Guid conferenceId)
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

            try
            {
                var profile = ClaimsPrincipalToUserProfileResponseMapper.Map(User);
                var response = new LoggedParticipantResponse
                {
                    AdminUsername = User.Identity?.Name,
                    DisplayName = "Admin",
                    Role = Role.VideoHearingsOfficer
                };

                if (profile.Roles.Exists(role => participantsRoles.Contains(role)))
                {
                    var conference = await conferenceService.GetConference(conferenceId);
                    var participantFromCache = conference.Participants
                        .SingleOrDefault(x => x.Username.Equals(profile.Username, StringComparison.CurrentCultureIgnoreCase));

                    if (participantFromCache == null)
                    {
                        conference = await conferenceService.ForceGetConference(conferenceId);
                        participantFromCache = conference.Participants
                            .Single(x => x.Username.Equals(profile.Username, StringComparison.CurrentCultureIgnoreCase));
                    }
                    
                    response = new LoggedParticipantResponse
                    {
                        ParticipantId = participantFromCache.Id,
                        DisplayName = participantFromCache.DisplayName,
                        Role = participantFromCache.Role
                    };
                }

                return Ok(response);
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Unable to get current participant Id for conference: {ConferenceId}", conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("{conferenceId}/joinConference")]
        [SwaggerOperation(OperationId = "StaffMemberJoinConference")]
        [ProducesResponseType(typeof(ConferenceResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [Authorize(AppRoles.StaffMember)]
        public async Task<IActionResult> StaffMemberJoinConferenceAsync(Guid conferenceId)
        {
            try
            {
                var username = User.Identity.Name.ToLower().Trim();
                var originalConference = await videoApiClient.GetConferenceDetailsByIdAsync(conferenceId);

                if (!participantService.CanStaffMemberJoinConference(originalConference))
                {
                    logger.LogWarning("Staff Member only can view hearing within 30 minutes of the Start time and 2 hours after the hearing has closed");
                    ModelState.AddModelError(nameof(conferenceId), $"Please select a valid conference {nameof(conferenceId)}");
                    return BadRequest(ModelState);
                }
                
                logger.LogDebug("Attempting to assign {StaffMember} to conference {ConferenceId}", username, conferenceId);
                
                var staffMemberProfile = ClaimsPrincipalToUserProfileResponseMapper.Map(User);

                var response = await videoApiClient.AddStaffMemberToConferenceAsync(conferenceId, participantService.InitialiseAddStaffMemberRequest(staffMemberProfile, username));
                await participantService.AddParticipantToConferenceCache(response.ConferenceId, response.Participant);
                var updatedConference = await conferenceService.GetConference(conferenceId);
                var mappedUpdatedConference = ConferenceResponseMapper.Map(updatedConference);
                return Ok(mappedUpdatedConference);
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Unable to add staff member for conference: {ConferenceId}", conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
