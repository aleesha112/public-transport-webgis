"use strict";

/* =====================================================
   TwinCity Transit Atlas
   Data source : OpenStreetMap via the Overpass API
   Libraries   : Leaflet 1.9.4, Leaflet.markercluster

   Loading strategy (designed for free public servers):
   1. Fresh copy in browser cache (6 hours)
   2. Overpass API, ONE server at a time:
        stops first (shown immediately), routes in the background
   3. Older browser cache
   4. Built-in snapshot stored inside this file (BUILT_IN_SNAPSHOT)
   ===================================================== */

/* ---------- 1. Configuration ---------- */
const CONFIG = {
  // South, West, North, East bounding box covering Rawalpindi and Islamabad
  bbox: "33.52,72.85,33.80,73.20",
  center: [33.65, 73.05],
  zoom: 12,

  // Public Overpass servers, tried one after another (never all at once)
  mirrors: [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter"
  ],
  points: { timeoutMs: 30000, rounds: 2 },
  routes: { timeoutMs: 45000, rounds: 1 },

  // The first key is used for saving; older keys are still read as a fallback
  cacheKeys: [
    "twincity-transit-cache-v3",
    "twincity-transit-cache-v2",
    "twincity-transit-cache-v1"
  ],
  cacheTtlMs: 6 * 60 * 60 * 1000, // 6 hours
  themeKey: "twincity-theme"
};

/* ---------- Built-in snapshot (optional backup, see instructions) ----------
   After one successful live load, open the browser console and run:
       copy(makeSnapshot())
   Then replace the word null below with the copied text, like this:
       const BUILT_IN_SNAPSHOT = { ...pasted text... };
   ------------------------------------------------------------------------ */
