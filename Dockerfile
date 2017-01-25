FROM alpine
ENV BUNDLER_VERSION 1.13.5
RUN apk add --update ruby build-base ruby-io-console ruby-irb ruby-json ruby-rake ruby-rdoc libffi-dev ruby-dev libxml2-dev
RUN gem install bundler -v "$BUNDLER_VERSION" --no-document && \
  bundle config --global silence_root_warning 1 && \
  mkdir /app
WORKDIR /app
ADD Gemfile.lock .
ADD Gemfile .
RUN bundle
