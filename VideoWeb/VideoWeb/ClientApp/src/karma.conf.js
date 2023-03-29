// Karma configuration file, see link for more information
// https://karma-runner.github.io/6.4/config/configuration-file.html
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    process.env.CHROME_BIN = process.env.PUPPETEER_EXECUTABLE_PATH;
} else {
    process.env.CHROME_BIN = require('puppeteer').executablePath();
}

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['jasmine', '@angular-devkit/build-angular'],
        plugins: [
            require('karma-jasmine'),
            require('karma-chrome-launcher'),
            require('karma-jasmine-html-reporter'),
            require('karma-coverage'),
            require('karma-junit-reporter'),
            require('@angular-devkit/build-angular/plugins/karma')
        ],
        client: {
            clearContext: false, // leave Jasmine Spec Runner output visible in browser
            jasmine: {
                //tells jasmine to run specs in semi random order, false is default
                random: false,
                failSpecWithNoExpectations: true
            }
        },
        coverageReporter: {
            dir: require('path').join(__dirname, '../coverage'),
            subdir: '.',
            reporters: [{ type: 'html' }, { type: 'lcovonly' }, { type: 'cobertura', file: 'coverage.cobertura.xml' }],
            fixWebpackSourcePaths: true
        },
        junitReporter: {
            outputDir: require('path').join(__dirname, '../jasmine-tests'), // results will be saved as $outputDir/$browserName.xml
            outputFile: undefined, // if included, results will be saved as $outputDir/$browserName/$outputFile
            suite: '', // suite will become the package name attribute in xml testsuite element
            useBrowserName: false, // add browser name to report and classes names
            nameFormatter: undefined, // function (browser, result) to customize the name attribute in xml testcase element
            classNameFormatter: undefined, // function (browser, result) to customize the classname attribute in xml testcase element
            properties: {}, // key value pair of properties to add to the <properties> section of the report
            xmlVersion: null // use '1' if reporting to be per SonarQube 6.2 XML format
        },
        reporters: ['progress', 'kjhtml', 'junit'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['ChromeNoPrompt'],
        customLaunchers: {
            ChromeNoPrompt: {
                base: 'Chrome',
                flags: ['--remote-debugging-port=9222', '--use-fake-ui-for-media-stream', '--mute-audio']
            },
            ChromeHeadlessNoPrompt: {
                base: 'ChromeHeadless',
                flags: ['--remote-debugging-port=9222', '--use-fake-ui-for-media-stream', '--mute-audio', '--no-sandbox']
            }
        },
        singleRun: false
    });
};
