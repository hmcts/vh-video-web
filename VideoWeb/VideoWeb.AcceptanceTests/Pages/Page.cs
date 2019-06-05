using System;
using VideoWeb.AcceptanceTests.Journeys;

namespace VideoWeb.AcceptanceTests.Pages
{
    public class Page
    {
        public string Name { get; set; }
        public string Url { get; set; }
        public ParticipantJourney ParticipantJourney { get; set; }
        public ParticipantJourney SubsequentPage { get; set; }
        public JudgeJourney JudgeJourney { get; set; }
        public JudgeJourney JudgeSubsequentPage { get; set; }
        public VhoJourney VhoJourney { get; set; }
        public VhoJourney VhoSubsequentPage { get; set; }

        private Page(string name, string url, ParticipantJourney participantJourney, ParticipantJourney subsequentPage,
            JudgeJourney judgeJourney, JudgeJourney judgeSubsequentPage, VhoJourney vhoJourney,
            VhoJourney vhoSubsequentPage)
        {
            Name = name;
            Url = url;
            ParticipantJourney = participantJourney;
            SubsequentPage = subsequentPage;
            JudgeJourney = judgeJourney;
            JudgeSubsequentPage = judgeSubsequentPage;
            VhoJourney = vhoJourney;
            VhoSubsequentPage = vhoSubsequentPage;
        }
      
        public static Page Login => new Page("Login", "login.microsoftonline.com", ParticipantJourney.Login, NextPageAsJourney(ParticipantJourney.Login), JudgeJourney.Login, NextPageAsJudgeJourney(JudgeJourney.Login), VhoJourney.Login, NextPageAsVhoJourney(VhoJourney.Login));
        public static Page HearingList => new Page("Hearing List", "hearing-list", ParticipantJourney.HearingList, NextPageAsJourney(ParticipantJourney.HearingList), JudgeJourney.HearingList, NextPageAsJudgeJourney(JudgeJourney.HearingList), VhoJourney.HearingList, NextPageAsVhoJourney(VhoJourney.HearingList));
        public static Page EquipmentCheck => new Page("Equipment Check", "equipment-check", ParticipantJourney.EquipmentCheck, NextPageAsJourney(ParticipantJourney.EquipmentCheck), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page SwitchOnCamAndMicPage => new Page("Switch on your camera and microphone", "switch-on-camera-microphone", ParticipantJourney.SwitchOnYourCameraAndMicrophone, NextPageAsJourney(ParticipantJourney.SwitchOnYourCameraAndMicrophone), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page PracticeVideoHearing => new Page("Practice video hearing", "practice-video-hearing", ParticipantJourney.PracticeVideoHearing, NextPageAsJourney(ParticipantJourney.PracticeVideoHearing), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));        
        public static Page CameraWorking => new Page("Camera Working", "camera-working", ParticipantJourney.CameraWorking, NextPageAsJourney(ParticipantJourney.CameraWorking), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page MicrophoneWorking => new Page("Microphone Working", "microphone-working", ParticipantJourney.MicrophoneWorking, NextPageAsJourney(ParticipantJourney.MicrophoneWorking), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page SeeAndHearVideo => new Page("See and Hear Video", "see-and-hear-video", ParticipantJourney.SeeAndHearVideo, NextPageAsJourney(ParticipantJourney.SeeAndHearVideo), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));        
        public static Page Rules => new Page("Rules", "hearing-rules", ParticipantJourney.Rules, NextPageAsJourney(ParticipantJourney.Rules), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page Declaration => new Page("Declaration", "declaration", ParticipantJourney.Declaration, NextPageAsJourney(ParticipantJourney.Declaration), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page WaitingRoom => new Page("Waiting Room", "waiting-room", ParticipantJourney.WaitingRoom, NextPageAsJourney(ParticipantJourney.WaitingRoom), JudgeJourney.WaitingRoom, NextPageAsJudgeJourney(JudgeJourney.WaitingRoom), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page Countdown => new Page("Countdown", "countdown", ParticipantJourney.Countdown, NextPageAsJourney(ParticipantJourney.Countdown), JudgeJourney.Countdown, NextPageAsJudgeJourney(JudgeJourney.Countdown), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page NotFound => new Page("Not Found", "not-found", ParticipantJourney.NotFound, NextPageAsJourney(ParticipantJourney.NotFound), JudgeJourney.NotFound, NextPageAsJudgeJourney(JudgeJourney.NotFound), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page Unauthorised => new Page("Unauthorised", "unauthorised", ParticipantJourney.Unauthorised, NextPageAsJourney(ParticipantJourney.Unauthorised), JudgeJourney.Unauthorised, NextPageAsJudgeJourney(JudgeJourney.Unauthorised), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page AdminPanel => new Page("Admin Panel", "hearing-list", ParticipantJourney.NotInParticipantJourney, NextPageAsJourney(ParticipantJourney.NotInParticipantJourney), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), VhoJourney.AdminPanel, NextPageAsVhoJourney(VhoJourney.AdminPanel));

        public static ParticipantJourney NextPageAsJourney(ParticipantJourney currentPage)
        {
            return (ParticipantJourney) ((int) currentPage + 1);
        }

        public static JudgeJourney NextPageAsJudgeJourney(JudgeJourney currentPage)
        {
            return (JudgeJourney)((int)currentPage + 1);
        }

        public static VhoJourney NextPageAsVhoJourney(VhoJourney currentPage)
        {
            return (VhoJourney)((int)currentPage + 1);
        }

        public Page NextPage(Page currentPage)
        {            
            switch (currentPage.SubsequentPage)
            {
                case ParticipantJourney.Login:
                    return Login;
                case ParticipantJourney.HearingList:
                    return HearingList;
                case ParticipantJourney.EquipmentCheck:
                    return EquipmentCheck;
                case ParticipantJourney.SwitchOnYourCameraAndMicrophone:
                    return SwitchOnCamAndMicPage;
                case ParticipantJourney.PracticeVideoHearing:
                    return PracticeVideoHearing;
                case ParticipantJourney.CameraWorking:
                    return CameraWorking;
                case ParticipantJourney.MicrophoneWorking:
                    return MicrophoneWorking;
                case ParticipantJourney.SeeAndHearVideo:
                    return SeeAndHearVideo;
                case ParticipantJourney.Rules:
                    return Rules;
                case ParticipantJourney.Declaration:
                    return Declaration;
                case ParticipantJourney.WaitingRoom:
                    return WaitingRoom;
                case ParticipantJourney.Countdown:
                    return Countdown;
                default: throw new ArgumentOutOfRangeException($"{currentPage.SubsequentPage} not found");
            }
        }

        public Page JudgeNextPage(Page currentPage)
        {
            switch (currentPage.JudgeSubsequentPage)
            {
                case JudgeJourney.Login:
                    return Login;
                case JudgeJourney.HearingList:
                    return HearingList;    
                case JudgeJourney.WaitingRoom:
                    return WaitingRoom;
                case JudgeJourney.Countdown:
                    return Countdown;
                default: throw new ArgumentOutOfRangeException($"{currentPage.JudgeSubsequentPage} not found");
            }
        }

        public Page VhoNextPage(Page currentPage)
        {
            switch (currentPage.VhoSubsequentPage)
            {
                case VhoJourney.Login:
                    return Login;
                case VhoJourney.HearingList:
                    return HearingList;
                case VhoJourney.AdminPanel:
                    return AdminPanel;
                default: throw new ArgumentOutOfRangeException($"{currentPage.VhoSubsequentPage} not found");
            }
        }
    }
}
