# Complete Guide to Deploy Backend server and Configure

This document demonstrates all the major process step by step to setup very strong backend on the `VPS`.

For this we used our nodejs,expressjs and typescript backend with dockerfile and nginx configurations.

## 1. Setup you Backend Codebase
At the base level or more create backend server using nodejs,expressjs,typescript,mongodb.

Also setup for eslint.config.mjs, .prettierrc.json etc

You should write your folder stcture like this,

```
project-root/
├── src/                      # Source code (TypeScript)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── app.ts
├── package.json               # Contains all the history of packages used
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs         # ESLint configuration
├── .prettierrc.json          # Prettier configuration
├── .env.example              # Example environment variables
├── .env                      # Actual environment variables
├── README.md                 # Project overview
└── DEPLOYMENT.md             # Deployment documentation
└──server.ts                  # Main Server file
```

## 2. Create Dockerfile
A Dockerfile is used because it defines all the steps required to run your backend application in a clean, isolated, and consistent environment. Instead of manually installing Node.js, dependencies, and building TypeScript on every server, the Dockerfile packages your entire backend—code, Node version, dependencies, and build process—into a single container image that works the same everywhere, making deployment faster, safer, and more reliable on any VPS or cloud platform.

Add Data in Dockerfile:
```json
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# build production image

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci
#--omit=dev

COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app && chmod -R 755 /app

RUN npm install pm2 -g

COPY ecosystem.config.js .

USER node

EXPOSE 5513

CMD ["pm2-runtime", "start", "ecosystem.config.js"]


```


## 3. Understanding the `outDir` in TypeScript
The `outDir` option in your `tsconfig.json` tells TypeScript where to place the compiled JavaScript files after converting your `.ts` source code into `.js`. When you run `tsc`, all TypeScript files from `src/` are compiled and saved into the `dist/` folder instead of mixing with your original source files. This keeps your project clean by separating source code (`src/`) from build output (`dist/`), and the dist folder is what your server or Docker container actually uses in production.


## 4. Update Scripts in `package.json`
To streamline development, building, and publishing your backend application as a Docker image, update the `scripts` section of your `package.json` as shown below:
```json
"scripts": {
  "start": "node server.ts",
  "server": "nodemon server.ts",
  "build": "tsc",
  "docker:publish": "docker build -t dockerhubusername/prod-backend:v1 --platform linux/amd64 . && docker push dockerhubuser/prod-backend:v1"
}
```

## 5. create `ecosystem.config.js`
To manage and run your backend efficiently in production using `PM2`, create an `ecosystem.config.js` file. This file defines how your application should run, including clustering, environment settings, and process management.
```json
module.exports = {
  apps: [
    {
      name: "prod-backend",
      script: "./dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
```
### **Why this file is important**

- **`instances: "max"`** → Utilizes all CPU cores for maximum performance.  
- **`exec_mode: "cluster"`** → Enables zero-downtime reloads and better load handling.  
- **`script: "./dist/server.js"`** → Executes the compiled JavaScript build instead of raw TypeScript.  
- **`env` / `env_production`** → Allows switching between development and production environments seamlessly.  

Using PM2 makes your server more stable by providing auto-restarts, enhanced monitoring, and centralized logging.


## 6. Upload Your Container Image to Docker Hub Using the `package.json` Script
Before publishing your Docker image, you must first compile your TypeScript code so the `/dist` folder is created. Then you can build and push the image using the script defined in your `package.json`.

### **Step 1: Build your backend**

Run the TypeScript compiler to generate the `dist/` folder:

```bash
npm run build
```

This ensures Docker uses the latest compiled production files.

---

### **Step 2: Publish your Docker image**

Use the script from your `package.json` to build and push your container image:
```bash
npm run build
```

```bash
npm run docker:publish
```

Once completed, your updated production image is available on Docker Hub and ready to be deployed on any VPS.


## 7. Create `Docker-compose.yaml`
The `docker-compose.yaml` file allows you to run multiple services—MongoDB, Redis, and multiple backend instances—together in a single command.
This setup also places all services inside the same private Docker network for secure internal communication.

