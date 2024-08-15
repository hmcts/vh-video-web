using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[ApiController]
[Route("api/reference-data")]
public class ReferenceDataController(IReferenceDataService referenceDataService) : ControllerBase
{
    /// <summary>
    ///     Get available interpreter languages
    /// </summary>
    /// <returns>List of interpreter languages</returns>
    [HttpGet("interpreter-languages", Name = "GetAvailableInterpreterLanguages")]
    [ProducesResponseType(typeof(List<InterpreterLanguageResponse>), (int)HttpStatusCode.OK)]
    [SwaggerOperation(OperationId = "GetAvailableInterpreterLanguages")]
    public async Task<ActionResult<List<InterpreterLanguageResponse>>> GetAvailableInterpreterLanguages(CancellationToken cancellationToken)
    {
        var languages = await referenceDataService.GetInterpreterLanguagesAsync(cancellationToken);
        return Ok(languages.Select(x =>x.Map()).ToList());
    }
}
