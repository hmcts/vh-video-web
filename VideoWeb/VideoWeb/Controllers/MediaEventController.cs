using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Extensions;
using VideoWeb.Contract.Request;
using VideoApi.Client;
using VideoApi.Contract.Requests;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class MediaEventController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<MediaEventController> _logger;
        private readonly IConferenceCache _conferenceCache;

        public MediaEventController(
            IVideoApiClient videoApiClient,
            ILogger<MediaEventController> logger,
            IConferenceCache conferenceCache)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _conferenceCache = conferenceCache;
        }

        [HttpPost("{conferenceId}/mediaevents")]
        [SwaggerOperation(OperationId = "AddMediaEventToConference")]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> AddMediaEventToConferenceAsync(Guid conferenceId, [FromBody] AddMediaEventRequest addMediaEventRequest)
        {
            var participantId = await GetIdForParticipantByUsernameInConference(conferenceId);
            try
            {
                await _videoApiClient.RaiseVideoEventAsync(new ConferenceEventRequest
                {
                    ConferenceId = conferenceId.ToString(),
                    ParticipantId = participantId.ToString(),
                    EventId = Guid.NewGuid().ToString(),
                    EventType = addMediaEventRequest.EventType,
                    TimeStampUtc = DateTime.UtcNow,
                    Reason = "media permission denied"
                });

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to add media event for conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("{conferenceId}/selftestfailureevents")]
        [SwaggerOperation(OperationId = "AddSelfTestFailureEventToConference")]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        public async Task<IActionResult> AddSelfTestFailureEventToConferenceAsync(Guid conferenceId,
            [FromBody] AddSelfTestFailureEventRequest addSelfTestFailureEventRequest)
        {
            var participantId = await GetIdForParticipantByUsernameInConference(conferenceId);

            try
            {
                var eventRequest = new ConferenceEventRequest
                {
                    ConferenceId = conferenceId.ToString(),
                    ParticipantId = participantId.ToString(),
                    EventId = Guid.NewGuid().ToString(),
                    EventType = addSelfTestFailureEventRequest.EventType,
                    TimeStampUtc = DateTime.UtcNow,
                    Reason = $"Failed self-test ({addSelfTestFailureEventRequest.SelfTestFailureReason.DescriptionAttr()})"
                };
                await _videoApiClient.RaiseVideoEventAsync(eventRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Unable to add self-test failure event for conference: {conferenceId}");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        private async Task<Guid> GetIdForParticipantByUsernameInConference(Guid conferenceId)
        {
            var conference = await _conferenceCache.GetOrAddConferenceAsync
            (
                conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId)
            );

            var username = User.Identity.Name;

            return conference.Participants
                .Single(x => x.Username.Equals(username, StringComparison.CurrentCultureIgnoreCase)).Id;
        }
    }
}
