using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers.Sorting;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers;

[Consumes("application/json")]
[Produces("application/json")]
[Route("end-of-day")]
[ApiController]
public class EndOfDayController : ControllerBase
{
    private readonly IBookingsApiClient _bookingsApiClient;
    private readonly IVideoApiClient _videoApiClient;
    private readonly IMapperFactory _mapperFactory;
    private readonly ILogger<EndOfDayController> _logger;

    public EndOfDayController(IVideoApiClient videoApiClient,
        IMapperFactory mapperFactory, IBookingsApiClient bookingsApiClient, ILogger<EndOfDayController> logger)
    {
        _logger = logger;
        _videoApiClient = videoApiClient;
        _mapperFactory = mapperFactory;
        _bookingsApiClient = bookingsApiClient;
    }

    /// <summary>
    /// Get all active conferences.
    /// This includes conferences that are in progress or paused.
    /// This includes conferences that are closed but the participants are still in consultation.
    /// </summary>
    /// <returns></returns>
    [HttpGet("active-sessions")]
    [SwaggerOperation(OperationId = "GetActiveConferences")]
    [ProducesResponseType(typeof(List<ConferenceForVhOfficerResponse>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<List<ConferenceForVhOfficerResponse>>> GetActiveConferences()
    {
        _logger.LogDebug("Getting all active conferences");
        try
        {
            var activeConferences =
                await _videoApiClient.GetActiveConferencesAsync();

            var allocatedHearings =
                await _bookingsApiClient.GetAllocationsForHearingsAsync(activeConferences.Select(e => e.HearingRefId));
            
            var conferenceForVhOfficerResponseMapper = _mapperFactory
                .Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>();
            var response = activeConferences
                .Select(c => conferenceForVhOfficerResponseMapper
                    .Map(c, allocatedHearings?
                        .FirstOrDefault(conference => conference.HearingId == c.HearingRefId))).ToList();
            response.Sort(new SortConferenceForVhoOfficerHelper());
            return Ok(response);
        }
        catch (VideoApiException e)
        {
            if (e.StatusCode == (int)HttpStatusCode.NotFound)
            {
                return Ok(new List<ConferenceForVhOfficerResponse>());
            }

            _logger.LogError(e, "Unable to get active conferences");
            return StatusCode(e.StatusCode, e.Response);
        }
    }
}
