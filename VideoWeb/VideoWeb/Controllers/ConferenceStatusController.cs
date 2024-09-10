using System;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.EventHub.Services;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("conferences")]
public class ConferenceStatusController : ControllerBase
{
    private readonly ILogger<ConferenceStatusController> _logger;
    private readonly IConferenceVideoControlStatusService _conferenceVideoControlStatusService;
    
    public ConferenceStatusController(ILogger<ConferenceStatusController> logger,
        IConferenceVideoControlStatusService conferenceVideoControlStatusService)
    {
        _logger = logger;
        _conferenceVideoControlStatusService = conferenceVideoControlStatusService;
    }
    
    /// <summary>
    /// Updates the video control statuses for the conference
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <param name="setVideoControlStatusesRequest">Request object to set Video Control Staus</param>
    /// <returns>Ok status</returns>
    /// <returns>Forbidden status</returns>
    /// <returns>Not Found status</returns>
    [HttpPut("{conferenceId}/setVideoControlStatuses")]
    [SwaggerOperation(OperationId = "SetVideoControlStatusesForConference")]
    [ProducesResponseType((int)HttpStatusCode.Accepted)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> SetVideoControlStatusesForConference(Guid conferenceId, [FromBody]SetConferenceVideoControlStatusesRequest setVideoControlStatusesRequest, CancellationToken cancellationToken)
    {
        try
        {
            var videoControlStatuses = SetConferenceVideoControlStatusesRequestMapper.Map(setVideoControlStatusesRequest);
            
            _logger.LogDebug("Setting the video control statuses for {conferenceId}", conferenceId);
            _logger.LogTrace($"Updating conference videoControlStatuses in cache: {JsonSerializer.Serialize(videoControlStatuses)}");
            
            await _conferenceVideoControlStatusService.SetVideoControlStateForConference(conferenceId, videoControlStatuses, cancellationToken);
            
            _logger.LogTrace("Set video control statuses ({videoControlStatuses}) for {conferenceId}", videoControlStatuses, conferenceId);
            return Accepted();
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Could not set video control statuses for {conferenceId} an unkown exception was thrown", conferenceId);
            throw;
        }
    }
    
    /// <summary>
    /// Returns the video control statuses for the conference
    /// </summary>
    /// <param name="conferenceId">conference id</param>
    /// <returns>Ok status</returns>
    /// <returns>Forbidden status</returns>
    /// <returns>Not Found status</returns>
    [HttpGet("{conferenceId}/getVideoControlStatuses")]
    [SwaggerOperation(OperationId = "GetVideoControlStatusesForConference")]
    [ProducesResponseType(typeof(ConferenceVideoControlStatuses), (int)HttpStatusCode.OK)]
    [ProducesResponseType(typeof(ConferenceVideoControlStatuses), (int)HttpStatusCode.NoContent)]
    public async Task<IActionResult> GetVideoControlStatusesForConference(Guid conferenceId)
    {
        try
        {
            _logger.LogDebug("Getting the video control statuses for {conferenceId}", conferenceId);
            var videoControlStatuses = await _conferenceVideoControlStatusService.GetVideoControlStateForConference(conferenceId);
            
            if (videoControlStatuses == null)
            {
                _logger.LogWarning("video control statuses with id: {conferenceId} not found", conferenceId);
                
                return NoContent();
            }
            
            _logger.LogTrace("Got video control statuses ({videoControlStatuses}) for {conferenceId}", videoControlStatuses, conferenceId);
            return Ok(videoControlStatuses);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Could not get video control statuses for {conferenceId} an unkown exception was thrown", conferenceId);
            throw;
        }
    }
}
