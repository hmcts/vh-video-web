using System;
using System.Globalization;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Controllers
{
    [ApiController]
    [Produces("application/json")]
    [Route("heartbeat")]
    public class HeartbeatConfigurationController : ControllerBase
    {
        private readonly ICustomJwtTokenProvider _customJwtTokenProvider;
        private readonly KinlyConfiguration _kinlyConfiguration;
        
        public HeartbeatConfigurationController(ICustomJwtTokenProvider customJwtTokenProvider,
            IOptions<KinlyConfiguration> kinlyConfiguration)
        {
            _customJwtTokenProvider = customJwtTokenProvider;
            _kinlyConfiguration = kinlyConfiguration.Value;
        }
        
        [HttpGet("GetHeartbeatConfigForParticipant/{participantId}")]
        [SwaggerOperation(OperationId = "GetHeartbeatConfigForParticipant")]
        [ProducesResponseType(typeof(HeartbeatConfigurationResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public IActionResult GetConfigurationForParticipant(Guid participantId)
        {
            if (participantId == Guid.Empty)
            {
                ModelState.AddModelError(nameof(participantId), $"Please provide a valid {nameof(participantId)}");
                return BadRequest(ModelState);
            }
            
            var token = _customJwtTokenProvider.GenerateToken(participantId.ToString(), _kinlyConfiguration.ExpiresInMinutes);
            var heartbeatConfig = new HeartbeatConfigurationResponse()
            {
                HeartbeatUrlBase = _kinlyConfiguration.HeartbeatUrlBase,
                HeartbeatJwt = token
            };
            
            return Ok(heartbeatConfig);
        }
    }
}