const BUILT_IN_SNAPSHOT = {"savedAt":1792937887607,"features":[{"id":"node/249699995","lat":33.6027369,"lon":73.0654409,"type":"stop","name":"Moti mehal stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/253124176","lat":33.6884058,"lon":73.0344119,"type":"terminal","name":"4 Star Travel Services","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/253126259","lat":33.6624714,"lon":73.084984,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/253126697","lat":33.7084243,"lon":73.0901733,"type":"stop","name":"Aabpara Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/253126873","lat":33.716335,"lon":73.0834699,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/253414950","lat":33.6056794,"lon":73.021165,"type":"stop","name":"Charing Cross","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/254768071","lat":33.5820875,"lon":73.044835,"type":"stop","name":"22 No Chungi Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/254768538","lat":33.5825266,"lon":73.0307137,"type":"stop","name":"Tench bhatta","named":true,"ref":"","operator":"local","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/256142965","lat":33.642652,"lon":73.1039059,"type":"stop","name":"Kuri Road","named":true,"ref":"","operator":"CDA","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/278034430","lat":33.6307049,"lon":73.0424887,"type":"terminal","name":"Pir Wadahi","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/278055349","lat":33.5710631,"lon":73.0480749,"type":"stop","name":"Tahli Mohri Chowk","named":true,"ref":"","operator":"Roundabout","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/612815054","lat":33.7234434,"lon":73.0622518,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/662431119","lat":33.5772,"lon":73.1522987,"type":"stop","name":"Korang Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1097776665","lat":33.7279819,"lon":73.0789032,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1109205591","lat":33.7204956,"lon":73.0844337,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1341925995","lat":33.6896713,"lon":73.030612,"type":"stop","name":"G-9 Bus Wagon & Pickup Stop‎","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1361287449","lat":33.6283922,"lon":73.1019716,"type":"terminal","name":"Jahaz Ground Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/1668259782","lat":33.6414058,"lon":73.1793259,"type":"terminal","name":"Alipur Bank Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1668259937","lat":33.6451764,"lon":73.1768217,"type":"terminal","name":"Nai Abbadi Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1668259968","lat":33.6444239,"lon":73.1641698,"type":"stop","name":"Tarramri","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1668281005","lat":33.6337432,"lon":73.1327477,"type":"terminal","name":"Burma Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1668281008","lat":33.632841,"lon":73.1268254,"type":"terminal","name":"Sanam Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/1674164803","lat":33.6647472,"lon":73.1524764,"type":"stop","name":"Chatha Bakhtawar","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1674164908","lat":33.6553153,"lon":73.1542783,"type":"stop","name":"Dhoke Kazim","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1674214383","lat":33.6295111,"lon":73.1091577,"type":"terminal","name":"Trolly Adda","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/1674221955","lat":33.6271482,"lon":73.0933943,"type":"terminal","name":"Chungi No.8","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/1674222103","lat":33.6298416,"lon":73.0895239,"type":"terminal","name":"Haji Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/1707162830","lat":33.703254,"lon":73.0714038,"type":"terminal","name":"Daewoo Islamabad Terminal","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1707171893","lat":33.7069586,"lon":73.0705022,"type":"stop","name":"Puli Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/1942265820","lat":33.6545319,"lon":73.0923242,"type":"stop","name":"Dhok Kala Khan Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2027815115","lat":33.6480239,"lon":73.0791072,"type":"stop","name":"Double Road Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2027815167","lat":33.650442,"lon":73.0803419,"type":"metro","name":"Metro Bus Terminal Shamsabad","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2190939487","lat":33.6356023,"lon":73.0338346,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2190939491","lat":33.635033,"lon":73.0340492,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2190939494","lat":33.6352272,"lon":73.0331668,"type":"stop","name":"Mandi morr bus stand","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"No","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2390714419","lat":33.5828328,"lon":73.0671733,"type":"stop","name":"Kucheri","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2390824183","lat":33.5759388,"lon":73.1529737,"type":"stop","name":"PWD bus stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/2393049796","lat":33.5572057,"lon":73.094114,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"Fauji Foundation","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2393049797","lat":33.5582326,"lon":73.0939692,"type":"stop","name":"Al-Shifa","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2396083146","lat":33.6229203,"lon":72.9543028,"type":"terminal","name":"Daewoo Express Terminal","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2396965112","lat":33.6145476,"lon":72.9966006,"type":"stop","name":"old New Khan","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2396965119","lat":33.6136252,"lon":72.9965045,"type":"stop","name":"Kainat Travels","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2397437383","lat":33.6190521,"lon":72.9807689,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2397437517","lat":33.6096465,"lon":73.0086612,"type":"stop","name":"Chour Harpal","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2397437527","lat":33.6082928,"lon":73.0114093,"type":"stop","name":"Chour Chowk","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2421371786","lat":33.6247961,"lon":72.9714981,"type":"stop","name":"Golra Mor Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"Yes","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2421373802","lat":33.61836,"lon":72.9842605,"type":"stop","name":"Daewoo BusWworkshop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2421446097","lat":33.6134507,"lon":72.9971771,"type":"stop","name":"moterway express","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2431820945","lat":33.6188521,"lon":72.9817163,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2439180945","lat":33.6088466,"lon":73.0116469,"type":"stop","name":"Chour Chowk","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2441070128","lat":33.6055553,"lon":73.0202747,"type":"stop","name":"Charing Cross","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2449128453","lat":33.5588575,"lon":73.0896279,"type":"stop","name":"Al-Shifa","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2450449666","lat":33.5841512,"lon":73.0664384,"type":"stop","name":"Kachehri","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2454022280","lat":33.5967,"lon":73.0536716,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2502440677","lat":33.6699959,"lon":72.8630754,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/2502440889","lat":33.6334306,"lon":72.935427,"type":"stop","name":"22#","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2502440906","lat":33.63143,"lon":72.940798,"type":"stop","name":"Islamabad Bus Terminal","named":true,"ref":"","operator":"CDA","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2502440919","lat":33.6284757,"lon":72.9434749,"type":"stop","name":"MOTORWAY","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2502440920","lat":33.6290209,"lon":72.943672,"type":"stop","name":"MOTORWAY","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2502440926","lat":33.6329471,"lon":72.934881,"type":"stop","name":"22#","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2502444235","lat":33.6242692,"lon":72.9546515,"type":"stop","name":"EME COLLEGE","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2502444236","lat":33.6238,"lon":72.954381,"type":"stop","name":"EME College","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2509355356","lat":33.6616009,"lon":72.895571,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/2509355357","lat":33.6610376,"lon":72.8950395,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/2607450117","lat":33.6847017,"lon":73.046878,"type":"stop","name":"Peshawar Morr","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/2640862163","lat":33.5997881,"lon":73.0629733,"type":"metro","name":"Metro Bus Terminal Marir Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2640862165","lat":33.5964982,"lon":73.0648618,"type":"stop","name":"Marir Hassan","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2661490349","lat":33.6248285,"lon":72.9608479,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2694097195","lat":33.6173277,"lon":73.0819386,"type":"stop","name":"Ali Nawaz Chauhan Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2694122295","lat":33.6234409,"lon":73.0674617,"type":"stop","name":"Naz Cinema Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/2696210238","lat":33.6215529,"lon":73.0620109,"type":"stop","name":"Banni Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/3143591775","lat":33.5328066,"lon":73.1811639,"type":"stop","name":"DHA Gate 7 South","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/3143591776","lat":33.5335207,"lon":73.1807677,"type":"stop","name":"DHA Gate 7 Bus Stop North","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/3443346127","lat":33.6242954,"lon":73.0116438,"type":"stop","name":"Kacha stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/3517198060","lat":33.6359118,"lon":73.0323157,"type":"stop","name":"mandi morr","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/3517201560","lat":33.6618777,"lon":73.0828496,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4189913594","lat":33.6087566,"lon":73.0820117,"type":"stop","name":"PAF Chowk Rawalpindi ","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4204109589","lat":33.5560613,"lon":73.0153107,"type":"stop","name":"Liaqat Colony","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4273484291","lat":33.6138511,"lon":73.0650786,"type":"metro","name":"Metro Bus Terminal Committee Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4273565394","lat":33.6616413,"lon":73.0845877,"type":"terminal","name":"Faiz Abad Adda ","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4273586191","lat":33.5935034,"lon":73.0558331,"type":"metro","name":"Metro Bus Terminal - Saddar","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4325257489","lat":33.6166795,"lon":73.0338213,"type":"stop","name":"Regional Passport office Rawalpindi","named":true,"ref":"","operator":"Govt of Pakistan","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4331663491","lat":33.6293183,"lon":73.1136457,"type":"stop","name":"Khanna Pul","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4331753492","lat":33.6056188,"lon":73.1311816,"type":"stop","name":"Koral Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4347885394","lat":33.6918399,"lon":73.0569027,"type":"terminal","name":"Daewoo express","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4360459789","lat":33.6615708,"lon":73.0812391,"type":"terminal","name":"Faisal movers","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4367177394","lat":33.6053697,"lon":73.1314528,"type":"stop","name":"Airport chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4401151391","lat":33.6268628,"lon":73.1151523,"type":"stop","name":"Shaheen chowkh","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4401164791","lat":33.5645701,"lon":73.1239819,"type":"stop","name":"Media town Block B, C, D & E","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4401166991","lat":33.6027643,"lon":72.9913263,"type":"stop","name":"lane 2 Officer colony","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4401180989","lat":33.5639764,"lon":73.1222157,"type":"stop","name":"media town Block A","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4401181689","lat":33.5662945,"lon":73.1307926,"type":"stop","name":"Doctors Colony","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4401181691","lat":33.6219426,"lon":73.1063503,"type":"stop","name":"Chatri Chowkh","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4409220994","lat":33.6163702,"lon":72.9912001,"type":"terminal","name":"ghosia travels","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4589215389","lat":33.6131551,"lon":73.0751984,"type":"stop","name":"Street 3, Dhoke Khabba","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4594516602","lat":33.5953896,"lon":73.0510238,"type":"stop","name":"GPO stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4603298713","lat":33.6152889,"lon":72.995157,"type":"terminal","name":"kohistan luxury bus service","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4603321398","lat":33.6151705,"lon":72.9947959,"type":"terminal","name":"new khan road runner","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4691693389","lat":33.6606291,"lon":73.0642842,"type":"metro","name":"Metro bus stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4700591160","lat":33.5928385,"lon":73.0652519,"type":"stop","name":"Punjab House Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4774740068","lat":33.6360881,"lon":73.0748894,"type":"metro","name":"Metro Bus Terminal Rehmanabad","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4774740070","lat":33.6436076,"lon":73.0778945,"type":"metro","name":"Metro Bus Terminal Sixth Road","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4774773822","lat":33.6691603,"lon":73.0592777,"type":"metro","name":"Metro station khyban-e-johar","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4774773827","lat":33.6628538,"lon":73.0836396,"type":"stop","name":"Chakwal Adda","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4774776645","lat":33.6564998,"lon":73.071978,"type":"metro","name":"Metro Bus Terminal IJP","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4774848621","lat":33.6627093,"lon":73.0834901,"type":"stop","name":"Fasal Movers","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4821025821","lat":33.6021058,"lon":72.9797832,"type":"terminal","name":"Bhaata Chowkh","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4899250481","lat":33.6618568,"lon":73.0833446,"type":"terminal","name":"Skyways Daewoo Bus Service","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4945457425","lat":33.6060748,"lon":73.0658159,"type":"metro","name":"Metro Bus Terminal Liaquat Bagh","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4945486122","lat":33.6322013,"lon":73.0855878,"type":"stop","name":"Sadiqabad Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4945486123","lat":33.6340999,"lon":73.0762307,"type":"stop","name":"Sadiqabad Morr","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4945486124","lat":33.62645,"lon":73.0753607,"type":"stop","name":"Rawal Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4983663615","lat":33.5411,"lon":73.1428268,"type":"stop","name":"Ghee Mill Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/4995217335","lat":33.6279741,"lon":72.9438784,"type":"terminal","name":"Faisal Mover","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/4996274621","lat":33.629977,"lon":73.0719525,"type":"metro","name":"Chandni Chowk Metro Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"Yes","bench":"Yes","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5004202422","lat":33.5793559,"lon":73.0238132,"type":"stop","name":"Dhoke Syed's Choke","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5072901321","lat":33.5263323,"lon":73.0486187,"type":"stop","name":"Samarzar Housing Society","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5072901322","lat":33.5302786,"lon":73.0503091,"type":"stop","name":"Kalyal Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5119109121","lat":33.5262396,"lon":73.0484983,"type":"stop","name":"Samarzar Housing Society","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5211585722","lat":33.623832,"lon":72.9514689,"type":"stop","name":"Hotel Stop Jhangi Syedan","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5220454815","lat":33.7351254,"lon":73.0923194,"type":"metro","name":"Metro Bus Terminal Pak Secretariat","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5220455035","lat":33.7181576,"lon":73.0718909,"type":"stop","name":"7th Avenue Station","named":true,"ref":"4","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5220455038","lat":33.7116433,"lon":73.0593882,"type":"stop","name":"Stock Exchange Station","named":true,"ref":"5","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5220455039","lat":33.7058993,"lon":73.0484371,"type":"metro","name":"PIMS Metro Bus Station","named":true,"ref":"6","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5220461796","lat":33.6564715,"lon":73.0720922,"type":"stop","name":"IJP Station","named":true,"ref":"14","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5220474951","lat":33.6138643,"lon":73.065037,"type":"stop","name":"Committee Chowk Station","named":true,"ref":"21","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5296922921","lat":33.6282461,"lon":72.9352584,"type":"stop","name":"26 No. stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5318062321","lat":33.6330248,"lon":72.9350241,"type":"stop","name":"26 number","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5325452224","lat":33.6609635,"lon":73.0654448,"type":"metro","name":"Metro Bus Station Photohar","named":true,"ref":"","operator":"PMTA","network":"","shelter":"Yes","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5325476921","lat":33.675424,"lon":73.0546662,"type":"stop","name":"Faiz Ahmed Faiz Station","named":true,"ref":"11","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5382681921","lat":33.6319532,"lon":73.0387141,"type":"terminal","name":"Baloch Transportation","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5495540722","lat":33.6415337,"lon":73.0433949,"type":"stop","name":"cda stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5495541421","lat":33.6449245,"lon":73.0494299,"type":"stop","name":"khalid hospital","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5681049021","lat":33.7245952,"lon":73.0840657,"type":"metro","name":"Metro Bus Terminal Parade Ground","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5681049022","lat":33.7214099,"lon":73.0779465,"type":"metro","name":"Metro Bus Terminal Shaheed-E-Millat","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5681049024","lat":33.6960418,"lon":73.0383718,"type":"metro","name":"Metro Bus Station Ibn-e-Sina","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5681054721","lat":33.7182558,"lon":73.0719172,"type":"metro","name":"Metro Bus Terminal 7th Avenue","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5681054722","lat":33.7115094,"lon":73.0590242,"type":"metro","name":"Metro Bus Terminal Stock Exchange","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5681067022","lat":33.7024767,"lon":73.0417953,"type":"metro","name":"Metro Bus Terminal Katchery","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/5901488707","lat":33.6208226,"lon":73.0660818,"type":"stop","name":"Waris Khan Station","named":true,"ref":"20","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/5915317185","lat":33.7040562,"lon":72.9792223,"type":"stop","name":"Asian Broadcasting Pvt. Ltd","named":true,"ref":"","operator":"Radio Jeevay Pakistan FM","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6192162687","lat":33.6458154,"lon":72.9552725,"type":"stop","name":"Usman Chowk Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/6195866385","lat":33.6819741,"lon":73.0205098,"type":"stop","name":"Wagon Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6199004086","lat":33.6876766,"lon":73.0337615,"type":"terminal","name":"Niazi Express","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6199004087","lat":33.6853129,"lon":73.0336663,"type":"stop","name":"Bilal Travels Bus Service","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6199004485","lat":33.6891173,"lon":73.0338903,"type":"stop","name":"Mansehra Wagon Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6201480785","lat":33.6899542,"lon":73.0559349,"type":"stop","name":"Sarya Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6557146364","lat":33.661358,"lon":73.0828401,"type":"stop","name":"Faizabad Station","named":true,"ref":"15","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6621799086","lat":33.6355638,"lon":73.0331479,"type":"stop","name":"Mandi Morh, Rawalpindi-Islamabad","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/6647106985","lat":33.6010683,"lon":72.9935193,"type":"stop","name":"Lane 2 Officer colony","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/6658591443","lat":33.5415093,"lon":73.1469282,"type":"stop","name":"Burji Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6658591444","lat":33.5417304,"lon":73.1496445,"type":"stop","name":"Java Road Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6741831186","lat":33.6646357,"lon":73.0870702,"type":"stop","name":"Faizabad - فیض آباد","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/6849114486","lat":33.6623527,"lon":73.0834512,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/8329695320","lat":33.6189079,"lon":72.9809912,"type":"stop","name":"Koh-i-Noor Mills Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/8559730417","lat":33.6344671,"lon":73.0330752,"type":"terminal","name":"Teri & Nari Panos Flyingcoach Adda Mandi Morr Rawalpindi","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160047641","lat":33.5941608,"lon":73.0565077,"type":"stop","name":"Saddar Station","named":true,"ref":"24","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160047657","lat":33.5940868,"lon":73.0565859,"type":"stop","name":"Saddar Station","named":true,"ref":"24","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160047665","lat":33.5997236,"lon":73.0627955,"type":"stop","name":"Marrir Station","named":true,"ref":"23","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160047697","lat":33.6138649,"lon":73.0651669,"type":"stop","name":"Committee Chowk Station","named":true,"ref":"21","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160047703","lat":33.6207896,"lon":73.0662045,"type":"stop","name":"Waris Khan Station","named":true,"ref":"20","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160141492","lat":33.6298541,"lon":73.0719634,"type":"stop","name":"Chandani Chowk Station","named":true,"ref":"19","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160141496","lat":33.6298998,"lon":73.0718689,"type":"stop","name":"Chandani Chowk Station","named":true,"ref":"19","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160141507","lat":33.6364306,"lon":73.0750898,"type":"stop","name":"Rehmanabad Station","named":true,"ref":"18","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160141512","lat":33.6435746,"lon":73.0778057,"type":"stop","name":"6th Road Station","named":true,"ref":"17","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160142117","lat":33.6435347,"lon":73.0779311,"type":"stop","name":"6th Road Station","named":true,"ref":"17","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160142121","lat":33.6506349,"lon":73.0803569,"type":"stop","name":"Shamsabad Station","named":true,"ref":"16","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9160142144","lat":33.6614417,"lon":73.0828598,"type":"stop","name":"Faizabad Station","named":true,"ref":"15","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9160142162","lat":33.6565484,"lon":73.0720094,"type":"stop","name":"IJP Station","named":true,"ref":"14","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9160142177","lat":33.6607922,"lon":73.0656739,"type":"stop","name":"Pothohar Station","named":true,"ref":"13","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9160142184","lat":33.6690589,"lon":73.0592968,"type":"stop","name":"Khayaban-i-Johar Station","named":true,"ref":"12","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9160142190","lat":33.6691136,"lon":73.0594075,"type":"stop","name":"Khayaban-i-Johar Station","named":true,"ref":"12","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9160142199","lat":33.6753623,"lon":73.0545313,"type":"stop","name":"Faiz Ahmed Faiz Station","named":true,"ref":"11","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182481560","lat":33.6898759,"lon":73.0429062,"type":"stop","name":"Chaman Station","named":true,"ref":"9","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182481565","lat":33.6899521,"lon":73.0430233,"type":"stop","name":"Chaman Station","named":true,"ref":"9","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182481570","lat":33.6850311,"lon":73.0472337,"type":"metro","name":"Metro Bus Terminal Peshawar Mor","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182481571","lat":33.6901836,"lon":73.0427633,"type":"metro","name":"Metro Bus Terminal Chaman","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182481583","lat":33.6957559,"lon":73.0386613,"type":"stop","name":"Ibne Sina Station","named":true,"ref":"8","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182481596","lat":33.7023064,"lon":73.0415875,"type":"stop","name":"Kachehri Station","named":true,"ref":"7","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182481609","lat":33.7023827,"lon":73.0415004,"type":"stop","name":"Kachehri Station","named":true,"ref":"7","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182505876","lat":33.7182752,"lon":73.0718246,"type":"stop","name":"7th Avenue Station","named":true,"ref":"4","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182505890","lat":33.7248014,"lon":73.0843277,"type":"stop","name":"Parade Ground Station","named":true,"ref":"2","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182623542","lat":33.6675956,"lon":73.0162888,"type":"metro","name":"G10 Metro Station","named":true,"ref":"2","operator":"Capital Mass Transit Authority","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182623554","lat":33.6633611,"lon":73.0082531,"type":"metro","name":"Police Foundation Metro Station","named":true,"ref":"3","operator":"Capital Mass Transit Authority","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182623575","lat":33.6553501,"lon":72.9929839,"type":"metro","name":"NUST Metro Bus Station","named":true,"ref":"4","operator":"Capital Mass Transit Authority","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9182623597","lat":33.6500223,"lon":72.9824858,"type":"stop","name":"G-12 west nust station","named":true,"ref":"5","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9182623635","lat":33.6404298,"lon":72.9614747,"type":"metro","name":"G13 Golra Metro Station","named":true,"ref":"6","operator":"Capital Mass Transit Authority","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9182623670","lat":33.6321609,"lon":72.9441234,"type":"metro","name":"N5 Metro Station","named":true,"ref":"7","operator":"Capital Mass Transit Authority","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9534110219","lat":33.6221778,"lon":72.9542023,"type":"stop","name":"Daewoo bus Terminal","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/9931405017","lat":33.6897778,"lon":73.0303593,"type":"stop","name":"Minivan #120 to E11","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/9931405117","lat":33.6884804,"lon":72.9794039,"type":"stop","name":"minivan #120 to G9","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10206989917","lat":33.6622841,"lon":73.0838516,"type":"stop","name":"Faizabad Adda (Mansehra terminal)","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10744868627","lat":33.5403707,"lon":73.097648,"type":"stop","name":"DHA jamia mosque bus stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/10803882165","lat":33.7288106,"lon":73.1363575,"type":"terminal","name":"Visa Seekers Shuttle Service","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10825687204","lat":33.6499073,"lon":72.9825827,"type":"stop","name":"G-12 West nust station","named":true,"ref":"5","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/10826292712","lat":33.6768319,"lon":73.0340007,"type":"metro","name":"NHA Metro Station","named":true,"ref":"1","operator":"Capital Mass Transit Authority","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10826298884","lat":33.7117133,"lon":73.0593234,"type":"stop","name":"Stock Exchange Station","named":true,"ref":"5","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084436","lat":33.5996623,"lon":73.0628867,"type":"stop","name":"Marrir Station","named":true,"ref":"23","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/10827084437","lat":33.605941,"lon":73.0657741,"type":"stop","name":"Liaqat Bagh Station","named":true,"ref":"22","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/10827084438","lat":33.6059588,"lon":73.0659109,"type":"stop","name":"Liaqat Bagh Station","named":true,"ref":"22","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/10827084439","lat":33.6364508,"lon":73.0749822,"type":"stop","name":"Rehmanabad Station","named":true,"ref":"18","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/10827084440","lat":33.6506256,"lon":73.0804834,"type":"stop","name":"Shamsabad Station","named":true,"ref":"16","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/10827084442","lat":33.6607416,"lon":73.0655676,"type":"stop","name":"Pothohar Station","named":true,"ref":"13","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084449","lat":33.6846081,"lon":73.0474815,"type":"stop","name":"Kashmir Highway Station","named":true,"ref":"10","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084450","lat":33.6846706,"lon":73.0475995,"type":"stop","name":"Kashmir Highway Station","named":true,"ref":"10","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084451","lat":33.6957043,"lon":73.0385524,"type":"stop","name":"Ibne Sina Station","named":true,"ref":"8","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084452","lat":33.7215979,"lon":73.0782008,"type":"stop","name":"Shaheed-i-Millat Station","named":true,"ref":"3","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084453","lat":33.7215243,"lon":73.0782813,"type":"stop","name":"Shaheed-i-Millat Station","named":true,"ref":"3","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084454","lat":33.7247089,"lon":73.0844182,"type":"stop","name":"Parade Ground Station","named":true,"ref":"2","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084455","lat":33.7346232,"lon":73.0925131,"type":"stop","name":"Secretariat Station","named":true,"ref":"1","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/10827084456","lat":33.7346779,"lon":73.0926552,"type":"stop","name":"Secretariat Station","named":true,"ref":"1","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/11247223883","lat":33.6556732,"lon":73.0169503,"type":"stop","name":"FAST Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/11647354269","lat":33.6304609,"lon":72.9399681,"type":"terminal","name":"Unnamed station","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/11860870636","lat":33.5378056,"lon":73.1089471,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12122904413","lat":33.6916216,"lon":73.0435872,"type":"stop","name":"Chaman Stop","named":true,"ref":"","operator":"","network":"Islamabad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12122904414","lat":33.6944431,"lon":73.0459517,"type":"stop","name":"Jillania Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12122904415","lat":33.6954009,"lon":73.0477921,"type":"stop","name":"Development Park","named":true,"ref":"","operator":"Capital Development Authority","network":"Islambad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12154861429","lat":33.550324,"lon":73.1722948,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12154861430","lat":33.5616566,"lon":73.1634918,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12154861431","lat":33.5619898,"lon":73.1642287,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12154861432","lat":33.5679369,"lon":73.1600748,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12162264599","lat":33.5201776,"lon":73.1789531,"type":"stop","name":"SUPARCO Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12162264600","lat":33.5200847,"lon":73.1797529,"type":"stop","name":"Opposite SUPARCO Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12361442440","lat":33.7003944,"lon":73.061979,"type":"stop","name":"Bank Colony","named":true,"ref":"","operator":"","network":"","shelter":"No","bench":"No","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12361442441","lat":33.6732762,"lon":73.0809068,"type":"stop","name":"Parade Ground Bus Stop","named":true,"ref":"","operator":"CDA","network":"Blue Line","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12361952078","lat":33.6840235,"lon":73.0727557,"type":"stop","name":"Shakarparian Stop","named":true,"ref":"","operator":"CDA","network":"Blue Line","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12361952079","lat":33.6591415,"lon":73.0914686,"type":"stop","name":"Faizabad Bus Stop","named":true,"ref":"","operator":"CDA","network":"Blue Line","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12361952080","lat":33.6501133,"lon":73.0983628,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361952081","lat":33.6497447,"lon":73.0978235,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361952095","lat":33.6458864,"lon":73.1016636,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361952096","lat":33.6456536,"lon":73.1009752,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361952099","lat":33.637227,"lon":73.1079481,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361952100","lat":33.6366496,"lon":73.1076132,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361997301","lat":33.6275129,"lon":73.1152017,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361997302","lat":33.6259161,"lon":73.1156935,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361997340","lat":33.6129975,"lon":73.1260908,"type":"stop","name":"Gangal East","named":true,"ref":"","operator":"","network":"Blueline Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12361997341","lat":33.6127419,"lon":73.1255346,"type":"stop","name":"Gangal West","named":true,"ref":"","operator":"","network":"Blueline Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/12401427421","lat":33.6997251,"lon":73.059868,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12401427423","lat":33.6986506,"lon":73.0537462,"type":"stop","name":"Nori Hospital","named":true,"ref":"","operator":"Capital Development Authority","network":"Islambad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007287","lat":33.6767277,"lon":73.0144717,"type":"stop","name":"G-10 Markaz","named":true,"ref":"","operator":"Capital Development Authority","network":"FR-7","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007288","lat":33.6812422,"lon":73.0187277,"type":"stop","name":"College Morr","named":true,"ref":"","operator":"Capital Development Authority","network":"FR-7","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007289","lat":33.6842807,"lon":73.0246143,"type":"stop","name":"Police Flats","named":true,"ref":"","operator":"Capital Development Authority","network":"FR-7","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007290","lat":33.6894962,"lon":73.0302152,"type":"stop","name":"G-9 Markaz","named":true,"ref":"","operator":"Capital Development Authority","network":"FR-7","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007291","lat":33.6893166,"lon":73.0344018,"type":"stop","name":"Karachi Company","named":true,"ref":"","operator":"Capital Development Authority","network":"FR-7","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007292","lat":33.6917382,"lon":73.0434825,"type":"metro","name":"Chamman Metro Station","named":true,"ref":"","operator":"Capital Development Authority","network":"Islamabad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007293","lat":33.6956361,"lon":73.0477111,"type":"stop","name":"Development Park","named":true,"ref":"","operator":"Capital Development Authority","network":"Islamabad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007294","lat":33.6989434,"lon":73.047102,"type":"stop","name":"G-8 Markaz","named":true,"ref":"","operator":"Capital Development Authority","network":"Islamabad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007295","lat":33.6999598,"lon":73.0490461,"type":"stop","name":"Dental Hospital","named":true,"ref":"","operator":"Capital Development Authority","network":"Islamabad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007296","lat":33.6984729,"lon":73.0539005,"type":"stop","name":"Nori Hospitan","named":true,"ref":"","operator":"Capital Development Authority","network":"Islamabad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12476007297","lat":33.7052943,"lon":73.0556601,"type":"stop","name":"Children Hospital","named":true,"ref":"","operator":"Capital Development Authority","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12690834695","lat":33.6988175,"lon":73.0472564,"type":"stop","name":"G-8 Markaz","named":true,"ref":"","operator":"Capital Development Authority","network":"Islamabad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12690834696","lat":33.6998326,"lon":73.0491492,"type":"stop","name":"Dental Hospital","named":true,"ref":"","operator":"Capital Development Authority","network":"Islamabad Bus Service","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12690834697","lat":33.7061083,"lon":73.0520138,"type":"stop","name":"PIMS Gate FR","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12690963703","lat":33.7055997,"lon":73.0481491,"type":"metro","name":"PIMS Metro Bus Station South","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731392226","lat":33.7053086,"lon":73.0555237,"type":"stop","name":"Children Hospital","named":true,"ref":"","operator":"Capital Development Authority","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754731","lat":33.7002911,"lon":73.0620838,"type":"stop","name":"Bank Colony","named":true,"ref":"","operator":"","network":"","shelter":"No","bench":"No","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754732","lat":33.7020236,"lon":73.0650205,"type":"stop","name":"Silai Centre","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754733","lat":33.7018288,"lon":73.0651784,"type":"stop","name":"Silai Centre","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754734","lat":33.7058429,"lon":73.0669642,"type":"stop","name":"Sitara Market","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754735","lat":33.705992,"lon":73.0671281,"type":"stop","name":"Sitara Market","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754736","lat":33.7067882,"lon":73.0703203,"type":"stop","name":"Puli Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754737","lat":33.708658,"lon":73.0736888,"type":"stop","name":"Iqbal Hall","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754738","lat":33.7082725,"lon":73.073492,"type":"stop","name":"Iqbal Hall","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754739","lat":33.7125097,"lon":73.0799637,"type":"stop","name":"G-6/1-2","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754740","lat":33.7123733,"lon":73.0801098,"type":"stop","name":"G-6/1-2","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754741","lat":33.7147001,"lon":73.0844815,"type":"stop","name":"Melody Market","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754742","lat":33.7147633,"lon":73.0849053,"type":"stop","name":"Melody Market","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754743","lat":33.7099999,"lon":73.0881703,"type":"stop","name":"Aabpara Market","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754744","lat":33.7102148,"lon":73.0884043,"type":"stop","name":"Aabpara Market","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754745","lat":33.7159589,"lon":73.0872895,"type":"stop","name":"Municipal Corporation","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754746","lat":33.7162317,"lon":73.0874235,"type":"stop","name":"Municipal Corporation","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754747","lat":33.7178095,"lon":73.08994,"type":"stop","name":"ICB College","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754748","lat":33.7177107,"lon":73.0900275,"type":"stop","name":"ICB College","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754749","lat":33.720271,"lon":73.0952994,"type":"stop","name":"Nadra Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754750","lat":33.7203264,"lon":73.094743,"type":"stop","name":"Nadra Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754751","lat":33.7165886,"lon":73.0981413,"type":"stop","name":"Lodges Park","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754752","lat":33.7161824,"lon":73.0982116,"type":"stop","name":"Lodges Park","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754753","lat":33.7136043,"lon":73.1003204,"type":"stop","name":"Sukh Chayn Park","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754754","lat":33.7130822,"lon":73.0997237,"type":"stop","name":"Sukh Chayn Park","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754755","lat":33.7181316,"lon":73.1038523,"type":"stop","name":"Ministry of Foreign Affairs","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754756","lat":33.7183011,"lon":73.1042153,"type":"stop","name":"Ministry of Foreign Affairs","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754757","lat":33.7228002,"lon":73.1008978,"type":"stop","name":"Radio Pakistan","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754758","lat":33.722439,"lon":73.1005682,"type":"stop","name":"Radio Pakistan","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754759","lat":33.7246312,"lon":73.1026994,"type":"stop","name":"National Library","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754760","lat":33.7244451,"lon":73.1028603,"type":"stop","name":"National Library","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754761","lat":33.7266776,"lon":73.1065117,"type":"stop","name":"Secretariat Police Station","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754762","lat":33.7264451,"lon":73.1067285,"type":"stop","name":"Secretariat Police Station","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754763","lat":33.7306818,"lon":73.110706,"type":"stop","name":"Diplomatic Enclave Gate 4","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754764","lat":33.7309895,"lon":73.1108491,"type":"stop","name":"Diplomatic Enclave Gate 4","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754765","lat":33.7334981,"lon":73.1085941,"type":"stop","name":"Aiwan-e-Sadar Colony","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754766","lat":33.7336212,"lon":73.1088779,"type":"stop","name":"Aiwan-e-Sadar Colony","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754767","lat":33.743403,"lon":73.1093811,"type":"stop","name":"Bari Imam","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754768","lat":33.7434753,"lon":73.1096253,"type":"stop","name":"Bari Imam","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754769","lat":33.7390822,"lon":73.1083598,"type":"stop","name":"Muslim Colony","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12731754770","lat":33.7391404,"lon":73.1085597,"type":"stop","name":"Muslim Colony","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12732606732","lat":33.7059753,"lon":73.052299,"type":"stop","name":"PIMS Gate FR","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12732941774","lat":33.7054698,"lon":73.0506399,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12732941775","lat":33.7053467,"lon":73.0504879,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12732941788","lat":33.7058724,"lon":73.0479031,"type":"metro","name":"PIMS Metro Bus Station North","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12733638846","lat":33.699603,"lon":73.0598203,"type":"stop","name":"Rescue 15","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12736736612","lat":33.6568808,"lon":72.9928533,"type":"metro","name":"NUST Metro Bus Station North","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12736736613","lat":33.6560206,"lon":72.9946197,"type":"metro","name":"NUST Metro Bus Station South","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12772382512","lat":33.6607038,"lon":73.0812807,"type":"terminal","name":"Daewoo Express Faizabad Terminal","named":true,"ref":"","operator":"Daewoo","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12772382513","lat":33.6621329,"lon":73.0839261,"type":"terminal","name":"Faisal Movers Faizabad Al-Makkah Terminal","named":true,"ref":"","operator":"فیصل موورز","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12895184963","lat":33.7099811,"lon":73.0918372,"type":"stop","name":"Youth Hostel","named":true,"ref":"12","operator":"","network":"FR-04","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12895184964","lat":33.727839,"lon":73.0970402,"type":"stop","name":"Supreme Court","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/12895184965","lat":33.7295485,"lon":73.0935369,"type":"stop","name":"Pakistan Secretariat","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/13043410030","lat":33.712297,"lon":73.0271437,"type":"stop","name":"Shaheen Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/13043410031","lat":33.712168,"lon":73.0266318,"type":"stop","name":"Shaheen Chowk","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/13043410140","lat":33.6758666,"lon":73.0541401,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/13043410141","lat":33.6759379,"lon":73.0542582,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/13307784272","lat":33.6732378,"lon":73.0803231,"type":"stop","name":"Unnamed bus stop","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"node/13383251565","lat":33.6306405,"lon":72.9440783,"type":"terminal","name":"Faisal Movers / Sania Express 26 No.Terminal","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/13954953089","lat":33.5487514,"lon":73.1022943,"type":"terminal","name":"Hamrahi Travels","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"node/13984864301","lat":33.6304269,"lon":72.9433451,"type":"terminal","name":"Faisal Movers Ghizali Terminal","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/260581467","lat":33.6314997,"lon":72.94079,"type":"terminal","name":"Unnamed station","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/386960869","lat":33.6298871,"lon":73.0420773,"type":"terminal","name":"Pirwadhai Mor Bus Station","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/707559481","lat":33.6957664,"lon":73.0385665,"type":"metro","name":"Metro Bus Terminal Ibn-e-Sina","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"way/707559482","lat":33.6898123,"lon":73.0430386,"type":"metro","name":"Metro bus stand Islamabad","named":true,"ref":"","operator":"","network":"Metro Bus Terminal Chaman","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"way/707559484","lat":33.6755449,"lon":73.0544806,"type":"metro","name":"Metro Bus Terminal Faiz Ahmed Faiz","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"way/707559485","lat":33.6690244,"lon":73.0593886,"type":"metro","name":"Metro Bus Terminal Khyban-e-Johar","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"way/707559486","lat":33.660777,"lon":73.0656043,"type":"metro","name":"Metro Bus Terminal Photohar","named":true,"ref":"","operator":"Punjab","network":"Saddar-Secretriat","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"way/707559488","lat":33.6612631,"lon":73.083034,"type":"metro","name":"Metro Bus Terminal Faizabad","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"},{"id":"way/707559489","lat":33.650676,"lon":73.0804366,"type":"terminal","name":"Unnamed station","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/707559490","lat":33.6435658,"lon":73.077873,"type":"terminal","name":"Unnamed station","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/707559491","lat":33.6363727,"lon":73.0749998,"type":"terminal","name":"Unnamed station","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/707559492","lat":33.629824,"lon":73.0718526,"type":"terminal","name":"Unnamed station","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/707559493","lat":33.6207335,"lon":73.066143,"type":"terminal","name":"Unnamed station","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/707559494","lat":33.6137785,"lon":73.0650827,"type":"terminal","name":"Unnamed station","named":false,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/707559495","lat":33.5995232,"lon":73.0626625,"type":"metro","name":"Metro bus Mareer Chowk station","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/707559496","lat":33.593782,"lon":73.0561506,"type":"metro","name":"Metro Bus Saddar station","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/780155219","lat":33.6131907,"lon":73.054763,"type":"terminal","name":"Fawara Chowk Bus Stop","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Rawalpindi"},{"id":"way/1375600682","lat":33.6555223,"lon":72.9931237,"type":"metro","name":"NUST Metro Bus Area","named":true,"ref":"","operator":"","network":"","shelter":"","bench":"","covered":"","wheelchair":"","zone":"Islamabad"}],"routes":[{"key":"guideway","ref":"","name":"Metro Bus guideway","operator":"","network":"","from":"","to":"","kind":"metro","segments":[[[33.67184,73.02447],[33.67176,73.02427],[33.67169,73.02413],[33.67157,73.02384],[33.67142,73.02354],[33.67121,73.02309],[33.67094,73.02254],[33.67091,73.02248],[33.6707,73.022],[33.67051,73.02166],[33.67013,73.02096],[33.66984,73.02042]]],"ids":["way/1164077050"],"visible":true,"color":"#14b8a6","label":"Metro Bus guideway"}]};

const TYPE_INFO = {
  metro:    { label: "Metro Bus Station" },
  terminal: { label: "Bus Terminal / Station" },
  stop:     { label: "Bus Stop" }
};

const ROUTE_KIND_LABEL = {
  metro: "Metro Bus",
  bus: "Bus route",
  minibus: "Minibus route",
  share_taxi: "Shared taxi / wagon route",
  trolleybus: "Trolleybus route"
};

const METRO_COLOR = "#14b8a6";
// Mid-tone colours that stay readable on both light and dark maps
const ROUTE_PALETTE = [
  "#2563eb", "#db2777", "#ea580c", "#7c3aed", "#ca8a04",
  "#16a34a", "#dc2626", "#0284c7", "#65a30d", "#c026d3"
];

/* ---------- 2. Basemap providers (no API key needed) ---------- */
const ATTR_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ATTR_CARTO = ATTR_OSM + ' &copy; <a href="https://carto.com/attributions">CARTO</a>';
const ATTR_ESRI = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors';

const PROVIDERS = {
  cartoDark: {
    name: "CARTO Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    opts: { subdomains: "abcd", maxZoom: 19, attribution: ATTR_CARTO }
  },
  cartoLight: {
    name: "CARTO Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    opts: { subdomains: "abcd", maxZoom: 19, attribution: ATTR_CARTO }
  },
  cartoVoyager: {
    name: "CARTO Streets",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    opts: { subdomains: "abcd", maxZoom: 19, attribution: ATTR_CARTO }
  },
  esriDark: {
    name: "Esri Dark Gray",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 16, attribution: ATTR_ESRI }
  },
  esriLight: {
    name: "Esri Light Gray",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 16, attribution: ATTR_ESRI }
  },
  esriStreet: {
    name: "Esri Streets",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 19, attribution: ATTR_ESRI }
  },
  esriSat: {
    name: "Esri Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 19, attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community" }
  },
  esriTopo: {
    name: "Esri Topographic",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    opts: { maxZoom: 19, maxNativeZoom: 19, attribution: ATTR_ESRI }
  },
  osm: {
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    opts: { maxZoom: 19, attribution: ATTR_OSM }
  },
  osmFr: {
    name: "OpenStreetMap France",
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    opts: { subdomains: "abc", maxZoom: 19, attribution: '&copy; OpenStreetMap France | ' + ATTR_OSM }
  },
  openTopo: {
    name: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    opts: {
      subdomains: "abc", maxZoom: 19, maxNativeZoom: 17,
      attribution: 'Map data: ' + ATTR_OSM + ', SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
    }
  }
};

