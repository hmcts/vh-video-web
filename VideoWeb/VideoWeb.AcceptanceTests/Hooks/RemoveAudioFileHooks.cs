using System;
using System.Linq;
using AcceptanceTests.Common.AudioRecordings;
using TechTalk.SpecFlow;
using VideoWeb.AcceptanceTests.Helpers;

namespace VideoWeb.AcceptanceTests.Hooks
{
    [Binding]
    public static class RemoveAudioFileHooks
    {
        [AfterScenario(Order = (int)HooksSequence.RemoveAudioFiles)]
        public static void RemoveAudioFiles(TestContext context, ScenarioContext scenario)
        {
            if (!scenario.ScenarioInfo.Tags.Contains("AudioRecording")) return;
            if (context?.VideoWebConfig == null) return;
            if (context.Test.NewHearingId == Guid.Empty) return;
            var wowza = new WowzaManager()
                .SetStorageAccountName(context.VideoWebConfig.Wowza.StorageAccountName)
                .SetStorageAccountKey(context.VideoWebConfig.Wowza.StorageAccountKey)
                .SetStorageContainerName(context.VideoWebConfig.Wowza.StorageContainerName)
                .CreateBlobClient(context.Test.NewHearingId);
            wowza.RemoveAudioFileFromStorage();
        }
    }
}
