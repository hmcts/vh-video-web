using System;
using System.Collections.Generic;
using FluentAssertions;
using TestApi.Client;
using TestApi.Contract.Dtos;
using TestApi.Contract.Enums;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.AcceptanceTests.Data
{
    public static class ParticipantsManager
    {
        public static List<ParticipantDetailsResponse> GetParticipantsFromRole(List<ParticipantDetailsResponse> conferenceParticipants, string userRole)
        {
            userRole = ChangeJudgeForJudge(userRole);
            List<ParticipantDetailsResponse> participants;
            if (userRole.ToLower().Equals("participants"))
            {
                participants = conferenceParticipants.FindAll(x => x.UserRole == UserRole.Individual || x.UserRole == UserRole.Representative);

            }
            else
            {
                Enum.TryParse(EnsureRoleTypeHasCapitalLetter(userRole), out UserRole userRoleEnum);
                participants = conferenceParticipants.FindAll(x => x.UserRole == userRoleEnum);
            }

            participants.Should().NotBeNullOrEmpty($"No participants with role {userRole} found");
            return participants;
        }

        private static string ChangeJudgeForJudge(string userRole)
        {
            return userRole.ToLower().Replace("Judge", "Judge");
        }

        private static string EnsureRoleTypeHasCapitalLetter(string userRole)
        {
            return char.ToUpper(userRole[0]) + userRole.Substring(1);
        }
    }
}
