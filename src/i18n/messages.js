// Tous les textes de l'interface. Chaque entrée est un tableau [fr, en, ar] (ordre de LOCALES dans index.js).
import core  from './messages/core.js'
import app   from './messages/app.js'
import pub   from './messages/pub.js'
import admin from './messages/super.js'

export default { ...core, ...app, ...pub, ...admin }
