import NextAuth, { NextAuthOptions } from "next-auth";
import { Provider } from "next-auth/providers";
import AzureADProvider from "next-auth/providers/azure-ad";
import KeycloakProvider from "next-auth/providers/keycloak";
import GitHubProvider from "next-auth/providers/github";
import { IsAdmin } from "./helpers";

const configureIdentityProvider = () => {
  const providers: Array<Provider> = [];

  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    providers.push(
      GitHubProvider({
        clientId: process.env.AUTH_GITHUB_ID!,
        clientSecret: process.env.AUTH_GITHUB_SECRET!,
      })
    );
  }

  if (
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  ) {
    providers.push(
      AzureADProvider({
        issuer:"http://localhost:8080/auth/realms/MDACA_GPT",
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      })
    );
  }
  if (
    process.env.KEYCLOAK_CLIENT_ID &&
    process.env.KEYCLOAK_CLIENT_SECRET &&
    process.env.KEYCLOAK_PROVIDER_URL
  ) {
    providers.push(
      KeycloakProvider({
        issuer:process.env.KEYCLOAK_PROVIDER_URL!,
        clientId: process.env.KEYCLOAK_CLIENT_ID!,
        clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      })
    );
  }
  return providers;
};

export const options: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [...configureIdentityProvider()],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (profile) {
        //const jwt_decode = jwt_decodePkg.jwtDecode;
        let isAdmin = false;
        let imageGen = false;
        try{

          let prof: any = profile;
          if(prof.resource_access) isAdmin = prof.resource_access['privategpt'].roles.indexOf('admin') >= 0;
          if(prof.resource_access) imageGen = prof.resource_access['privategpt'].roles.indexOf('imagegen') >= 0;
          
        }catch(err) {
          console.error(err);
        }
        token.imageGen = imageGen;
        token.isAdmin = isAdmin;
      }
      return token
    },
    async session({ session, token, user }) {
      if(session.user) session.user['isAdmin'] = token.isAdmin;
      if(session.user) session.user['imageGen'] = token.imageGen;
      return session;
    },
  }
};

export const handlers = NextAuth(options);