```yaml
services:
  mongoserver:
    image: mongo
    container_name: mongodb-server
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=root
    volumes:
      - ~/mongo/data:/data/db
    networks:
      - prod-backend

  redisserver:
    image: redis:7
    container_name: redis-server
    ports:
      - "6379:6379"
    networks:
      - prod-backend

  backend1:
    image: makwanagautam/prod-backend:v1
    container_name: backend1
    environment:
      - PORT=5513
    expose:
      - "5513"
    networks:
      - prod-backend
    depends_on:
      - mongoserver
      - redisserver
    env_file: .env

  backend2:
    image: makwanagautam/prod-backend:v1
    container_name: backend2
    environment:
      - PORT=5514
    expose:
      - "5514"
    networks:
      - prod-backend
    depends_on:
      - mongoserver
      - redisserver
    env_file: .env

  backend3:
    image: makwanagautam/prod-backend:v1
    container_name: backend3
    environment:
      - PORT=5515
    expose:
      - "5515"
    networks:
      - prod-backend
    depends_on:
      - mongoserver
      - redisserver
    env_file: .env

networks:
  prod-backend:
    driver: bridge
```

### **What this compose setup does**

- **MongoDB container** → Stores all database data in a persistent local volume.  
- **Redis container** → Used for caching, rate limiting, queues, sessions, and more.  
- **Three backend containers** →  
  - Each runs on a different port: **5513**, **5514**, **5515**  
  - Enables horizontal scaling that spinup three backend server
- **Shared Docker network (`prod-backend`)** →  
  Allows all services to communicate internally without exposing MongoDB or Redis to the public internet.

### **Step 8: Update and upgrade your VPS**

```bash
sudo apt update && sudo apt upgrade -y
```

This command:

- Updates package lists  
- Installs the latest security patches  
- Ensures your system is ready for Docker, Nginx, and deployment  

---

### Enable the firewall (UFW)

```bash
sudo ufw enable
```

This command enables the firewall to add an extra layer of security.

---

### Step 3: Allow essential ports

```bash
sudo ufw allow ssh
```

```bash
sudo ufw allow http
```

```bash
sudo ufw allow https
```

These commands allow public access to:  
- **Port 22** → SSH (server login)  
- **Port 80** → HTTP (web traffic)  
- **Port 443** → HTTPS (secure traffic)  

### 9: Create a new user

```bash
sudo useradd -m -s /bin/bash dockeruser
```

- `-m` → Creates a home directory  
- `-s /bin/bash` → Assigns Bash as the default shell  

---

### Set a password for the user

```bash
sudo passwd dockeruser
```

This will prompt you to enter and confirm the new password.


## 10. Install `Docker` Using the Convenience Script
Docker provides an official convenience script at https://get.docker.com
 that installs Docker Engine quickly and non-interactively.
This method is ideal for development and VPS setups, but not recommended for critical production systems where fine-grained package control is required.

### ⚠️ Important Notes Before Using the Script

- The script **requires root or sudo** privileges.  
- It automatically detects your Linux distribution and configures package sources.  
- It **does not allow customization** of installation parameters.  
- It installs required dependencies **without asking for confirmation**.  
- It always installs the **latest stable version** of Docker, containerd, and runc.  
- Using this method may unexpectedly **upgrade Docker versions** during provisioning.  
- The script is **not designed for upgrading** an existing Docker installation.  
- Always review scripts downloaded from the internet before running them.

The script’s source code is open-source and available in the **docker-install** GitHub repository.

---

### **Step 1: Download the Docker installation script**

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
```

---

### **Step 2: Run the installer**

```bash
sudo sh ./get-docker.sh
```

This installs:

- Docker Engine  
- Docker CLI  
- containerd  
- runc  
- docker-compose plugin  

---

### **Step 3: Verify Docker installation**

```bash
sudo docker run hello-world
```

You should see a message confirming Docker is installed and working.

---

## 11. Allow Your Non-Root User to Use Docker
By default, Docker commands require sudo.
To allow your non-root user (example: dockeruser) to run Docker without sudo, you must add them to the docker group.
### **Add your user to the Docker group**

```bash
sudo usermod -aG docker dockeruser
```

Replace `dockeruser` with the username you created.

---


## 12. Switch to Your Non-Root User & Prepare the App Directory
After creating the non-root user (dockeruser) and giving Docker permissions, switch to that user and set up your project structure.

### **Step 1: Switch to the new user**

```bash
su - dockeruser
```

---

### **Step 2: Create an apps directory**

```bash
mkdir apps
cd apps
```

---

### **Step 3: Create your backend project folder**

```bash
mkdir prod-backend
cd prod-backend
```

---

### **Step 4: Create the `docker-compose.yaml` file**

Use either **vim** or **nano** (recommended for beginners):

```bash
nano docker-compose.yaml
```

Paste your previously created Docker Compose configuration inside this file.

Save and exit:
- For nano → `CTRL + O`, press Enter, then `CTRL + X`
- For vim → `ESC`, type `:wq`, press Enter

---

### **Step 5: Create the `.env` file**

```bash
nano .env
```

Paste the following environment variables (modify as needed):

```env
# ========================================
# 🔧 GENERAL CONFIGURATION
# ========================================
PORT=5513
ENV="development"    # change to "production" in production environments

