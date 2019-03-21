using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class ConferencesController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;
        public ConferencesController(IVideoApiClient videoApiClient)
        {
            _videoApiClient = videoApiClient;
        }
        
        /// <summary>
        /// Get conferences for user
        /// </summary>
        /// <returns>List of conferences, if any</returns>
        [HttpGet]
        [ProducesResponseType(typeof(List<ConferenceForUserResponse>), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        [SwaggerOperation(OperationId = "GetConferencesForUser")]
        public async Task<ActionResult<List<ConferenceForUserResponse>>> GetConferencesForUser()
        {
            var username = User.Identity.Name;
            try
            {
                var conferences = await _videoApiClient.GetConferencesForUsernameAsync(username);
                var mapper = new ConferenceForUserResponseMapper();
                var response = conferences.Select(x => mapper.MapConferenceSummaryToResponseModel(x)).ToList();
                return Ok(response);
            }
            catch (VideoApiException e)
            {
                switch (e.StatusCode)
                {
                    case (int) HttpStatusCode.Unauthorized:
                        return Forbid();
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(e.Response);
                    default:
                        throw;
                }
            }
        }
    }
}