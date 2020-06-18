using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
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

        public ConsultationsController(IVideoApiClient videoApiClient, 
            IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext,
            IConferenceCache conferenceCache, ILogger<ConsultationsController> logger)
        {
            _videoApiClient = videoApiClient;
            _hubContext = hubContext;
            _conferenceCache = conferenceCache;
            _logger = logger;
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
            var conference = await _conferenceCache.GetOrAddConferenceAsync(request.ConferenceId, () =>
            {
                _logger.LogTrace($"Retrieving conference details for conference: ${request.ConferenceId}");

                return _videoApiClient.GetConferenceDetailsByIdAsync(request.ConferenceId);
            });

            conference.Participants ??= new List<Participant>();

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
                var mappedRequest = PrivateConsultationRequestMapper.MapToApiConsultationRequest(request);
                await _videoApiClient.HandleConsultationRequestAsync(mappedRequest);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                object value;
                if (e is VideoApiException<ProblemDetails>)
                {
                    var errors =
                        Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string[]>>(e.Response);
                    value = BadRequestResponseMapper.MapToResponse(errors);
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
            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync(request.ConferenceId, () =>
                {
                    _logger.LogTrace($"Retrieving conference details for conference: ${request.ConferenceId}");
                    
                    return _videoApiClient.GetConferenceDetailsByIdAsync(request.ConferenceId);
                });

                conference.Participants ??= new List<Participant>();

                var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId);
                if (participant == null)
                {
                    return NotFound();
                }

                var mappedRequest = LeavePrivateConsultationRequestMapper.MapToLeaveConsultationRequest(request);
                await _videoApiClient.LeavePrivateConsultationAsync(mappedRequest);
                return NoContent();
            }
            catch (VideoApiException e)
            {
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
            try
            {
                var conference = await _conferenceCache.GetOrAddConferenceAsync(request.ConferenceId, () =>
                {
                    _logger.LogTrace($"Retrieving conference details for conference: ${request.ConferenceId}");
                
                    return _videoApiClient.GetConferenceDetailsByIdAsync(request.ConferenceId);
                });

                conference.Participants ??= new List<Participant>();
                var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId);
                if (participant == null)
                {
                    return NotFound();
                }

                var mappedRequest = PrivateAdminConsultationRequestMapper.MapToAdminConsultationRequest(request);
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
                return StatusCode(e.StatusCode, e.Response);
            }
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
