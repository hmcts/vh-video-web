using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.Services;

namespace VideoWeb.UnitTests.Controllers.ReferenceData;

public class GetAvailableInterpreterLanguagesTests
{
    private AutoMock _mocker;
    private ReferenceDataController _sut;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _sut = _mocker.Create<ReferenceDataController>();
    }
    
    [Test]
    public async Task Should_return_ok_with_interpreter_languages()
    {
        // arrange
        var languages = new List<InterpreterLanguage>
        {
            new ()
            {
                Code = "spa",
                Description = "Spanish",
                Type = InterpreterType.Verbal
            },
            new ()
            {
                Code = "urd",
                Description = "Urdu",
                Type = InterpreterType.Verbal
            }
        };
        _mocker.Mock<IReferenceDataService>().Setup(x => x.GetInterpreterLanguagesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(languages);
        
        // act
        var result = await _sut.GetAvailableInterpreterLanguages(CancellationToken.None);
        
        // assert
        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
    }
}
