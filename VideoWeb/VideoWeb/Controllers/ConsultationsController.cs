using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Hub;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Requests;
using VideoWeb.Services.Video;
using ConsultationAnswer = VideoWeb.Common.Models.ConsultationAnswer;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using RoomType = VideoWeb.Common.Models.RoomType;

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

        /// <summary>
        /// Raise or answer to a private consultation request with another participant
        /// </summary>
        /// <param name="request">Private consultation request with or without an answer</param>
        /// <returns></returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "HandleConsultationRequest")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(BadRequestModelResponse), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> HandleConsultationRequestAsync(PrivateConsultationRequest request)
        {
            var conference = await GetConference(request.ConferenceId);

            var requestedBy = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedById);
            if (requestedBy == null)
            {
                return NotFound();
            }

            var requestedFor = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedForId);
            if (requestedFor == null)
            {
                return NotFound();
            }

            var requestRaised = !request.Answer.HasValue;
            if (requestRaised)
            {
                await NotifyConsultationRequestAsync(conference, requestedBy, requestedFor);
            }
            else if (request.Answer == ConsultationAnswer.Cancelled)
            {
                await NotifyConsultationCancelledAsync(conference, requestedBy, requestedFor);
            }
            else
            {
                await NotifyConsultationResponseAsync(conference, requestedBy, requestedFor, request.Answer.Value);
            }

            try
            {
                var consultationRequestMapper = _mapperFactory.Get<PrivateConsultationRequest, ConsultationRequest>();
                var mappedRequest = consultationRequestMapper.Map(request);
                await _videoApiClient.HandleConsultationRequestAsync(mappedRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                object value;
                if (e is VideoApiException<ProblemDetails>)
                {
                    var errors = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string[]>>(e.Response);
                    var badRequestModelResponseMapper = _mapperFactory.Get<Dictionary<string, string[]>, BadRequestModelResponse>();
                    value = badRequestModelResponseMapper.Map(errors);
                    await NotifyParticipantsConsultationRoomOccupied(request.ConferenceId, requestedBy.Username,
                        requestedFor.Username);
                }
                else
                {
                    value = e.Response;
                }

                _logger.LogError(e, $"Consultation error ConferenceId: {request.ConferenceId} and answer {request.Answer}, ErrorCode: {e.StatusCode}");
                return StatusCode(400, value);
            }
        }

        [HttpPost("leave")]
        [SwaggerOperation(OperationId = "LeavePrivateConsultation")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> LeavePrivateConsultationAsync(LeavePrivateConsultationRequest request)
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

        private async Task NotifyParticipantsConsultationRoomOccupied(Guid conferenceId,
            string requesterUsername, string requesteeUsername)
        {
            await _hubContext.Clients.Group(requesterUsername.ToLowerInvariant()).ConsultationMessage(conferenceId,
                requesterUsername.ToLowerInvariant(),
                requesteeUsername.ToLowerInvariant(), ConsultationAnswer.NoRoomsAvailable);

            await _hubContext.Clients.Group(requesteeUsername.ToLowerInvariant()).ConsultationMessage(conferenceId,
                requesterUsername.ToLowerInvariant(),
                requesteeUsername.ToLowerInvariant(), ConsultationAnswer.NoRoomsAvailable);

        }

        [HttpPost("vhofficer/respond")]
        [SwaggerOperation(OperationId = "RespondToAdminConsultationRequest")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> RespondToAdminConsultationRequestAsync(PrivateAdminConsultationRequest request)
        {
            var conference = new Conference();
            try
            {
                conference = await GetConference(request.ConferenceId);
                var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId);
                if (participant == null)
                {
                    return NotFound();
                }

                var adminConsultationRequestMapper = _mapperFactory.Get<PrivateAdminConsultationRequest, AdminConsultationRequest>();
                var mappedRequest = adminConsultationRequestMapper.Map(request);
                await _videoApiClient.RespondToAdminConsultationRequestAsync(mappedRequest);
                if (request.Answer != ConsultationAnswer.Accepted) return NoContent();
                var roomType = Enum.Parse<RoomType>(request.ConsultationRoom.ToString());
                var answer = Enum.Parse<ConsultationAnswer>(request.Answer.ToString());

                await _hubContext.Clients.Group(participant.Username.ToLowerInvariant()).AdminConsultationMessage
                    (conference.Id, roomType, participant.Username.ToLowerInvariant(), answer);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Admin consultation request could not be responded to for HearingId: {conference.HearingId}");
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
        [SwaggerOperation(OperationId = "StartConsultationAsync")]
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
           //     await _videoApiClient.StartConsultationAsync(mappedRequest);
                return Accepted();

            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"Start consultation error ConferenceId: {request.ConferenceId}, participantId: {request.RequestedBy}, ErrorCode: {e.StatusCode}");
                return StatusCode(e.StatusCode);
            }
        }

        [HttpPost("end")]
        [SwaggerOperation(OperationId = "LeaveConsultationAsync")]
        [ProducesResponseType((int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> LeaveConsultationAsync(LeavePrivateConsultationRequest request)
        {
            try
            {
                var conference = await GetConference(request.ConferenceId);

                var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId);
                if (participant == null)
                {
                    _logger.LogWarning($"The participant with Id: {request.ParticipantId} is not found");
                    return NotFound();
                }

                var leaveConsultationRequestMapper = _mapperFactory.Get<LeavePrivateConsultationRequest, LeaveConsultationRequest>();
                var mappedRequest = leaveConsultationRequestMapper.Map(request);
           //     await _videoApiClient.LeaveConsultationAsync(mappedRequest);

                return Ok();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, $"End consultation error ConferenceId: {request.ConferenceId} and participant Id: {request.ParticipantId}, ErrorCode: {e.StatusCode}");
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
        /// <param name="conference">The conference Id</param>
        /// <param name="requestedBy">The participant raising the consultation request</param>
        /// <param name="requestedFor">The participant with whom the consultation is being requested with</param>
        private async Task NotifyConsultationRequestAsync(Conference conference, Participant requestedBy,
            Participant requestedFor)
        {
            await _hubContext.Clients.Group(requestedFor.Username.ToLowerInvariant())
                .ConsultationMessage(conference.Id, requestedBy.Username, requestedFor.Username,
                    null);

        }

        /// <summary>
        /// This method raises a notification to the requester informing them the response to their consultation request.
        /// </summary>
        /// <param name="conference">The conference Id</param>
        /// <param name="requestedBy">The participant raising the consultation request</param>
        /// <param name="requestedFor">The participant with whom the consultation is being requested with</param>
        /// /// <param name="answer">The answer to the request (i.e. Accepted or Rejected)</param>
        private async Task NotifyConsultationResponseAsync(Conference conference, Participant requestedBy,
            Participant requestedFor, ConsultationAnswer answer)
        {
            await _hubContext.Clients.Group(requestedBy.Username.ToLowerInvariant())
                .ConsultationMessage(conference.Id, requestedBy.Username, requestedFor.Username, answer);

        }

        private async Task NotifyConsultationCancelledAsync(Conference conference, Participant requestedBy,
            Participant requestedFor)
        {
            await _hubContext.Clients.Group(requestedFor.Username.ToLowerInvariant())
                .ConsultationMessage(conference.Id, requestedBy.Username, requestedFor.Username,
                    ConsultationAnswer.Cancelled);

        }
    }
}
