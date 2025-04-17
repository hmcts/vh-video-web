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
using VideoWeb.Common.Logging;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("hearing-venues")]
    [Authorize(AppRoles.VenueManagementRole)]
    public class VenuesController(ILogger<VenuesController> logger, IReferenceDataService referenceDataService)
        : ControllerBase
    {
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
            logger.LogGetVenues();

            var response = await referenceDataService.GetHearingVenuesForTodayAsync(cancellationToken);
            return Ok(response);
        }
    }
}
