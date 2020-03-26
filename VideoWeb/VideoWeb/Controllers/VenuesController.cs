using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Services.Bookings;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("hearings-venues")]
    public class VenuesController : Controller
    {
        private readonly IBookingsApiClient _bookingsApiClient;
        private readonly ILogger<VenuesController> _logger;

        public VenuesController(IBookingsApiClient bookingsApiClient, ILogger<VenuesController> logger)
        {
            _bookingsApiClient = bookingsApiClient;
            _logger = logger;
        }

        /// <summary>
        /// Get hearings venues
        /// </summary>
        /// <returns>List of hearings venue, if any</returns>
        [HttpGet]
        [ProducesResponseType(typeof(List<HearingVenueResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetHearingsVenues")]
        public async Task<ActionResult<List<HearingVenueResponse>>> GetHearingsVenuesAsync()
        {
            _logger.LogDebug("GetHearingsVenues");
            try
            {
                var venues = await _bookingsApiClient.GetHearingVenuesAsync();
                return Ok(venues);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Unable to retrieve hearings venues");
                return NotFound();
            }
        }

    }
}
