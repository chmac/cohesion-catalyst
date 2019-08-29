#!/bin/bash

./build_app.sh

./build_admin.sh

docker-compose up --build