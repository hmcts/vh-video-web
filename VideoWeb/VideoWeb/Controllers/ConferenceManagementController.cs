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
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Services;
using Supplier = VideoWeb.Common.Enums.Supplier;

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
        private readonly IHearingLayoutService _hearingLayoutService;
        private readonly IConferenceManagementService _conferenceManagementService;
        private readonly IConferenceService _conferenceService;
        
        public ConferenceManagementController(IVideoApiClient videoApiClient,
            ILogger<ConferenceManagementController> logger,
            IHearingLayoutService hearingLayoutService, 
            IConferenceManagementService conferenceManagementService,
            IConferenceService conferenceService)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _hearingLayoutService = hearingLayoutService;
            _conferenceManagementService = conferenceManagementService;
            _conferenceService = conferenceService;
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
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> StartOrResumeVideoHearingAsync(Guid conferenceId, StartOrResumeVideoHearingRequest request, CancellationToken cancellationToken)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);
                var triggeredById = conference.GetParticipant(User.Identity!.Name)?.Id;
                var hosts = conference.GetNonScreenedParticipantsAndEndpoints();
                var apiRequest = new StartHearingRequest
                {
                    Layout = request.Layout,
                    MuteGuests = false,
                    TriggeredByHostId = triggeredById ?? Guid.Empty,
                    Hosts = hosts
                };

                await _videoApiClient.StartOrResumeVideoHearingAsync(conferenceId, apiRequest, cancellationToken);
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
        public async Task<IActionResult> GetLayoutForHearing(Guid conferenceId, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("Getting the layout for {ConferenceId}", conferenceId);
                var layout = await _hearingLayoutService.GetCurrentLayout(conferenceId, cancellationToken);

                if (!layout.HasValue) {
                    _logger.LogWarning("Layout didn't have a value returning NotFound. This was for {ConferenceId}", conferenceId);
                    return NotFound();
                }

                _logger.LogTrace("Got Layout ({Layout}) for {ConferenceId}", layout.Value, conferenceId);
                return Ok(layout);
            }
            catch (VideoApiException exception)
            {
                _logger.LogError(exception, "Could not get layout for {ConferenceId} a video api exception was thrown", conferenceId);
                return StatusCode(exception.StatusCode, exception.Response);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not get layout for {ConferenceId} an unknown exception was thrown", conferenceId);
                throw new InvalidOperationException("There was an unexpected error when getting the layout", exception);
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
        public async Task<IActionResult> UpdateLayoutForHearing(Guid conferenceId, HearingLayout layout, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("Attempting to update layout to {Layout} for conference {ConferenceId}", layout, conferenceId);

                var participant = await GetParticipant(conferenceId, User.Identity!.Name, cancellationToken);

                if (participant == null)
                {
                    _logger.LogWarning("Could not update layout to {Layout} for hearing as participant with the name {Username} was not found in conference {ConferenceId}", layout, User.Identity.Name, conferenceId);
                    return NotFound(nameof(participant));
                }

                await _hearingLayoutService.UpdateLayout(conferenceId, participant.Id, layout, cancellationToken);

                _logger.LogInformation("Updated layout to {Layout} for conference {ConferenceId}", layout, conferenceId);
                return Ok();
            }
            catch (VideoApiException exception)
            {
                _logger.LogError(exception, "Could not update layout for {ConferenceId} a video api exception was thrown", conferenceId);
                return StatusCode(exception.StatusCode, exception.Response);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not update layout for {ConferenceId} an unknown exception was thrown", conferenceId);
                throw new InvalidOperationException("There was an unexpected error when updating the layout", exception);
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
        public async Task<IActionResult> GetRecommendedLayoutForHearing(Guid conferenceId, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogDebug("Attempting get recommended layout  for conference {ConferenceId}", conferenceId);
                var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);
                return Ok(conference.GetRecommendedLayout());
            }
            catch (VideoApiException exception)
            {
                _logger.LogError(exception, "Could not get recommended layout for {ConferenceId}. A video api exception was thrown", conferenceId);
                return StatusCode(exception.StatusCode, exception.Response);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Could not get recommended layout for {ConferenceId}. an unknown exception was thrown", conferenceId);
                throw new InvalidOperationException("There was an unexpected error when getting the recommended layout", exception);
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
        public async Task<IActionResult> PauseVideoHearingAsync(Guid conferenceId, CancellationToken cancellationToken)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await _videoApiClient.PauseVideoHearingAsync(conferenceId, cancellationToken);
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
        public async Task<IActionResult> SuspendVideoHearingAsync(Guid conferenceId, CancellationToken cancellationToken)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await _videoApiClient.SuspendHearingAsync(conferenceId, cancellationToken);
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
        public async Task<IActionResult> EndVideoHearingAsync(Guid conferenceId, CancellationToken cancellationToken)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await _videoApiClient.EndVideoHearingAsync(conferenceId, cancellationToken);
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
        /// Admit a participant into an active video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="participantId">witness id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/participant/{participantId}/call")]
        [SwaggerOperation(OperationId = "CallParticipant")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> CallParticipantAsync(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
        {
            var validatedRequest = await ValidateParticipantInConferenceAndIsCallable(conferenceId, participantId, cancellationToken);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            await TransferParticipantAsync(conferenceId, participantId, TransferType.Call, cancellationToken);
            return Accepted();
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
        public async Task<IActionResult> JoinHearingInSession(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }
            try
            {
                await TransferParticipantAsync(conferenceId, participantId, TransferType.Call, cancellationToken);
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
        public async Task<IActionResult> DismissParticipantAsync(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
        {
            var validatedRequest = await ValidateParticipantInConferenceAndIsCallable(conferenceId, participantId, cancellationToken);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            await TransferParticipantAsync(conferenceId, participantId, TransferType.Dismiss, cancellationToken);
            // reset hand raise on dismiss
            await _conferenceManagementService.UpdateParticipantHandStatusInConference(conferenceId, participantId,
                false, cancellationToken);

            await AddDismissTaskAsync(conferenceId, participantId, cancellationToken);
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
        public async Task<IActionResult> LeaveHearingAsync(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
        {
            var validatedRequest = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                await TransferParticipantAsync(conferenceId, participantId, TransferType.Dismiss, cancellationToken);
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to dismiss participant {Participant} from video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }

            return Accepted();
        }

        private async Task<IActionResult> ValidateUserIsHostAndInConference(Guid conferenceId, CancellationToken cancellationToken)
        {
            if (await IsConferenceHost(conferenceId, cancellationToken))
            {
                return null;
            }

            _logger.LogWarning("{JudgeRole} or {StaffMember} may control hearings", AppRoles.JudgeRole, AppRoles.StaffMember);
            return Unauthorized($"User must be either {AppRoles.JudgeRole} or {AppRoles.StaffMember}.");
        }

        private async Task<IActionResult> ValidateParticipantInConferenceAndIsCallable(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
        {
            // ensure the invoker is a host of the given conference id
            var judgeValidation = await ValidateUserIsHostAndInConference(conferenceId, cancellationToken);
            if (judgeValidation != null) return judgeValidation;

            // ensure the participant exists in said conference and is callable
            if (await ValidateParticipantIsInConferenceAndCallable(conferenceId, participantId, cancellationToken))
            {
                return null;
            }

            _logger.LogWarning("Participant {ParticipantId} is not a callable participant in {ConferenceId}", participantId, conferenceId);
            return Unauthorized("Participant is not callable");
        }

        private async Task<bool> IsConferenceHost(Guid conferenceId, CancellationToken cancellationToken)
        {
            var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);
            return conference.Participants.Exists(x => x.Username.Equals(User.Identity!.Name?.Trim(), StringComparison.InvariantCultureIgnoreCase) && x.IsHost());
        }

        private async Task<bool> ValidateParticipantIsInConferenceAndCallable(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
        {
            var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);

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
            
            conference = await _conferenceService.ForceGetConference(conference.Id, cancellationToken);
        
            witnessRoom = GetRoomForParticipant(conference, participantId);

            return witnessRoom;
        }

        private static CivilianRoom GetRoomForParticipant(Conference conference, Guid participantId) => 
            conference.CivilianRooms.Find(x => x.Participants.Contains(participantId));
        
        private async Task<Participant> GetParticipant(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
        {
            var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);
            return conference.Participants.SingleOrDefault(x => x.Id == participantId);
        }

        private async Task<Participant> GetParticipant(Guid conferenceId, string username, CancellationToken cancellationToken)
        {
            var conference = await _conferenceService.GetConference(conferenceId, cancellationToken);
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

        private Task TransferParticipantAsync(Guid conferenceId, Guid participantId, TransferType transferType, CancellationToken cancellationToken)
        {
            return _videoApiClient.TransferParticipantAsync(conferenceId, new TransferParticipantRequest
            {
                ParticipantId = participantId,
                TransferType = transferType
            }, cancellationToken);
        }

        private async Task AddDismissTaskAsync(Guid conferenceId, Guid participantId, CancellationToken cancellationToken)
        {
            _logger.LogDebug("Sending alert to vho participant {Participant} dismissed from video hearing {Conference}",
                participantId, conferenceId);

            var participant = await GetParticipant(conferenceId, participantId, cancellationToken);
            var dismisser = await GetParticipant(conferenceId, User.Identity!.Name, cancellationToken);

            await _videoApiClient.AddTaskAsync(conferenceId, new AddTaskRequest
            {
                ParticipantId = participantId,
                Body = $"{GetParticipantRoleString(participant)} dismissed by {GetParticipantRoleString(dismisser)}",
                TaskType = TaskType.Participant
            }, cancellationToken);
        }
    }
}
