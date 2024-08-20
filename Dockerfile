FROM node:20

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install TSC
RUN npm install typescript -g

# Install production dependencies. ## --only=production
RUN npm install 

# Copy local code to the container image.
COPY . .

# Build using tsc
RUN npm run build

# Run the web service on container startup.
CMD [ "npm","run", "start:prod" ]