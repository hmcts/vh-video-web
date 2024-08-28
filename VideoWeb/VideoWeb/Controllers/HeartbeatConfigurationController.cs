using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Controllers
{
    [ApiController]
    [Produces("application/json")]
    [Route("heartbeat")]
    public class HeartbeatConfigurationController : ControllerBase
    {
        private readonly ISupplierPlatformServiceFactory _supplierPlatformServiceFactory;
        private readonly IConferenceService _conferenceService;
        
        public HeartbeatConfigurationController(ISupplierPlatformServiceFactory supplierPlatformServiceFactory, 
            IConferenceService conferenceService)
        {
            _supplierPlatformServiceFactory = supplierPlatformServiceFactory;
            _conferenceService = conferenceService;
        }
        
        [HttpGet("conferences/{conferenceId}/GetHeartbeatConfigForParticipant/{participantId}")]
        [SwaggerOperation(OperationId = "GetHeartbeatConfigForParticipant")]
        [ProducesResponseType(typeof(HeartbeatConfigurationResponse), (int) HttpStatusCode.OK)]
        [ProducesResponseType((int) HttpStatusCode.BadRequest)]
        public async Task<IActionResult> GetConfigurationForParticipant(Guid conferenceId, Guid participantId)
        {
            if (participantId == Guid.Empty)
            {
                ModelState.AddModelError(nameof(participantId), $"Please provide a valid {nameof(participantId)}");
                return BadRequest(ModelState);
            }

            var conference = await _conferenceService.GetConference(conferenceId);
            var supplierPlatformService = _supplierPlatformServiceFactory.Create(conference.Supplier);
            var customJwtTokenProvider = supplierPlatformService.GetTokenProvider();
            var supplierConfiguration = supplierPlatformService.GetSupplierConfiguration();

            var token = customJwtTokenProvider.GenerateToken(participantId.ToString(), supplierConfiguration.ExpiresInMinutes);
            var heartbeatConfig = new HeartbeatConfigurationResponse
            {
                HeartbeatUrlBase = supplierConfiguration.HeartbeatUrlBase,
                HeartbeatJwt = token
            };
            
            return Ok(heartbeatConfig);
        }
    }
}
