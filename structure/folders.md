golf-sacco-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts          # For future caching
│   │   │   └── environment.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.validations.ts
│   │   │   │   └── dto/
│   │   │   │       ├── register.dto.ts
│   │   │   │       └── login.dto.ts
│   │   │   ├── users/
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.routes.ts
│   │   │   │   ├── users.validations.ts
│   │   │   │   └── dto/
│   │   │   │       ├── update-user.dto.ts
│   │   │   │       └── user-response.dto.ts
│   │   │   ├── wallets/
│   │   │   │   ├── wallets.controller.ts
│   │   │   │   ├── wallets.service.ts
│   │   │   │   ├── wallets.routes.ts
│   │   │   │   ├── wallets.validations.ts
│   │   │   │   └── dto/
│   │   │   │       ├── deposit.dto.ts
│   │   │   │       └── withdrawal.dto.ts
│   │   │   ├── transactions/
│   │   │   │   ├── transactions.controller.ts
│   │   │   │   ├── transactions.service.ts
│   │   │   │   ├── transactions.routes.ts
│   │   │   │   └── dto/
│   │   │   │       └── transaction-filter.dto.ts
│   │   │   ├── loans/
│   │   │   │   ├── loans.controller.ts
│   │   │   │   ├── loans.service.ts
│   │   │   │   ├── loans.routes.ts
│   │   │   │   ├── loans.validations.ts
│   │   │   │   └── dto/
│   │   │   │       ├── apply-loan.dto.ts
│   │   │   │       └── approve-loan.dto.ts
│   │   │   ├── payments/
│   │   │   │   ├── payments.controller.ts
│   │   │   │   ├── payments.service.ts
│   │   │   │   ├── payments.routes.ts
│   │   │   │   ├── mpesa.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── mpesa-callback.dto.ts
│   │   │   └── dashboard/
│   │   │       ├── dashboard.controller.ts
│   │   │       ├── dashboard.service.ts
│   │   │       ├── dashboard.routes.ts
│   │   │       └── dto/
│   │   │           └── stats.dto.ts
│   │   ├── shared/
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── role.middleware.ts
│   │   │   │   ├── validation.middleware.ts
│   │   │   │   └── error.middleware.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── response.ts
│   │   │   │   ├── constants.ts
│   │   │   │   └── helpers.ts
│   │   │   ├── decorators/
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── interfaces/
│   │   │   │   ├── request.interface.ts
│   │   │   │   └── response.interface.ts
│   │   │   └── enums/
│   │   │       ├── roles.enum.ts
│   │   │       ├── transaction-types.enum.ts
│   │   │       └── loan-status.enum.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── nodemon.json
│   ├── jest.config.ts
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── verify/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── users/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── loans/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── analytics/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── player/
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── savings/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── loans/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── transactions/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── pro/
│   │   │   │   │   └── dashboard/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── caddy/
│   │   │   │       └── dashboard/
│   │   │   │           └── page.tsx
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   │   └── [...nextauth]/
│   │   │   │   │       └── route.ts
│   │   │   │   ├── users/
│   │   │   │   ├── wallets/
│   │   │   │   ├── loans/
│   │   │   │   └── payments/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button/
│   │   │   │   ├── Input/
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Table/
│   │   │   │   └── ...
│   │   │   ├── layouts/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── forms/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   ├── DepositForm.tsx
│   │   │   │   └── LoanApplicationForm.tsx
│   │   │   └── shared/
│   │   │       ├── Loader.tsx
│   │   │       ├── Toast.tsx
│   │   │       └── ProtectedRoute.tsx
│   │   ├── lib/
│   │   │   ├── auth/
│   │   │   │   ├── auth.config.ts
│   │   │   │   ├── auth.actions.ts
│   │   │   │   └── auth.hooks.ts
│   │   │   ├── api/
│   │   │   │   ├── client.ts
│   │   │   │   ├── endpoints.ts
│   │   │   │   └── interceptors.ts
│   │   │   ├── store/
│   │   │   │   ├── useUserStore.ts
│   │   │   │   ├── useWalletStore.ts
│   │   │   │   └── useLoanStore.ts
│   │   │   └── utils/
│   │   │       ├── validators.ts
│   │   │       ├── formatters.ts
│   │   │       ├── constants.ts
│   │   │       └── helpers.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWallet.ts
│   │   │   ├── useLoans.ts
│   │   │   └── useToast.ts
│   │   ├── types/
│   │   │   ├── user.types.ts
│   │   │   ├── wallet.types.ts
│   │   │   ├── loan.types.ts
│   │   │   └── api.types.ts
│   │   └── styles/
│   │       ├── theme/
│   │       │   └── theme.ts
│   │       └── modules/
│   │           └── dashboard.module.css
│   ├── public/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── .env.local.example
│   ├── .gitignore
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── middleware.ts
│   └── README.md
│
├── shared-types/
│   ├── src/
│   │   ├── interfaces/
│   │   ├── enums/
│   │   └── validations/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── tsconfig.json
│
├── docker-compose.yml (optional - for local DB)
├── .env.example
└── README.md