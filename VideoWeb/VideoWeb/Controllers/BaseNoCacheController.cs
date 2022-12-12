using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Net.Http.Headers;

namespace VideoWeb.Controllers;

public class BaseNoCacheController : Controller
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        context.HttpContext.Request.Headers[HeaderNames.CacheControl] = "no-store";
        
        base.OnActionExecuting(context);
    }
}
