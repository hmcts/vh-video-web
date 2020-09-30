using System;
using OpenQA.Selenium;

namespace VideoWeb.AcceptanceTests.Pages
{
    public static class ParticipantListPanel
    {
        public static By PanelMemberRow(Guid participantId) => By.Id($"p-row-{participantId:D}-panel-member");
        public static By PanelMemberName(Guid participantId) => By.Id($"p-{participantId:D}-name-panel-member");
        public static By ParticipantRow(Guid participantId) => By.Id($"p-row-{participantId:D}-participant");
        public static By ParticipantName(Guid participantId) => By.Id($"p-{participantId:D}-name");
        public static By ParticipantCaseTypeGroup(Guid participantId) => By.Id($"p-{participantId:D}-case-type-group");
        public static By RepresentativeRepresentee(Guid participantId) => By.Id($"p-{participantId:D}-representee");
        public static By ObserverRow(Guid participantId) => By.Id($"p-row-{participantId:D}-observer");
        public static By ObserverName(Guid participantId) => By.Id($"p-{participantId:D}-name-observer");
        public static By PrivateConsultationLink(Guid participantId) => By.Id($"p-call-{participantId:D}-btn");
        public static By ParticipantHearingRole(Guid participantId) => By.Id($"p-{participantId:D}-hearing-role");

    }
}
