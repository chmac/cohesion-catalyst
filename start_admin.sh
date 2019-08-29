#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export PACKAGE_DIRS="${DIR}/global-packages/"

export MONGO_URL="mongodb://localhost:3001/meteor"

cd admin
meteor --port 3100