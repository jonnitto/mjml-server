#!/bin/bash

# Manual test to spool up the latest docker image, submit the raw body and print
# the actual result for human review.

docker run --rm -p 8090:8080 -e "CORS=*" --name mjml-server-test carbon/mjml-server:latest

sleep 5

curl -v -H 'Content-Type: application/json; charset=utf-8' --data "@payload.json" http://localhost:8090

docker stop mjml-server-test
