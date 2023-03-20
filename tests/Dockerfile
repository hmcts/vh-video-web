FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim
WORKDIR /app

## Setting the Sonarqube Organization and Uri
ENV SONAR_ORG "hmcts"
ENV SONAR_HOST "https://sonarcloud.io"
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

## Install Java, because the sonarscanner needs it.
# leave commented until sonar variables are setup properly
RUN apt-get update && apt-get dist-upgrade -y && apt-get install -y openjdk-11-jre

# Install NodeJS
RUN apt-get -y update \
    && apt-get install -y curl \
    && curl -sL https://deb.nodesource.com/setup_12.x | bash - \ 
    && apt-get install -y nodejs \
    && apt-get clean

# Install Chromium due to the dependency of Puppeteer
RUN apt-get update \
    && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends

## Install sonarscanner
RUN dotnet tool install --global dotnet-sonarscanner 

## Set the dotnet tools folder in the PATH env variable
ENV PATH="${PATH}:/root/.dotnet/tools"

COPY ["scripts/tests/run-tests.sh", "/"]
RUN chmod +x /run-tests.sh