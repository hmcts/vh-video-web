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
using VideoWeb.Services.Video;

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
        public async Task<IActionResult> CallWitnessAsync(Guid conferenceId, Guid participantId)
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
                await _videoApiClient.TransferParticipantAsync(conferenceId, new TransferParticipantRequest
                {
                    Participant_id = participantId,
                    Transfer_type = TransferType.Call
                });
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
        public async Task<IActionResult> DismissWitnessAsync(Guid conferenceId, Guid participantId)
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
                await _videoApiClient.TransferParticipantAsync(conferenceId, new TransferParticipantRequest
                {
                    Participant_id = participantId,
                    Transfer_type = TransferType.Dismiss
                });
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
                await _videoApiClient.AddTaskAsync(conferenceId, new AddTaskRequest
                {
                    Participant_id = participantId,
                    Body = "Witness dismissed",
                    Task_type = TaskType.Participant
                });
            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, "Unable to add a dismiss witness alert for {Participant} in video hearing {Conference}",
                    participantId, conferenceId);
                return StatusCode(ex.StatusCode, ex.Response);
            }
            return Accepted();
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

        private async Task<IActionResult> ValidateWitnessInConference(Guid conferenceId, Guid participantId)
        {
            var judgeValidation = await ValidateUserIsJudgeAndInConference(conferenceId);
            if (judgeValidation != null) return judgeValidation;

            if (await IsParticipantAWitness(conferenceId, participantId))
            { 
                return null;
            }

            _logger.LogWarning("Participant {Participant} is not a witness in {Conference}", participantId,
                conferenceId);
            return Unauthorized("Participant is not a witness");
        }

        private async Task<bool> IsConferenceJudge(Guid conferenceId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            return conference.GetJudge().Username
                .Equals(User.Identity.Name?.Trim(), StringComparison.InvariantCultureIgnoreCase);
        }

        private async Task<bool> IsParticipantAWitness(Guid conferenceId, Guid participantId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            var witness = conference.Participants.SingleOrDefault(x => x.Id == participantId);
            
            return witness != null ? witness.IsWitness(): default;
        }
    }
}
