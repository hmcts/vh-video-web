using System;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Security;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Common.Security.Tokens.Base;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Controllers
{
    [ApiController]
    [Produces("application/json")]
    [Route("heartbeat")]
    public class HeartbeatConfigurationController : ControllerBase
    {
        private readonly IJwtTokenProvider _customJwtTokenProvider;
        private readonly SupplierConfiguration _supplierConfiguration;
        
        public HeartbeatConfigurationController(ISupplierLocator supplierLocator)
        {
            _customJwtTokenProvider = supplierLocator.GetTokenProvider();
            _supplierConfiguration = supplierLocator.GetSupplierConfiguration().Value;
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
            
            var token = _customJwtTokenProvider.GenerateToken(participantId.ToString(), _supplierConfiguration.ExpiresInMinutes);
            var heartbeatConfig = new HeartbeatConfigurationResponse
            {
                HeartbeatUrlBase = _supplierConfiguration.HeartbeatUrlBase,
                HeartbeatJwt = token
            };
            
            return Ok(heartbeatConfig);
        }
    }
}
