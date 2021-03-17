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
using VideoApi.Client;
using VideoApi.Contract.Requests;
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
                await _videoApiClient.LeaveConsultationAsync(mappedRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                if (participant != null)
                {
                    _logger.LogError(e, "Participant: {participant.Username} was not able to leave the private consultation. An error occured", participant.Username);
                }
                else
                {
                    _logger.LogError(e, "Invalid participant");
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
            var conference = await GetConference(request.ConferenceId);
            var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedById);
            if (participant == null && request.RequestedById != Guid.Empty)
            {
                // Participants other than VHO
                return NotFound();
            }

            var adminConsultationRequestMapper = _mapperFactory.Get<PrivateConsultationRequest, ConsultationRequestResponse>();
            var mappedRequest = adminConsultationRequestMapper.Map(request);

            try
            {
                if (request.Answer == ConsultationAnswer.Accepted)
                {
                    await NotifyConsultationResponseAsync(conference, request.RoomLabel, request.RequestedForId, ConsultationAnswer.Transferring);
                }

                await _videoApiClient.RespondToConsultationRequestAsync(mappedRequest);
                await NotifyConsultationResponseAsync(conference, request.RoomLabel, request.RequestedForId, request.Answer);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                await NotifyConsultationResponseAsync(conference, request.RoomLabel, request.RequestedForId, ConsultationAnswer.Failed);
                _logger.LogError(e, "Consultation request could not be responded to");
                return StatusCode(e.StatusCode, e.Response);
            }
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
                var username = User.Identity.Name?.ToLower().Trim();
                var conference = await GetConference(request.ConferenceId);

                var requestedBy = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedBy && x.Username == username);
                if (requestedBy == null)
                {
                    _logger.LogWarning("The participant with Id: {requestedBy} and username: {username} is not found", request.RequestedBy, username);
                    return NotFound();
                }

                var consultationRequestMapper = _mapperFactory.Get<StartPrivateConsultationRequest, StartConsultationRequest>();
                var mappedRequest = consultationRequestMapper.Map(request);

                if (request.RoomType == Contract.Enums.VirtualCourtRoomType.Participant)
                {
                    var room = await _videoApiClient.CreatePrivateConsultationAsync(mappedRequest);
                    await NotifyRoomUpdateAsync(conference, new Room { Label = room.Label, Locked = room.Locked, ConferenceId = conference.Id });
                    foreach (var participantId in request.InviteParticipants.Where(participantId => conference.Participants.Any(p => p.Id == participantId)))
                    {
                        await NotifyConsultationRequestAsync(conference, room.Label, request.RequestedBy, participantId);
                    }

                    var validSelectedEndpoints = request.InviteEndpoints
                        .Select(endpointId => conference.Endpoints.SingleOrDefault(p => p.Id == endpointId))
                        .Where(x => x.DefenceAdvocateUsername.Equals(username, StringComparison.OrdinalIgnoreCase));
                    foreach (var endpoint in validSelectedEndpoints)
                    {
                        try
                        {
                            await _videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                            {
                                ConferenceId = request.ConferenceId,
                                RequestedById = requestedBy.Id,
                                EndpointId = endpoint.Id,
                                RoomLabel = room.Label
                            });
                            break;
                        }
                        catch (VideoApiException e)
                        {
                            await NotifyConsultationResponseAsync(conference, room.Label, endpoint.Id, ConsultationAnswer.Failed);
                            _logger.LogError(e, "Unable to add {endpointId} to consultation", endpoint.Id);
                        }
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
                _logger.LogError(e, "Start consultation error Conference");
                return StatusCode(e.StatusCode);
            }
        }

        [HttpPost("lock")]
        [SwaggerOperation(OperationId = "LockConsultationRoomRequest")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> LockConsultationRoomRequestAsync(LockConsultationRoomRequest request)
        {
            try
            {
                var conference = await GetConference(request.ConferenceId);

                var lockRequestMapper = _mapperFactory.Get<LockConsultationRoomRequest, LockRoomRequest>();
                var mappedRequest = lockRequestMapper.Map(request);
                await _videoApiClient.LockRoomAsync(mappedRequest);

                await NotifyRoomUpdateAsync(conference, new Room { Label = request.RoomLabel, Locked = request.Lock, ConferenceId = conference.Id });

                return NoContent();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Could not update the lock state of the consultation room");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("invite")]
        [SwaggerOperation(OperationId = "InviteToConsultation")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> InviteToConsultationAsync(InviteToConsultationRequest request)
        {
            var conference = await GetConference(request.ConferenceId);

            var username = User.Identity.Name?.ToLower().Trim();
            var requestedBy = conference.Participants.SingleOrDefault(x =>
                x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
            if (requestedBy == null && !User.IsInRole(AppRoles.VhOfficerRole))
            {
                return Unauthorized("You must be a VHO or a member of the conference");
            }

            await NotifyConsultationRequestAsync(conference, request.RoomLabel, requestedBy?.Id ?? Guid.Empty, request.ParticipantId);

            return Accepted();
        }

        [HttpPost("addendpoint")]
        [SwaggerOperation(OperationId = "AddEndpointToConsultation")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> AddEndpointToConsultationAsync(AddEndpointConsultationRequest request)
        {
            var conference = await GetConference(request.ConferenceId);

            var username = User.Identity.Name?.ToLower().Trim();
            var requestedBy = conference.Participants.SingleOrDefault(x =>
                x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
            if (requestedBy == null)
            {
                return Unauthorized("You must be a VHO or a member of the conference");
            }

            try
            {
                await NotifyConsultationResponseAsync(conference, request.RoomLabel, request.EndpointId, ConsultationAnswer.Transferring);
                await _videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                {
                    ConferenceId = request.ConferenceId,
                    DefenceAdvocateId = requestedBy.Id,
                    EndpointId = request.EndpointId,
                    RoomLabel = request.RoomLabel
                });
            }
            catch (VideoApiException e)
            {
                await NotifyConsultationResponseAsync(conference, request.RoomLabel, request.EndpointId, ConsultationAnswer.Failed);
                _logger.LogError(e, "Join endpoint to consultation error");
                return StatusCode(e.StatusCode);
            }

            return Accepted();
        }

        private Task<Conference> GetConference(Guid conferenceId)
        {
            return _conferenceCache.GetOrAddConferenceAsync(conferenceId,
                () => _videoApiClient.GetConferenceDetailsByIdAsync(conferenceId));
        }

        private async Task NotifyConsultationRequestAsync(Conference conference, string roomLabel, Guid requestedById,
            Guid requestedForId)
        {
            var tasks = conference.Participants.Select(p =>
                _hubContext.Clients.Group(p.Username.ToLowerInvariant())
                .RequestedConsultationMessage(conference.Id, roomLabel, requestedById, requestedForId));
            await Task.WhenAll(tasks);
        }

        private async Task NotifyConsultationResponseAsync(Conference conference, string roomLabel,
            Guid requestedForId, ConsultationAnswer answer)
        {
            var tasks = conference.Participants.Select(p => 
                _hubContext.Clients?.Group(p.Username.ToLowerInvariant())
                    .ConsultationRequestResponseMessage(conference.Id, roomLabel, requestedForId, answer) ?? Task.CompletedTask);
            await Task.WhenAll(tasks);
        }

        private async Task NotifyRoomUpdateAsync(Conference conference, Room room)
        {
            var tasks = conference.Participants.Select(p =>
                _hubContext.Clients?.Group(p.Username.ToLowerInvariant())
                .RoomUpdate(room) ?? Task.CompletedTask);
            await Task.WhenAll(tasks);
        }
    }
}
