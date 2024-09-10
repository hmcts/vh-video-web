using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoApi.Client;
using VideoWeb.Common;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers;

[Consumes("application/json")]
[Produces("application/json")]
[Route("conferences")]
[ApiController]
public class VirtualRoomsController : ControllerBase
{
    private readonly IVideoApiClient _videoApiClient;
    private readonly IConferenceService _conferenceService;
    private readonly ILogger<VirtualRoomsController> _logger;
    
    public VirtualRoomsController(IVideoApiClient videoApiClient,
        IConferenceService conferenceService,
        ILogger<VirtualRoomsController> logger)
    {
        _videoApiClient = videoApiClient;
        _conferenceService = conferenceService;
        _logger = logger;
    }
    
    [HttpGet("{conferenceId}/rooms/shared/{participantId}")]
    [SwaggerOperation(OperationId = "GetParticipantRoomForParticipant")]
    [ProducesResponseType(typeof(SharedParticipantRoom), (int) HttpStatusCode.OK)]
    [ProducesResponseType(typeof(string), (int) HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetParticipantRoomForParticipant(Guid conferenceId, Guid participantId,
        [FromQuery] string participantType = "Civilian")
    {
        try
        {
            var room = participantType switch
            {
                "Witness" => await _videoApiClient.GetWitnessRoomForParticipantAsync(conferenceId,
                    participantId),
                "Judicial" => await _videoApiClient.GetJudicialRoomForParticipantAsync(conferenceId,
                    participantId),
                _ => await _videoApiClient.GetInterpreterRoomForParticipantAsync(conferenceId, participantId)
            };
            var conference = await _conferenceService.GetConference(conferenceId);
            var participant = conference.Participants.First(x => x.Id == participantId);
            var response = SharedParticipantRoomMapper.Map(room, participant, participantType == "Witness");
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
