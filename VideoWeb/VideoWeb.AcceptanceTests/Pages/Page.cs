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
        public ClerkSelfTestJourney ClerkSelfTestJourney { get; set; }
        public ClerkSelfTestJourney ClerkSelfTestSubsequentPage { get; set; }
        public VhoJourney VhoJourney { get; set; }
        public VhoJourney VhoSubsequentPage { get; set; }

        private Page(string name, string url, ParticipantJourney participantJourney, ParticipantJourney subsequentPage,
            JudgeJourney judgeJourney, JudgeJourney judgeSubsequentPage,
            ClerkSelfTestJourney clerkSelfTestJourney, ClerkSelfTestJourney clerkSelfTestSubsequentPage,
            VhoJourney vhoJourney, VhoJourney vhoSubsequentPage)
        {
            Name = name;
            Url = url;
            ParticipantJourney = participantJourney;
            SubsequentPage = subsequentPage;
            JudgeJourney = judgeJourney;
            JudgeSubsequentPage = judgeSubsequentPage;
            ClerkSelfTestJourney = clerkSelfTestJourney;
            ClerkSelfTestSubsequentPage = clerkSelfTestSubsequentPage;
            VhoJourney = vhoJourney;
            VhoSubsequentPage = vhoSubsequentPage;
        }

        public static Page Login => new Page("Login", "login.microsoftonline.com", ParticipantJourney.Login, NextPageAsJourney(ParticipantJourney.Login), JudgeJourney.Login, NextPageAsJudgeJourney(JudgeJourney.Login), ClerkSelfTestJourney.Login, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.Login), VhoJourney.Login, NextPageAsVhoJourney(VhoJourney.Login));
        public static Page HearingList => new Page("Hearing List", "hearing-list", ParticipantJourney.HearingList, NextPageAsJourney(ParticipantJourney.HearingList), JudgeJourney.HearingList, NextPageAsJudgeJourney(JudgeJourney.HearingList), ClerkSelfTestJourney.HearingList, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.HearingList), VhoJourney.HearingList, NextPageAsVhoJourney(VhoJourney.HearingList));
        public static Page Introduction => new Page("Introduction", "introduction", ParticipantJourney.Introduction, NextPageAsJourney(ParticipantJourney.Introduction), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page EquipmentCheck => new Page("Equipment Check", "equipment-check", ParticipantJourney.EquipmentCheck, NextPageAsJourney(ParticipantJourney.EquipmentCheck), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.EquipmentCheck, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.EquipmentCheck), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page SwitchOnCamAndMicPage => new Page("Switch on your camera and microphone", "switch-on-camera-microphone", ParticipantJourney.SwitchOnYourCameraAndMicrophone, NextPageAsJourney(ParticipantJourney.SwitchOnYourCameraAndMicrophone), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.SwitchOnYourCameraAndMicrophone, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.SwitchOnYourCameraAndMicrophone), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page PracticeVideoHearing => new Page("Practice video hearing", "practice-video-hearing", ParticipantJourney.PracticeVideoHearing, NextPageAsJourney(ParticipantJourney.PracticeVideoHearing), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.PracticeVideoHearing, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.PracticeVideoHearing), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));        
        public static Page CameraWorking => new Page("Camera Working", "camera-working", ParticipantJourney.CameraWorking, NextPageAsJourney(ParticipantJourney.CameraWorking), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page MicrophoneWorking => new Page("Microphone Working", "microphone-working", ParticipantJourney.MicrophoneWorking, NextPageAsJourney(ParticipantJourney.MicrophoneWorking), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page SeeAndHearVideo => new Page("See and Hear Video", "see-and-hear-video", ParticipantJourney.SeeAndHearVideo, NextPageAsJourney(ParticipantJourney.SeeAndHearVideo), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page Rules => new Page("Rules", "hearing-rules", ParticipantJourney.Rules, NextPageAsJourney(ParticipantJourney.Rules), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page Declaration => new Page("Declaration", "declaration", ParticipantJourney.Declaration, NextPageAsJourney(ParticipantJourney.Declaration), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page WaitingRoom => new Page("Waiting Room", "waiting-room", ParticipantJourney.WaitingRoom, NextPageAsJourney(ParticipantJourney.WaitingRoom), JudgeJourney.WaitingRoom, NextPageAsJudgeJourney(JudgeJourney.WaitingRoom), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page Countdown => new Page("Countdown", "hearing-room", ParticipantJourney.Countdown, NextPageAsJourney(ParticipantJourney.Countdown), JudgeJourney.Countdown, NextPageAsJudgeJourney(JudgeJourney.Countdown), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page HearingRoom => new Page("Hearing Room", "hearing-room", ParticipantJourney.HearingRoom, NextPageAsJourney(ParticipantJourney.HearingRoom), JudgeJourney.HearingRoom, NextPageAsJudgeJourney(JudgeJourney.HearingRoom), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page NotFound => new Page("Not Found", "not-found", ParticipantJourney.NotFound, NextPageAsJourney(ParticipantJourney.NotFound), JudgeJourney.NotFound, NextPageAsJudgeJourney(JudgeJourney.NotFound), ClerkSelfTestJourney.NotFound, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotFound), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page Unauthorised => new Page("Unauthorised", "unauthorised", ParticipantJourney.Unauthorised, NextPageAsJourney(ParticipantJourney.Unauthorised), JudgeJourney.Unauthorised, NextPageAsJudgeJourney(JudgeJourney.Unauthorised), ClerkSelfTestJourney.Unauthorised, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.Unauthorised), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page Help => new Page("Help", "get-help", ParticipantJourney.Help, NextPageAsJourney(ParticipantJourney.Help), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.Help, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.Help), VhoJourney.NotInVhoJourney, NextPageAsVhoJourney(VhoJourney.NotInVhoJourney));
        public static Page AdminPanel => new Page("Admin Panel", "hearing-list", ParticipantJourney.NotInParticipantJourney, NextPageAsJourney(ParticipantJourney.NotInParticipantJourney), JudgeJourney.NotInJudgeJourney, NextPageAsJudgeJourney(JudgeJourney.NotInJudgeJourney), ClerkSelfTestJourney.NotInClerkSelfTestJourney, NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney.NotInClerkSelfTestJourney), VhoJourney.AdminPanel, NextPageAsVhoJourney(VhoJourney.AdminPanel));

        public static ParticipantJourney NextPageAsJourney(ParticipantJourney currentPage)
        {
            return (ParticipantJourney)((int)currentPage + 1);
        }

        public static JudgeJourney NextPageAsJudgeJourney(JudgeJourney currentPage)
        {
            return (JudgeJourney)((int)currentPage + 1);
        }

        public static ClerkSelfTestJourney NextPageAsClerkSelfTestJourney(ClerkSelfTestJourney currentPage)
        {
            return (ClerkSelfTestJourney)((int)currentPage + 1);
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
                case ParticipantJourney.Introduction:
                    return Introduction;
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
                case ParticipantJourney.HearingRoom:
                    return HearingRoom;
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
                case JudgeJourney.HearingRoom:
                    return HearingRoom;
                default: throw new ArgumentOutOfRangeException($"{currentPage.JudgeSubsequentPage} not found");
            }
        }

        public Page ClerkSelfTestNextPage(Page currentPage)
        {
            switch (currentPage.ClerkSelfTestSubsequentPage)
            {
                case ClerkSelfTestJourney.Login:
                    return Login;
                case ClerkSelfTestJourney.HearingList:
                    return HearingList;
                case ClerkSelfTestJourney.EquipmentCheck:
                    return EquipmentCheck;
                case ClerkSelfTestJourney.SwitchOnYourCameraAndMicrophone:
                    return SwitchOnCamAndMicPage;
                case ClerkSelfTestJourney.PracticeVideoHearing:
                    return PracticeVideoHearing;
                default: throw new ArgumentOutOfRangeException($"{currentPage.ClerkSelfTestSubsequentPage} not found");
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