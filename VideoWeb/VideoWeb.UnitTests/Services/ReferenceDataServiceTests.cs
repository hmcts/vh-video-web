using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Autofac;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Responses;
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
