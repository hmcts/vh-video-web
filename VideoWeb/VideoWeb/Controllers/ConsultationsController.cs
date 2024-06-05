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
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.EventHub.Services;
using VideoWeb.Helpers;
using ConsultationAnswer = VideoWeb.Common.Models.ConsultationAnswer;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("consultations")]
    public class ConsultationsController(
        IVideoApiClient videoApiClient,
        IConferenceService conferenceService,
        ILogger<ConsultationsController> logger,
        IMapperFactory mapperFactory,
        IConsultationNotifier consultationNotifier,
        IConsultationInvitationTracker consultationInvitationTracker,
        IDistributedJOHConsultationRoomLockCache distributedJohConsultationRoomLockCache)
        : ControllerBase
    {
        [HttpPost("leave")]
        [SwaggerOperation(OperationId = "LeaveConsultation")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> LeaveConsultationAsync(LeavePrivateConsultationRequest request)
        {
            var participant = new ParticipantDto();
            try
            {
                var conference = await conferenceService.GetConference(request.ConferenceId);
                participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId);
                if (participant == null)
                {
                    return NotFound();
                }

                var leaveConsultationRequestMapper = mapperFactory.Get<LeavePrivateConsultationRequest, LeaveConsultationRequest>();
                var mappedRequest = leaveConsultationRequestMapper.Map(request);
                await videoApiClient.LeaveConsultationAsync(mappedRequest);

                return NoContent();
            }
            catch (VideoApiException e)
            {
                if (participant != null)
                {
                    logger.LogError(e, "Participant: {Username} was not able to leave the private consultation. An error occured", participant.Username);
                }
                else
                {
                    logger.LogError(e, "Invalid participant");
                }

                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("respond")]
        [SwaggerOperation(OperationId = "RespondToConsultationRequest")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> RespondToConsultationRequestAsync(PrivateConsultationRequest request)
        {
            var conference = await conferenceService.GetConference(request.ConferenceId);
            var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedById);
            if (participant == null && request.RequestedById != Guid.Empty)
            {
                // Participants other than VHO
                return NotFound();
            }

            var adminConsultationRequestMapper = mapperFactory.Get<PrivateConsultationRequest, ConsultationRequestResponse>();
            var mappedRequest = adminConsultationRequestMapper.Map(request);

            try
            {
                await consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, request.Answer);
                var haveAllAccepted = await consultationInvitationTracker.HaveAllParticipantsAccepted(request.InvitationId);
                if (haveAllAccepted)
                {
                    await consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, ConsultationAnswer.Transferring);
                    await videoApiClient.RespondToConsultationRequestAsync(mappedRequest);
                }
                else if (request.Answer != ConsultationAnswer.Accepted)
                {
                    await videoApiClient.RespondToConsultationRequestAsync(mappedRequest);
                }

                return NoContent();
            }
            catch (VideoApiException e)
            {
                await consultationNotifier.NotifyConsultationResponseAsync(conference, request.InvitationId, request.RoomLabel, request.RequestedForId, ConsultationAnswer.Failed);
                logger.LogError(e, "Consultation request could not be responded to");
                return StatusCode(e.StatusCode, e.Response);
            }
        }

        [HttpPost("joinPrivateConsultation")]
        [SwaggerOperation(OperationId = "JoinPrivateConsultation")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> JoinPrivateConsultation(JoinPrivateConsultationRequest request)
        {
            try
            {
                logger.LogTrace("Attempting to join a private consultation {ConferenceId} {ParticipantId} {RoomLabel}",
                    request.ConferenceId, request.ParticipantId, request.RoomLabel);
                var authenticatedUsername = User.Identity?.Name?.ToLower().Trim();
                var conference = await conferenceService.GetConference(request.ConferenceId);
                var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.ParticipantId && x.Username.Trim().Equals(authenticatedUsername, StringComparison.CurrentCultureIgnoreCase));

                if (participant == null)
                {
                    logger.LogWarning("Couldn't join private consultation. Couldn't find participant.  {ConferenceId} {ParticipantId} {RoomLabel}", request.ConferenceId, request.ParticipantId, request.RoomLabel);
                    return NotFound("Couldn't find participant.");
                }

                var consultationRequestMapper = mapperFactory.Get<JoinPrivateConsultationRequest, ConsultationRequestResponse>();
                var mappedRequest = consultationRequestMapper.Map(request);

                await videoApiClient.RespondToConsultationRequestAsync(mappedRequest);
                await consultationNotifier.NotifyParticipantTransferring(conference, request.ParticipantId, request.RoomLabel);
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Join private consultation error {ConferenceId} {ParticipantId} {RoomLabel}", request.ConferenceId, request.ParticipantId, request.RoomLabel);
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
        public async Task<IActionResult> StartConsultationAsync(StartPrivateConsultationRequest request)
        {
            try
            {
                var username = User.Identity?.Name?.Trim() ?? throw new UnauthorizedAccessException("No username found in claims");
                var conference = await conferenceService.GetConference(request.ConferenceId);

                var requestedBy = conference.Participants?.SingleOrDefault(x => x.Id == request.RequestedBy && x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
                if (requestedBy == null)
                {
                    logger.LogWarning("The participant with Id: {RequestedBy} and username: {Username} is not found", request.RequestedBy, username);
                    return NotFound();
                }

                var consultationRequestMapper = mapperFactory.Get<StartPrivateConsultationRequest, StartConsultationRequest>();
                var mappedRequest = consultationRequestMapper.Map(request);

                if (request.RoomType == Contract.Enums.VirtualCourtRoomType.Participant)
                {
                    var room = await videoApiClient.CreatePrivateConsultationAsync(mappedRequest);
                    await consultationNotifier.NotifyRoomUpdateAsync(conference, new Room { Label = room.Label, Locked = room.Locked, ConferenceId = conference.Id });
                    foreach (var participantId in request.InviteParticipants.Where(participantId => conference.Participants.Exists(p => p.Id == participantId)))
                    {
                        await consultationNotifier.NotifyConsultationRequestAsync(conference, room.Label, request.RequestedBy, participantId);
                    }

                    var validSelectedEndpoints = request.InviteEndpoints
                        .Select(endpointId => conference.Endpoints.SingleOrDefault(p => p.Id == endpointId))
                        .Where(x => x != null && x.EndpointParticipants.Exists(ep => ep.ParticipantUsername.Equals(username, StringComparison.OrdinalIgnoreCase)));
                    
                    foreach (var endpointId in validSelectedEndpoints.Select(x => x.Id))
                    {
                        try
                        {
                            await videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                            {
                                ConferenceId = request.ConferenceId,
                                EndpointId = endpointId,
                                RoomLabel = room.Label,
                                
                            });
                            break;
                        }
                        catch (VideoApiException e)
                        {
                            // As endpoints cannot be linked participants just use and Empty GUID
                            await consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, room.Label, endpointId, ConsultationAnswer.Failed);
                            logger.LogError(e, "Unable to add {EndpointId} to consultation",endpointId);
                        }
                    }
                }
                else
                {
                    if (!CanStartJohConsultation())
                    {
                        return Forbid();
                    }

                    var johConsultationRoomLockedStatusKeyName = $"johConsultationRoomLockedStatus_{conference.Id}";
                    var isLocked =
                        await distributedJohConsultationRoomLockCache.IsJOHRoomLocked(johConsultationRoomLockedStatusKeyName);

                    if (isLocked)
                    {
                        Thread.Sleep(3000);
                    }
                    else
                    {
                        await distributedJohConsultationRoomLockCache.UpdateJohConsultationRoomLockStatus(true,
                            johConsultationRoomLockedStatusKeyName);
                    }
                    
                    await videoApiClient.StartPrivateConsultationAsync(mappedRequest);
                }

                return Accepted();
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Start consultation error Conference");
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
                var conference = await conferenceService.GetConference(request.ConferenceId);
                var lockRequestMapper = mapperFactory.Get<LockConsultationRoomRequest, LockRoomRequest>();
                var mappedRequest = lockRequestMapper.Map(request);
                await videoApiClient.LockRoomAsync(mappedRequest);

                await consultationNotifier.NotifyRoomUpdateAsync(conference,
                    new Room { Label = request.RoomLabel, Locked = request.Lock, ConferenceId = conference.Id });

                return NoContent();
            }
            catch (VideoApiException e)
            {
                logger.LogError(e, "Could not update the lock state of the consultation room");
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
            var conference = await conferenceService.GetConference(request.ConferenceId);
            var username = User.Identity?.Name?.ToLower().Trim();
            var requestedBy = conference.Participants.SingleOrDefault(x =>
                x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
            if (requestedBy == null && !User.IsInRole(AppRoles.VhOfficerRole))
            {
                return Unauthorized("You must be a VHO or a member of the conference");
            }

            await consultationNotifier.NotifyConsultationRequestAsync(conference, request.RoomLabel, requestedBy?.Id ?? Guid.Empty, request.ParticipantId);

            return Accepted();
        }

        [HttpPost("addendpoint")]
        [SwaggerOperation(OperationId = "AddEndpointToConsultation")]
        [ProducesResponseType((int)HttpStatusCode.Accepted)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> AddEndpointToConsultationAsync(AddEndpointConsultationRequest request)
        {
            var conference = await conferenceService.GetConference(request.ConferenceId);
            var username = User.Identity?.Name?.ToLower().Trim();
            var requestedBy = conference.Participants.SingleOrDefault(x => x.Username.Trim().Equals(username, StringComparison.CurrentCultureIgnoreCase));
            
            if (requestedBy == null)
            {
                return Unauthorized("You must be a VHO or a member of the conference");
            }

            try
            {
                await consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Transferring);
                await videoApiClient.JoinEndpointToConsultationAsync(new EndpointConsultationRequest
                {
                    ConferenceId = request.ConferenceId,
                    EndpointId = request.EndpointId,
                    RoomLabel = request.RoomLabel
                });
            }
            catch (VideoApiException e)
            {
                // As endpoints cannot be linked participants just use and Empty GUID
                await consultationNotifier.NotifyConsultationResponseAsync(conference, Guid.Empty, request.RoomLabel, request.EndpointId, ConsultationAnswer.Failed);
                logger.LogError(e, "Join endpoint to consultation error");
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
