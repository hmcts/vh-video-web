using System.Threading.Tasks;
using BookingsApi.Client;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Common.ConferenceServiceTests;

public class RemoveConferenceTests: ConferenceCacheServiceTestsBase
{
    [Test]
    public async Task Should_remove_conference()
    {
        // Arrange & Act
        await ConferenceService.RemoveConference(Conference);
        
        // Assert
        ConferenceCacheMock.Verify(x => x.RemoveConferenceAsync(Conference, default), Times.Once);
    }
}