// If the first provider in a chain is blocked or too slow, the next one is used automatically.
const CHAINS = {
  dark:      ["cartoDark", "esriDark", "esriStreet", "osmFr"],
  light:     ["cartoLight", "esriLight", "esriStreet", "osmFr"],
  streets:   ["cartoVoyager", "esriStreet", "osmFr", "osm"],
  osm:       ["osm", "osmFr", "cartoVoyager", "esriStreet"],
  satellite: ["esriSat", "esriStreet", "cartoVoyager"],
  topo:      ["esriTopo", "openTopo", "esriStreet"]
};

/* ---------- 3. DOM references and state ---------- */
const $ = (id) => document.getElementById(id);

const els = {
  loading: $("loading"), loadingText: $("loadingText"),
  error: $("error"), errorText: $("errorText"), retryBtn: $("retryBtn"),
  toast: $("toast"),
  search: $("searchInput"), zone: $("zoneFilter"), basemap: $("basemapSelect"),
  routeToggle: $("routeToggle"),
  resultCount: $("resultCount"), resultList: $("resultList"), resetBtn: $("resetBtn"),
  routeSearch: $("routeSearch"), routeCount: $("routeCount"), routeList: $("routeList"),
  routesAllBtn: $("routesAllBtn"), routesNoneBtn: $("routesNoneBtn"),
  statMetro: $("statMetro"), statTerminal: $("statTerminal"), statStop: $("statStop"), statRoute: $("statRoute"),
  barIsb: $("barIsb"), barRwp: $("barRwp"), cntIsb: $("cntIsb"), cntRwp: $("cntRwp"),
  sourceInfo: $("sourceInfo"),
  nearestCard: $("nearestCard"), nearestBody: $("nearestBody"),
  locateBtn: $("locateBtn"), refreshBtn: $("refreshBtn"), exportBtn: $("exportBtn"),
  themeBtn: $("themeBtn"), menuBtn: $("menuBtn"), sidebar: $("sidebar")
};

