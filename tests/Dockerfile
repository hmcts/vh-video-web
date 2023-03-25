FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim
WORKDIR /app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

# Install NodeJS and chromium
RUN apt-get -y update \
    && apt-get install -y curl \
    && curl -sL https://deb.nodesource.com/setup_18.x | bash - \ 
    && apt-get install -y nodejs \
    && apt-get clean

RUN apt-get update \
    && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends

COPY ["scripts/tests/run-tests.sh", "/"]
RUN chmod +x /run-tests.sh