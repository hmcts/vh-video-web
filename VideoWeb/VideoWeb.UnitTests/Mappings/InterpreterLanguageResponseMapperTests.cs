using System;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;

namespace VideoWeb.UnitTests.Mappings
{
    public class InterpreterLanguageResponseMapperTests
    {
        [TestCase(InterpreterType.Sign)]
        [TestCase(InterpreterType.Verbal)]
        public void Should_map_interpreter_language(InterpreterType interpreterType)
        {
            // Arrange
            var language = new InterpreterLanguage
            {
                Code = "spa",
                Description = "Spanish",
                Type = interpreterType
            };

            // Act
            var result = language.Map();

            // Assert
            result.Code.Should().Be(language.Code);
            result.Description.Should().Be(language.Description);
            switch (interpreterType)
            {
                case InterpreterType.Sign:
                    result.Type.Should().Be(Contract.Responses.InterpreterType.Sign);
                    break;
                case InterpreterType.Verbal:
                    result.Type.Should().Be(Contract.Responses.InterpreterType.Verbal);
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(interpreterType), interpreterType, null);
            }
        }
    }
}
