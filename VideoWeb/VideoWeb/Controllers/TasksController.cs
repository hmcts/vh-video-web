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
        [SwaggerOperation(OperationId = "GetPendingTasks")]
        [ProducesResponseType(typeof(List<TaskResponse>), (int) HttpStatusCode.OK)]
        public async Task<IActionResult> GetPendingTasks(Guid conferenceId)
        {
            try
            {
                var pendingTasks = await _videoApiClient.GetPendingTasksAsync(conferenceId);
                return Ok(pendingTasks);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }
        }
    }
}