# ========================================
# 🗄️ DATABASE CONFIGURATION (MONGODB)
# ========================================
# Use your actual domain instead of localhost in production

# --- Development ---
DB_CONNECTION_STRING="mongodb://localhost:27017/prod-backend"

# --- Production (Docker MongoDB) ---
# DB_CONNECTION_STRING="mongodb://makwanagautam:mymongodb@mongoserver:27017/prod-backend?authSource=admin"

# ========================================
# 🔐 AUTH / SECURITY
# ========================================
JWT_SECRET="your-jwt-secret-string"

# ========================================
# 🌐 CLIENT / FRONTEND URLS
# ========================================
CLIENT_URL="https://yourdomain.com"   # Replace with your actual domain

# ========================================
# ☁️ CLOUDINARY CONFIGURATION
# ========================================
CLOUDINARY_CLOUD="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret_key"

# ========================================
# 🚀 REDIS CONFIGURATION
# ========================================
# --- Development (local Redis) ---
REDIS_HOST="127.0.0.1"

# --- Production (Docker Redis container) ---
# REDIS_HOST="redisserver"

REDIS_PORT="6379"
REDIS_PASSWORD="myredis"
```

Save and exit your editor.

---

### 🔥 **Important Note**
For production, update these settings:

- Use your **actual domain**  
- Use your **production MongoDB connection string**  
- Set `ENV="production"`  
- Set `REDIS_HOST="redisserver"`  
- Set Redis password for online external service else comment it
- Replace secrets with secure values  

---

## 13. Start Your Containers Using Docker Compose
Once your `docker-compose.yaml` and `.env` files are ready, you can start all services (MongoDB, Redis, and backend containers) using Docker Compose.

### **Run the Docker Compose stack**

```bash
docker compose up -d
```

---

### **What this command does**

- Pulls your Docker images (if not already available)  
- Creates containers for MongoDB, Redis, and all backend instances  
- Starts everything in **detached mode** (`-d`) so it runs in the background  

---

### ⚠️ **Possible warnings or errors**

At this stage, you might see errors related to:

- Nginx not configured yet  
- Backend ports not exposed externally  
- Load balancer not set up  
- Environment variables not optimized  

This is **expected** because Nginx reverse proxy and load balancing are configured in the next steps.

---

Once containers are running, you can confirm with:

```bash
docker ps
```


## 14. Add a MongoDB User Inside the Mongo Container
Once your MongoDB container is running, you should create a new database user (NOT root) for your application. This improves security and prevents running your backend with the root MongoDB account.

### **Step 1: Enter the MongoDB container**

Replace `<mongo-container-name>` with your actual container name (example: `mongodb-server`).

```bash
docker exec -it <mongo-container-name> sh
```

---

### **Step 2: Log into MongoDB with the root user**

```bash
mongosh -u root -p root --authenticationDatabase admin
```

This opens the Mongo shell using the root credentials you defined in your Docker Compose file.

---

### **Step 3: Switch to the `admin` database**

```bash
use admin
```

---

### **Step 4: Create a new MongoDB user**

Replace:

- `yourname` → your desired username  
- `yourpassword` → your strong password  
- `yourdb` → your actual application database name  

```javascript
db.createUser({
  user: "yourname",
  pwd: "yourpassword",
  roles: [
    { role: "readWrite", db: "yourdb" }
  ]
})
```

Example for your project:

```javascript
db.createUser({
  user: "prodbackenduser",
  pwd: "supersecurepassword",
  roles: [
    { role: "readWrite", db: "prod-backend" }
  ]
})
```

---

### ✅ **User Created Successfully**

You will now see output similar to:

```json
{
  "user" : "yourname",
  "db" : "admin",
  "roles" : [
    { "role" : "readWrite", "db" : "yourdb" }
  ]
}
```

You can now use this username and password in your `.env`:

```env
DB_CONNECTION_STRING="mongodb://yourname:yourpassword@mongoserver:27017/yourdb?authSource=admin"
```

---


## 15. Stop All Containers and Start Everything Again
After setting up MongoDB users or updating configuration files, it's a good practice to stop all running containers and run them again to ensure all changes apply properly.
### **Step 1: Stop all running containers**

```bash
docker compose down
```

This command:

- Stops all containers  
- Removes networks created by docker-compose  
- Shuts down the entire stack cleanly  

---

### **Step 2: Start all containers again**

```bash
docker compose up -d
```

This will:

- Re-create MongoDB, Redis, and backend containers  
- Apply your `.env` updates  
- Apply updated MongoDB users  
- Rebuild missing images if needed  

---

### **Step 3: Verify running containers**

```bash
docker ps
```

You should now see:

- `mongodb-server`  
- `redis-server`  
- `backend1`, `backend2`, `backend3`  

all running successfully.


## 16. Fix UFW Firewall Rules for Docker Before Configuring Nginx

When Docker is installed, it bypasses UFW firewall rules and exposes container ports directly on the host.
This means even if UFW is enabled, Docker can still open ports to the public — which is a security risk.

To fix this, you must manually update the UFW configuration so Docker traffic is filtered correctly.
### ⚠️ Why this step is required?

- Docker modifies iptables rules directly  
- UFW does **not** see those changes  
- As a result, Docker containers may expose ports publicly  


This step ensures your firewall works **with Docker**, not against it.

---

### **Step 1: Open the UFW after.rules file**

```bash
sudo nano /etc/ufw/after.rules
```

Scroll to the **bottom** of the file.

---

### **Step 2: Add this code at the end of the file**

```text
# BEGIN UFW AND DOCKER
*filter
:ufw-user-forward - [0:0]
:DOCKER-USER - [0:0]
-A DOCKER-USER -j RETURN -s 10.0.0.0/8
-A DOCKER-USER -j RETURN -s 172.16.0.0/12
-A DOCKER-USER -j RETURN -s 192.168.0.0/16

