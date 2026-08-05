# Entra ID Demo App

A minimal Node.js/Express app that:
1. Signs users in with their Microsoft account via **Microsoft Entra ID**
2. Uses the resulting access token to call **Microsoft Graph** (`GET /me`)
3. Shows the user's profile info on a simple page

This walks you through everything: registering the app in Entra, running it
locally, then deploying it to Azure App Service.

---

## Part 1 — Register the app in Microsoft Entra ID

1. Go to the [Entra admin center](https://entra.microsoft.com) → **Identity > Applications > App registrations**.
2. Click **New registration**.
   - **Name**: `entra-demo-app` (or anything)
   - **Supported account types**: "Accounts in this organizational directory only" is fine for learning. Pick "Accounts in any organizational directory and personal Microsoft accounts" if you want anyone to be able to sign in.
   - **Redirect URI**: platform = **Web**, value = `http://localhost:3000/redirect`
   - Click **Register**.
3. On the app's **Overview** page, copy:
   - **Application (client) ID** → this is `CLIENT_ID`
   - **Directory (tenant) ID** → this is `TENANT_ID`
4. Go to **Certificates & secrets** → **New client secret**.
   - Add a description, choose an expiry (6-12 months is fine for learning).
   - Copy the secret **Value** immediately (it's hidden after you leave the page) → this is `CLIENT_SECRET`.
5. Go to **API permissions**.
   - `User.Read` (Microsoft Graph, delegated) is added by default — that's all this demo needs.
   - (Optional) Click **Grant admin consent** if you're an admin and want to skip the individual consent prompt.
6. Go to **Authentication**.
   - Confirm the Redirect URI `http://localhost:3000/redirect` is listed under **Web**.
   - Under **Implicit grant and hybrid flows**, leave both boxes unchecked (this app uses the more secure auth code flow, not implicit flow).

---

## Part 2 — Run it locally

```bash
cd entra-demo-app
npm install
cp .env.example .env
```

Edit `.env` and paste in the `CLIENT_ID`, `TENANT_ID`, and `CLIENT_SECRET` from Part 1.

```bash
npm start
```

Open **http://localhost:3000**, click **Sign in with Microsoft**, sign in with
an account from your tenant, and you should land on a profile page showing
your name and email — pulled live from Microsoft Graph.

---

## Part 3 — Deploy to Azure App Service

You said you have an Azure subscription, so here's the fastest path using the
Azure CLI. Run these **on your own machine** (not here) after installing the
[Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) and
running `az login`.

```bash
# 1. Create a resource group (skip if you already have one)
az group create --name entra-demo-rg --location eastus

# 2. Create an App Service plan (Linux, free/basic tier for learning)
az appservice plan create \
  --name entra-demo-plan \
  --resource-group entra-demo-rg \
  --sku B1 \
  --is-linux

# 3. Create the Web App (pick a globally unique name)
az webapp create \
  --name your-unique-app-name \
  --resource-group entra-demo-rg \
  --plan entra-demo-plan \
  --runtime "NODE:20-lts"

# 4. Set the environment variables (App Settings) — same values as your .env
az webapp config appsettings set \
  --name your-unique-app-name \
  --resource-group entra-demo-rg \
  --settings \
    CLIENT_ID="<your-client-id>" \
    TENANT_ID="<your-tenant-id>" \
    CLIENT_SECRET="<your-client-secret>" \
    REDIRECT_URI="https://your-unique-app-name.azurewebsites.net/redirect" \
    POST_LOGOUT_REDIRECT_URI="https://your-unique-app-name.azurewebsites.net" \
    SESSION_SECRET="<any-random-string>" \
    NODE_ENV="production"

# 5. Deploy the code (zip deploy from the project folder)
cd entra-demo-app
zip -r ../deploy.zip . -x "node_modules/*" ".env"
az webapp deploy \
  --name your-unique-app-name \
  --resource-group entra-demo-rg \
  --src-path ../deploy.zip \
  --type zip
```

### Update the App Registration for production
Back in the Entra admin center on your App Registration → **Authentication**,
add a second Redirect URI:
```
https://your-unique-app-name.azurewebsites.net/redirect
```
(Keep the `localhost` one too if you still want to test locally.)

Then visit `https://your-unique-app-name.azurewebsites.net` — sign-in should
work the same way as it did locally, now fully hosted in Azure.

---

## How the pieces fit together (for learning)

- **App Registration** = the identity of your app inside Entra ID. It's what
  lets Entra know "this app is allowed to ask users to sign in, and here's
  what it's allowed to access."
- **Client ID / Tenant ID** = public identifiers for your app and your Entra
  directory.
- **Client Secret** = a password your *server* uses to prove it's really your
  app when it exchanges an auth code for a token (never exposed to the
  browser — that's why this is a confidential/server-side client).
- **Redirect URI** = where Entra is allowed to send users back to after they
  sign in. Must match exactly, including `http` vs `https`.
- **Scopes** (`user.read`) = what your app is asking permission to do on the
  user's behalf.
- **Access token** = short-lived credential your server uses to call
  Microsoft Graph as that user.

## Natural next steps once this works
- Add more Graph scopes (e.g. `Mail.Read`, `Calendars.Read`) to pull more data.
- Switch `AzureAD` sign-in restriction to allow specific groups only (Enterprise
  Applications → your app → **Users and groups**).
- Add a second app registration for a pure API (no UI) and call it using the
  **client credentials flow** — a common next step for service-to-service auth.
