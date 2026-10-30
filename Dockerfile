# Docker Hub's CDN is not always reachable from the production VPS. These are
# the official Docker Library images mirrored by Amazon ECR Public.
FROM public.ecr.aws/docker/library/node:20-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM public.ecr.aws/docker/library/node:20-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . ./

ARG VITE_API_URL
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME
ARG VITE_BASE_URL_IMAGE
ARG VITE_DEBUG_GR_DATE=false
ARG VITE_DEMO_MODE=false
ARG VITE_GEOAPIFY_API_KEY
ARG VITE_WEATHER_API_KEY
ARG VITE_CURRENCY_API_KEY

ENV VITE_API_URL=$VITE_API_URL \
    VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME \
    VITE_BASE_URL_IMAGE=$VITE_BASE_URL_IMAGE \
    VITE_DEBUG_GR_DATE=$VITE_DEBUG_GR_DATE \
    VITE_DEMO_MODE=$VITE_DEMO_MODE \
    VITE_GEOAPIFY_API_KEY=$VITE_GEOAPIFY_API_KEY \
    VITE_WEATHER_API_KEY=$VITE_WEATHER_API_KEY \
    VITE_CURRENCY_API_KEY=$VITE_CURRENCY_API_KEY

RUN npm run build

FROM public.ecr.aws/docker/library/node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/build ./build
COPY --from=build /app/public ./public

USER node
EXPOSE 3000
CMD ["node_modules/.bin/react-router-serve", "build/server/index.js"]
