using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Handlers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using Endpoint = VideoWeb.Common.Models.Endpoint;

namespace VideoWeb.UnitTests.Controllers.InternalEventControllerTests
{
    public class AllocationHearingsTests
    {
        private AutoMock _mocker;
        protected InternalEventController _controller;

        Mock<Conference> mockConference;
        
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

            _controller = _mocker.Create<InternalEventController>();
            _controller.ControllerContext = context;

            _mocker.Mock<IAllocationHearingsEventNotifier>();
        }


        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var allocatedHearingsDetails = new List<HearingDetailRequest>();
            var allocationHearingsToCsoRequest = new AllocationHearingsToCsoRequest()
            {
                Hearings = allocatedHearingsDetails,
                AllocatedCsoUserName = "csousername@email.com"
            };
            

            // Act
            var result = await _controller.AllocationHearings(allocationHearingsToCsoRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IAllocationHearingsEventNotifier>().Verify(x => x.PushAllocationHearingsEvent("csousername@email.com", allocatedHearingsDetails), Times.Once);
        }
        
        [Test]
        public async Task Should_not_send_event_if_exception_throwed()
        {
            _mocker.Mock<IAllocationHearingsEventNotifier>().Setup(x =>
                    x.PushAllocationHearingsEvent("csousername@email.com", new List<HearingDetailRequest>()))
                .Throws(new VideoApiException("error", StatusCodes.Status500InternalServerError, "", null, null));
            // Arrange
            var allocatedHearingsDetails = new List<HearingDetailRequest>();
            var allocationHearingsToCsoRequest = new AllocationHearingsToCsoRequest()
            {
                Hearings = allocatedHearingsDetails,
                AllocatedCsoUserName = "csousername@email.com"
            };
            

            // Act
            var result = await _controller.AllocationHearings(allocationHearingsToCsoRequest);

            // Assert
            result.Should().BeOfType<ObjectResult>();

            _mocker.Mock<IAllocationHearingsEventNotifier>().Verify(x => x.PushAllocationHearingsEvent("csousername@email.com", allocatedHearingsDetails), Times.Once);
        }
    }
}
