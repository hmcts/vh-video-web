#!/bin/sh
set -x

configuration=Release
exclusions="[VideoWeb]VideoWeb.ConfigureServicesExtensions,[VideoWeb]VideoWeb.Program,[*]VideoWeb.Extensions.*[VideoWeb]VideoWeb.Startup,[Testing.Common]*,[VideoWeb.Common]VideoWeb.Common.*,[VideoWeb]VideoWeb.Security.*,[VideoWeb]VideoWeb.Configuration.*,[VideoWeb]VideoWeb.Pages.*,[VideoWeb.Testing.Common]*,[*]VideoWeb.Swagger.*"

# Script is for docker compose tests where the script is at the root level
dotnet test VideoWeb/VideoWeb.UnitTests/VideoWeb.UnitTests.csproj -c $configuration --results-directory ./TestResults --logger "trx;LogFileName=VideoWeb-Unit-Tests-TestResults.trx" \
    "/p:CollectCoverage=true" \
    "/p:Exclude=\"${exclusions}\"" \
    "/p:CoverletOutput=${PWD}/Coverage/" \
    "/p:MergeWith=${PWD}/Coverage/coverage.json" \
    "/p:CoverletOutputFormat=\"opencover,json,cobertura,lcov\"" ||
    {
        echo "##vso[task.logissue type=error]DotNet Unit Tests Failed."
        echo "##vso[task.complete result=Failed]"
        exit 1
    }

# Run the Jasmine tests
npm install --prefix VideoWeb/VideoWeb/ClientApp
npm run --prefix VideoWeb/VideoWeb/ClientApp lint || {
    echo "##vso[task.logissue type=error]Node Linting Failed."
    echo "##vso[task.complete result=Failed]"
    exit 1
}
npm run --prefix VideoWeb/VideoWeb/ClientApp test-once-ci || {
    echo "##vso[task.logissue type=error]Node Unit Tests Failed."
    echo "##vso[task.complete result=Failed]"
    exit 1
}
