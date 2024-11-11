using System.Collections.Generic;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Controllers.InternalEventControllers;
using VideoWeb.Helpers.Interfaces;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InternalEventControllers
{
    public class AllocationHearingsTests
    {
        private AutoMock _mocker;
        private InternalEventAllocationController allocationController;

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
            
            allocationController = _mocker.Create<InternalEventAllocationController>();
            allocationController.ControllerContext = context;

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
            var result = await allocationController.AllocationHearings(allocationHearingsToCsoRequest);

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
            var result = await allocationController.AllocationHearings(allocationHearingsToCsoRequest);

            // Assert
            result.Should().BeOfType<ObjectResult>();

            _mocker.Mock<IAllocationHearingsEventNotifier>().Verify(x => x.PushAllocationHearingsEvent("csousername@email.com", allocatedHearingsDetails), Times.Once);
        }
    }
}
