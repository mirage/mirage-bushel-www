FROM alpine
ENV BUNDLER_VERSION 1.13.5
RUN apk add --update ruby build-base ruby-io-console ruby-irb ruby-json \
  ruby-rake ruby-rdoc libffi-dev ruby-dev libxml2-dev libxslt-dev imagemagick-dev \
  nodejs git
RUN gem install bundler -v "$BUNDLER_VERSION" --no-document && \
  bundle config --global silence_root_warning 1 && \
  mkdir /app
ENV NOKOGIRI_USE_SYSTEM_LIBRARIES=1 
WORKDIR /app
EXPOSE 4000
