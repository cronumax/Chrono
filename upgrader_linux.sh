#!/bin/bash

rm chrono

wget -q $1/chrono.tar.xz

tar -xf chrono.tar.xz

rm chrono.tar.xz

./chrono
