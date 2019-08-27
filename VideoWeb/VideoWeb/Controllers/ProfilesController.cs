using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.User;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("profile")]
    public class ProfilesController : Controller
    {
        private readonly IUserApiClient _userApiClient;
        private readonly ILogger<ProfilesController> _logger;

        public ProfilesController(IUserApiClient userApiClient, ILogger<ProfilesController> logger)
        {
            _userApiClient = userApiClient;
            _logger = logger;
        }

        [HttpGet]
        [SwaggerOperation(OperationId = "GetUserProfile")]
        [ProducesResponseType(typeof(UserProfileResponse) ,(int) HttpStatusCode.OK)]
        public async Task<IActionResult> GetUserProfile()
        {
            var username = User.Identity.Name.ToLower().Trim();
            try
            {
                var profile = await _userApiClient.GetUserByAdUserNameAsync(username);
                var response = new UserProfileResponseMapper().MapToResponseModel(profile);
                return Ok(response);         
            }
            catch (UserApiException e)
            {
                _logger.LogError(e, "Unable to get user profile");
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}