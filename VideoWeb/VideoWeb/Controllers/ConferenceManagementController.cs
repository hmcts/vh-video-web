using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Services;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    [Authorize("Host")]
    public class ConferenceManagementController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<ConferenceManagementController> _logger;
        private readonly IConferenceCache _conferenceCache;
        private readonly IHearingLayoutService _hearingLayoutService;
        private readonly IConferenceVideoControlStatusService _conferenceVideoControlStatusService;
        private readonly IMapperFactory _mapperFactory;

        public ConferenceManagementController(IVideoApiClient videoApiClient,
            ILogger<ConferenceManagementController> logger, IConferenceCache conferenceCache, IHearingLayoutService hearingLayoutService, IConferenceVideoControlStatusService conferenceVideoControlStatusService, IMapperFactory mapperFactory)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _conferenceCache = conferenceCache;
            _hearingLayoutService = hearingLayoutService;
            _conferenceVideoControlStatusService = conferenceVideoControlStatusService;
            _mapperFactory = mapperFactory;
        }

        /// <summary>
        /// Start or resume a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="request">start hearing request details</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/start")]
        [SwaggerOperation(OperationId = "StartOrResumeVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> StartOrResumeVideoHearingAsync(Guid conferenceId, StartHearingRequest request)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync
                (
                    conferenceId,
                    () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
                );
 
                request.ParticipantsToForceTransfer = conference.Participants
                    .Where(x => x.Username.Equals(User.Identity.Name?.Trim(), StringComparison.InvariantCultureIgnoreCase))
                    .Select(x => x.Id.ToString()).ToList();

                request.MuteGuests = false;

                await _videoApiClient.StartOrResumeVideoHearingAsync(conferenceId, request);
                _logger.LogDebug("Sent request to start / resume conference {Conference}", conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to start video hearing {Conference}", conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }
                
        /// <summary>
        /// Updates the video control statuses for the conference
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Ok status</returns>
        /// <returns>Forbidden status</returns>
        /// <returns>Not Found status</returns>
        [HttpPut("{conferenceId}/setVideoControlStatuses")]
        [SwaggerOperation(OperationId = "SetVideoControlStatusesForConference")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> SetVideoControlStatusesForConference(Guid conferenceId, [FromBody]SetConferenceVideoControlStatusesRequest setVideoControlStatusesRequest)
        {
            try
            {
                var mapper = _mapperFactory.Get<SetConferenceVideoControlStatusesRequest, ConferenceVideoControlStatuses>();
                var videoControlStatuses = mapper.Map(setVideoControlStatusesRequest);
                
                _logger.LogDebug("Setting the video control statuses for {conferenceId}", conferenceId);
                await _conferenceVideoControlStatusService.SetVideoControlStateForConference(conferenceId, videoControlStatuses);

                _logger.LogTrace("Set video control statuses ({videoControlStatuses}) for {conferenceId}", videoControlStatuses, conferenceId);
                return Accepted();
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not set video control statuses for {conferenceId} an unkown exception was thrown", conferenceId);
                return StatusCode((int)HttpStatusCode.InternalServerError);
            }
        }
        
        /// <summary>
        /// Returns the video control statuses for the conference
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Ok status</returns>
        /// <returns>Forbidden status</returns>
        /// <returns>Not Found status</returns>
        [HttpGet("{conferenceId}/getVideoControlStatuses")]
        [SwaggerOperation(OperationId = "GetVideoControlStatusesForConference")]
        [ProducesResponseType(typeof(ConferenceVideoControlStatuses), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType(typeof(ConferenceVideoControlStatuses), (int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetVideoControlStatusesForConference(Guid conferenceId)
        {
            try
            {
                _logger.LogDebug("Getting the video control statuses for {conferenceId}", conferenceId);
                var conference = await GetConference(conferenceId);
                if (conference.CurrentStatus == ConferenceState.NotStarted)
                {
                    return Ok("Conference is not started");
                }
                var videoControlStatuses = await _conferenceVideoControlStatusService.GetVideoControlStateForConference(conferenceId);

                if (videoControlStatuses == null) {
                    _logger.LogWarning("video control statuses didn't have a value returning NotFound. This was for {conferenceId}", conferenceId);
                    return NotFound(new ConferenceVideoControlStatuses()
                    {
                        ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatus>()
                    });
                }

                _logger.LogTrace("Got video control statuses ({videoControlStatuses}) for {conferenceId}", videoControlStatuses, conferenceId);
                return Ok(videoControlStatuses);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not get video control statuses for {conferenceId} an unkown exception was thrown", conferenceId);
                return StatusCode((int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Returns the active layout for a conference
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Ok status</returns>
        /// <returns>Forbidden status</returns>
        /// <returns>Not Found status</returns>
        [HttpGet("{conferenceId}/getlayout")]
        [SwaggerOperation(OperationId = "GetLayoutForHearing")]
        [ProducesResponseType(typeof(HearingLayout), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetLayoutForHearing(Guid conferenceId)
        {
            try
            {
                _logger.LogDebug("Getting the layout for {conferenceId}", conferenceId);
                var layout = await _hearingLayoutService.GetCurrentLayout(conferenceId);

                if (!layout.HasValue) {
                    _logger.LogWarning("Layout didn't have a value returning NotFound. This was for {conferenceId}", conferenceId);
                    return NotFound();
                }

                _logger.LogTrace("Got Layout ({layout}) for {conferenceId}", layout.Value, conferenceId);
                return Ok(layout);
            }
            catch (VideoApiException exception)
            {
                _logger.LogError(exception, "Could not get layout for {conferenceId} a video api exception was thrown", conferenceId);
                return StatusCode(exception.StatusCode, exception.Response);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not get layout for {conferenceId} an unkown exception was thrown", conferenceId);
                return StatusCode((int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Update the active layout for a conference
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="layout">layout</param>
        /// <returns>Ok status</returns>
        /// <returns>Forbidden status</returns>
        /// <returns>Not Found status</returns>
        [HttpPost("{conferenceId}/updatelayout")]
        [SwaggerOperation(OperationId = "UpdateLayoutForHearing")]
        [ProducesResponseType((int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> UpdateLayoutForHearing(Guid conferenceId, HearingLayout layout)
        {
            try
            {
                _logger.LogDebug("Attempting to update layout to {layout} for conference {conferenceId}", layout, conferenceId);

                var participant = await GetParticipant(conferenceId, User.Identity.Name);

                if (participant == null)
                {
                    _logger.LogWarning("Could not update layout to {layout} for hearing as participant with the name {username} was not found in conference {conferenceId}", layout, User.Identity.Name, conferenceId);
                    return NotFound(nameof(participant));
                }

                await _hearingLayoutService.UpdateLayout(conferenceId, participant.Id, layout);

                _logger.LogInformation("Updated layout to {layout} for conference {conferenceId}", layout, conferenceId);
                return Ok();
            }
            catch (VideoApiException exception)
            {
                _logger.LogError(exception, "Could not update layout for {conferenceId} a video api exception was thrown", conferenceId);
                return StatusCode(exception.StatusCode, exception.Response);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not update layout for {conferenceId} an unkown exception was thrown", conferenceId);
                return StatusCode((int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Get recommended layout for hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Ok status</returns>
        /// <returns>Forbidden status</returns>
        /// <returns>Not Found status</returns>
        [HttpPost("{conferenceId}/getrecommendedlayout")]
        [SwaggerOperation(OperationId = "GetRecommendedLayoutForHearing")]
        [ProducesResponseType(typeof(HearingLayout), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetRecommendedLayoutForHearing(Guid conferenceId)
        {
            try
            {
                _logger.LogDebug("Attempting get recommended layout  for conference {conferenceId}", conferenceId);
                var conference = await GetConference(conferenceId);

                return Ok(conference.GetRecommendedLayout());
            }
            catch (VideoApiException exception)
            {
                _logger.LogError(exception, "Could not get recommended layout for {conferenceId} a video api exception was thrown", conferenceId);
                return StatusCode(exception.StatusCode, exception.Response);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not get recommended layout for {conferenceId} an unkown exception was thrown", conferenceId);
                return StatusCode((int)HttpStatusCode.InternalServerError);
            }
        }

        /// <summary>
        /// Pause a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/pause")]
        [SwaggerOperation(OperationId = "PauseVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> PauseVideoHearingAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await _videoApiClient.PauseVideoHearingAsync(conferenceId);
                _logger.LogDebug("Sent request to pause conference {Conference}", conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to pause video hearing {Conference}", conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        /// <summary>
        /// Suspend a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/suspend")]
        [SwaggerOperation(OperationId = "SuspendVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> SuspendVideoHearingAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await _videoApiClient.SuspendHearingAsync(conferenceId);
                _logger.LogDebug("Sent request to suspend conference {Conference}", conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to suspend video hearing {Conference}", conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        /// <summary>
        /// End a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/end")]
        [SwaggerOperation(OperationId = "EndVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> EndVideoHearingAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await _videoApiClient.EndVideoHearingAsync(conferenceId);
                _logger.LogDebug("Sent request to end conference {Conference}", conferenceId);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to end video hearing {Conference}", conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        /// <summary>
        /// Call a witness into a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="participantId">witness id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/participant/{participantId}/call")]
        [SwaggerOperation(OperationId = "CallParticipant")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> CallParticipantAsync(Guid conferenceId, Guid participantId)
        {
            var validatedRequest = await ValidateParticipantInConference(conferenceId, participantId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await TransferParticipantAsync(conferenceId, participantId, TransferType.Call);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to call witness {Participant} into video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        /// <summary>
        /// Joins a video hearing currently in session
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="participantId">participant id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/participant/{participantId}/join-hearing")]
        [SwaggerOperation(OperationId = "JoinHearingInSession")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> JoinHearingInSession(Guid conferenceId, Guid participantId)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }
            try
            {
                await TransferParticipantAsync(conferenceId, participantId, TransferType.Call);
                return Accepted();
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "{Participant} is unable to join into video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
        }

        /// <summary>
        /// Call a witness into a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="participantId">witness id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/participant/{participantId}/dismiss")]
        [SwaggerOperation(OperationId = "DismissParticipant")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> DismissParticipantAsync(Guid conferenceId, Guid participantId)
        {
            var validatedRequest = await ValidateParticipantInConference(conferenceId, participantId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await TransferParticipantAsync(conferenceId, participantId, TransferType.Dismiss);
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to dismiss participant {Participant} from video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }

            try
            {
                await AddDismissTaskAsync(conferenceId, participantId);
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to add a dismiss participant alert for {Participant} in video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
            return Accepted();
        }

        /// <summary>
        /// Leave host from hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="participantId">witness id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/participant/{participantId}/leave")]
        [SwaggerOperation(OperationId = "LeaveHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> LeaveHearingAsync(Guid conferenceId, Guid participantId)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await TransferParticipantAsync(conferenceId, participantId, TransferType.Dismiss);
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to dismiss participant {Participant} from video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }

            return Accepted();
        }

        private async Task<IActionResult> ValidateUserIsHostAndInConference(Guid conferenceId)
        {
            if (await IsConferenceHost(conferenceId))
            {
                return null;
            }

            _logger.LogWarning($"{AppRoles.JudgeRole} or {AppRoles.StaffMember} may control hearings.");
            return Unauthorized($"User must be either {AppRoles.JudgeRole} or {AppRoles.StaffMember}.");
        }

        private async Task<IActionResult> ValidateParticipantInConference(Guid conferenceId, Guid participantId)
        {
            var judgeValidation = await ValidateUserIsHostAndInConference(conferenceId);
            if (judgeValidation != null) return judgeValidation;

            if (await IsParticipantCallable(conferenceId, participantId))
            {
                return null;
            }

            _logger.LogWarning($"Participant {participantId} is not a callable participant in {conferenceId}");
            return Unauthorized("Participant is not callable");
        }

        private async Task<bool> IsConferenceHost(Guid conferenceId)
        {
            var conference = await GetConference(conferenceId);
            return conference.Participants.Any(x => x.Username.Equals(User.Identity.Name?.Trim(), StringComparison.InvariantCultureIgnoreCase) && x.IsHost());
        }

        private async Task<bool> IsParticipantCallable(Guid conferenceId, Guid participantId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            var participant = conference.Participants.SingleOrDefault(x => x.Id == participantId);

            if (participant == null)
            {
                return false;
            }

            if (!participant.LinkedParticipants.Any())
            {
                return participant.IsCallable();
            }

            var witnessRoom = conference.CivilianRooms.First(x => x.Participants.Contains(participant.Id));
            var expectedParticipantsInRoomIds = participant.LinkedParticipants.Select(x => x.LinkedId).ToList();
            expectedParticipantsInRoomIds.Add(participant.Id);
            return expectedParticipantsInRoomIds.All(p => witnessRoom.Participants.Contains(p));
        }

        private async Task<Conference> GetConference(Guid conferenceId)
        {
            return await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );
        }

        private async Task<Participant> GetParticipant(Guid conferenceId, Guid participantId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            return conference.Participants.SingleOrDefault(x => x.Id == participantId);
        }

        private async Task<Participant> GetParticipant(Guid conferenceId, string username)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            return conference.Participants.SingleOrDefault(x => x.Username.Trim().Equals(username.Trim(), StringComparison.InvariantCultureIgnoreCase));
        }

        private string GetParticipantRoleString(Participant participant)
        {
            switch (participant.Role)
            {
                case Role.QuickLinkParticipant:
                    return "Participant";
                case Role.QuickLinkObserver:
                    return "Observer";
                default:
                    return participant.HearingRole;
            }

        }

        private Task TransferParticipantAsync(Guid conferenceId, Guid participantId, TransferType transferType)
        {
            _logger.LogDebug("Sending request to {transferType.ToString().ToLowerInvariant()} participant {ParticipantId} from video hearing {ConferenceId}",
                transferType, participantId, conferenceId);

            return _videoApiClient.TransferParticipantAsync(conferenceId, new TransferParticipantRequest
            {
                ParticipantId = participantId,
                TransferType = transferType
            });
        }

        private async Task AddDismissTaskAsync(Guid conferenceId, Guid participantId)
        {
            _logger.LogDebug("Sending alert to vho participant {Participant} dismissed from video hearing {Conference}",
                participantId, conferenceId);

            var participant = await GetParticipant(conferenceId, participantId);
            var dismisser = await GetParticipant(conferenceId, User.Identity.Name);

            await _videoApiClient.AddTaskAsync(conferenceId, new AddTaskRequest
            {
                ParticipantId = participantId,
                Body = $"{GetParticipantRoleString(participant)} dismissed by {GetParticipantRoleString(dismisser)}",
                TaskType = TaskType.Participant
            });
        }
    }
}
