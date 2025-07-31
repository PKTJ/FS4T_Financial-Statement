# image Node.js
FROM node:24

# working directory in container
WORKDIR /app

# copy the configuration file
COPY package*.json ./

# install dependency
RUN npm install
RUN npm install dotenv
RUN npm install googleapis
RUN npm install discord.js

# copy all source code
COPY . .

# run
CMD ["node", "index.js"]
