FROM fanout/pushpin:1.37.0

# Copy routes file
COPY routes /etc/pushpin/routes

# Set log level
RUN sed -i 's/^log_level=.*/log_level=2/' /etc/pushpin/pushpin.conf