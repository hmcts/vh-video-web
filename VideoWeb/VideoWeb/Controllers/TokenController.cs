using System;
using System.Globalization;
using System.Net;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Common.Security;
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
        private readonly ICustomJwtTokenProvider _customJwtTokenProvider;

        public TokenController(IHashGenerator hashGenerator, ICustomJwtTokenProvider customJwtTokenProvider)
        {
            _hashGenerator = hashGenerator;
            _customJwtTokenProvider = customJwtTokenProvider;
        }

        [HttpGet("{participantId}/token")]
        [SwaggerOperation(OperationId = "GetToken")]
        [ProducesResponseType(typeof(TokenResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public IActionResult GetToken(Guid participantId)
        {
            if (participantId == Guid.Empty)
            {
                ModelState.AddModelError(nameof(participantId), $"Please provide a valid {nameof(participantId)}");
                return BadRequest(ModelState);
            }

            var expiresOn = DateTime.UtcNow.AddMinutes(20).ToUniversalTime().ToString("dd.MM.yyyy-H:mmZ");
            var token = _hashGenerator.GenerateHash(expiresOn, participantId.ToString());
            var tokenResponse = new TokenResponse {ExpiresOn = expiresOn, Token = token};
            return Ok(tokenResponse);
        }

        [HttpGet("{participantId}/jwtoken")]
        [SwaggerOperation(OperationId = "GetJwtoken")]
        [ProducesResponseType(typeof(TokenResponse), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public IActionResult GetJwToken(Guid participantId)
        {
            if (participantId == Guid.Empty)
            {
                ModelState.AddModelError(nameof(participantId), $"Please provide a valid {nameof(participantId)}");
                return BadRequest(ModelState);
            }

            var expiresOn = DateTime.UtcNow.AddMinutes(180).ToUniversalTime().ToString(CultureInfo.InvariantCulture);
            var token = _customJwtTokenProvider.GenerateToken(participantId.ToString(), 240);
            var tokenResponse = new TokenResponse {ExpiresOn = expiresOn, Token = token};
            return Ok(tokenResponse);
        }
    }
}