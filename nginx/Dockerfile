FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80 443

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
