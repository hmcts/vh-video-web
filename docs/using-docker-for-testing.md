# Running tests with Docker

## Create the admin web image locally

``` shell
docker build . --file tests/Dockerfile -t video-web-tests --build-arg PAT=$pat
docker run --name video-web-local --network=host -it --mount src="$(pwd)",target=/app,type=bind video-web-tests:latest
```

## Setup a local instance of Sonar

``` shell
docker run -d --name sonarqube -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p 9000:9000 sonarqube:latest
```

The unit and integration tests can be run inside a container. You will need a an access token to build the image locally

## Running all tests in Docker

Open a terminal at the root level of the repository and run the following command

``` shell
docker-compose -f "docker-compose.tests.yml" up --build --abort-on-container-exit
```

> You may need to create a `.env` file to store the environment variables

## Convert test results into coverage report

Run the following in a terminal

``` bash
dotnet reportgenerator "-reports:./Coverage/coverage.opencover.xml" "-targetDir:./Artifacts/Coverage/Report" -reporttypes:Html -sourcedirs:./VideoWeb
```
