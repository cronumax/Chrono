#!/bin/bash

rm Chrono

wget -q $1/Chrono.tar.xz

tar -xf Chrono.tar.xz

rm Chrono.tar.xz

./Chrono
