#!/bin/sh

su -c "screen -dmS joplin" pi
su -c "screen -S joplin -X title joplin\_server" pi
su -c "screen -S joplin -X stuff \"sqlite3 ~/.config/joplin/database.sqlite \\\"INSERT INTO settings ('key', 'value') VALUES('api.token', '1234567890987654321')\\\"^M\"" pi
su -c "screen -S joplin -X stuff \"joplin server start\"" pi
su -c "screen -S joplin -X screen -t bash" pi
su -c "screen -S joplin -X screen -t daphne" pi
su -c "screen -S joplin -X stuff \"cd^M\"" pi
su -c "screen -S joplin -X stuff \"cd .joplin-vieweb^M\"" pi
su -c "screen -S joplin -X stuff \". venv/bin/activate^M\"" pi
su -c "screen -S joplin -X stuff \"cd joplinweb/^M\"" pi
su -c "screen -S joplin -X stuff \"daphne -p 8001 joplinweb.asgi:application^M\"" pi
