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
        public static By RepresentativeRepresentee(Guid participantId) => By.Id($"p-{participantId:D}-representee-participant");
        public static By ParticipantHearingRole(Guid participantId) => By.Id($"p-{participantId:D}-hearing-role-participant");
        public static By ObserverRow(Guid participantId) => By.Id($"p-row-{participantId:D}-observer");
        public static By ObserverName(Guid participantId) => By.Id($"p-{participantId:D}-name-observer");
        
        public static By ParticipantWithInterpreter(Guid interpreteeId)
        {
            var interpeteeXPath = $"//div[@id='p-row-{interpreteeId}-participant']/../following-sibling::div//div[starts-with(@id,'p-row')]";
            return By.XPath(interpeteeXPath);
        }
    }
}
