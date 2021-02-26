using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Decorators;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.UnitTests.Mappings
{
    public class MapperLoggingDecoratorTests
    {
        private AutoMock _mocker;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
        }

        [Test]
        public void should_map_dictionary_to_response_1()
        {
            // Arrange
            var input1 = 1;
            var output = "1";
            _mocker.Mock<IMapTo<int, string>>().Setup(x => x.Map(input1)).Returns(output);
            var sut = _mocker.Create<MapperLoggingDecorator<int, string>>();

            // Act
            var result = sut.Map(input1);

            // Assert
            result.Should().Be(output);
            _mocker.Mock<IMapTo<int, string>>().Verify(x => x.Map(input1), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, string>>>().Verify(x => x.BeginScope(It.Is<Dictionary<string, object>>(d =>
                new[]
                {
                    "TIn1",
                    "TOut"
                }.All(keys => d.ContainsKey(keys)))), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, string>>>().Verify(x => x.Log(LogLevel.Debug, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(), (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Exactly(2));
        }

        [Test]
        public void should_map_dictionary_to_response_2()
        {
            // Arrange
            var input1 = 1;
            var input2 = 1.1d;
            var output = "2.1";
            _mocker.Mock<IMapTo<int, double, string>>().Setup(x => x.Map(input1, input2)).Returns(output);
            var sut = _mocker.Create<MapperLoggingDecorator<int, double, string>>();

            // Act
            var result = sut.Map(input1, input2);

            // Assert
            result.Should().Be(output);
            _mocker.Mock<IMapTo<int, double, string>>().Verify(x => x.Map(input1, input2), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, double, string>>>().Verify(x => x.BeginScope(It.Is<Dictionary<string, object>>(d =>
                new[]
                {
                    "TIn1",
                    "TIn2",
                    "TOut"
                }.All(keys => d.ContainsKey(keys)))), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, double, string>>>().Verify(x => x.Log(LogLevel.Debug, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(), (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Exactly(2));
        }

        [Test]
        public void should_map_dictionary_to_response_3()
        {
            // Arrange
            var input1 = 1;
            var input2 = 1.1d;
            var input3 = 1.2f;
            var output = "3.3";
            _mocker.Mock<IMapTo<int, double, float, string>>().Setup(x => x.Map(input1, input2, input3)).Returns(output);
            var sut = _mocker.Create<MapperLoggingDecorator<int, double, float, string>>();

            // Act
            var result = sut.Map(input1, input2, input3);

            // Assert
            result.Should().Be(output);
            _mocker.Mock<IMapTo<int, double, float, string>>().Verify(x => x.Map(input1, input2, input3), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, double, float, string>>>().Verify(x => x.BeginScope(It.Is<Dictionary<string, object>>(d =>
               new[]
               {
                    "TIn1",
                    "TIn2",
                    "TIn3",
                    "TOut"
               }.All(keys => d.ContainsKey(keys)))), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, double, float, string>>>().Verify(x => x.Log(LogLevel.Debug, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(), (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Exactly(2));
        }

        [Test]
        public void should_map_dictionary_to_response_4()
        {
            // Arrange
            var input1 = 1;
            var input2 = 1.1d;
            var input3 = 1.2f;
            var input4 = 1.3m;
            var output = "4.6";
            _mocker.Mock<IMapTo<int, double, float, decimal, string>>().Setup(x => x.Map(input1, input2, input3, input4)).Returns(output);
            var sut = _mocker.Create<MapperLoggingDecorator<int, double, float, decimal, string>>();

            // Act
            var result = sut.Map(input1, input2, input3, input4);

            // Assert
            result.Should().Be(output);
            _mocker.Mock<IMapTo<int, double, float, decimal, string>>().Verify(x => x.Map(input1, input2, input3, input4), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, double, float, decimal, string>>>().Verify(x => x.BeginScope(It.Is<Dictionary<string, object>>(d =>
               new[]
               {
                    "TIn1",
                    "TIn2",
                    "TIn3",
                    "TIn4",
                    "TOut"
               }.All(keys => d.ContainsKey(keys)))), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, double, float, decimal, string>>>().Verify(x => x.Log(LogLevel.Debug, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(), (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Exactly(2));
        }

        [Test]
        public void should_map_dictionary_to_response_5()
        {
            // Arrange
            var input1 = 1;
            var input2 = 1.1d;
            var input3 = 1.2f;
            var input4 = 1.3m;
            var input5 = 2L;
            var output = "5.6";
            _mocker.Mock<IMapTo<int, double, float, decimal, long, string>>().Setup(x => x.Map(input1, input2, input3, input4, input5)).Returns(output);
            var sut = _mocker.Create<MapperLoggingDecorator<int, double, float, decimal, long, string>>();

            // Act
            var result = sut.Map(input1, input2, input3, input4, input5);

            // Assert
            result.Should().Be(output);
            _mocker.Mock<IMapTo<int, double, float, decimal, long, string>>().Verify(x => x.Map(input1, input2, input3, input4, input5), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, double, float, decimal, long, string>>>().Verify(x => x.BeginScope(It.Is<Dictionary<string, object>>(d =>
               new[]
               {
                    "TIn1",
                    "TIn2",
                    "TIn3",
                    "TIn4",
                    "TIn5",
                    "TOut"
               }.All(keys => d.ContainsKey(keys)))), Times.Once);
            _mocker.Mock<ILogger<IMapTo<int, double, float, decimal, long, string>>>().Verify(x => x.Log(LogLevel.Debug, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(), (Func<It.IsAnyType, Exception, string>)It.IsAny<object>()), Times.Exactly(2));
        }
    }
}
