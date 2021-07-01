using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using Endpoint = VideoWeb.Common.Models.Endpoint;

namespace VideoWeb.UnitTests.Controllers.VideoEventController
{
    public class InternalEventControllerTests
    {
        protected InternalEventController controller;
        
    }
}
