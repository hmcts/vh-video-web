using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.User;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [Route("api/accounts")]
    [ApiController]
    public class UserDataController : ControllerBase
    {
        private readonly IUserApiClient _userApiClient;
        private readonly ILogger<UserDataController> _logger;

        public UserDataController(IUserApiClient userApiClient, ILogger<UserDataController> logger)
        {
            _userApiClient = userApiClient;
            _logger = logger;
        }

        /// <summary>
        /// Get Court rooms accounts (judges)
        /// </summary>
        [HttpGet("courtrooms", Name = "GetCourtRoomAccounts")]
        [ProducesResponseType(typeof(IList<CourtRoomsAccountResponse>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<IList<CourtRoomsAccountResponse>>> GetCourtRoomsAccounts([FromQuery]VhoConferenceFilterQuery query)
        {
            try
            {
                var response = await _userApiClient.GetJudgesAsync();

                var accountList = response.Where(x => query.UserNames.Any(s => x.First_name == s))
                    .Select(s => new { first_name = s.First_name, last_name = s.Last_name })
                    .GroupBy(x => x.first_name)
                    .Select(s => new CourtRoomsAccountResponse(s.Key, s.Select(g => g.last_name).OrderBy(o => o).ToList()))
                    .OrderBy(s => s.Venue)
                    .ToList();

                return Ok(accountList);
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, "Unable to get list of court rooms accounts");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}