const state = {
  theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
  features: [],
  routes: [],
  markers: new Map(),
  routeLayers: new Map(),
  filtered: [],
  activeRoute: null,
  userLatLng: null,
  userMarker: null,
  nearestLine: null,
  sourceLabel: ""
};

/* ---------- 4. Map setup ---------- */
const map = L.map("map", { zoomControl: true, preferCanvas: true, maxZoom: 19 })
  .setView(CONFIG.center, CONFIG.zoom);

const routeLayer = L.layerGroup().addTo(map);
const metroLayer = L.layerGroup().addTo(map);
const terminalLayer = L.layerGroup().addTo(map);
const stopCluster = L.markerClusterGroup({
  showCoverageOnHover: false,
  maxClusterRadius: 45,
  chunkedLoading: true,
  iconCreateFunction: (c) =>
    L.divIcon({
      html: `<div class="cluster">${c.getChildCount()}</div>`,
      className: "cluster-wrap",
      iconSize: [38, 38]
    })
}).addTo(map);

/* ---------- 5. Helpers ---------- */
function esc(value) {
  const d = document.createElement("div");
  d.textContent = value == null ? "" : String(value);
  return d.innerHTML;
}

function haversine(a, b) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

function yesNo(v) {
  if (!v) return "";
  const s = String(v).toLowerCase();
  if (s === "yes" || s === "true") return "Yes";
  if (s === "no" || s === "false") return "No";
  return v;
}

