#!/bin/bash

./build_app.sh

./build_admin.sh

sudo docker-compose up --build