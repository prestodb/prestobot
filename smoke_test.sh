#!/bin/bash

# This script is used to test the lambda function locally.
# It will send a test event to the lambda function and print the response.
# It requires the following environment variables to be set:
#   LAMBDA_URL: The URL of the lambda function
#   SECRET: The secret used to sign the payload


LAMBDA_URL=$LAMBDA_URL
SECRET=$SECRET
TMP_DATA_FILE=/tmp/smoke.data

echo "{\"action\":\"test\"}" > $TMP_DATA_FILE
SIGN=$(openssl dgst -sha1 -hmac $SECRET $TMP_DATA_FILE | cut -d" " -f2)
curl --request POST --header "X-Hub-Signature: sha1=$SIGN" --header "X-Github-Event: test" --header "X-GitHub-Delivery: fake" --data-binary "@$TMP_DATA_FILE" $LAMBDA_URL
