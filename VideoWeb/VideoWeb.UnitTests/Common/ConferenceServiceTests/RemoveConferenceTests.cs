using System.Threading.Tasks;
using BookingsApi.Client;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Common.ConferenceServiceTests
{
    public class RemoveConferenceTests
    {
        private ConferenceService _conferenceService;
        private Conference _conference;
        private Mock<IConferenceCache> _conferenceCacheMock;
        
        [SetUp]
        public void SetUp()
        {
            _conference = new ConferenceCacheModelBuilder().Build();
            _conferenceCacheMock = new Mock<IConferenceCache>();
            var videoApiClientMock = new Mock<IVideoApiClient>();
            var bookingsApiClientMock = new Mock<IBookingsApiClient>();
            _conferenceService = new ConferenceService(_conferenceCacheMock.Object,
                videoApiClientMock.Object,
                bookingsApiClientMock.Object);
        }

        [Test]
        public async Task Should_remove_conference()
        {
            // Arrange & Act
            await _conferenceService.RemoveConference(_conference);

            // Assert
            _conferenceCacheMock.Verify(x => x.RemoveConferenceAsync(_conference, default), Times.Once);
        }
    }
}
