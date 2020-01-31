using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using VideoWeb.Services.Bookings;

namespace VideoWeb.UnitTests.Controllers
{
    public class VenueControllerTest
    {
        private VenuesController _controller;
        private Mock<IBookingsApiClient> _bookingsApiClientMock;
        private Mock<ILogger<VenuesController>> _mockLogger;

        [SetUp]
        public void Setup()
        {
            _bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _mockLogger = new Mock<ILogger<VenuesController>>();
            _controller = new VenuesController(_bookingsApiClientMock.Object, _mockLogger.Object);
        }

        [Test]
        public async Task Should_return_list_of_hearings_venue_with_status_ok()
        {
            var venues = new List<HearingVenueResponse> { new HearingVenueResponse() };

            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesAsync()).ReturnsAsync(venues);
            var result = await _controller.GetHearingsVenues();
            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();
            var venuesList = typedResult.Value;
            venuesList.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_error_when_unable_to_retrieve_venues()
        {
            var apiException = new BookingsApiException("Venues not found", (int)HttpStatusCode.NotFound,
               "Error", null, null);
            _bookingsApiClientMock
                .Setup(x => x.GetHearingVenuesAsync())
                .ThrowsAsync(apiException);

            var result = await _controller.GetHearingsVenues();
            var typedResult = (NotFoundResult)result.Result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(apiException.StatusCode);
        }
    }
}
