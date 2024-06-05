using System;
using System.Security.Claims;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.Common;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class CallVideoEndpointTests
    {
        private AutoMock _mocker;
        private ConferenceDto _testConferenceDto;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
           

            _testConferenceDto = ConsultationHelper.BuildConferenceForTest();

            var eventHubContextMock = _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>();
            var eventHubClientMock = _mocker.Mock<IEventHubClient>();
            foreach (var participant in _testConferenceDto.Participants)
            {
                eventHubContextMock.Setup(x => x.Clients.Group(participant.Username.ToLowerInvariant()))
                    .Returns(eventHubClientMock.Object);
            }

            eventHubContextMock.Setup(x => x.Clients.Group(EventHub.Hub.EventHub.VhOfficersGroupName))
                .Returns(eventHubClientMock.Object);
            
            _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == _testConferenceDto.Id))).ReturnsAsync(_testConferenceDto);

            SetupControllerWithClaims(null);
        }
        
        private void SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var cp = claimsPrincipal ?? new ClaimsPrincipalBuilder().WithRole(AppRoles.RepresentativeRole)
                .WithUsername("rep1@hmcts.net").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = cp
                }
            };

            var controller = _mocker.Create<ConsultationsController>();
            controller.ControllerContext = context;
        }
    }
}
