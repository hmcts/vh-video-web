using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using VideoWeb.Services;

namespace VideoWeb.UnitTests.Controllers
{
    public class VenueControllerTest
    {
        private VenuesController _controller;
        private Mock<ILogger<VenuesController>> _mockLogger;
        private Mock<IReferenceDataService> _referenceDataServiceMock;

        [SetUp]
        public void Setup()
        {
            _mockLogger = new Mock<ILogger<VenuesController>>();
            _referenceDataServiceMock = new Mock<IReferenceDataService>();
            _controller = new VenuesController( _mockLogger.Object, _referenceDataServiceMock.Object);
        }

        [Test]
        public async Task GetVenues_Should_return_list_of_judges_with_hearings_with_status_ok()
        {
            var venues = new List<HearingVenueResponse>();
            _referenceDataServiceMock.Setup(x => x.GetHearingVenuesForTodayAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(venues);
            var result = await _controller.GetVenues(CancellationToken.None);
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var judgeList = typedResult!.Value;
            judgeList.Should().NotBeNull();
        }
    }
}
