using System;
using System.Net;
using System.Reflection;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Security.HashGen;
using VideoWeb.Contract.Responses;

namespace VideoWeb.Controllers
{
    [Produces("application/json")]
    [ApiController]
    [Route("participants")]
    public class TokenController : ControllerBase
    {
        private readonly IHashGenerator _hashGenerator;
        private readonly VodafoneConfiguration _supplierConfiguration;

        public TokenController(IHashGenerator hashGenerator,
            VodafoneConfiguration supplierConfiguration)
        {
            _hashGenerator = hashGenerator;
            _supplierConfiguration = supplierConfiguration;
        }

        [HttpGet("{participantId}/selftesttoken")]
        [SwaggerOperation(OperationId = "GetSelfTestToken")]
        [ProducesResponseType(typeof(TokenResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public IActionResult GetSelfTestToken(Guid participantId)
        {
            if (participantId == Guid.Empty)
            {
                ModelState.AddModelError(nameof(participantId), $"Please provide a valid {nameof(participantId)}");
                return BadRequest(ModelState);
            }

            var expiresOn = DateTime.UtcNow.AddMinutes(_supplierConfiguration.HashExpiresInMinutes).ToUniversalTime().ToString("dd.MM.yyyy-H:mmZ");
            var token = _hashGenerator.GenerateSelfTestTokenHash(expiresOn, participantId.ToString());
            var tokenResponse = new TokenResponse { ExpiresOn = expiresOn, Token = token };
            return Ok(tokenResponse);
        }
    }
}
