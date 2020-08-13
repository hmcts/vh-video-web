using VideoWeb.Services.Bookings;
using UpdateParticipantRequest = VideoWeb.Services.Bookings.UpdateParticipantRequest;

namespace VideoWeb.AcceptanceTests.Builders
{
    public class UpdateParticipantBuilder
    {
        private readonly UpdateParticipantRequest _request;

        private string _appendWord;
        private ParticipantResponse _participant;

        public UpdateParticipantBuilder()
        {
            _request = new UpdateParticipantRequest();
        }

        public UpdateParticipantBuilder ForParticipant(ParticipantResponse participant)
        {
            _participant = participant;
            return this;
        }

        public UpdateParticipantBuilder AddWordToStrings(string word)
        {
            _appendWord = word;
            return this;
        }

        public UpdateParticipantRequest Build()
        {
            _request.Display_name = $"{_appendWord} {_participant.Display_name}";
            _request.Organisation_name = _participant.Organisation;
            _request.Representee = _participant.Representee;
            _request.Reference = _participant.Reference;
            _request.Telephone_number = _participant.Telephone_number;
            _request.Title = $"{_appendWord}";
            return _request;
        }

        public UpdateParticipantRequest Reset()
        {
            _request.Display_name = $"{_participant.Display_name.Replace($"{_appendWord}","")}";
            _request.Organisation_name = _participant.Organisation;
            _request.Representee = _participant.Representee;
            _request.Reference = _participant.Reference;
            _request.Telephone_number = _participant.Telephone_number;
            _request.Title = "Mrs";
            return _request;
        }
    }
}

