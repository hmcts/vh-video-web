using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoApi.Client;
using VideoWeb.Common;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers.Sorting;
using VideoWeb.Mappings;
using VideoWeb.Common.Logging;

namespace VideoWeb.Controllers;

[Consumes("application/json")]
[Produces("application/json")]
[Route("end-of-day")]
[ApiController]
public class EndOfDayController(
    IVideoApiClient videoApiClient,
    IConferenceService conferenceService,
    ILogger<EndOfDayController> logger)
    : ControllerBase
{
    /// <summary>
    /// Get all active conferences.
    /// This includes conferences that are in progress or paused.
    /// This includes conferences that are closed but the participants are still in consultation.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [HttpGet("active-sessions")]
    [SwaggerOperation(OperationId = "GetActiveConferences")]
    [ProducesResponseType(typeof(List<ConferenceForVhOfficerResponse>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<List<ConferenceForVhOfficerResponse>>> GetActiveConferences(CancellationToken cancellationToken)

    {
        logger.LogGettingActiveConferences();
        try
        {
            var activeConferences = await videoApiClient.GetActiveConferencesAsync(cancellationToken);
            var retrieveCachedConferencesTask = conferenceService.GetConferences(activeConferences.Select(e => e.Id), cancellationToken);
            var conferences = await retrieveCachedConferencesTask;
            var response = conferences
                .Select(ConferenceForVhOfficerResponseMapper.Map).ToList();
            response.Sort(new SortConferenceForVhoOfficerHelper());
            return Ok(response);
        }
        catch (VideoApiException e)
        {
            if (e.StatusCode == (int)HttpStatusCode.NotFound)
            {
                return Ok(new List<ConferenceForVhOfficerResponse>());
            }

            logger.LogUnableToGetActiveConferences(e);
            return StatusCode(e.StatusCode, e.Response);
        }
    }
}
