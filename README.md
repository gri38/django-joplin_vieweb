# joplin-vieweb
A simple web viewer for Joplin app  

## Purpose
I'm going to use Joplin as a note application (instead of OneNote).  
It's a long time I wanted for something like Joplin: opensource, not coupled to a web giant, and without illimited storage: storage has a price, we should pay for it.

This quick dev is to provide an **online view of my Joplin notes**.  
It's running on a "Django server", running beside a configured & running [Joplin terminal app](https://joplinapp.org/terminal/). 

## First screenshot
After a week-end time boxing work, I stop here:  
![joplin-vieweb-screenshot](https://user-images.githubusercontent.com/26554495/119501066-cd16bd00-bd68-11eb-93a2-703da697f52b.png)

## Features and not(-yet?) features
### Yes it does ❤
- Display notebooks, and notes
- code syntax highlight
- Add a table of content if note contains headers
### No it doesn't 💔
- Support tags (but I whish it did)
- Sort notebooks nor notes
- Create / edit / delete notes


## Installation, configuration
Don't hesitate to open a ticket to ask for, I'll be glad to do it quickly.  
But only if you need, I don't enjoy documenting for documentation 😉.

## Why not joplin-web?
I tried for some hours to make it run. The master branch was easy to setup, but work is still in progress.  
And the full featured "vuejs" branch: I just didn't succeed to set it up (neither with node nor with docker).... probably a matter of versions with my raspberry distribution.  
➡ I decided to do my simple own product, for my simple need: view my notes online.  
Thanks for joplin-api that helped me ! I liked the WTF licence, I chose it too.
