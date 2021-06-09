#!/bin/sh

joplin_profile=/home/pi/.config/joplin

echo "ongoing" > ${joplin_profile}/sync_info
joplin sync
date '+%d %B %Y %H:%M' > ${joplin_profile}/sync_info
