using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Configuration.ConferenceRetrievers
{
    public interface IConferenceRetriever
    {
        ConferenceDetailsResponse GetConference(TestContext context);
    }
}
