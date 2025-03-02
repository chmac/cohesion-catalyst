#!/bin/bash

echo "Building ADMIN"

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
export PACKAGE_DIRS="${DIR}/global-packages/"

cd admin
meteor build --directory ../builds/admin/ --architecture=os.linux.x86_64 --server localhost

cp ../Dockerfile ../builds/admin/bundle
