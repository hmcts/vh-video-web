using System;
using BookingsApi.Contract.V1.Enums;
using BookingsApi.Contract.V1.Responses;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Caching;

namespace VideoWeb.UnitTests.Mappings
{
    public class InterpreterLanguageMapperTests
    {
        [TestCase(InterpreterType.Sign)]
        [TestCase(InterpreterType.Verbal)]
        public void Should_map_interpreter_language_response(InterpreterType interpreterType)
        {
            // Arrange
            var response = new InterpreterLanguagesResponse
            {
                Code = "spa",
                Value = "Spanish",
                Type = interpreterType
            };

            // Act
            var result = response.Map();

            // Assert
            result.Code.Should().Be(response.Code);
            result.Description.Should().Be(response.Value);
            switch (interpreterType)
            {
                case InterpreterType.Sign:
                    result.Type.Should().Be(VideoWeb.Common.Models.InterpreterType.Sign);
                    break;
                case InterpreterType.Verbal:
                    result.Type.Should().Be(VideoWeb.Common.Models.InterpreterType.Verbal);
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(interpreterType), interpreterType, null);
            }
        }
    }
}
