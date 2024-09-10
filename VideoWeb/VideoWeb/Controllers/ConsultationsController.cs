using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.EventHub.Services;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Requests;
using ConsultationAnswer = VideoWeb.Common.Models.ConsultationAnswer;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("consultations")]
    public class ConsultationsController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IConferenceService _conferenceService;
        private readonly ILogger<ConsultationsController> _logger;
        private readonly IConsultationNotifier _consultationNotifier;
        private readonly IConsultationInvitationTracker _consultationInvitationTracker;
        private readonly IDistributedJOHConsultationRoomLockCache _distributedJohConsultationRoomLockCache;
        
        public ConsultationsController(IVideoApiClient videoApiClient,
            IConferenceService conferenceService,
            ILogger<ConsultationsController> logger,
            IConsultationNotifier consultationNotifier,
            IConsultationInvitationTracker consultationInvitationTracker,
            IDistributedJOHConsultationRoomLockCache distributedJohConsultationRoomLockCache)
        {
            _videoApiClient = videoApiClient;
            _conferenceService = conferenceService;
            _logger = logger;
            _consultationNotifier = consultationNotifier;
            _consultationInvitationTracker = consultationInvitationTracker;
            _distributedJohConsultationRoomLockCache = distributedJohConsultationRoomLockCache;
        }
        
        [HttpPost("leave")]
        [SwaggerOperation(OperationId = "LeaveConsultation")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> LeaveConsultationAsync(LeavePrivateConsultationRequest request, CancellationToken cancellationToken)
        {
            var participant = new Participant();
            try
            {
                var conference = await _conferenceService.GetConference(request.ConferenceId, cancellationToken);
                participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId);
                if (participant == null)
                {
                    return NotFound();
                }

                var mappedRequest = LeavePrivateConsultationRequestMapper.Map(request);
                await _videoApiClient.LeaveConsultationAsync(mappedRequest, cancellationToken);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                if (participant != null)
                {
                    _logger.LogError(e, "Participant: {Username} was not able to leave the private consultation. An error occured", participant.Username);
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
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> RespondToConsultationRequestAsync(PrivateConsultationRequest request, CancellationToken cancellationToken)
        {
            var conference = await _conferenceService.GetConference(request.ConferenceId, cancellationToken);
            var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedById);
            if (participant == null && request.RequestedById != Guid.Empty)
            {
                // Participants other than VHO
                return NotFound();
            }

            var mappedRequest = PrivateConsultationRequestMapper.Map(request);

            try
            {
                await _consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, request.Answer);
                var haveAllAccepted = await _consultationInvitationTracker.HaveAllParticipantsAccepted(request.InvitationId);
                if (haveAllAccepted)
                {
                    await _consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, ConsultationAnswer.Transferring);
                    await _videoApiClient.RespondToConsultationRequestAsync(mappedRequest);
                }
                else if (request.Answer != ConsultationAnswer.Accepted)
                {
                    await _videoApiClient.RespondToConsultationRequestAsync(mappedRequest);
                }

                return NoContent();
            }
            catch (VideoApiException e)
            {
                await _consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, ConsultationAnswer.Failed);
                _logger.LogError(e, "Consultation request could not be responded to");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("joinPrivateConsultation")]
        [SwaggerOperation(OperationId = "JoinPrivateConsultation")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> JoinPrivateConsultation(JoinPrivateConsultationRequest request, CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogTrace("Attempting to join a private consultation {ConferenceId} {ParticipantId} {RoomLabel}",
                    request.ConferenceId, request.ParticipantId, request.RoomLabel);
                var authenticatedUsername = User.Identity?.Name?.ToLower().Trim();
                var conference = await _conferenceService.GetConference(request.ConferenceId, cancellationToken);
                var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId && x.Username.Trim().Equals(authenticatedUsername, StringComparison.CurrentCultureIgnoreCase));

                if (participant == null)
                {
                    _logger.LogWarning("Couldn't join private consultation. Couldn't find participant.  {ConferenceId} {ParticipantId} {RoomLabel}", request.ConferenceId, request.ParticipantId, request.RoomLabel);
                    return NotFound("Couldn't find participant.");
                }

                var mappedRequest = JoinPrivateConsultationRequestMapper.Map(request);

                await _videoApiClient.RespondToConsultationRequestAsync(mappedRequest, cancellationToken);
                await _consultationNotifier.NotifyParticipantTransferring(conference, request.ParticipantId, request.RoomLabel);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Join private consultation error {ConferenceId} {ParticipantId} {RoomLabel}", request.ConferenceId, request.ParticipantId, request.RoomLabel);
                return StatusCode(e.StatusCode);
            }

            return Accepted();
        }

        [HttpPost("start")]
        [SwaggerOperation(OperationId = "StartOrJoinConsultation")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        public async Task<IActionResult> StartConsultationAsync(StartPrivateConsultationRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var username = User.Identity?.Name?.Trim() ?? throw new UnauthorizedAccessException("No username found in claims");
                var conference = await _conferenceService.GetConference(request.ConferenceId, cancellationToken);

                var requestedBy = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedBy && x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
                if (requestedBy == null)
                {
                    _logger.LogWarning("The participant with Id: {RequestedBy} and username: {Username} is not found", request.RequestedBy, username);
                    return NotFound();
                }

                var mappedRequest = StartPrivateConsultationRequestMapper.Map(request);

                if (request.RoomType == Contract.Enums.VirtualCourtRoomType.Participant)
                {
                    await StartParticipantConsultation(request, cancellationToken, mappedRequest, conference, username);
                }
                else
                {
                    if (!CanStartJohConsultation())
                    {
                        return Forbid();
                    }

                    await StartJudicialConsultation(cancellationToken, conference, mappedRequest);
                }

                return Accepted();
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Start consultation error Conference");
                return StatusCode(e.StatusCode);
            }
        }

        private async Task StartJudicialConsultation(CancellationToken cancellationToken, Conference conference,
            StartConsultationRequest mappedRequest)
        {
            var johConsultationRoomLockedStatusKeyName = $"johConsultationRoomLockedStatus_{conference.Id}";
            var isLocked =
                await _distributedJohConsultationRoomLockCache.IsJOHRoomLocked(johConsultationRoomLockedStatusKeyName, cancellationToken);

            if (isLocked)
            {
                Thread.Sleep(3000);
            }
            else
            {
                await _distributedJohConsultationRoomLockCache.UpdateJohConsultationRoomLockStatus(true,
                    johConsultationRoomLockedStatusKeyName, cancellationToken);
            }
                    
            await _videoApiClient.StartPrivateConsultationAsync(mappedRequest, cancellationToken);
        }

        private async Task StartParticipantConsultation(StartPrivateConsultationRequest request,
            CancellationToken cancellationToken, StartConsultationRequest mappedRequest, Conference conference, string username)
        {
            var room = await _videoApiClient.CreatePrivateConsultationAsync(mappedRequest, cancellationToken);
            conference.UpsertConsultationRoom(room.Label, room.Locked);
            await _conferenceService.UpdateConferenceAsync(conference, cancellationToken);
            await _consultationNotifier.NotifyRoomUpdateAsync(conference, new Room { Label = room.Label, Locked = room.Locked, ConferenceId = conference.Id });
            foreach (var participantId in request.InviteParticipants.Where(participantId => conference.Participants.Exists(p => p.Id == participantId)))
            {
                await _consultationNotifier.NotifyConsultationRequestAsync(conference, room.Label, request.RequestedBy, participantId);
            }

            var validSelectedEndpoints = request.InviteEndpoints
                .Select(endpointId => conference.Endpoints.SingleOrDefault(p => p.Id == endpointId))
                .Where(x => x != null && x.DefenceAdvocateUsername.Equals(username, StringComparison.OrdinalIgnoreCase));
                    
            foreach (var endpointId in validSelectedEndpoints.Select(x => x.Id))
            {
                try
                {
                    await _videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                    {
                        ConferenceId = request.ConferenceId,
                        EndpointId = endpointId,
                        RoomLabel = room.Label,
                                
                    }, cancellationToken);
                    break;
                }
                catch (VideoApiException e)
                {
                    // As endpoints cannot be linked participants just use and Empty GUID
                    await _consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, room.Label, endpointId, ConsultationAnswer.Failed);
                    _logger.LogError(e, "Unable to add {EndpointId} to consultation",endpointId);
                }
            }
        }

        [HttpPost("lock")]
        [SwaggerOperation(OperationId = "LockConsultationRoomRequest")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> LockConsultationRoomRequestAsync(LockConsultationRoomRequest request, CancellationToken cancellationToken)
        {
            try
            {
                var conference = await _conferenceService.GetConference(request.ConferenceId, cancellationToken);
                var mappedRequest = LockRoomRequestMapper.Map(request);
                await _videoApiClient.LockRoomAsync(mappedRequest, cancellationToken);

                await _consultationNotifier.NotifyRoomUpdateAsync(conference,
                    new Room { Label = request.RoomLabel, Locked = request.Lock, ConferenceId = conference.Id });

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
        public async Task<IActionResult> InviteToConsultationAsync(InviteToConsultationRequest request, CancellationToken cancellationToken)
        {
            var conference = await _conferenceService.GetConference(request.ConferenceId, cancellationToken);
            var username = User.Identity?.Name?.ToLower().Trim();
            var requestedBy = conference.Participants.SingleOrDefault(x =>
                x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
            if (requestedBy == null && !User.IsInRole(AppRoles.VhOfficerRole))
            {
                return Unauthorized("You must be a VHO or a member of the conference");
            }

            await _consultationNotifier.NotifyConsultationRequestAsync(conference, request.RoomLabel, requestedBy?.Id ?? Guid.Empty, request.ParticipantId);

            return Accepted();
        }

        [HttpPost("addendpoint")]
        [SwaggerOperation(OperationId = "AddEndpointToConsultation")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> AddEndpointToConsultationAsync(AddEndpointConsultationRequest request, CancellationToken cancellationToken)
        {
            var conference = await _conferenceService.GetConference(request.ConferenceId, cancellationToken);
            var username = User.Identity?.Name?.ToLower().Trim();
            var requestedBy = conference.Participants.SingleOrDefault(x => x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
            
            if (requestedBy == null)
            {
                return Unauthorized("You must be a VHO or a member of the conference");
            }

            try
            {
                await _consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Transferring);
                await _videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                {
                    ConferenceId = request.ConferenceId,
                    EndpointId = request.EndpointId,
                    RoomLabel = request.RoomLabel
                }, cancellationToken);
            }
            catch (VideoApiException e)
            {
                // As endpoints cannot be linked participants just use and Empty GUID
                await _consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Failed);
                _logger.LogError(e, "Join endpoint to consultation error");
                return StatusCode(e.StatusCode);
            }

            return Accepted();
        }

        private bool CanStartJohConsultation()
        {
            return User.IsInRole(AppRoles.JudgeRole) || User.IsInRole(AppRoles.StaffMember) || User.IsInRole(AppRoles.JudicialOfficeHolderRole);
        }
    }
}
