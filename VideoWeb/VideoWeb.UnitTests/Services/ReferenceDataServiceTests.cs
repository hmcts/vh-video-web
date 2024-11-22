using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Services;

namespace VideoWeb.UnitTests.Services;

public class ReferenceDataServiceTests
{
    private AutoMock _mocker;
    private ReferenceDataService _sut;
    private IMemoryCache _memoryCache;
    
    [SetUp]
    public void Setup()
    {
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
        _mocker = AutoMock.GetLoose(builder => builder.RegisterInstance(_memoryCache).As<IMemoryCache>());
        _sut = _mocker.Create<ReferenceDataService>();
    }
    
    [Test]
    public async Task Should_initialise_cache()
    {
        // arrange
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetAvailableInterpreterLanguagesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<InterpreterLanguagesResponse>());
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingVenuesForHearingsTodayAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<HearingVenueResponse>());

        // act
        await _sut.InitialiseCache();

        // assert
        _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetAvailableInterpreterLanguagesAsync(It.IsAny<CancellationToken>()), Times.Once);
        _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetHearingVenuesForHearingsTodayAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
    
    [Test]
    public async Task Should_return_interpreter_languages()
    {
        // arrange
        var languages = new List<InterpreterLanguagesResponse>
        {
            new ()
            {
                Code = "spa",
                Value = "Spanish",
                Type = InterpreterType.Verbal
            },
            new ()
            {
                Code = "urd",
                Value = "Urdu",
                Type = InterpreterType.Verbal
            }
        };
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetAvailableInterpreterLanguagesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(languages);
        
        // act
        var result = await _sut.GetInterpreterLanguagesAsync();
        
        // assert
        result.Count.Should().Be(languages.Count);
        result[0].Code.Should().Be(languages[0].Code);
        result[0].Description.Should().Be(languages[0].Value);
        result[0].Type.Should().Be((VideoWeb.Common.Models.InterpreterType)languages[0].Type);
    }

    [Test]
    public async Task should_return_hearing_venues_for_today()
    {
        // arrange
        var hearingVenues = new List<HearingVenueResponse>
        {
            new()
            {
                Id = 1,
                Name = "Venue 1",
                Code = "123456"
            },
            new()
            {
                Id = 2,
                Name = "Venue 2",
                Code = "234567"
            }
        };
        _mocker.Mock<IBookingsApiClient>().Setup(x => x.GetHearingVenuesForHearingsTodayAsync(It.IsAny<CancellationToken>())).ReturnsAsync(hearingVenues);
        
        // act
        var result = await _sut.GetHearingVenuesForTodayAsync();
        
        // assert
        result.Count.Should().Be(hearingVenues.Count);
        result[0].Id.Should().Be(hearingVenues[0].Id);
        result[0].Name.Should().Be(hearingVenues[0].Name);
        result[0].Code.Should().Be(hearingVenues[0].Code);
    }

    [Test]
    public async Task Should_not_call_api_when_cache_value_exists()
    {
        var languages = new List<InterpreterLanguagesResponse>
        {
            new ()
            {
                Code = "spa",
                Value = "Spanish",
                Type = InterpreterType.Verbal
            },
            new ()
            {
                Code = "urd",
                Value = "Urdu",
                Type = InterpreterType.Verbal
            }
        };
        var existingCache = languages.Select(x => x.Map()).ToList();
        _memoryCache.Set("RefData_InterpreterLanguages", existingCache);
        
        // act
        var result = await _sut.GetInterpreterLanguagesAsync();
        
        // assert
        result.Count.Should().Be(languages.Count);
        _mocker.Mock<IBookingsApiClient>().Verify(x => x.GetAvailableInterpreterLanguagesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
