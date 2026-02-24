/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdViewer from './pages/AdViewer';
import AdminPanel from './pages/AdminPanel';
import AdvertiserPanel from './pages/AdvertiserPanel';
import AdvertiserRegister from './pages/AdvertiserRegister';
import AdvertiserSubscriptions from './pages/AdvertiserSubscriptions';
import BattlePass from './pages/BattlePass';
import Cashback from './pages/Cashback';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import EarnAds from './pages/EarnAds';
import Missions from './pages/Missions';
import Partners from './pages/Partners';
import Payments from './pages/Payments';
import PointsHistory from './pages/PointsHistory';
import Ranking from './pages/Ranking';
import Referrals from './pages/Referrals';
import Shop from './pages/Shop';
import Games from './pages/Games';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdViewer": AdViewer,
    "AdminPanel": AdminPanel,
    "AdvertiserPanel": AdvertiserPanel,
    "AdvertiserRegister": AdvertiserRegister,
    "AdvertiserSubscriptions": AdvertiserSubscriptions,
    "BattlePass": BattlePass,
    "Cashback": Cashback,
    "Contact": Contact,
    "Dashboard": Dashboard,
    "EarnAds": EarnAds,
    "Missions": Missions,
    "Partners": Partners,
    "Payments": Payments,
    "PointsHistory": PointsHistory,
    "Ranking": Ranking,
    "Referrals": Referrals,
    "Shop": Shop,
    "Games": Games,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};