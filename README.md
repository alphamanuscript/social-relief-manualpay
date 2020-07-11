# SocialRelief ManualPay

This project keeps track of [SocialRelief](https://github.com/alphamanuscript/social-relief) transactions
(e.g. donation distributions) that should be executed manually. SocialRelief uses it as a back-up
payment provider for donation distributions.

## Installation

```
yarn
```

## Running the app

```
node app/index
```

This runs the app on port 5000.

## Configuration

The following environment variables are available for configuration:

Environment variable | Description                | Default
---------------------|----------------------------|----------------
`DB_URL`             | MongoDB's connection URL   | `mongodb://localhost:27017/manualpay_socialrelief`
`DB_NAME`            | Database name              | `manualpay_socialrelief`
`BASE_PATH_SECRET`   | Secret path prefix used to hide app's urls for security. If set to `/mysecret` (*notice the leading slash*), then a path like `localhost:5000/completed` will be replaced with `localhost:5000/mysecret/completed` | *empty*
`WEBHOOK_URL`        | The URL on SocialRelief's server to send payment notifications to | `http://localhost:3000/webhooks/manualpay`
`PORT`               | Port the server listens on | `5000`
