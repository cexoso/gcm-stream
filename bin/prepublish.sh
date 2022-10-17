#! /bin/bash
set -e
cd $(dirname $0)
cd ..

# clear all .js and .js.map files
ls -l {**/*.js,**/*.js.map} | awk '{print $9}' | xargs -I {} -t rm {}

npm run test
npm run build
