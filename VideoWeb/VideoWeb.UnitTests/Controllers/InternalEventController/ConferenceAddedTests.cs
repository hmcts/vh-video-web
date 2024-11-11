using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers.InternalEventControllers;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController;

public class ConferenceAddedTests
{
    private AutoMock _mocker;
    private InternalEventConferenceController _conferenceController;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole("Judge").Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
        
        _conferenceController = _mocker.Create<InternalEventConferenceController>();
        _conferenceController.ControllerContext = context;
        
        _mocker.Mock<INewConferenceAddedEventNotifier>();
    }
    
    [Test]
    public async Task Sends_Event_For_New_Conference_Added()
    {
        var conferenceId = Guid.NewGuid();
        
        var result = await _conferenceController.ConferenceAdded(conferenceId);
        
        result.Should().BeOfType<NoContentResult>();
        
        _mocker.Mock<INewConferenceAddedEventNotifier>().Verify(x => x.PushNewConferenceAddedEvent(conferenceId), Times.Once);
    }
}
