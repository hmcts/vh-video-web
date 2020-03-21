using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("consultations")]
    public class ConsultationsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IHubContext<EventHub.Hub.EventHub, IEventHubClient> _hubContext;
        private readonly IMemoryCache _memoryCache;

        public ConsultationsController(IVideoApiClient videoApiClient, 
            IHubContext<EventHub.Hub.EventHub, IEventHubClient> hubContext,
            IMemoryCache memoryCache)
        {
            _videoApiClient = videoApiClient;
            _hubContext = hubContext;
            _memoryCache = memoryCache;
        }
        
        /// <summary>
        /// Raise or answer to a private consultation request with another participant
        /// </summary>
        /// <param name="request">Private consultation request with or without an answer</param>
        /// <returns></returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "HandleConsultationRequest")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> HandleConsultationRequestAsync(ConsultationRequest request)
        {
            var conference = _memoryCache.Get<Conference>(request.Conference_id);
            if (conference == null)
            {
                return NotFound();
            }

            conference.Participants ??= new List<Participant>();

            var requestedBy = conference.Participants?.SingleOrDefault(x => x.Id == request.Requested_by);
            if (requestedBy == null)
            {
                return NotFound();
            }

            var requestedFor = conference.Participants?.SingleOrDefault(x => x.Id == request.Requested_for);
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
                await _videoApiClient.HandleConsultationRequestAsync(request);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
        
        [HttpPost("leave")]
        [SwaggerOperation(OperationId = "LeavePrivateConsultation")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> LeavePrivateConsultationAsync(LeaveConsultationRequest request)
        {
            var conference = _memoryCache.Get<Conference>(request.Conference_id);
            if (conference == null)
            {
                return NotFound();
            }

            conference.Participants ??= new List<Participant>();

            var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.Participant_id);
            if (participant == null)
            {
                return NotFound();
            }

            try
            {
                await _videoApiClient.LeavePrivateConsultationAsync(request);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
        
        [HttpPost("vhofficer/respond")]
        [SwaggerOperation(OperationId = "RespondToAdminConsultationRequest")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> RespondToAdminConsultationRequestAsync(AdminConsultationRequest request)
        {
            var conference = _memoryCache.Get<Conference>(request.Conference_id);
            if (conference == null)
            {
                return NotFound();
            }

            conference.Participants ??= new List<Participant>();
            var participant = conference.Participants?.SingleOrDefault(x => x.Id == request.Participant_id);
            if (participant == null)
            {
                return NotFound();
            }

            try
            {
                await _videoApiClient.RespondToAdminConsultationRequestAsync(request);
                if (request.Answer != null && request.Answer.Value == ConsultationAnswer.Accepted)
                {
                    var roomType = Enum.Parse<EventHub.Enums.RoomType>(request.Consultation_room.ToString());
                    var answer = Enum.Parse<EventHub.Enums.ConsultationAnswer>(request.Answer.ToString());

                    await _hubContext.Clients.Group(participant.Username.ToLowerInvariant()).AdminConsultationMessage
                    (conference.Id, roomType, participant.Username.ToLowerInvariant(), answer);
                }

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
                    string.Empty);
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
                .ConsultationMessage(conference.Id, requestedBy.Username, requestedFor.Username, answer.ToString());
        }

        private async Task NotifyConsultationCancelledAsync(Conference conference, Participant requestedBy,
            Participant requestedFor)
        {
            await _hubContext.Clients.Group(requestedFor.Username.ToLowerInvariant())
                .ConsultationMessage(conference.Id, requestedBy.Username, requestedFor.Username,
                    ConsultationAnswer.Cancelled.ToString());
        }
    }
}
