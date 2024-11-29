using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using Moq;
using NUnit.Framework;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Common.ConferenceServiceTests;

public class PopulateConferencesCacheForTodayTests : ConferenceCacheServiceTestsBase
{
    [Test]
    public async Task Should_AddMatchingConferencesToCache()
    {
        // Arrange
        var hearingId = Guid.NewGuid();
        var hearings = new List<HearingDetailsResponseV2> { new HearingDetailsResponseV2 { Id = hearingId } };
        var conferences = new List<ConferenceDetailsResponse> { new ConferenceDetailsResponse { HearingId = hearingId } };

        BookingsApiClientMock
            .Setup(x => x.GetHearingsForTodayV2Async(It.IsAny<CancellationToken>()))
            .ReturnsAsync(hearings);
        VideoApiClientMock
            .Setup(x => x.GetConferencesTodayAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);

        // Act
        await ConferenceService.PopulateConferenceCacheForToday();

        // Assert
        ConferenceCacheMock.Verify(x => x.AddConferenceAsync(conferences[0], hearings[0], It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task Should_NotAddNonMatchingConferencesToCache()
    {
        // Arrange
        var hearings = new List<HearingDetailsResponseV2> { new HearingDetailsResponseV2 { Id = Guid.NewGuid() } };
        var conferences = new List<ConferenceDetailsResponse> { new ConferenceDetailsResponse { HearingId = Guid.NewGuid() } };

        BookingsApiClientMock
            .Setup(x => x.GetHearingsForTodayV2Async(It.IsAny<CancellationToken>()))
            .ReturnsAsync(hearings);
        VideoApiClientMock
            .Setup(x => x.GetConferencesTodayAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);

        // Act
        await ConferenceService.PopulateConferenceCacheForToday();

        // Assert
        ConferenceCacheMock.Verify(x => x.AddConferenceAsync(It.IsAny<ConferenceDetailsResponse>(), It.IsAny<HearingDetailsResponseV2>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Should_HandleEmptyDataGracefully()
    {
        // Arrange
        BookingsApiClientMock
            .Setup(x => x.GetHearingsForTodayV2Async(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HearingDetailsResponseV2>());
        VideoApiClientMock
            .Setup(x => x.GetConferencesTodayAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ConferenceDetailsResponse>());

        // Act
        await ConferenceService.PopulateConferenceCacheForToday();

        // Assert
        ConferenceCacheMock.Verify(x => x.AddConferenceAsync(It.IsAny<ConferenceDetailsResponse>(), It.IsAny<HearingDetailsResponseV2>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
