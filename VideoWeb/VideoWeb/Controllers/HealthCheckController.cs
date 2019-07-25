using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Services;
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
        private readonly IEventsServiceClient _eventsServiceClient;

        public HealthCheckController(IVideoApiClient videoApiClient, IUserApiClient userApiClient,
            IBookingsApiClient bookingsApiClient, IEventsServiceClient eventsServiceClient)
        {
            _videoApiClient = videoApiClient;
            _userApiClient = userApiClient;
            _bookingsApiClient = bookingsApiClient;
            _eventsServiceClient = eventsServiceClient;
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
                VideoApiHealth = {Successful = true},
                EventsCallbackHealth = {Successful = true}
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

                if (((VideoApiException) ex).StatusCode == (int) HttpStatusCode.InternalServerError)
                {
                    response.VideoApiHealth.Successful = false;
                    response.VideoApiHealth.ErrorMessage = ex.Message;
                    response.VideoApiHealth.Data = ex.Data;
                }
            }

            try
            {
                var conferenceEvent = new ConferenceEventRequest
                {
                    Conference_id = string.Empty,
                    Event_id = string.Empty,
                    Event_type = EventType.None,
                    Participant_id = string.Empty,
                    Reason = "Video-Web Health Check",
                    Time_stamp_utc = null,
                    Transfer_from = null,
                    Transfer_to = null
                };
                await _eventsServiceClient.PostEventsAsync(conferenceEvent);
            }
            catch (Exception ex)
            {
                if (!(ex is VideoApiException))
                {
                    response.EventsCallbackHealth.Successful = false;
                    response.EventsCallbackHealth.ErrorMessage = ex.Message;
                    response.EventsCallbackHealth.Data = ex.Data;
                }

                if (((VideoApiException) ex).StatusCode == (int) HttpStatusCode.InternalServerError)
                {
                    response.EventsCallbackHealth.Successful = false;
                    response.EventsCallbackHealth.ErrorMessage = ex.Message;
                    response.EventsCallbackHealth.Data = ex.Data;
                }
            }


            if (!response.UserApiHealth.Successful || !response.BookingsApiHealth.Successful ||
                !response.VideoApiHealth.Successful || !response.EventsCallbackHealth.Successful)
            {
                return StatusCode((int) HttpStatusCode.InternalServerError, response);
            }

            return Ok(response);
        }
    }
}