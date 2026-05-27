# VozimVarno Backend

Backend uporablja Convex in Convex Auth z enostavno prijavo prek e-poste in gesla.

## Zagon

1. V rootu projekta nastavi Expo spremenljivko:

   ```sh
   cp .env.example .env.local
   ```

2. V `backend` folderju povezi Convex projekt:

   ```sh
   cd backend
   npx convex dev
   ```

3. Convex bo izpisal deployment URL. Enako vrednost vnesi v root `.env.local`:

   ```sh
   EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

4. Za produkcijo nastavi tudi Convex auth kljuce:

   ```sh
   npx @convex-dev/auth
   ```

Prijava in registracija uporabljata isti provider `password`, flow pa je locen na `signIn` in `signUp`.
