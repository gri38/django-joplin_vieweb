#!/bin/sh

su pi
screen -dmS joplin\_screen
screen -S joplin\_screen -X title joplin\_server
screen -S joplin\_screen -p 0 -X stuff "sqlite3 ~/.config/joplin/database.sqlite \"INSERT INTO settings ('key', 'value') VALUES('api.token', '1234567890987654321')\"^M"
screen -S sessionName -p 0 -X stuff "joplin server start"
screen -S joplin_screen -X screen -t bash
screen -S joplin_screen -X next
screen -S joplin_screen -X screen -t daphne
screen -S joplin_screen -X next
screen -S joplin\_screen -p 0 -X stuff "cd^M"
screen -S joplin\_screen -p 0 -X stuff "cd .joplin-vieweb^M"
screen -S joplin\_screen -p 0 -X stuff ". venv/bin/activate^M"
screen -S joplin\_screen -p 0 -X stuff "cd joplinweb/^M"
screen -S joplin\_screen -p 0 -X stuff "daphne -p 8001 joplinweb.asgi:application^M"