// Approximate city split (used for filtering and statistics only)
function zoneOf(lat, lon) {
  return lat < 33.655 && lon < 73.13 ? "Rawalpindi" : "Islamabad";
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let toastTimer;
function toast(message, ms = 4500) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add("hidden"), ms);
}

function showLoading(text) {
  els.error.classList.add("hidden");
  els.loading.classList.remove("hidden");
  if (text) els.loadingText.textContent = text;
}
function hideLoading() { els.loading.classList.add("hidden"); }
function showError(message) {
  hideLoading();
  els.errorText.textContent = message;
  els.error.classList.remove("hidden");
}

/* ---------- 6. Theme and basemap handling ---------- */
const tiles = { chain: [], index: 0, layer: null, ok: 0, fail: 0, warned: false, timer: null };

function mountTileLayer() {
  clearTimeout(tiles.timer);
  if (tiles.layer) map.removeLayer(tiles.layer);

  const provider = PROVIDERS[tiles.chain[tiles.index]];
  const layer = L.tileLayer(provider.url, { ...provider.opts });
  tiles.ok = 0;
  tiles.fail = 0;

  // Move to the next provider in the chain (or warn once if none is left)
  const tryNext = (reason) => {
    if (tiles.layer !== layer) return;
    if (tiles.index < tiles.chain.length - 1) {
      tiles.index++;
      toast(`${reason} Switching to ${PROVIDERS[tiles.chain[tiles.index]].name}...`, 5000);
      mountTileLayer();
    } else if (!tiles.warned) {
      tiles.warned = true;
      toast("Basemap tiles could not be loaded. Please check your internet connection.", 7000);
    }
  };

  layer.on("tileload", () => {
    if (tiles.layer === layer) tiles.ok++;
  });

  layer.on("tileerror", () => {
    if (tiles.layer !== layer) return;
    tiles.fail++;
    if ((tiles.ok === 0 && tiles.fail >= 3) || (tiles.fail >= 8 && tiles.fail > tiles.ok)) {
      tryNext("This map provider is not reachable on your network.");
    }
  });

  tiles.layer = layer;
  layer.addTo(map);
  layer.bringToBack();

  // Watchdog: if nothing has loaded after 8 seconds, try the next provider
  tiles.timer = setTimeout(() => {
    if (tiles.layer === layer && tiles.ok === 0) tryNext("The map is loading too slowly.");
  }, 8000);
}

