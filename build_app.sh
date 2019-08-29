#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export PACKAGE_DIRS="${DIR}/global-packages/"

cd app
meteor build --directory ../builds/app/ --architecture=os.linux.x86_64 --server localhost

cp Dockerfile ../builds/app/bundle