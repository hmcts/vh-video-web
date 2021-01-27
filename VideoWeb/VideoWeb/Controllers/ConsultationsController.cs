using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using ConsultationAnswer = VideoWeb.Common.Models.ConsultationAnswer;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("consultations")]
    public class ConsultationsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> _hubContext;
        private readonly IConferenceCache _conferenceCache;
        private readonly ILogger<ConsultationsController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public ConsultationsController(
            IVideoApiClient videoApiClient,
            IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache,
            ILogger<ConsultationsController> logger,
            IMapperFactory mapperFactory)
        {
            _videoApiClient = videoApiClient;
            _hubContext = hubContext;
            _conferenceCache = conferenceCache;
            _logger = logger;
            _mapperFactory = mapperFactory;
        }

        [HttpPost("leave")]
        [SwaggerOperation(OperationId = "LeaveConsultation")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> LeaveConsultationAsync(LeavePrivateConsultationRequest request)
        {
            var participant = new Participant();
            try
            {
                var conference = await GetConference(request.ConferenceId);
                participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId);
                if (participant == null)
                {
                    return NotFound();
                }

                var leaveConsultationRequestMapper = _mapperFactory.Get<LeavePrivateConsultationRequest, LeaveConsultationRequest>();
                var mappedRequest = leaveConsultationRequestMapper.Map(request);
                await _videoApiClient.LeavePrivateConsultationAsync(mappedRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                if (participant != null)
                {
                    _logger.LogError(e, $"Participant: {participant.Username} was not able to leave the private consultation. " +
                                        $"An error occured");
                }
                else
                {
                    _logger.LogError(e, $"Invalid participant");
                }

                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("respond")]
        [SwaggerOperation(OperationId = "RespondToConsultationRequest")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> RespondToConsultationRequestAsync(PrivateConsultationRequest request)
        {
            try
            {
                var conference = await GetConference(request.ConferenceId);
                var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedById);
                if (participant == null)
                {
                    return NotFound();
                }

                var adminConsultationRequestMapper = _mapperFactory.Get<PrivateConsultationRequest, ConsultationRequestResponse>();
                var mappedRequest = adminConsultationRequestMapper.Map(request);
                await _videoApiClient.RespondToConsultationRequestAsync(mappedRequest);

                await NotifyConsultationResponseAsync(conference, request.RoomLabel, request.RequestedById, request.RequestedForId, request.Answer);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Consultation request could not be responded to");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("video-endpoint")]
        [SwaggerOperation(OperationId = "CallVideoEndpoint")]
        [ProducesResponseType((int) HttpStatusCode.Accepted)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [Authorize(AppRoles.RepresentativeRole)]
        public async Task<IActionResult> CallVideoEndpointAsync(PrivateVideoEndpointConsultationRequest request)
        {
            _logger.LogDebug("CallVideoEndpoint");
            var username = User.Identity.Name?.ToLower().Trim();
            var conference = await GetConference(request.ConferenceId);

            var defenceAdvocate = conference.Participants.SingleOrDefault(x =>
                x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
            if (defenceAdvocate == null)
            {
                return NotFound($"Defence advocate does not exist in conference {request.ConferenceId}");
            }

            var endpoint = conference.Endpoints.SingleOrDefault(x => x.Id == request.EndpointId);
            if (endpoint == null)
            {
                return NotFound($"No endpoint id {request.EndpointId} exists");
            }

            try
            {
                await _videoApiClient.StartPrivateConsultationWithEndpointAsync(new EndpointConsultationRequest
                {
                    Conference_id = request.ConferenceId,
                    Endpoint_id = endpoint.Id,
                    Defence_advocate_id = defenceAdvocate.Id
                });

            }
            catch (VideoApiException ex)
            {
                _logger.LogError(ex, $"Unable to start endpoint private consultation");
                return StatusCode(ex.StatusCode, ex.Response);
            }

            return Accepted();
        }

        [HttpPost("start")]
        [SwaggerOperation(OperationId = "StartOrJoinConsultation")]
        [ProducesResponseType((int) HttpStatusCode.Accepted)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> StartConsultationAsync(StartPrivateConsultationRequest request)
        {
            try
            {
                var conference = await GetConference(request.ConferenceId);

                var requestedBy = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedBy);
                if (requestedBy == null)
                {
                    _logger.LogWarning($"The participant with Id: {request.RequestedBy} is not found");
                    return NotFound();
                }

                var consultationRequestMapper = _mapperFactory.Get<StartPrivateConsultationRequest, StartConsultationRequest>();
                var mappedRequest = consultationRequestMapper.Map(request);

                if (request.RoomType == Contract.Enums.VirtualCourtRoomType.Participant)
                {
                    var room = await _videoApiClient.CreatePrivateConsultationAsync(mappedRequest);
                    await NotifyRoomCreatedAsync(conference, new Room { Label = room.Label, Locked = room.Locked, ConferenceId = conference.Id });
                    foreach (var participant in request.InviteParticipants)
                    {
                        await NotifyConsultationRequestAsync(conference, room.Label, request.RequestedBy, participant);
                    }
                }
                else
                {
                    await _videoApiClient.StartPrivateConsultationAsync(mappedRequest);
                }
                return Accepted();

            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Start consultation error ConferenceId: {request.ConferenceId}, participantId: {request.RequestedBy}, ErrorCode: {e.StatusCode}");
                return StatusCode(e.StatusCode);
            }
        }

        private async Task<Conference> GetConference(Guid conferenceId)
        {
            return await _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
        }

        /// <summary>
        /// This method raises a notification to the requestee informing them of an incoming consultation request
        /// </summary>
        /// <param name="conferenceId">The conference Id</param>
        /// <param name="requestedById">The participant raising the consultation request</param>
        /// <param name="requestedForId">The participant with whom the consultation is being requested with</param>
        /// <param name="roomLabel">The room you're requesting the participant joins</param>
        private async Task NotifyConsultationRequestAsync(Conference conference, string roomLabel, Guid requestedById,
            Guid requestedForId)
        {
            var tasks = conference.Participants.Select(p =>
                _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                .RequestedConsultationMessage(conference.Id, roomLabel, requestedById, requestedForId));
            await Task.WhenAll(tasks);
        }

        /// <summary>
        /// This method raises a notification to the requester informing them the response to their consultation request.
        /// </summary>
        /// <param name="conferenceId">The conference Id</param>
        /// <param name="roomLabel">The room the participant is responding to</param>
        /// <param name="requestedById">The participant raising the consultation request</param>
        /// <param name="requestedForId">The participant with whom the consultation is being requested with</param>
        /// /// <param name="answer">The answer to the request (i.e. Accepted or Rejected)</param>
        private async Task NotifyConsultationResponseAsync(Conference conference, string roomLabel, Guid requestedById,
            Guid requestedForId, ConsultationAnswer answer)
        {
            var tasks = conference.Participants.Select(p => 
                _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                    .ConsultationRequestResponseMessage(conference.Id, roomLabel, requestedForId, answer));
            await Task.WhenAll(tasks);
        }

        private async Task NotifyRoomCreatedAsync(Conference conference, Room room)
        {
            var tasks = conference.Participants.Select(p =>
                _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                .RoomUpdate(room));
            await Task.WhenAll(tasks);
        }
    }
}
