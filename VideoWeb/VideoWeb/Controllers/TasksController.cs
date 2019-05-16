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

        /// <summary>
        /// Update existing tasks
        /// </summary>
        /// <param name="conferenceId">The id of the conference to update</param>
        /// <param name="taskId">The id of the task to update</param>
        /// <returns></returns>
        [HttpPatch("{conferenceId}/tasks/{taskId}")]
        [SwaggerOperation(OperationId = "CompleteTask")]
        [ProducesResponseType(typeof(TaskResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.NotFound)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> CompleteTask([FromRoute]Guid conferenceId, [FromRoute]long taskId)
        {
            var username = User.Identity.Name.ToLower().Trim();
            try
            {
                var request = new UpdateTaskRequest
                {
                    Updated_by = username
                };
                var updatedTask = await _videoApiClient.UpdateTaskStatusAsync(conferenceId, taskId, request);
                return Ok(updatedTask);
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e.Response);
            }
        }
    }
}