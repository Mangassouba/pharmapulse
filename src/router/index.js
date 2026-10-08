import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore }       from '../stores/auth.js'
import { useSuperAdminStore } from '../stores/superAdmin.js'
import { useSiteStore }       from '../stores/site.js'

// Auth
const Login      = () => import('../views/auth/Login.vue')
const Register   = () => import('../views/auth/Register.vue')
const SuperLogin = () => import('../views/superadmin/SuperLogin.vue')
const ForgotPassword = () => import('../views/auth/ForgotPassword.vue')
const ResetPassword  = () => import('../views/auth/ResetPassword.vue')
const SuperForgotPassword = () => import('../views/superadmin/SuperForgotPassword.vue')
const SuperResetPassword  = () => import('../views/superadmin/SuperResetPassword.vue')

// Pharmacy app
const AppLayout          = () => import('../components/layout/AppLayout.vue')
const Dashboard          = () => import('../views/Dashboard.vue')
const Produits           = () => import('../views/Produits.vue')
const Categories         = () => import('../views/Categories.vue')
const Reception          = () => import('../views/Reception.vue')
const Ventes             = () => import('../views/Ventes.vue')
const Mouvements         = () => import('../views/Mouvements.vue')
const Inventaire         = () => import('../views/Inventaire.vue')
const Alertes            = () => import('../views/Alertes.vue')
const Lots               = () => import('../views/Lots.vue')
const Commandes          = () => import('../views/Commandes.vue')
const CommandesEnLigne   = () => import('../views/CommandesEnLigne.vue')
const Utilisateurs       = () => import('../views/Utilisateurs.vue')
const Parametres         = () => import('../views/Parametres.vue')

// SuperAdmin
const SuperLayout     = () => import('../components/layout/SuperLayout.vue')
const SuperDashboard  = () => import('../views/superadmin/SuperDashboard.vue')
const SuperPharmacies = () => import('../views/superadmin/SuperPharmacies.vue')
const SuperUsers      = () => import('../views/superadmin/SuperUsers.vue')
const SuperLogs       = () => import('../views/superadmin/SuperLogs.vue')
const SuperParametres = () => import('../views/superadmin/SuperParametres.vue')

// Public storefront
const PublicLayout    = () => import('../components/layout/PublicLayout.vue')
const Accueil         = () => import('../views/public/Accueil.vue')
const Recherche       = () => import('../views/public/Recherche.vue')
const ListePharmacies = () => import('../views/public/ListePharmacies.vue')
const PharmacieProfil = () => import('../views/public/PharmacieProfil.vue')
const Panier          = () => import('../views/public/Panier.vue')
const Confirmation    = () => import('../views/public/Confirmation.vue')

const routes = [
  // Public auth
  { path:'/login',       component:Login,      meta:{ public:true } },
  { path:'/register',    component:Register,   meta:{ public:true } },
  { path:'/super/login', component:SuperLogin, meta:{ public:true } },
  { path:'/forgot-password', component:ForgotPassword, meta:{ public:true } },
  { path:'/reset-password',  component:ResetPassword,  meta:{ public:true } },
  { path:'/super/forgot-password', component:SuperForgotPassword, meta:{ public:true } },
  { path:'/super/reset-password',  component:SuperResetPassword,  meta:{ public:true } },

  // SuperAdmin
  { path:'/super', component:SuperLayout, meta:{ super:true },
    children:[
      { path:'',              component:SuperDashboard  },
      { path:'pharmacies',    component:SuperPharmacies },
      { path:'utilisateurs',  component:SuperUsers      },
      { path:'logs',          component:SuperLogs       },
      { path:'parametres',    component:SuperParametres },
    ]
  },

  // Pharmacy app (requires auth)
  { path:'/app', component:AppLayout,
    children:[
      { path:'',                   component:Dashboard,        meta:{ title:'nav.dashboard' } },
      { path:'produits',           component:Produits,         meta:{ title:'nav.products' } },
      { path:'categories',         component:Categories,       meta:{ title:'nav.categories' } },
      { path:'reception',          component:Reception,        meta:{ title:'nav.reception' } },
      { path:'ventes',             component:Ventes,           meta:{ title:'nav.sales' } },
      { path:'mouvements',         component:Mouvements,       meta:{ title:'nav.movements' } },
      { path:'inventaire',         component:Inventaire,       meta:{ title:'nav.inventory' } },
      { path:'alertes',            component:Alertes,          meta:{ title:'nav.alerts' } },
      { path:'lots',               component:Lots,             meta:{ title:'nav.batchesShort' } },
      { path:'commandes',          component:Commandes,        meta:{ title:'nav.orders' } },
      { path:'commandes-en-ligne', component:CommandesEnLigne, meta:{ title:'nav.onlineOrders' } },
      { path:'utilisateurs',       component:Utilisateurs,     meta:{ title:'nav.users' } },
      { path:'parametres',         component:Parametres,       meta:{ title:'nav.settings' } },
    ]
  },

  // Public storefront (pas d'auth)
  { path:'/', component:PublicLayout, meta:{ public:true },
    children:[
      { path:'',              component:Accueil,         meta:{ public:true } },
      { path:'pharmacies',    component:ListePharmacies, meta:{ public:true } },
      { path:'pharmacie/:id', component:PharmacieProfil, meta:{ public:true } },
      { path:'recherche',     component:Recherche,       meta:{ public:true } },
      { path:'panier',        component:Panier,          meta:{ public:true } },
      { path:'confirmation',  component:Confirmation,    meta:{ public:true } },
    ]
  },

  { path:'/:p(.*)*', redirect:'/' }
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(to => {
  const auth   = useAuthStore()
  const super_ = useSuperAdminStore()
  if (to.meta.super)          { if (!super_.isLoggedIn) return '/super/login' }
  else if (!to.meta.public)   { if (!auth.isLoggedIn)   return '/login'       }
  else if (to.path === '/login'       && auth.isLoggedIn)   return '/app'
  else if (to.path === '/super/login' && super_.isLoggedIn) return '/super'
})

router.afterEach(to => {
  useSiteStore().pageTitle = to.meta.title || '' // clé i18n, traduite par le store
})

export default router
