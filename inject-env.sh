#!/bin/sh
echo "Injecting runtime environment variables..."

# Copy files from read-only directory to writable /tmp/html
mkdir -p /tmp/html
cp -r /usr/share/nginx/html/* /tmp/html/

if [ -n "$VITE_COGNITO_USER_POOL_ID" ]; then
  echo "Setting VITE_COGNITO_USER_POOL_ID to $VITE_COGNITO_USER_POOL_ID"
  find /tmp/html -type f -name "*.js" -exec sed -i "s|__VITE_COGNITO_USER_POOL_ID__|$VITE_COGNITO_USER_POOL_ID|g" {} +
fi

if [ -n "$VITE_COGNITO_APP_CLIENT_ID" ]; then
  echo "Setting VITE_COGNITO_APP_CLIENT_ID to $VITE_COGNITO_APP_CLIENT_ID"
  find /tmp/html -type f -name "*.js" -exec sed -i "s|__VITE_COGNITO_APP_CLIENT_ID__|$VITE_COGNITO_APP_CLIENT_ID|g" {} +
fi
