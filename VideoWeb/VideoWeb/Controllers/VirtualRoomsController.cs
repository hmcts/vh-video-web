using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

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
        [ProducesResponseType(typeof(InterpreterRoom), (int) HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetInterpreterRoomForParticipant(Guid conferenceId, Guid participantId)
        {
            try
            {
                // var room = await _videoApiClient.GetInterpreterRoomForParticipantAsync(conferenceId, participantId);
                var room = await Task.FromResult(new InterpreterRoomResponse
                {
                    Label = "Interpreter1",
                    Participant_join_uri = "hmctstest1-0__855617b6-a1b7-49eb-88e5-df9005344c26__INTERPRETER_VMR",
                    Pexip_node = "https://sip.test.hearings.hmcts.net"
                });
                var mapper = _mapperFactory.Get<InterpreterRoomResponse, InterpreterRoom>();
                var response = mapper.Map(room);
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
