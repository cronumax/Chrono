#!/bin/bash

rm -r $2/Chrono.app

curl $1/Chrono.app.zip -o $2/Chrono.app.zip

unzip $2/Chrono.app.zip -d $2

rm $2/Chrono.app.zip