function applyBasemap() {
  tiles.chain = CHAINS[els.basemap.value] || CHAINS.dark;
  tiles.index = 0;
  tiles.warned = false;
  mountTileLayer();
}

function setTheme(theme, persist = true) {
  state.theme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", state.theme);
  if (persist) {
    try { localStorage.setItem(CONFIG.themeKey, state.theme); } catch (e) { /* ignore */ }
  }
  els.themeBtn.innerHTML = state.theme === "dark" ? "&#9728; Light mode" : "&#9790; Dark mode";
}

/* ---------- 7. Overpass queries ---------- */
function pointsQuery() {
  const b = CONFIG.bbox;
  return `
    [out:json][timeout:40];
    (
      node["highway"="bus_stop"](${b});
      nwr["amenity"="bus_station"](${b});
      nwr["public_transport"="station"]["bus"="yes"](${b});
      nwr["public_transport"="station"]["name"~"metro",i](${b});
    );
    out center tags;
  `;
}

// All bus-type route relations (bus, minibus, shared taxi / wagon, trolleybus)
// plus the dedicated Metro Bus guideway.
function routesQuery() {
  const b = CONFIG.bbox;
  return `
    [out:json][timeout:60];
    (
      relation["route"~"^(bus|minibus|share_taxi|trolleybus)$"](${b});
      way["highway"="bus_guideway"](${b});
    );
    out geom tags;
  `;
}

/* ---------- 8. fetch(): one server at a time (avoids HTTP 429) ---------- */
// opts: { label, timeoutMs, rounds, progress(text) }
async function queryOverpass(query, opts) {
  const { label, timeoutMs, rounds, progress } = opts;

  for (let round = 1; round <= rounds; round++) {
    for (let i = 0; i < CONFIG.mirrors.length; i++) {
      const url = CONFIG.mirrors[i];
      const host = new URL(url).hostname;
      progress(`Loading ${label} (server ${i + 1} of ${CONFIG.mirrors.length}` +
               (round > 1 ? ", second attempt" : "") + ")...");

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: "data=" + encodeURIComponent(query),
          signal: ctrl.signal
        });
        if (!res.ok) throw new Error(`${host} returned HTTP ${res.status}`);
        const json = await res.json();
        if (!json || !Array.isArray(json.elements)) throw new Error("Unexpected response format");
        return json;
      } catch (err) {
        console.warn(`Overpass attempt failed (${host}):`, err.message || err);
      } finally {
        clearTimeout(timer);
      }
    }
    if (round < rounds) await sleep(3000); // short pause before the next round
  }
  throw new Error("The OpenStreetMap servers are busy right now.");
}

/* ---------- 9. Parse JSON into clean objects ---------- */
function classify(tags) {
  const text = [tags.name, tags["name:en"], tags.network, tags.operator, tags.brand]
    .filter(Boolean).join(" ").toLowerCase();
  if (text.includes("metro")) return "metro";
  if (tags.amenity === "bus_station" || tags.public_transport === "station") return "terminal";
  return "stop";
}

function parseFeatures(elements) {
  const seenIds = new Set();
  const seenNamed = new Set();
  const out = [];

  for (const el of elements) {
    const lat = el.lat ?? (el.center && el.center.lat);
    const lon = el.lon ?? (el.center && el.center.lon);
    if (lat == null || lon == null) continue;

    const id = `${el.type}/${el.id}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const t = el.tags || {};
    const type = classify(t);
    const rawName = t["name:en"] || t.name || "";

    // Merge duplicate stations (for example two platforms with the same name)
    if (type !== "stop" && rawName) {
      const key = `${type}|${rawName.toLowerCase()}`;
      if (seenNamed.has(key)) continue;
      seenNamed.add(key);
    }

    out.push({
      id, lat, lon, type,
      name: rawName || (type === "stop" ? "Unnamed bus stop" : "Unnamed station"),
      named: Boolean(rawName),
      ref: t.ref || t.local_ref || "",
      operator: t.operator || "",
      network: t.network || "",
      shelter: yesNo(t.shelter),
      bench: yesNo(t.bench),
      covered: yesNo(t.covered),
      wheelchair: yesNo(t.wheelchair),
      zone: zoneOf(lat, lon)
    });
  }
  return out;
}

function compactGeometry(geometry) {
  return geometry.map((p) => [Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5]);
}

function routeLabel(r) {
  if (r.ref && r.name) {
    return r.name.toLowerCase().includes(r.ref.toLowerCase()) ? r.name : `${r.ref} · ${r.name}`;
  }
  return r.name || r.ref || "Unnamed route";
}

// Groups OSM relations that belong to the same route (for example two directions)
function parseRoutes(elements) {
  const groups = new Map();

  for (const el of elements) {
    const t = el.tags || {};
    const segments = [];

    if (el.type === "way" && Array.isArray(el.geometry)) {
      segments.push(compactGeometry(el.geometry));
    } else if (el.type === "relation" && Array.isArray(el.members)) {
      for (const m of el.members) {
        if (m.type === "way" && Array.isArray(m.geometry) && !/stop|platform/.test(m.role || "")) {
          segments.push(compactGeometry(m.geometry));
        }
      }
    }

    const usable = segments.filter((s) => s.length > 1);
    if (!usable.length) continue;

    const isGuideway = el.type === "way";
    const name = isGuideway ? "Metro Bus guideway" : (t["name:en"] || t.name || "");
    const ref = isGuideway ? "" : (t.ref || "");
    const text = [name, ref, t.network, t.operator].join(" ").toLowerCase();
    const kind = isGuideway || text.includes("metro") ? "metro" : (t.route || "bus");
    const key = isGuideway ? "guideway" : (ref || name || String(el.id)).toLowerCase();

    let g = groups.get(key);
    if (!g) {
      g = {
        key, ref: "", name: "", operator: "", network: "", from: "", to: "",
        kind, segments: [], ids: [], visible: true, color: "#2563eb", label: ""
      };
      groups.set(key, g);
    }

    g.segments.push(...usable);
    g.ids.push(`${el.type}/${el.id}`);
    if (!g.ref && ref) g.ref = ref;
    if (!g.name && name) g.name = name;
    if (!g.operator && t.operator) g.operator = t.operator;
    if (!g.network && t.network) g.network = t.network;
    if (!g.from && t.from) g.from = t.from;
    if (!g.to && t.to) g.to = t.to;
    if (kind === "metro") g.kind = "metro";
  }

  // Do not draw the raw guideway twice if a Metro Bus route relation exists
  const hasMetroRelation = [...groups.values()].some((g) => g.kind === "metro" && g.key !== "guideway");
  if (hasMetroRelation) groups.delete("guideway");

  const routes = [...groups.values()];
  routes.forEach((r) => { r.label = routeLabel(r); });
  routes.sort((a, b) =>
    (a.kind === "metro" ? 0 : 1) - (b.kind === "metro" ? 0 : 1) ||
    a.label.localeCompare(b.label, undefined, { numeric: true }));

  let i = 0;
  routes.forEach((r) => {
    r.color = r.kind === "metro" ? METRO_COLOR : ROUTE_PALETTE[i++ % ROUTE_PALETTE.length];
  });
  return routes;
}

/* ---------- 10. Cache and built-in snapshot ---------- */
function saveCache(features, routes) {
  try {
    localStorage.setItem(CONFIG.cacheKeys[0], JSON.stringify({ t: Date.now(), features, routes }));
  } catch (e) { /* storage full or blocked: ignore */ }
}

// Reads the newest cache, falling back to the older cache names
function readCache() {
  for (const key of CONFIG.cacheKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.features) && data.features.length) return data;
    } catch (e) { /* try the next key */ }
  }
  return null;
}

function getBuiltInSnapshot() {
  const s = BUILT_IN_SNAPSHOT;
  if (s && Array.isArray(s.features) && s.features.length) return s;
  return null;
}

// Run in the browser console after a successful live load:  copy(makeSnapshot())
window.makeSnapshot = function () {
  return JSON.stringify({
    savedAt: Date.now(),
    features: state.features,
    routes: state.routes.map((r) => ({ ...r, visible: true }))
  });
};

/* ---------- 11. Build map layers ---------- */
function popupHtml(f) {
  const rows = [];
  const add = (k, v) => { if (v) rows.push(`<tr><td>${k}</td><td>${esc(v)}</td></tr>`); };

  add("City (approx.)", f.zone);
  add("Route / Ref", f.ref);
  add("Operator", f.operator);
  add("Network", f.network);
  add("Shelter", f.shelter);
  add("Bench", f.bench);
  add("Covered", f.covered);
  add("Wheelchair", f.wheelchair);
  add("Coordinates", `${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}`);
  if (state.userLatLng) add("From you", fmtDist(haversine(state.userLatLng, [f.lat, f.lon])));

  return `
    <div class="pop-title">${esc(f.name)}</div>
    <span class="pop-badge ${f.type}">${TYPE_INFO[f.type].label}</span>
    <table class="pop-table">${rows.join("")}</table>
    <div class="pop-links">
      <a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}">Directions</a>
      <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/${f.id}">View on OSM</a>
    </div>`;
}

function routePopupHtml(r) {
  const rows = [];
  const add = (k, v) => { if (v) rows.push(`<tr><td>${k}</td><td>${esc(v)}</td></tr>`); };
  add("Route no.", r.ref);
  add("From", r.from);
  add("To", r.to);
  add("Operator", r.operator);
  add("Network", r.network);
  add("Mapped parts", r.ids.length);

  return `
    <div class="pop-title">${esc(r.label)}</div>
    <span class="pop-badge" style="background:${r.color};color:#fff">${ROUTE_KIND_LABEL[r.kind] || "Route"}</span>
    <table class="pop-table">${rows.join("")}</table>
    <div class="pop-links">
      <a target="_blank" rel="noopener" href="https://www.openstreetmap.org/${r.ids[0]}">View on OSM</a>
    </div>`;
}

function makeMarker(f) {
  const isStop = f.type === "stop";
  const letter = f.type === "metro" ? "M" : f.type === "terminal" ? "B" : "";
  const size = isStop ? 14 : 28;

  const icon = L.divIcon({
    className: "",
    html: `<div class="pin pin-${f.type}">${letter}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });

  const marker = L.marker([f.lat, f.lon], { icon, title: f.name, riseOnHover: true });
  marker.bindPopup(() => popupHtml(f), { maxWidth: 300 });
  return marker;
}

