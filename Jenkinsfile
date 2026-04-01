pipeline {
    agent any

    environment {
        TARGET_HOST = "noufal@172.31.38.209"
        APP_DIR = "/home/noufal/auth-app-complete/auth-app"
        BRANCH = "main"
    }

    stages {

        stage('Detect Changes') {
            steps {
                script {
                    def changedFiles = sh(
                        script: "git diff --name-only HEAD~1 HEAD",
                        returnStdout: true
                    ).trim()

                    echo "Changed files: ${changedFiles}"

                    if (changedFiles.contains("backend/")) {
                        env.SERVICE = "backend"
                    } else if (changedFiles.contains("frontend/")) {
                        env.SERVICE = "frontend"
                    } else {
                        env.SERVICE = "all"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                sshagent(['appsrvkey']) {
                    sh """
ssh -o StrictHostKeyChecking=no $TARGET_HOST << EOF
set -e

cd $APP_DIR

git fetch origin
git reset --hard origin/$BRANCH

echo "Deploying service: $SERVICE"

if [ "$SERVICE" = "backend" ]; then
    docker compose up -d --build backend
elif [ "$SERVICE" = "frontend" ]; then
    docker compose up -d --build frontend
else
    docker compose up -d --build
fi

EOF
"""
                }
            }
        }
    }
}
