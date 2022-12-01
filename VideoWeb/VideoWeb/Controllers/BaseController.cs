using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Net.Http.Headers;

namespace VideoWeb.Controllers;

public class BaseController : Controller
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        context.HttpContext.Response.Headers[HeaderNames.CacheControl] = "no-cache, no-store, must-revalidate";
        context.HttpContext.Response.Headers[HeaderNames.Expires] = "0";
        context.HttpContext.Response.Headers[HeaderNames.Pragma] = "no-cache";
        base.OnActionExecuting(context);
    }
}
