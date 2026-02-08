#!/usr/bin/env bash
set -euo pipefail

# Run on a fresh EC2 (Amazon Linux 2 / Ubuntu) to install Docker and Docker Compose
# Usage: sudo ./setup_ec2.sh

if [ -f /etc/os-release ]; then
  . /etc/os-release
fi

echo "Installing Docker..."
# Ubuntu / Debian
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg lsb-release
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io
  sudo usermod -aG docker $USER
# Amazon Linux
elif [ "${ID:-}" = "amzn" ]; then
  sudo yum update -y
  sudo amazon-linux-extras install docker -y
  sudo service docker start
  sudo usermod -aG docker ec2-user
else
  echo "OS not explicitly supported by this script. Install Docker manually."
fi

# Install docker-compose plugin (Docker Compose V2)
if ! command -v docker-compose >/dev/null 2>&1; then
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

echo "Docker and docker-compose should be installed. Log out and back in if necessary to pick up group changes."
