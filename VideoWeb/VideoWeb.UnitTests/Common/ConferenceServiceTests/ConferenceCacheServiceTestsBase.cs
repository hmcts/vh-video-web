using BookingsApi.Client;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Common.ConferenceServiceTests;

public abstract class ConferenceCacheServiceTestsBase
{
    protected ConferenceService ConferenceService;
    protected Conference Conference;
    protected Mock<IConferenceCache> ConferenceCacheMock;
    protected Mock<IVideoApiClient> VideoApiClientMock;
    protected Mock<IBookingsApiClient> BookingsApiClientMock;
    
    [SetUp]
    public void SetUp()
    {
        Conference = new ConferenceCacheModelBuilder().Build();
        ConferenceCacheMock = new Mock<IConferenceCache>();
        VideoApiClientMock = new Mock<IVideoApiClient>();
        BookingsApiClientMock = new Mock<IBookingsApiClient>();
        ConferenceService = new ConferenceService(ConferenceCacheMock.Object,
            VideoApiClientMock.Object,
            BookingsApiClientMock.Object);
    }
}
