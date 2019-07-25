using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.Services
{
    public interface IEventsServiceClient
    {
        Task PostEventsAsync(ConferenceEventRequest request);
    }

    public class EventServiceClient : IEventsServiceClient
    {
        private readonly HttpClient _httpClient;

        public EventServiceClient(HttpClient httpClient,
            IOptions<HearingServicesConfiguration> hearingServicesConfiguration)
        {
            var hearingServicesConfiguration1 = hearingServicesConfiguration.Value;
            _httpClient = httpClient;

            _httpClient.BaseAddress = new Uri(hearingServicesConfiguration1.VideoApiUrl);
        }


        public async Task PostEventsAsync(ConferenceEventRequest request)
        {
            var jsonBody = ApiRequestHelper.SerialiseRequestToSnakeCaseJson(request);
            var httpContent = new StringContent(jsonBody, Encoding.UTF8, "application/json");


            var response = await _httpClient.PostAsync(new Uri("callback/conference"), httpContent).ConfigureAwait(false);
            try
            {
                var headers_ = System.Linq.Enumerable.ToDictionary(response.Headers, h_ => h_.Key, h_ => h_.Value);
                var statusCode = response.StatusCode;
                
                if (statusCode == HttpStatusCode.NoContent)
                {
                    return;
                }
                else if (statusCode == HttpStatusCode.BadRequest)
                {
                    var responseText = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                    var problemDetails =
                        ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ProblemDetails>(responseText);
                    throw new VideoApiException<ProblemDetails>("Bad Request", (int) response.StatusCode, responseText,
                        headers_, problemDetails, null);
                } 
                else
                {
                    var responseData_ = response.Content == null
                        ? null
                        : await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                    throw new VideoApiException(
                        "The HTTP status code of the response was not expected (" + (int) response.StatusCode +
                        ").", (int) response.StatusCode, responseData_, headers_, null);
                }
            }
            finally
            {
                response?.Dispose();
            }
        }
    }
}