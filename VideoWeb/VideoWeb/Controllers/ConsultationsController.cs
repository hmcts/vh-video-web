using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Services.Video;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("consultations")]
    public class ConsultationsController : Controller
    {
        private readonly IVideoApiClient _videoApiClient;

        public ConsultationsController(IVideoApiClient videoApiClient)
        {
            _videoApiClient = videoApiClient;
        }
        
        /// <summary>
        /// Raise or answer to a private consultation request with another participant
        /// </summary>
        /// <param name="request">Private consultation request with or without an answer</param>
        /// <returns></returns>
        [HttpPost]
        [SwaggerOperation(OperationId = "HandleConsultationRequest")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> HandleConsultationRequest(ConsultationRequest request)
        {
            try
            {
                await _videoApiClient.HandleConsultationRequestAsync(request);
                return NoContent();
            }
            catch (VideoApiException e)
            {
                return StatusCode(e.StatusCode, e);
            }
        }
    }
}