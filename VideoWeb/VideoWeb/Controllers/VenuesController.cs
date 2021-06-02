using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoApi.Client;
using VideoApi.Contract.Responses;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("hearing-venues")]
    [Authorize(AppRoles.VhOfficerRole)]
    public class VenuesController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly ILogger<VenuesController> _logger;
        private readonly IBookingsApiClient _bookingsApiClient;


        public VenuesController(IVideoApiClient videoApiClient, ILogger<VenuesController> logger, IBookingsApiClient bookingsApiClient)
        {
            _videoApiClient = videoApiClient;
            _logger = logger;
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// Get Judge names
        /// </summary>
        /// <returns>List of judges with hearing scheduled, if any</returns>
        [HttpGet]
        [ProducesResponseType(typeof(JudgeNameListResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetDistinctJudgeNames")]
        public async Task<ActionResult<JudgeNameListResponse>> GetDistinctJudgeNamesAsync()
        {
            _logger.LogDebug("GetDistinctJudgeNames");
            try
            {
                var judges = await _videoApiClient.GetDistinctJudgeNamesAsync();

                return Ok(judges);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to retrieve judge names");
                return NotFound();
            }
        }
        /// <summary>
        ///     Get available courts
        /// </summary>
        /// <returns>List of courts</returns>
        [HttpGet("courts", Name = "GetCourts")]
        [ProducesResponseType(typeof(IList<HearingVenueResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetVenues ")]
        public async Task<ActionResult<IList<HearingVenueResponse>>> GetCourts()
        {
            _logger.LogDebug("GetVenues");
            try
            {
                var response = await _bookingsApiClient.GetHearingVenuesAsync();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                _logger.LogError(e, "Unable to retrieve venues");
                return NotFound();
            }
        }
    }
}
