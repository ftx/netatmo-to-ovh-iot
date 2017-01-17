FROM node:alpine 

# ENV Variables
ENV QUERY_TIME 5 
ENV TOKEN_ID tokenid
ENV TOKEN_KEY tokenkey
ENV NETATMO_CLIENT_ID clientid
ENV NETATMO_CLIENT_SECRET clientsecret
ENV NETATMO_USERNAME foo
ENV NETATMO_PASSWORD bar

# Install app dependencies
COPY . /src
WORKDIR /src
RUN npm install

# RUN
CMD ["node", "index.js"]
