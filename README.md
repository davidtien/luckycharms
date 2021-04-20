
## Multiplayer Whiteboard Prototype:

## Features
1. Basic diagramming features
   1.  Shapes
   2.  Move/Resize/Rotate
   3.  Colors
2. Multiplayer 
   1.  Presence panel to see active collaborators
   2.  See collaborator cursors 

## DemoVid

## Architecture
<img width="1101" alt="arch-diagram" src="https://user-images.githubusercontent.com/3998480/115320566-01c6a180-a137-11eb-93cb-3032cf936603.png">

## For Local Dev
1.  Prereq: [Install Docker](https://docs.docker.com/get-docker/)
2.  Prereq: [Install Node](https://nodejs.org/en/download/)
3.  Clone repo
4.  sh ./install_node_modules.sh ( only needed first time, or if modify dependencies )
5.  docker-compose -f docker-compose-dev.yml up -d
6.  open [http://localhost/doc1/](http://localhost/doc1/)

