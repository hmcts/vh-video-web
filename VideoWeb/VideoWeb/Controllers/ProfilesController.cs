using System;
using System.Net;
using System.Security.Claims;
using System.Threading;
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
    public class ProfilesController(ILogger<ProfilesController> logger, IUserProfileService userProfileService) : ControllerBase
    {
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
                return Ok(ClaimsPrincipalToUserProfileResponseMapper.Map(User));
            }
            catch (Exception e)
            {
                const string message = "User does not have permission";
                logger.LogError(e, message);
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
        public async Task<IActionResult> GetProfileByUsernameAsync([FromQuery] string username, CancellationToken cancellationToken)
        {
            var usernameClean = username.ToLower().Trim();

            var userProfile = await userProfileService.GetUserAsync(usernameClean, cancellationToken);
            if (userProfile == null) return NotFound();

            var response = UserProfileToUserProfileResponseMapper.Map(userProfile);

            return Ok(response);

        }
    }
}
