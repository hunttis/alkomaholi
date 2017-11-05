# alkomaholi
API for Alko prices

Alko is the centralized alcohol monopoly in Finland. You want harder Alcohol, you go to Alko. 
They provide prices for everything they sell, but only in a daily updated Excel form.
This app downloads and parses that form and serves it in a searchable form.

# How to start it up

Currently the server and client are built separate, and there is a clunky way to run the server and keep the client updated.

Open a terminal in the client-directory and run `npm run dev`.

Open a second terminal in the main directory and run `npm run dev`.

The dev script for the client is not likely to work on windows, since it uses the 'cp'-command.

When the UI is modified, it gets rebuilt and deployed to the public directory under the main directory. 
This is pretty far from optimal, but will be fixed in the future.
