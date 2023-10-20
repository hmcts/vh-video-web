using System;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("profile")]
    public class ProfilesController : Controller
    {
        private readonly ILogger<ProfilesController> _logger;
        private readonly IMapperFactory _mapperFactory;
        private readonly IUserProfileService _userProfileService;

        public ProfilesController(
            ILogger<ProfilesController> logger,
            IMapperFactory mapperFactory, IUserProfileService userProfileService)
        {
            _logger = logger;
            _mapperFactory = mapperFactory;
            _userProfileService = userProfileService;
        }

        /// <summary>
        /// Get profile for logged in user
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [SwaggerOperation(OperationId = "GetUserProfile")]
        [ProducesResponseType(typeof(UserProfileResponse), (int) HttpStatusCode.OK)]
        public IActionResult GetUserProfile()
        {
            try
            {
                var claimsPrincipalToUserProfileResponseMapper =
                    _mapperFactory.Get<ClaimsPrincipal, UserProfileResponse>();
                var response = claimsPrincipalToUserProfileResponseMapper.Map(User);
                return Ok(response);
            }
            catch (Exception e)
            {
                const string message = "User does not have permission";
                _logger.LogError(e, message);
                return Unauthorized(message);
            }
        }

        /// <summary>
        /// Get profile for username
        /// </summary>
        /// <param name="username"></param>
        /// <returns></returns>
        [HttpGet("query")]
        [SwaggerOperation(OperationId = "GetProfileByUsername")]
        [ProducesResponseType(typeof(UserProfileResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        public async Task<IActionResult> GetProfileByUsernameAsync([FromQuery] string username)
        {
            var usernameClean = username.ToLower().Trim();

            var userProfile = await _userProfileService.GetUserAsync(usernameClean);
            if (userProfile == null) return NotFound();

            var userProfileToUserProfileResponseMapper = _mapperFactory.Get<UserProfile, UserProfileResponse>();
            var response = userProfileToUserProfileResponseMapper.Map(userProfile);

            return Ok(response);

        }
    }
}
