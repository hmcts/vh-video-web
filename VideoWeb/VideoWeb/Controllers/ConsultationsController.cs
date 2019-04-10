using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Requests;
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
        ///     Request a private consultation
        /// </summary>
        /// <param name="request">The requester and requestee to whom to ask to consult with</param>
        /// <returns></returns>
        [HttpPost("request")]
        [SwaggerOperation(OperationId = "RequestConsultation")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> RequestConsultation(PrivateConsultationRequest request)
        {
            try
            {
                await _videoApiClient.HandleConsultationRequestAsync(new ConsultationRequest
                {
                    Conference_id = request.ConferenceId,
                    Requested_by = request.RequestBy,
                    Requested_for = request.RequestFor,
                    Answer = null
                });
                return NoContent();
            }
            catch (VideoApiException e)
            {
                switch (e.StatusCode)
                {
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(e.Response);
                    default:
                        return StatusCode((int) HttpStatusCode.InternalServerError, e);
                }
            }
        }
        
        /// <summary>
        ///     Response to a private consultation
        /// </summary>
        /// <param name="request">The requester and requestee to whom to ask to consult with an answer</param>
        /// <returns></returns>
        [HttpPost("respond")]
        [SwaggerOperation(OperationId = "RespondToConsultationRequest")]
        [ProducesResponseType((int) HttpStatusCode.NoContent)]
        [ProducesResponseType(typeof(string), (int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> RespondToConsultationRequest(PrivateConsultationAnswerRequest request)
        {
            try
            {
                Enum.TryParse<ConsultationAnswer>(request.Answer.ToString(), out var answer);
                await _videoApiClient.HandleConsultationRequestAsync(new ConsultationRequest
                {
                    Conference_id = request.ConferenceId,
                    Requested_by = request.RequestBy,
                    Requested_for = request.RequestFor, 
                    Answer = answer
                });
                return NoContent();
            }
            catch (VideoApiException e)
            {
                switch (e.StatusCode)
                {
                    case (int) HttpStatusCode.BadRequest:
                        return BadRequest(e.Response);
                    default:
                        return StatusCode((int) HttpStatusCode.InternalServerError, e);
                }
            }
        }
    }
}