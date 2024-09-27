# vh-video-web

Master Build Status:

[![Build Status](https://dev.azure.com/hmcts/Video%20Hearings/_apis/build/status/vh-video-web/hmcts.vh-video-web.sds.master-release?repoName=hmcts%2Fvh-video-web&branchName=master)](https://dev.azure.com/hmcts/Video%20Hearings/_build/latest?definitionId=671&repoName=hmcts%2Fvh-video-web&branchName=master)

PR Build Status:

[![Build Status](https://dev.azure.com/hmcts/Video%20Hearings/_apis/build/status/vh-video-web/hmcts.vh-video-web.sds.pr-release?repoName=hmcts%2Fvh-video-web&branchName=refs%2Fpull%2F1979%2Fmerge)](https://dev.azure.com/hmcts/Video%20Hearings/_build/latest?definitionId=614)

Release Status:

[![Build Status](https://dev.azure.com/hmcts/Video%20Hearings/_apis/build/status/vh-video-web/hmcts.vh-video-web.sds.release?repoName=hmcts%2Fvh-video-web&branchName=release%2F1.43)](https://dev.azure.com/hmcts/Video%20Hearings/_build/latest?definitionId=618)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=vh-video-web&metric=alert_status)](https://sonarcloud.io/dashboard?id=vh-video-web)

## Restore Tools

Run the following in a terminal at the root of the repository

``` shell
dotnet tool restore
```

Open a terminal at the ClientApp folder and run the following command

``` shell
nvm use
```

> You will need Node Version Manager installed  to run the above command 

## Running the app as a container

Visit the VH-Setup repository for
[Instructions to run as a container locally.](https://github.com/hmcts/vh-setup/tree/main/docs/local-container-setup).