function buildMarkers() {
  state.markers.clear();
  state.features.forEach((f) => state.markers.set(f.id, makeMarker(f)));
}

function buildRoutes() {
  routeLayer.clearLayers();
  state.routeLayers.clear();
  state.activeRoute = null;

  state.routes.forEach((r) => {
    const base = r.kind === "metro" ? 5 : 3.5;
    const glow = L.polyline(r.segments, { color: r.color, weight: base + 8, opacity: 0.16, interactive: false });
    const line = L.polyline(r.segments, { color: r.color, weight: base, opacity: 0.95, lineJoin: "round", lineCap: "round" });

    line.bindPopup(() => routePopupHtml(r), { maxWidth: 300 });
    line.on("mouseover", () => { if (state.activeRoute !== r.key) line.setStyle({ weight: base + 2.5 }); });
    line.on("mouseout", () => { if (state.activeRoute !== r.key) line.setStyle({ weight: base }); });

    state.routeLayers.set(r.key, { line, glow, base });
  });

  syncRouteLayers();
}

// Adds or removes route lines depending on the master toggle and each route's checkbox
function syncRouteLayers() {
  routeLayer.clearLayers();
  if (!els.routeToggle.checked) return;
  state.routes.forEach((r) => {
    if (!r.visible) return;
    const ly = state.routeLayers.get(r.key);
    if (!ly) return;
    routeLayer.addLayer(ly.glow);
    routeLayer.addLayer(ly.line);
  });
}

// Shows only the legend items that exist in the loaded data
function updateLegend() {
  const hasType = (t) => state.features.some((f) => f.type === t);
  const toggle = (id, show) => $(id).classList.toggle("hidden", !show);
  toggle("legMetro", hasType("metro"));
  toggle("legTerminal", hasType("terminal"));
  toggle("legStop", hasType("stop"));
  toggle("legMetroRoute", state.routes.some((r) => r.kind === "metro"));
}

/* ---------- 12. Route panel ---------- */
function getFilteredRoutes() {
  const q = els.routeSearch.value.trim().toLowerCase();
  if (!q) return state.routes;
  return state.routes.filter((r) =>
    r.label.toLowerCase().includes(q) ||
    r.ref.toLowerCase().includes(q) ||
    r.operator.toLowerCase().includes(q));
}

function renderRouteList() {
  const list = getFilteredRoutes();
  els.routeCount.textContent = `${list.length} route${list.length === 1 ? "" : "s"}`;
  els.routeList.innerHTML = "";

  if (!list.length) {
    els.routeList.innerHTML = '<li class="result-empty">No routes found for this area or filter.</li>';
    return;
  }

  const frag = document.createDocumentFragment();
  list.forEach((r) => {
    const li = document.createElement("li");
    li.className = "route-item" + (state.activeRoute === r.key ? " active" : "");

    const detail = r.from && r.to ? ` · ${r.from} → ${r.to}` : r.operator ? ` · ${r.operator}` : "";
    li.innerHTML = `
      <input type="checkbox" ${r.visible ? "checked" : ""} aria-label="Show or hide this route" />
      <span class="route-swatch" style="background:${r.color}"></span>
      <span class="route-text">
        <span class="route-title">${esc(r.label)}</span>
        <span class="route-sub">${esc((ROUTE_KIND_LABEL[r.kind] || "Route") + detail)}</span>
      </span>`;

    const box = li.querySelector("input");
    box.addEventListener("click", (e) => e.stopPropagation());
    box.addEventListener("change", () => {
      r.visible = box.checked;
      syncRouteLayers();
    });
    li.addEventListener("click", () => focusRoute(r.key));
    frag.appendChild(li);
  });
  els.routeList.appendChild(frag);
}

function focusRoute(key) {
  const r = state.routes.find((x) => x.key === key);
  const ly = state.routeLayers.get(key);
  if (!r || !ly) return;

  // Reset the previously highlighted route
  if (state.activeRoute && state.routeLayers.has(state.activeRoute)) {
    const prev = state.routeLayers.get(state.activeRoute);
    prev.line.setStyle({ weight: prev.base });
  }
  state.activeRoute = key;

  if (!r.visible || !els.routeToggle.checked) {
    r.visible = true;
    els.routeToggle.checked = true;
    syncRouteLayers();
  }

  ly.line.setStyle({ weight: ly.base + 4 });
  ly.line.bringToFront();
  map.fitBounds(ly.line.getBounds().pad(0.15));
  ly.line.openPopup(ly.line.getBounds().getCenter());
  renderRouteList();

  if (window.innerWidth <= 860) els.sidebar.classList.add("collapsed");
}

function setRoutesVisible(visible) {
  getFilteredRoutes().forEach((r) => { r.visible = visible; });
  if (visible) els.routeToggle.checked = true;
  syncRouteLayers();
  renderRouteList();
}

/* ---------- 13. Filtering and rendering of stops ---------- */
function getFiltered() {
  const q = els.search.value.trim().toLowerCase();
  const zone = els.zone.value;
  const types = new Set(
    [...document.querySelectorAll(".type-toggle:checked")].map((c) => c.value)
  );

  return state.features.filter((f) => {
    if (!types.has(f.type)) return false;
    if (zone !== "all" && f.zone !== zone) return false;
    if (q && !(f.name.toLowerCase().includes(q) || f.ref.toLowerCase().includes(q))) return false;
    return true;
  });
}

function render() {
  const list = getFiltered();
  state.filtered = list;

  metroLayer.clearLayers();
  terminalLayer.clearLayers();
  stopCluster.clearLayers();

  const stops = [];
  list.forEach((f) => {
    const m = state.markers.get(f.id);
    if (!m) return;
    if (f.type === "metro") metroLayer.addLayer(m);
    else if (f.type === "terminal") terminalLayer.addLayer(m);
    else stops.push(m);
  });
  stopCluster.addLayers(stops);

  updateStats(list);
  renderList(list);
}

function updateStats(list) {
  const count = (t) => list.filter((f) => f.type === t).length;
  els.statMetro.textContent = count("metro");
  els.statTerminal.textContent = count("terminal");
  els.statStop.textContent = count("stop");
  els.statRoute.textContent = state.routes.length;

  const isb = list.filter((f) => f.zone === "Islamabad").length;
  const rwp = list.length - isb;
  const total = list.length || 1;
  els.cntIsb.textContent = isb;
  els.cntRwp.textContent = rwp;
  els.barIsb.style.width = (isb / total) * 100 + "%";
  els.barRwp.style.width = (rwp / total) * 100 + "%";

  els.sourceInfo.textContent = `Data status: ${state.sourceLabel}`;
}

