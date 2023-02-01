using System.Collections.Generic;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Net.Http.Headers;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers;

public class BaseNoCacheTest
{

    [Test]
    public void Adding_To_Headers_No_Cache_Values()
    {
        var controller = new BaseNoCacheController();

        var httpContext = new DefaultHttpContext();

        var actionContext = new ActionContext(
            httpContext,
            Mock.Of<RouteData>(),
            Mock.Of<ActionDescriptor>()
        );
        
        var actionExecutingContext = new ActionExecutingContext(
            actionContext, 
            new List<IFilterMetadata>(),
            new Dictionary<string, object>(),
            Mock.Of<Controller>()
        );
        
        controller.OnActionExecuting(actionExecutingContext);
        
        actionExecutingContext.HttpContext.Request.Headers[HeaderNames.CacheControl].Should().Contain("no-store");
    }
    
    
    
}
