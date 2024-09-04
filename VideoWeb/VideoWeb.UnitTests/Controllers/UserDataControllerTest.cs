using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;

namespace VideoWeb.UnitTests.Controllers;

public class UserDataControllerTest
{
    private AutoMock _mocker;
    private UserDataController _sut;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _sut = _mocker.Create<UserDataController>();
    }
    
    [Test]
    public async Task return_list_of_justice_users()
    {
        var csos = new List<JusticeUserResponse>
        {
            Mock.Of<JusticeUserResponse>(),
            Mock.Of<JusticeUserResponse>(),
            Mock.Of<JusticeUserResponse>(),
        };
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetJusticeUserListAsync(string.Empty, null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(csos);
        var result = await _sut.GetJusticeUsers(CancellationToken.None);
        var objectResult = result.Result as OkObjectResult;
        objectResult.Should().NotBeNull();
        objectResult?.StatusCode.Should().Be(200);
        objectResult?.Value.Should().BeEquivalentTo(csos);
    }
}
