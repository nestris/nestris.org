FROM debian:bullseye-slim

# Set the working directory inside the container
WORKDIR /app

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy all source files from `src` to the container
COPY ./StackRabbit/src/cpp_modules/src/ /app/

# Compile the application
RUN g++ -o cpp_service http_server.cpp -I/app -lpthread -std=c++17

# Expose the service port
EXPOSE 4500

# Run the application
CMD ["./cpp_service"]
