using System;
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
namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("hearing-venues")]
    [Authorize(AppRoles.VenueManagementRole)]
    public class VenuesController : Controller
    {
        private readonly ILogger<VenuesController> _logger;
        private readonly IBookingsApiClient _bookingsApiClient;


        public VenuesController(ILogger<VenuesController> logger, IBookingsApiClient bookingsApiClient)
        {
            _logger = logger;
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        ///     Get available courts
        /// </summary>
        /// <returns>List of courts</returns>
        [HttpGet("courts", Name = "GetCourts")]
        [ProducesResponseType(typeof(IList<HearingVenueResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetVenues")]
        public async Task<ActionResult<IList<HearingVenueResponse>>> GetVenues()
        {
            _logger.LogDebug("GetVenues");
            try
            {
                var response = await _bookingsApiClient.GetHearingVenuesAsync();
                return Ok(response);
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Unable to retrieve venues");
                return NotFound();
            }
        }
        
        /// <summary>
        /// Get Hearing Venue Names By Cso
        /// </summary>
        /// <returns>Hearing Venue Names</returns>
        [Authorize(AppRoles.VhOfficerRole)]
        [HttpGet("allocated-cso", Name = "GetVenuesByAllocatedCso")]
        [ProducesResponseType(typeof(IList<string>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<string>>> GetVenuesByCso(
            [FromQuery] Guid[] csos,
            [FromQuery] bool includeUnallocated = false)
        {
            try
            {
                return Ok(await _bookingsApiClient.GetHearingVenuesByAllocatedCsoAsync(csos, includeUnallocated));
            }
            catch (BookingsApiException e)
            {
                _logger.LogError(e, "Unable to get venues with allocated csos");
                if (e.StatusCode is (int)HttpStatusCode.NotFound)
                    return Ok(new List<string>());
                
                return StatusCode(e.StatusCode, e.Message);
            }
        }
    }
}
