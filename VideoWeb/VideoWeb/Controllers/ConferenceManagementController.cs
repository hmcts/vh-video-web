using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Enums;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    [Authorize(AppRoles.JudgeRole)]
    public class ConferenceManagementController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<ConferenceManagementController> _logger;
        private readonly IConferenceCache _conferenceCache;

        public ConferenceManagementController(IVideoApiClient videoApiClient,
            ILogger<ConferenceManagementController> logger, IConferenceCache conferenceCache)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _conferenceCache = conferenceCache;
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
            var validatedRequest = await ValidateUserIsJudgeAndInConference(conferenceId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
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
        /// Pause a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/pause")]
        [SwaggerOperation(OperationId = "PauseVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> PauseVideoHearingAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsJudgeAndInConference(conferenceId);
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
        /// End a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/end")]
        [SwaggerOperation(OperationId = "EndVideoHearing")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> EndVideoHearingAsync(Guid conferenceId)
        {
            var validatedRequest = await ValidateUserIsJudgeAndInConference(conferenceId);
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
        [SwaggerOperation(OperationId = "CallWitness")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> CallWitnessAsync(Guid conferenceId, string participantId)
        {
            var validatedRequest = await ValidateWitnessInConference(conferenceId, participantId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                _logger.LogDebug("Sending request to call witness {Participant} into video hearing {Conference}",
                    participantId, conferenceId);
                await _videoApiClient.TransferParticipantAsync(conferenceId, BuildTransferRequest(TransferType.Call, participantId));
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
        /// Call a witness into a video hearing
        /// </summary>
        /// <param name="conferenceId">conference id</param>
        /// <param name="participantId">witness id</param>
        /// <returns>Accepted status</returns>
        [HttpPost("{conferenceId}/participant/{participantId}/dismiss")]
        [SwaggerOperation(OperationId = "DismissWitness")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        public async Task<IActionResult> DismissWitnessAsync(Guid conferenceId, string participantId)
        {
            var validatedRequest = await ValidateWitnessInConference(conferenceId, participantId);
            if (validatedRequest != null)
            {
                return validatedRequest;
            }

            try
            {
                _logger.LogDebug("Sending request to dismiss witness {Participant} from video hearing {Conference}",
                    participantId, conferenceId);
                await _videoApiClient.TransferParticipantAsync(conferenceId, BuildTransferRequest(TransferType.Dismiss, participantId));
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to dismiss witness {Participant} from video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }

            try
            {
                _logger.LogDebug("Sending alert to vho witness {Participant} dismissed from video hearing {Conference}",
                    participantId, conferenceId);
                await SendParticipantDismissed(conferenceId, participantId);
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to add a dismiss witness alert for {Participant} in video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
            return Accepted();
        }

        private async Task SendParticipantDismissed(Guid conferenceId, string participantId)
        {
            if (Guid.TryParse(participantId, out var participantGuid))
            {
                await _videoApiClient.AddTaskAsync(conferenceId, new AddTaskRequest
                {
                    ParticipantId = participantGuid,
                    Body = "Witness dismissed",
                    TaskType = TaskType.Participant
                });
                return;
            }

            var conference = await GetConference(conferenceId);
            var roomId = long.Parse(participantId);
            var room = conference.CivilianRooms.Single(r => r.Id == roomId);
            var witness =
                conference.Participants.First(x => room.Participants.Contains(x.Id) && x.IsWitness());
            await _videoApiClient.AddTaskAsync(conferenceId, new AddTaskRequest
            {
                ParticipantId = witness.Id,
                Body = "Witness dismissed",
                TaskType = TaskType.Participant
            });
        }

        private async Task<IActionResult> ValidateUserIsJudgeAndInConference(Guid conferenceId)
        {
            if (await IsConferenceJudge(conferenceId))
            {
                return null;
            }

            _logger.LogWarning("Only judges may control hearings");
            return Unauthorized("User must be a Judge");
        }

        private async Task<IActionResult> ValidateWitnessInConference(Guid conferenceId, string participantId)
        {
            var judgeValidation = await ValidateUserIsJudgeAndInConference(conferenceId);
            if (judgeValidation != null) return judgeValidation;

            if (await IsParticipantAWitnessOrAWitnessRoom(conferenceId, participantId))
            { 
                return null;
            }

            _logger.LogWarning("Participant {Participant} is not a witness in {Conference}", participantId,
                conferenceId);
            return Unauthorized("Participant is not a witness");
        }

        private async Task<bool> IsConferenceJudge(Guid conferenceId)
        {
            var conference = await GetConference(conferenceId);
            return conference.GetJudge().Username
                .Equals(User.Identity.Name?.Trim(), StringComparison.InvariantCultureIgnoreCase);
        }

        private TransferParticipantRequest BuildTransferRequest(TransferType transferType, string participantId)
        {
            var transferRequest = new TransferParticipantRequest {TransferType = transferType};
            if (long.TryParse(participantId, out var roomId))
            {
                transferRequest.RoomId = roomId;
            }
            else
            {
                transferRequest.ParticipantId = Guid.Parse(participantId);
            }

            return transferRequest;
        }

        private async Task<bool> IsParticipantAWitnessOrAWitnessRoom(Guid conferenceId, string participantId)
        {
            var conference = await GetConference(conferenceId);

            if (Guid.TryParse(participantId, out var participantGuid))
            {
                var participant = conference.Participants.SingleOrDefault(x => x.Id == participantGuid);
                return participant != null && participant.IsWitness();
            }

            if (!long.TryParse(participantId, out var roomId)) return false;

            var room = conference.CivilianRooms.SingleOrDefault(x => x.Id == roomId);
            return room != null &&
                   conference.Participants.Any(p => room.Participants.Contains(p.Id) && p.IsWitness());
        }

        private async Task<Conference> GetConference(Guid conferenceId)
        {
            return await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );
        }
    }
}
