# Entra ID Demo App

A minimal Node.js/Express app that:
1. Signs users in with their Microsoft account via **Microsoft Entra ID**
2. Uses the resulting access token to call **Microsoft Graph** (`GET /me`)
3. Shows the user's profile info on a simple page
4. Recommends another show based on your favorite
