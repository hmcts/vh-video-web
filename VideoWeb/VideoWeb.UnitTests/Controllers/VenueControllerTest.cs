using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
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
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesAsync()).ReturnsAsync(judges);
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
                .Setup(x => x.GetHearingVenuesAsync())
                .ThrowsAsync(apiException);

            var result = await _controller.GetVenues();
            var typedResult = (NotFoundResult)result.Result;
            typedResult.Should().NotBeNull();
            typedResult.StatusCode.Should().Be(apiException.StatusCode);
        }
        
        [Test]
        public async Task GetVenuesByCso_should_return_list_of_venue_names()
        {
            var venueNames = new List<string>
            {
                "Woolwich Crown Court",
                "Birmingham Crown and Civil",
                "Camelot, The court of King Arthur"
            };
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesByAllocatedCsoAsync(It.IsAny<Guid[]>(), false)).ReturnsAsync(venueNames);
            var result = await _controller.GetVenuesByCso(It.IsAny<Guid[]>());
            var objectResult = result.Result as OkObjectResult;
            objectResult.Should().NotBeNull();
            objectResult?.StatusCode.Should().Be(200);
            objectResult?.Value.Should().BeEquivalentTo(venueNames);
        }        
        
        [Test]
        public async Task GetVenuesByCso_should_catch_404_and_return_Ok_and_empty_list()
        {
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesByAllocatedCsoAsync(It.IsAny<Guid[]>(), false))
                .ThrowsAsync(new BookingsApiException("Not Found", 404, "", It.IsAny<IReadOnlyDictionary<string, IEnumerable<string>>>(), It.IsAny<Exception>()));
            var result = await _controller.GetVenuesByCso(It.IsAny<Guid[]>());
            var objectResult = result.Result as OkObjectResult;
            objectResult.Should().NotBeNull();
            objectResult?.StatusCode.Should().Be(200);
            objectResult?.Value.Should().NotBeNull();
            objectResult?.Value.Should().BeEquivalentTo(new List<string>());
        }       
        
        [Test]
        public async Task GetVenuesByCso_should_catch_and_return_500()
        {
            _bookingsApiClientMock.Setup(x => x.GetHearingVenuesByAllocatedCsoAsync(It.IsAny<Guid[]>(), false))
                .ThrowsAsync(new BookingsApiException("Internal Server Error", 500, "", It.IsAny<IReadOnlyDictionary<string, IEnumerable<string>>>(), It.IsAny<Exception>()));
            var result = await _controller.GetVenuesByCso(It.IsAny<Guid[]>());
            var objectResult = result.Result as ObjectResult;
            objectResult.Should().NotBeNull();
            objectResult?.StatusCode.Should().Be(500);
        }
    }
}
