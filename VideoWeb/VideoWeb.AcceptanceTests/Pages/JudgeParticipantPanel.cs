using System;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class JudgeParticipantPanel
    {
        public static By PanelMemberRow(Guid participantId) => By.Id($"p-row-{participantId:D}-panel-member");
        public static By PanelMemberName(Guid participantId) => By.Id($"p-{participantId:D}-name-panel-member");
        public static By IndividualRow(Guid participantId) => By.Id($"p-row-{participantId:D}-participant");
        public static By ParticipantName(Guid participantId) => By.Id($"p-{participantId:D}-name-participant");
        public static By ParticipantCaseType(Guid participantId) => By.Id($"p-{participantId:D}-case-type-group-participant");
        public static By ParticipantStatus(Guid participantId) => By.Id($"p-{participantId:D}-status-participant");
        public static By RepresentativeRepresentee(Guid participantId) => By.Id($"p-{participantId:D}-representee");
        public static By ObserverRow(Guid participantId) => By.Id($"p-row-{participantId:D}-observer");
        public static By ObserverName(Guid participantId) => By.Id($"p-{participantId:D}-name-observer");
        public static By ParticipantHearingRole(Guid participantId) => By.Id($"p-{participantId:D}-hearing-role-participant");
    }
}
