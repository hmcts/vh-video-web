using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers
{
    public class VenueControllerTest
    {
        private VenuesController _controller;
        private Mock<ILogger<VenuesController>> _mockLogger;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;

        [SetUp]
        public void Setup()
        {
            _mockLogger = new Mock<ILogger<VenuesController>>();
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _controller = new VenuesController( _mockLogger.Object, _bookingsApiClientMock.Object);
        }

        [Test]
        public async Task GetVenues_Should_return_list_of_judges_with_hearings_with_status_ok()
        {
            var judges = new List<HearingVenueResponse>();
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesForHearingsTodayAsync()).ReturnsAsync(judges);
            var result = await _controller.GetVenues();
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var judgeList = typedResult.Value;
            judgeList.Should().NotBeNull();
        }

        [Test]
        public async Task GetVenues_Should_return_error_when_unable_to_retrieve_venues()
        {
            var apiException = new BookingsApiException("Venues not found", (int)HttpStatusCode.NotFound,
                "Error", null, null);
            _bookingsApiClientMock
                .Setup(x => x.GetHearingVenuesForHearingsTodayAsync())
                .ThrowsAsync(apiException);

            var result = await _controller.GetVenues();
            var typedResult = (NotFoundResult)result.Result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(apiException.StatusCode);
        }
    }
}