-A DOCKER-USER -j ufw-user-forward

-A DOCKER-USER -j DROP -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 192.168.0.0/16
-A DOCKER-USER -j DROP -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 10.0.0.0/8
-A DOCKER-USER -j DROP -p tcp -m tcp --tcp-flags FIN,SYN,RST,ACK SYN -d 172.16.0.0/12
-A DOCKER-USER -j DROP -p udp -m udp --dport 0:32767 -d 192.168.0.0/16
-A DOCKER-USER -j DROP -p udp -m udp --dport 0:32767 -d 10.0.0.0/8
-A DOCKER-USER -j DROP -p udp -m udp --dport 0:32767 -d 172.16.0.0/12

-A DOCKER-USER -j RETURN
COMMIT
# END UFW AND DOCKER
```

Save and exit:  
- For nano → `CTRL + O`, Enter, then `CTRL + X`

---

### **Step 3: Restart UFW**

```bash
sudo systemctt restart Ufw
```

This ensures the firewall rules take effect.

---

### ✔️ What this fixes

- Prevents Docker from bypassing UFW  
- Blocks unwanted traffic from private IP ranges  
- Allows internal Docker network communication   
- Improves VPS security before exposing your backend publicly  

---

## 17. Install Nginx on Your VPS
Nginx will act as the reverse proxy, load balancer, and eventually handle SSL certificates for your backend server.

Install Nginx using apt:

### **Step 1: Install Nginx**

```bash
sudo apt install nginx -y
```

---

### **Step 2: Verify Nginx is running**

```bash
sudo systemctl status nginx
```

You should see **active (running)**.

---

### **Step 3: Visit your server IP in the browser**

Open:

```
http://YOUR_VPS_IP
```

If everything is working, you should see the **default Nginx welcome page**, like this:

> *Welcome to nginx!*  
> If you see this page, the nginx web server is successfully installed and working.

This means Nginx was installed successfully and is ready for reverse proxy configuration.

---

## 18. Modify nginx.conf and Comment Out the Sites-Enabled Include Line
Before creating your custom reverse proxy configuration, you must disable the default Nginx “sites-enabled” autoload mechanism.
This prevents conflicts with the default server blocks like the Welcome to nginx! page.

### **Step 1: Open the main Nginx configuration file**

Use either `nano` or `vim`:

```bash
sudo nano /etc/nginx/nginx.conf
```

---

### **Step 2: Scroll to the bottom and find this line**

```nginx
include /etc/nginx/sites-enabled/*;
```

---

### **Step 3: Comment out this line**

Change it to:

```nginx
# include /etc/nginx/sites-enabled/*;
```

---

### **Why do we comment out this line?**

- Nginx automatically loads all configuration files inside `/etc/nginx/sites-enabled/`.  
- Ubuntu includes a **default server configuration** (`default`) that shows the “Welcome to nginx!” page.  
- If this default config is active, it **overrides your custom reverse proxy settings**, preventing your backend from working.  
- By commenting it out, you ensure **only your custom config file** (which we will create next) controls all Nginx behavior.

In short:  
**We disable the default Nginx site so it doesn’t conflict with our custom backend reverse proxy setup.**

---

### **Step 4: Save and exit**

For nano:  
`CTRL + O`, Enter → `CTRL + X`  

For vim:  
`:wq` → Enter

---

## 19. Create Your Custom Nginx Reverse Proxy Configuration

Your backend cluster (backend1, backend2, backend3) needs to be load-balanced through Nginx.
To do this, you must create a new Nginx config file inside `/etc/nginx/conf.d`

### **Step 1: Go to the Nginx `conf.d` directory**

```bash
cd /etc/nginx/conf.d
```

---

### **Step 2: Create a new Nginx config file**

This file handles your domain + load balancer settings.

Example:

```bash
sudo nano subdomain.maindomain.conf
```

Replace `subdomain.maindomain` with your actual domain like:

- `api.yourdomain.com`
- `backend.yourdomain.in`
- `service.yourdomain.net`

---

### **Step 3: Add the upstream cluster + server block**

Paste the following:

```nginx
upstream backend_cluster {
    server 127.0.0.1:5513;
    server 127.0.0.1:5514;
    server 127.0.0.1:5515 backup;
}

server {
    server_name subdomain.maindomain;

    location / {
        proxy_pass http://backend_cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

### **Explanation of the config**

- **upstream backend_cluster** → defines load balancing across your 3 backend containers  
- `5513`, `5514`, `5515` → ports exposed by backend1, backend2, backend3  
- **backup** → if server 1 or 2 fails, server 3 will be used  
- **server_name** → your API domain  
- **proxy_pass** → sends all traffic to the backend load balancer  
- Sets proper headers required for real IP and routing  

---

### **Step 4: Save and exit**

For nano:  
`CTRL + O`, Enter → `CTRL + X`

---

### **Step 5: Test Nginx configuration**

```bash
sudo nginx -t
```

If no errors:  
```bash
sudo systemctl reload nginx
```

---

## 🎉 **Congratulations! Your Server Is Now Live With Nginx, Load Balancing & Reverse Proxy**

## 20. Add an A Record for Your Domain
To make your backend accessible via your domain, you must create an A Record in your domain provider’s DNS settings.
### **DNS Configuration**

Create an **A Record**:

| Type | Name               | Value (Your VPS IP)     | TTL      |
|------|--------------------|--------------------------|----------|
| A    | subdomain.domain   | YOUR_VPS_IP_ADDRESS     | Default  |

Example:

| Type | Name               | Value        |
|------|--------------------|--------------|
| A    | api.yourdomain.com | 146.190.88.21 |

After saving, DNS propagation may take **1–10 minutes** (sometimes up to 24 hours).

Once DNS resolves successfully, your domain will point to your VPS.



## 21. Add SSL to Your Domain (HTTPS with Certbot)
o enable HTTPS and secure your API domain, use Certbot with Nginx.

### **Step 1: Install Certbot**

```bash
sudo snap install --classic certbot
```

---

### **Step 2: Create Certbot symlink**

```bash
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

---

### **Step 3: Generate and install SSL certificates (automatic nginx configuration)**

This command obtains an SSL certificate **and automatically updates your Nginx config**:

```bash
sudo certbot --nginx
```

Choose your domain from the list and proceed.

---

### **Alternative Option: Get certificate only**

Use this if you want to manually update your Nginx config:

```bash
sudo certbot certonly --nginx
```

---

### **Step 4: Test automatic renewal**

Certbot automatically renews certificates using cron/systemd.  
You can test renewal with:

```bash
sudo certbot renew --dry-run
```

If no errors appear, your SSL setup is working correctly.

---

### ✔️ After SSL Setup

Your domain will now:

- Serve **HTTPS** traffic  
- Use automatic SSL renewal  
- Be fully protected with modern encryption  
- Work seamlessly with Nginx reverse proxy + load balancing  

### **Certbot automatically updates your Nginx configuration**

When you run:

```bash
sudo certbot --nginx
```

Certbot automatically:

- Detects your Nginx config files  
- Inserts SSL certificates  
- Adds HTTPS redirection  
- Reloads Nginx settings  

You do **not** need to manually edit your Nginx files for SSL.

---

### **Validate Nginx configuration**

```bash
sudo nginx -t
```

If everything shows:

```
syntax is ok
test is successful
```

Then restart Nginx:

```bash
sudo systemctl restart nginx
```

---

## 🎉 **Congratulations! Your domain is now fully secured with HTTPS and running behind Nginx reverse proxy + load balancing.**
Your backend server is officially **live, secure, scalable, and production-ready. 🚀**
