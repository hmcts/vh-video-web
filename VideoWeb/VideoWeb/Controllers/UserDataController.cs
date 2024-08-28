using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VideoWeb.Common.Models;

namespace VideoWeb.Controllers;

[Produces("application/json")]
[Route("api/accounts")]
[ApiController]
[Authorize(AppRoles.VhOfficerRole)]
public class UserDataController(IBookingsApiClient bookingApiClient) : ControllerBase
{
    /// <summary>
    ///Get CSOS
    /// </summary>
    [HttpGet("csos", Name = "GetCSOs")]
    [ProducesResponseType(typeof(IList<JusticeUserResponse>), (int)HttpStatusCode.OK)]
    public async Task<ActionResult<IList<JusticeUserResponse>>> GetJusticeUsers() =>Ok(await bookingApiClient.GetJusticeUserListAsync(string.Empty, null));
}
