using System.Collections.Generic;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Models;
using VideoWeb.Services;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("hearing-venues")]
    [Authorize(AppRoles.VenueManagementRole)]
    public class VenuesController : ControllerBase
    {
        private readonly ILogger<VenuesController> _logger;
        private readonly IReferenceDataService _referenceDataService;
        
        public VenuesController(ILogger<VenuesController> logger,
            IReferenceDataService referenceDataService)
        {
            _logger = logger;
            _referenceDataService = referenceDataService;
        }
        
        /// <summary>
        ///     Get available courts
        /// </summary>
        /// <returns>List of courts</returns>
        [HttpGet("courts", Name = "GetCourts")]
        [ProducesResponseType(typeof(IList<HearingVenueResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [SwaggerOperation(OperationId = "GetVenues")]
        public async Task<ActionResult<IList<HearingVenueResponse>>> GetVenues(CancellationToken cancellationToken)
        {
            _logger.LogDebug("GetVenues");

            var response = await _referenceDataService.GetHearingVenuesForTodayAsync(cancellationToken);
            return Ok(response);
        }
    }
}
