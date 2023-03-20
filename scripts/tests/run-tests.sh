#!/bin/sh
set -x

rm -d -r ${PWD}/Coverage
rm -d -r ${PWD}/TestResults
# rm -d -r ${PWD}/VideoWeb/VideoWeb/ClientApp/node_modules

configuration=Debug
exclusions="[VideoWeb]VideoWeb.ConfigureServicesExtensions,[VideoWeb]VideoWeb.Program,[*]VideoWeb.Extensions.*[VideoWeb]VideoWeb.Startup,[Testing.Common]*,[VideoWeb.Common]VideoWeb.Common.*,[VideoWeb]VideoWeb.Security.*,[VideoWeb]VideoWeb.Configuration.*,[VideoWeb]VideoWeb.Pages.*,[VideoWeb.Testing.Common]*,[*]VideoWeb.Swagger.*"

dotnet sonarscanner begin /k:"${SONAR_PROJECT_KEY}" /o:"${SONAR_ORG}" /version:"${SONAR_PROJECT_VERSION}" /name:"${SONAR_PROJECT_NAME}" /d:sonar.host.url="${SONAR_HOST}" /d:sonar.login="${SONAR_TOKEN}" /s:"${PWD}/vh-video-web-sonar-settings.xml"

dotnet build VideoWeb/VideoWeb.sln -c $configuration

# Script is for docker compose tests where the script is at the root level
dotnet test VideoWeb/VideoWeb.UnitTests/VideoWeb.UnitTests.csproj -c $configuration --no-build --results-directory ./TestResults --logger "trx;LogFileName=VideoWeb-Unit-Tests-TestResults.trx" \
    "/p:CollectCoverage=true" \
    "/p:Exclude=\"${exclusions}\"" \
    "/p:CoverletOutput=${PWD}/Coverage/" \
    "/p:MergeWith=${PWD}/Coverage/coverage.json" \
    "/p:CoverletOutputFormat=\"opencover,json,cobertura,lcov\""

# Run the Jasmine tests
# cd VideoWeb/VideoWeb/ClientApp
# npm install
# npm run test-once-ci

# Return to the root directory to finish the SonarQube analysis
# cd $OLDPWD
dotnet sonarscanner end /d:sonar.login="${SONAR_TOKEN}"
