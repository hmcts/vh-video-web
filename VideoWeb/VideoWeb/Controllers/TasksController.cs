using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("conferences")]
    public class TasksController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;

        public TasksController(IVideoApiClient videoApiClient)
        {
            _videoApiClient = videoApiClient;
        }

        [HttpGet("{conferenceId}/tasks")]
        [SwaggerOperation(OperationId = "GetTasks")]
        [ProducesResponseType(typeof(List<TaskResponse>), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> GetTasks(Guid conferenceId)
        {
            try
            {
                var tasks = await _videoApiClient.GetTasksForConferenceAsync(conferenceId);
                return Ok(tasks);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }
        }
    }
}