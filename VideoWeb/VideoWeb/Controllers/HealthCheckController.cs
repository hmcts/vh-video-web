using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Services.Bookings;
using VideoWeb.Services.User;
using VideoWeb.Services.Video;
using HealthCheckResponse = VideoWeb.Contract.Responses.HealthCheckResponse;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [Route("HealthCheck")]
    [AllowAnonymous]
    [ApiController]
    public class HealthCheckController : ControllerBase
    {
        private readonly IVideoApiClient _videoApiClient;
        private readonly IUserApiClient _userApiClient;
        private readonly IBookingsApiClient _bookingsApiClient;

        public HealthCheckController(IVideoApiClient videoApiClient, IUserApiClient userApiClient,
            IBookingsApiClient bookingsApiClient)
        {
            _videoApiClient = videoApiClient;
            _userApiClient = userApiClient;
            _bookingsApiClient = bookingsApiClient;
        }

        /// <summary>
        /// Check Service Health
        /// </summary>
        /// <returns>Error if fails, otherwise OK status</returns>
        [HttpGet("health")]
        [SwaggerOperation(OperationId = "CheckServiceHealth")]
        [ProducesResponseType(typeof(HealthCheckResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType(typeof(HealthCheckResponse), (int) HttpStatusCode.InternalServerError)]
        public async Task<IActionResult> Health()
        {
            var response = new HealthCheckResponse
            {
                BookingsApiHealth = {Successful = true},
                UserApiHealth = {Successful = true},
                VideoApiHealth = {Successful = true}
            };
            try
            {
                await _userApiClient.GetJudgesAsync();
            }
            catch (Exception ex)
            {
                if (!(ex is UserApiException))
                {
                    response.UserApiHealth.Successful = false;
                    response.UserApiHealth.ErrorMessage = ex.Message;
                    response.UserApiHealth.Data = ex.Data;
                }
            }

            try
            {
                await _bookingsApiClient.GetCaseTypesAsync();
            }
            catch (Exception ex)
            {
                if (!(ex is BookingsApiException))
                {
                    response.BookingsApiHealth.Successful = false;
                    response.BookingsApiHealth.ErrorMessage = ex.Message;
                    response.BookingsApiHealth.Data = ex.Data;
                }
            }

            try
            {
                await _videoApiClient.GetConferencesTodayAsync();
            }
            catch (Exception ex)
            {
                if (!(ex is VideoApiException))
                {
                    response.VideoApiHealth.Successful = false;
                    response.VideoApiHealth.ErrorMessage = ex.Message;
                    response.VideoApiHealth.Data = ex.Data;
                }
            }


            if (!response.UserApiHealth.Successful || !response.BookingsApiHealth.Successful ||
                !response.VideoApiHealth.Successful)
            {
                return StatusCode((int) HttpStatusCode.InternalServerError, response);
            }

            return Ok(response);
        }
    }
}