# Tribaldex 

![CI](https://github.com/hive-engine/dswap/workflows/CI/badge.svg)
![Deploy](https://github.com/hive-engine/dswap/workflows/Deploy/badge.svg)

The codebase for Tribaldex.

## Installation / Setup

To run locally, you will need to install Node.js. The easiest way to install Node.js is via the downloadable installers on the official Node website [here](https://nodejs.org/en/download/). This is the only prerequisite (besides a computer).

### Clone This Repo

Obvious, but essential. You need to clone or download this repo to be able to run it locally.

### Install Aurelia CLI

The DEX is built using [Aurelia](https://aurelia.io) and as such, the CLI is a requirement to properly run and bundle the application. To install it simply open up a Terminal window and run `npm install aurelia-cli -g` to globally install it.

### Install the packages

By default, Node.js ships with NPM (Node Package Manager) to install Node modules. If you use a different package manager like Yarn, the process is largely the same. In-fact, Yarn is the recommended package manager for working with the DEX, but not a hard requirement.

```shell
npm install
```

## Running The App (Mainnet)

To run the application locally in development mode simply open up your Terminal window and run from the project directory:

```shell
au run --watch
```

The application will then be viewable via: http://localhost:8081

## Running The App (Testnet)

To run the application locally in development mode simply open up your Terminal window and run from the project directory:

```shell
au run --watch --env stage
```

The application will then be viewable via: http://localhost:8081

## Building The App For Production

It's time to ship it, to do a production build simply run the following command in your project directory in a Terminal window:

```shell
au build --env prod
```

This will build the application into a `dist` folder which is the built application. You then deploy this built directory to your chosen location.

## Tests

This project is configured to use Cypress for end-to-end testing and Jest for unit testing. At this time, there are only unit tests. It is a requirement that any work contributed to this repository has accompanying test cases.

A basic test case is checking all code paths, functions and ensuring that you have a test that accounts for failure and for success.

To run the tests type:

```shell
npm run test
```

## Environment / Project Configuration

The application is broken down into three configuration files located within `aurelia_project/environments` these environment files are chosen based on the type of run or build command performed.

There is a `aurelia_project/environments/base.ts` file which the environment configurations all extend from. As you would expect, it is some shared configuration settings all config files inherit to prevent duplicate values.

The `au build --env prod` command above uses the `aurelia_project/environments/prod.ts` file and the `au run --watch` command above uses the `aurelia_project/environments/dev.ts` environment config.

The `au build --env stage` command above uses the `aurelia_project/environments/staging.ts` file and the `au run --watch --env stage` command above uses the `aurelia_project/environments/staging.ts` environment config.

Unless you are developing on the main Tribaldex or creating your own variant, you probably don't need to touch these values whatsoever.
