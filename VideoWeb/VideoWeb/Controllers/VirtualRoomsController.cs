using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace VideoWeb.Controllers
{
    [Consumes("application/json")]
    [Produces("application/json")]
    [Route("conferences")]
    [ApiController]
    public class VirtualRoomsController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<VirtualRoomsController> _logger;
        private readonly IMapperFactory _mapperFactory;

        public VirtualRoomsController(IVideoApiClient videoApiClient, IMapperFactory mapperFactory,
            ILogger<VirtualRoomsController> logger)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _mapperFactory = mapperFactory;
        }

        [HttpGet("{conferenceId}/rooms/interpreter/{participantId}")]
        [SwaggerOperation(OperationId = "GetInterpreterRoomForParticipant")]
        [ProducesResponseType(typeof(SharedParticipantRoom), (int) HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetInterpreterRoomForParticipant(Guid conferenceId, Guid participantId, [FromQuery] string participantType = "Civilian")
        {
            try
            {
                var room = participantType switch
                {
                    "Witness" => await _videoApiClient.GetWitnessRoomForParticipantAsync(conferenceId,
                        participantId),
                    _ => await _videoApiClient.GetInterpreterRoomForParticipantAsync(conferenceId, participantId)
                };
                var mapper = _mapperFactory.Get<SharedParticipantRoomResponse, Guid, bool, SharedParticipantRoom>();
                var response = mapper.Map(room, participantId, participantType == "Witness");
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e,
                    "Unable to retrieve interpreter room for participant {ParticipantId} for conference: {ConferenceId}",
                    participantId, conferenceId);
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