function renderList(list) {
  els.resultCount.textContent = `${list.length} result${list.length === 1 ? "" : "s"}`;

  const order = { metro: 0, terminal: 1, stop: 2 };
  const sorted = [...list]
    .sort((a, b) =>
      order[a.type] - order[b.type] ||
      Number(b.named) - Number(a.named) ||
      a.name.localeCompare(b.name))
    .slice(0, 40);

  els.resultList.innerHTML = "";
  if (!sorted.length) {
    els.resultList.innerHTML = '<li class="result-empty">No matching features. Try changing the filters.</li>';
    return;
  }

  const frag = document.createDocumentFragment();
  sorted.forEach((f) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="r-left"><i class="dot ${f.type}"></i><span class="r-name">${esc(f.name)}</span></span>
      <span class="r-meta">${f.zone}</span>`;
    li.addEventListener("click", () => focusFeature(f.id));
    frag.appendChild(li);
  });
  els.resultList.appendChild(frag);
}

function focusFeature(id) {
  const f = state.features.find((x) => x.id === id);
  const m = state.markers.get(id);
  if (!f || !m) return;

  if (f.type === "stop" && stopCluster.hasLayer(m)) {
    stopCluster.zoomToShowLayer(m, () => m.openPopup());
  } else {
    map.flyTo([f.lat, f.lon], 16, { duration: 0.8 });
    map.once("moveend", () => m.openPopup());
  }
  if (window.innerWidth <= 860) els.sidebar.classList.add("collapsed");
}

/* ---------- 14. Nearest stop (browser geolocation) ---------- */
function findNearest() {
  if (!navigator.geolocation) {
    toast("Geolocation is not supported by this browser.");
    return;
  }
  if (!state.features.length) {
    toast("Please wait until the data has loaded.");
    return;
  }
  toast("Locating you...", 2500);

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const here = [pos.coords.latitude, pos.coords.longitude];
      state.userLatLng = here;

      let best = null, bestD = Infinity;
      state.features.forEach((f) => {
        const d = haversine(here, [f.lat, f.lon]);
        if (d < bestD) { bestD = d; best = f; }
      });

      if (state.userMarker) map.removeLayer(state.userMarker);
      if (state.nearestLine) map.removeLayer(state.nearestLine);

      state.userMarker = L.marker(here, {
        icon: L.divIcon({ className: "", html: '<div class="user-pulse"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        zIndexOffset: 1000
      }).addTo(map).bindPopup("<b>You are here</b>");

      if (bestD > 40000) {
        map.setView(here, 13);
        toast("You appear to be outside the twin-city study area.");
        return;
      }

      state.nearestLine = L.polyline([here, [best.lat, best.lon]], {
        color: "#3b82f6", weight: 3, dashArray: "6 8"
      }).addTo(map);

      map.fitBounds(L.latLngBounds([here, [best.lat, best.lon]]).pad(0.5));
      const walkMin = Math.max(1, Math.round(bestD / 83)); // about 5 km/h

      els.nearestCard.classList.remove("hidden");
      els.nearestBody.innerHTML = `
        <div class="big">${esc(best.name)}</div>
        <div class="row"><span>Type: <b>${TYPE_INFO[best.type].label}</b></span></div>
        <div class="row"><span>Distance: <b>${fmtDist(bestD)}</b></span><span>Walk: <b>about ${walkMin} min</b></span></div>`;

      const m = state.markers.get(best.id);
      if (m) {
        setTimeout(() => {
          if (stopCluster.hasLayer(m)) stopCluster.zoomToShowLayer(m, () => m.openPopup());
          else m.openPopup();
        }, 500);
      }
    },
    (err) => {
      const msg = err.code === 1
        ? "Location permission was denied. Allow it in your browser to use this feature."
        : "Could not determine your location.";
      toast(msg, 6000);
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

/* ---------- 15. Export ---------- */
function exportGeoJSON() {
  const visibleRoutes = state.routes.filter((r) => r.visible);
  if (!state.filtered.length && !visibleRoutes.length) {
    toast("Nothing to export with the current filters.");
    return;
  }

  const pointFeatures = state.filtered.map((f) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [f.lon, f.lat] },
    properties: {
      id: f.id, name: f.name, type: TYPE_INFO[f.type].label, city_approx: f.zone,
      ref: f.ref, operator: f.operator, network: f.network,
      shelter: f.shelter, bench: f.bench, wheelchair: f.wheelchair
    }
  }));

  const routeFeatures = visibleRoutes.map((r) => ({
    type: "Feature",
    geometry: {
      type: "MultiLineString",
      coordinates: r.segments.map((seg) => seg.map((p) => [p[1], p[0]]))
    },
    properties: {
      name: r.label, kind: ROUTE_KIND_LABEL[r.kind] || "Route", ref: r.ref,
      from: r.from, to: r.to, operator: r.operator, network: r.network
    }
  }));

  const geojson = { type: "FeatureCollection", features: [...pointFeatures, ...routeFeatures] };
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "twincity-transit.geojson";
  a.click();
  URL.revokeObjectURL(a.href);
  toast(`Exported ${pointFeatures.length} stops and ${routeFeatures.length} routes.`);
}

/* ---------- 16. Data loading ---------- */
function applyData(features, routes, label, fit = true) {
  routes.forEach((r) => { r.visible = true; });
  state.features = features;
  state.routes = routes;
  state.sourceLabel = label;

  buildMarkers();
  buildRoutes();
  render();
  renderRouteList();
  updateLegend();

  const metro = features.filter((f) => f.type === "metro");
  if (fit && metro.length > 1) {
    map.fitBounds(L.latLngBounds(metro.map((f) => [f.lat, f.lon])).pad(0.25));
  }
}

// Replaces only the routes (used when routes finish loading in the background)
function applyRoutes(routes, label) {
  routes.forEach((r) => { r.visible = true; });
  state.routes = routes;
  state.sourceLabel = label;

  buildRoutes();
  renderRouteList();
  updateLegend();
  updateStats(state.filtered);
}

let loadSeq = 0; // protects against two loads running at the same time

async function loadData(force = false) {
  const mySeq = ++loadSeq;
  const cached = readCache();
  const snap = getBuiltInSnapshot();

  // 1. Fresh browser cache
  if (!force && cached && Date.now() - cached.t < CONFIG.cacheTtlMs) {
    applyData(cached.features, cached.routes || [], `loaded from recent cache (${new Date(cached.t).toLocaleTimeString()})`);
    hideLoading();
    toast("Loaded recent data from this browser. Press Refresh data for a live request.");
    return;
  }

  // 2. Show a saved copy or the built-in snapshot immediately, then update quietly
  let quiet = false;
  if (!force && cached) {
    applyData(cached.features, cached.routes || [],
      `saved copy from ${new Date(cached.t).toLocaleString()}; checking for live data...`);
    quiet = true;
  } else if (!force && snap) {
    const when = snap.savedAt ? new Date(snap.savedAt).toLocaleDateString() : "an earlier date";
    applyData(snap.features, snap.routes || [],
      `built-in snapshot saved on ${when}; checking for live data...`);
    quiet = true;
  }

  if (quiet) hideLoading();
  else showLoading("Checking for saved data...");

  // In quiet mode the map is already usable, so use shorter waits and no loading screen
  const progress = quiet
    ? (text) => { els.sourceInfo.textContent = `Data status: ${text}`; }
    : showLoading;
  const pointsOpts = quiet ? { timeoutMs: 15000, rounds: 1 } : CONFIG.points;
  const routesOpts = quiet ? { timeoutMs: 25000, rounds: 1 } : CONFIG.routes;

  // 3. Live API: stops first, then routes in the background
  try {
    const pointsJson = await queryOverpass(pointsQuery(), {
      label: "stops and stations",
      timeoutMs: pointsOpts.timeoutMs,
      rounds: pointsOpts.rounds,
      progress
    });
    if (mySeq !== loadSeq) return;

    const features = parseFeatures(pointsJson.elements);
    if (!features.length) throw new Error("The API returned no transport features for this area.");

    // Until fresh routes arrive, show the last known routes (if any)
    const knownRoutes = quiet ? state.routes
      : (cached && cached.routes && cached.routes.length) ? cached.routes
      : (snap && snap.routes) ? snap.routes : [];

    const stamp = new Date().toLocaleTimeString();
    // Avoid moving the map while the visitor is already using saved data
    applyData(features, knownRoutes, `stops live from Overpass API (${stamp}); loading routes...`, !quiet);
    hideLoading();
    saveCache(features, knownRoutes);

    try {
      const routesJson = await queryOverpass(routesQuery(), {
        label: "bus routes",
        timeoutMs: routesOpts.timeoutMs,
        rounds: routesOpts.rounds,
        progress: (text) => { els.sourceInfo.textContent = `Data status: ${text}`; }
      });
      if (mySeq !== loadSeq) return;

      const routes = parseRoutes(routesJson.elements);
      if (routes.length) {
        applyRoutes(routes, `live from Overpass API (${new Date().toLocaleTimeString()})`);
        saveCache(features, routes);
      } else {
        state.sourceLabel = `stops live from Overpass API (${stamp}); no mapped bus routes found`;
        updateStats(state.filtered);
        toast("The API returned stops, but no mapped bus routes for this area.", 6000);
      }
    } catch (routeErr) {
      console.warn("Route layer unavailable:", routeErr);
      if (mySeq !== loadSeq) return;
      state.sourceLabel = knownRoutes.length
        ? `stops live (${stamp}); routes from a saved copy`
        : `stops live (${stamp}); routes unavailable right now`;
      updateStats(state.filtered);
      toast(knownRoutes.length
        ? "Routes could not be refreshed, so the last saved routes are shown."
        : "Stops loaded, but the route lines could not be fetched this time. Press Refresh data to retry.", 7000);
    }
    return;
  } catch (err) {
    console.error("Live request failed:", err);
  }

  if (mySeq !== loadSeq) return;

  // Live servers failed. If something is already on screen, just say so.
  if (quiet) {
    state.sourceLabel = `${state.sourceLabel.split(";")[0]}; live servers busy, showing saved data`;
    updateStats(state.filtered);
    toast("The live servers are busy, so saved data is shown. Press Refresh data to retry.", 7000);
    return;
  }

  // Manual refresh or first visit with nothing on screen yet
  if (cached) {
    applyData(cached.features, cached.routes || [], `saved copy from ${new Date(cached.t).toLocaleString()}`);
    hideLoading();
    toast("The data servers are busy, so a saved copy of the data is shown. Press Refresh data to retry.", 8000);
    return;
  }

  if (snap) {
    const when = snap.savedAt ? new Date(snap.savedAt).toLocaleDateString() : "an earlier date";
    applyData(snap.features, snap.routes || [], `built-in snapshot saved on ${when}`);
    hideLoading();
    toast("The live servers are busy, so the built-in snapshot is shown. Press Refresh data to retry.", 8000);
    return;
  }

  showError("The OpenStreetMap servers are busy right now. This is usually temporary. Please wait a minute and try again.");
}

/* ---------- 17. Events ---------- */
let searchTimer;
els.search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(render, 150);
});
els.zone.addEventListener("change", render);
document.querySelectorAll(".type-toggle").forEach((c) => c.addEventListener("change", render));
els.routeToggle.addEventListener("change", syncRouteLayers);

els.routeSearch.addEventListener("input", renderRouteList);
els.routesAllBtn.addEventListener("click", () => setRoutesVisible(true));
els.routesNoneBtn.addEventListener("click", () => setRoutesVisible(false));

els.resetBtn.addEventListener("click", () => {
  els.search.value = "";
  els.zone.value = "all";
  els.routeSearch.value = "";
  document.querySelectorAll(".type-toggle").forEach((c) => (c.checked = true));
  els.routeToggle.checked = true;
  state.routes.forEach((r) => { r.visible = true; });
  syncRouteLayers();
  render();
  renderRouteList();
});

els.basemap.addEventListener("change", applyBasemap);
els.themeBtn.addEventListener("click", () => setTheme(state.theme === "dark" ? "light" : "dark"));

els.locateBtn.addEventListener("click", findNearest);
els.exportBtn.addEventListener("click", exportGeoJSON);
els.refreshBtn.addEventListener("click", () => loadData(true));
els.retryBtn.addEventListener("click", () => loadData(true));
els.menuBtn.addEventListener("click", () => els.sidebar.classList.toggle("collapsed"));

/* ---------- 18. Start ---------- */
setTheme(state.theme, false);
applyBasemap();
loadData();