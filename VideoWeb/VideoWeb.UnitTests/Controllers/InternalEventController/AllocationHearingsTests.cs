using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers.InternalEventControllers;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventController
{
    public class AllocationHearingsTests
    {
        private AutoMock _mocker;
        private InternalEventAllocationController _allocationController;
        private List<ConferenceDetailsResponse> _conferenceDetailsResponses;

        [SetUp]
        public void Setup()
        {
            _conferenceDetailsResponses = ConferenceDetailsResponseBuilder.BuildConferenceDetailsResponseList(10);
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole("Judge").Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            
            _allocationController = _mocker.Create<InternalEventAllocationController>();
            _allocationController.ControllerContext = context;

            _mocker.Mock<IAllocationHearingsEventNotifier>();
        }


        [Test]
        public async Task Should_send_event()
        {
            // Arrange
            var conferenceIds = _conferenceDetailsResponses.Select(x => x.Id).ToList();
            var allocationHearingsToCsoRequest = new HearingAllocationNotificationRequest()
            {
                ConferenceIds = conferenceIds,
                AllocatedCsoUserName = "csousername@email.com"
            };
            

            // Act
            var result = await _allocationController.AllocationHearings(allocationHearingsToCsoRequest);

            // Assert
            result.Should().BeOfType<NoContentResult>();

            _mocker.Mock<IAllocationHearingsEventNotifier>().Verify(
                x => x.PushAllocationHearingsEvent("csousername@email.com", conferenceIds),
                Times.Once);
        }
    }
}
