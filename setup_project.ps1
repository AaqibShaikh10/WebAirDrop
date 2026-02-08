
mkdir client
mkdir server
cd server
npm init -y
npm install socket.io
npm install --save-dev nodemon
cd ../client
npm create vite@latest . -- --template vanilla
npm install
