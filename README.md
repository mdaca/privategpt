# MDACA PrivateGPT - Solution Accelerator
## Unleash the Power of AWS Bedrock, Azure Open AI or the Open AI APIs with your Private Content

ChatGPT has grown explosively in popularity as we all know now. Business users across the globe often tap into the public service to work more productively or act as a creative assistant.

However, ChatGPT risks exposing confidential intellectual property. One option is to block corporate access to ChatGPT, but people always find workarounds. This also limits the powerful capabilities of ChatGPT and reduces employee productivity and their work experience.

MDACA PrivateGPT is our enterprise option.

![](/images/highlevel.png)

### Benefits are:

**1. Private:** Built-in guarantees around the privacy of your data and fully isolated.

**2. Controlled:** Network traffic can be fully isolated to your network and other enterprise grade security controls are built in.

**3. Value:** Deliver added business value with your own internal data sources (plug and play) or develop plug-ins to integrate with your internal services (e.g., ServiceNow, etc).

**4. Knowledge Stores:** Ask questions over hundreds of pages or your own content and webpages.

![](/images/graph-store.png)

![](/images/add-content.png)

We've built a Solution Accelerator to empower your workforce with MDACA PrivateGPT.

# 📘 Prerequisites

1. [AWS Bedrock](https://aws.amazon.com/bedrock/): To utilize Bedrock, you must first request model access.  Follow these [instructions](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) to request model access.
   **or** 
   [Azure OpenAI](https://azure.microsoft.com/en-us/products/cognitive-services/openai-service/): To deploy and run ChatGPT on Azure, you'll need an Azure subscription with access to the Azure OpenAI service. Once you have access, follow the instructions in this [link](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/how-to/create-resource?pivots=web-portal) to deploy the gpt-35-turbo or gpt-4 models.
   **or** 
   [OpenAI APIs](https://openai.com/blog/openai-api): To run directly against the OpenAI APIs, you'll need to acquire an API key.
2. Setup an Authentication Provider:
   The [Add an identity provider](#-add-an-identity-provider) section below shows how to configure authentication providers.
3. Setup ChromaDB as a Vectorstore:
   ChromaDB should be running in client/server mode and configured via CHROMA_URL to utilize large knowledge stores.
3. Setup [DozerDB](https://dozerdb.org/) as a graph database:
   DozerDB should be running and configured via NEO4J_URI to utilize graph knowledge stores.
5. Setup MySQL as a Database Server:
   MySQL should be running and available to store the chat history.

   💡Note: You can configure the authentication provider to your identity solution using [NextAuth providers](https://next-auth.js.org/providers/)

# 👋🏻 Introduction

MDACA PrivateGPT is built with the following technologies.

[Node.js 18](https://nodejs.org/en): an open-source, cross-platform JavaScript runtime environment.

[Next.js 13](https://nextjs.org/docs): enables you to create full-stack web applications by extending the latest React features

[NextAuth.js](https://next-auth.js.org/): configurable authentication framework for Next.js 13

[LangChain JS](https://www.langchain.com/): AI orchestration layer to build intelligent apps

[Tailwind CSS](https://tailwindcss.com/): is a utility-first CSS framework that provides a series of predefined classes that can be used to style each element by mixing and matching

[shadcn/ui](https://ui.shadcn.com/): re-usable components built using Radix UI and Tailwind CSS.

![](/images/privategpt-new.png)

![](/images/privategpt-stores.png)

# 💙 One click AWS Marketplace Deployment

[Deploy in AWS using the Marketplace AMI](https://aws.amazon.com/marketplace/pp/prodview-oatdhswgh2f4u)

Deploy the AMI and get setup using the quick launch guide: https://mdaca.io/support/documentation/privategpt/launch-guide/

# 👨🏻‍💻 Run from your local machine

Clone this repository locally or fork to your Github account. Run all of the the steps below from the "src" directory.

1. Create a new file named `.env.local` to store the environment variables add the following variables

   ```
   # SELECT ONLY ONE - AWS, Azure, or OpenAI

   BEDROCK_AWS_REGION=us-east-1
   BEDROCK_AWS_ACCESS_KEY_ID=...
   BEDROCK_AWS_SECRET_ACCESS_KEY=...
   BEDROCK_MODEL=mistral.mixtral-8x7b-instruct-v0:1
   BEDROCK_EMBED_MODEL=amazon.titan-embed-text-v1

   # - OR -

   # Azure OpenAI related configurations
   AZURE_OPENAI_API_KEY=
   AZURE_OPENAI_API_INSTANCE_NAME=
   AZURE_OPENAI_API_DEPLOYMENT_NAME=
   AZURE_OPENAI_API_VERSION=

   # - OR -

   # Using OpenAI APIs instead of Azure or AWS
   OPENAI_API_KEY=


   # Select Only ONE - GitHub, Azure AD, or Keycloak 

   # github OAuth app configuration
   AUTH_GITHUB_ID=
   AUTH_GITHUB_SECRET=

   # Azure AD OAuth app configuration
   AZURE_AD_CLIENT_ID=
   AZURE_AD_CLIENT_SECRET=
   AZURE_AD_TENANT_ID=

   # Keycloak OIDC app configuration
   KEYCLOAK_CLIENT_ID=
   KEYCLOAK_CLIENT_SECRET=
   KEYCLOAK_PROVIDER_URL=

   # when deploying to production, set the NEXTAUTH_URL environment variable to the canonical URL of your site. https://next-auth.js.org/configuration/options

   NEXTAUTH_SECRET=
   NEXTAUTH_URL=http://localhost:3000

   # MYSQL DB configuration
   MYSQL_HOST=
   MYSQL_USER=
   MYSQL_PASSWORD=
   MY_SQL_DB=

   # CHROMA DB configuration
   CHROMA_URL=http://localhost:8000

   # DozerDB configuration
   NEO4J_URI="bolt://localhost:7687"
   NEO4J_USERNAME=
   NEO4J_PASSWORD=
   ```

2. Install npm packages by running `npm install`
3. Start the project by running `npm run dev`

You should now be prompted to login with your selected identity provider. Once you successfully login, you can start creating new conversations.

# 🪪 Add an identity provider

Once the deployment is complete, you will need to add an identity provider to authenticate your app.

⚠️ Note: Only one of the identity provider is required below.

## GitHub Authentication provider

We'll create two GitHub apps: one for testing locally and another for production.

### 🟡 Development app setup

1. Navigate to GitHub OAuth Apps setup https://github.com/settings/developers
2. Create a `New OAuth App` https://github.com/settings/applications/new
3. Fill in the following details

```
Application name: MDACA PrivateGPT DEV Environment
Homepage URL:http://localhost:3000/
Authorization callback URL:http://localhost:3000/api/auth/callback/github/
```

### 🟢 Production app setup

1. Navigate to GitHub OAuth Apps setup https://github.com/settings/developers
2. Create a `New OAuth App` https://github.com/settings/applications/new
3. Fill in the following details

```
Application name: MDACA PrivateGPT Production
Homepage URL:https://YOUR-WEBSITE-NAME.azurewebsites.net/
Authorization callback URL:https://YOUR-WEBSITE-NAME.azurewebsites.net/api/auth/callback/github/
```

⚠️ Once the apps are setup, ensure to update the environment variables locally.

```
   # github OAuth app configuration
   AUTH_GITHUB_ID=
   AUTH_GITHUB_SECRET=
```

## Azure AD Authentication provider

### 🟡 Development app setup

1. Navigate to Azure AD Apps setup https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps
2. Create a `New Registration` https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade/quickStartType~/null/isMSAApp~/false
3. Fill in the following details

```
Application name: MDACA PrivateGPT DEV Environment
Supported account types: Accounts in this organizational directory only
Redirect URI Platform: Web
Redirect URI:http://localhost:3000/api/auth/callback/azure-ad
```

### 🟢 Production app setup

1. Navigate to Azure AD Apps setup https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps
2. Create a `New Registration` https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade/quickStartType~/null/isMSAApp~/false
3. Fill in the following details

```
Application name: MDACA PrivateGPT Production
Supported account types: Accounts in this organizational directory only
Redirect URI Platform: Web
Redirect URI:https://YOUR-WEBSITE-NAME.azurewebsites.net/api/auth/callback/azure-ad
```

⚠️ Once the apps are setup, ensure to update the environment variables locally and on Azure App Service.

```
# Azure AD OAuth app configuration

AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
```

## Keycloak Authentication provider

To setup keycloak as the authentication provider, you will need to create a new client inside your realm.  You will also neeed the realm URL to configure the provider.

```
# Keycloak OIDC app configuration
   KEYCLOAK_CLIENT_ID=
   KEYCLOAK_CLIENT_SECRET=
   KEYCLOAK_PROVIDER_URL=
```

# 🔑 Environment variables

Below are the required environment variables

| App Setting                      | Value              | Note                                                                                                                                   |
| -------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| BEDROCK_AWS_REGION               |                    | AWS Region containing Bedrock                                                                                                          |
| BEDROCK_AWS_ACCESS_KEY_ID        |                    | AWS Acess Key ID                                                                                                                       |
| BEDROCK_AWS_SECRET_ACCESS_KEY    |                    | AWS Secret Access Key                                                                                                                  |
| BEDROCK_MODEL                    |                    | Model ID (i.e. mistral.mixtral-8x7b-instruct-v0:1)                                                                                     |
| BEDROCK_EMBED_MODEL              |                    | Embed Model ID (i.e. amazon.titan-embed-text-v1)                                                                                       |
| AZURE_OPENAI_API_KEY             |                    | API keys of your Azure OpenAI resource                                                                                                 |
| AZURE_OPENAI_API_INSTANCE_NAME   |                    | The name of your Azure OpenAI resource                                                                                                 |
| AZURE_OPENAI_API_DEPLOYMENT_NAME |                    | The name of your model deployment                                                                                                      |
| AZURE_OPENAI_API_VERSION         | 2023-03-15-preview | API version when using gpt chat                                                                                                        |
| OPENAI_API_KEY                   |                    | The OpenAI API Key to use instead of Azure                                                                                             |
| AUTH_GITHUB_ID                   |                    | Client ID of your GitHub OAuth application                                                                                             |
| AUTH_GITHUB_SECRET               |                    | Client Secret of your GitHub OAuth application                                                                                         |
| NEXTAUTH_SECRET                  |                    | Used to encrypt the NextAuth.js JWT, and to hash email verification tokens.                                                            |
| NEXTAUTH_URL                     |                    | Current web hosting domain name with HTTP or HTTPS.                                                                                    |
| AZURE_AD_CLIENT_ID               |                    | The client id specific to the application                                                                                              |
| AZURE_AD_CLIENT_SECRET           |                    | The client secret specific to the application                                                                                          |
| AZURE_AD_TENANT_ID               |                    | The organisation Tenant ID                                                                                                             |
| KEYCLOAK_CLIENT_ID               |                    | The client id specific to the application in Keycloak                                                                                  |
| KEYCLOAK_CLIENT_SECRET           |                    | The client secret specific to the application in Keycloak                                                                              |
| KEYCLOAK_PROVIDER_URL            |                    | The URL of the keycloak realm                                                                                                          |
| MYSQL_HOST                       |                    | The MySQL server's hostname                                                                                                            |
| MYSQL_USER                       |                    | The MySQL application user account                                                                                                     |
| MYSQL_PASSWORD                   |                    | The MySQL application user passsword                                                                                                   |
| MY_SQL_DB                        |                    | The MySQL database name                                                                                                                |
| CHROMA_URL                       |                    | URL of the ChromaDB server                                                                                                             |
| NEO4J_URI                        |                    | Bolt URI for DozerDB                                                                                                                   |
| NEO4J_USERNAME                   |                    | The DozerDB username                                                                                                                   |
| NEO4J_PASSWORD                   |                    | The DozerDB password                                                                                                                   |
